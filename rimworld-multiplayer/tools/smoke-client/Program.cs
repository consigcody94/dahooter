// Protocol smoke test for the RimWorld Multiplayer standalone server.
//
//   SmokeClient [host] [port] [timeoutSeconds]   connect and walk the join handshake as far as a
//                                                non-game client can (Protocol -> ProtocolOk ->
//                                                Bootstrap -> Username -> InitDataRequest)
//   SmokeClient dump-settings                    print settings.toml with the server's defaults
//
// Exit code 0 = server answered ProtocolOk and identified itself as a standalone server.

using System.Diagnostics;
using LiteNetLib;
using Multiplayer.Common;
using Multiplayer.Common.Networking.Packet;
using Multiplayer.Common.Util;

if (args.Length > 0 && args[0] == "dump-settings")
{
    Console.Write(TomlSettings.Serialize(new ServerSettings { direct = true, lan = false }));
    return 0;
}

var host = args.Length > 0 ? args[0] : "127.0.0.1";
var port = args.Length > 1 ? int.Parse(args[1]) : MultiplayerServer.DefaultPort;
var timeout = TimeSpan.FromSeconds(args.Length > 2 ? int.Parse(args[2]) : 10);
const string username = "smoketest";

var gotProtocolOk = false;
var isStandalone = false;
ServerBootstrapPacket? bootstrap = null;
var initDataRequested = false;
var usernameOk = false;
string? disconnectReason = null;
var done = false;
var disconnecting = false;

var listener = new EventBasedNetListener();
var client = new NetManager(listener) { IPv6Enabled = false };

listener.PeerConnectedEvent += peer =>
{
    Log($"UDP connection accepted by {peer}");
    Send(peer, ClientProtocolPacket.Current());
    Log($"sent Client_Protocol (protocol {MpVersion.Protocol}, mod {MpVersion.Version})");
};

listener.NetworkReceiveEvent += (peer, reader, _, _) =>
{
    var data = reader.GetRemainingBytes();
    reader.Recycle();
    var id = (Packets)(data[0] & 0x3F);
    var body = new PacketReader(new ByteReader(data[1..]));

    switch (id)
    {
        case Packets.Server_ProtocolOk:
        {
            var p = new ServerProtocolOkPacket();
            p.Bind(body);
            gotProtocolOk = true;
            isStandalone = p.isStandaloneServer;
            Log($"recv Server_ProtocolOk: standalone={p.isStandaloneServer} password={p.hasPassword} autosave={p.autosaveInterval} {p.autosaveUnit}");
            Send(peer, new ClientUsernamePacket(username));
            Log($"sent Client_Username '{username}'");
            break;
        }
        case Packets.Server_Bootstrap:
        {
            var p = new ServerBootstrapPacket();
            p.Bind(body);
            bootstrap = p;
            Log($"recv Server_Bootstrap: bootstrap={p.bootstrap} settingsMissing={p.settingsMissing} saveMissing={p.saveMissing}");
            break;
        }
        case Packets.Server_UsernameOk:
            usernameOk = true;
            Log("recv Server_UsernameOk");
            break;
        case Packets.Server_InitDataRequest:
            initDataRequested = true;
            Log("recv Server_InitDataRequest: server wants the mod list + def hashes. Only a real game client can answer this; handshake verified up to here.");
            break;
        case Packets.Server_Disconnect:
        {
            var p = new ServerDisconnectPacket();
            p.Bind(body);
            disconnectReason = p.reason.ToString();
            Log($"recv Server_Disconnect: {p.reason}");
            done = true;
            break;
        }
        default:
            Log($"recv {id} ({data.Length} bytes)");
            break;
    }
};

listener.PeerDisconnectedEvent += (_, info) =>
{
    Log($"disconnected: {info.Reason}");
    if (info.AdditionalData != null && info.AdditionalData.AvailableBytes > 0)
    {
        try
        {
            var bytes = info.AdditionalData.GetRemainingBytes();
            var p = new ServerDisconnectPacket();
            p.Bind(new PacketReader(new ByteReader(bytes)));
            disconnectReason = p.reason.ToString();
            Log($"server goodbye reason: {p.reason}");
        }
        catch (Exception e)
        {
            Log($"could not parse goodbye: {e.Message}");
        }
    }
    done = true;
};

listener.NetworkErrorEvent += (endPoint, error) => Log($"network error from {endPoint}: {error}");

if (!client.Start())
{
    Log("could not start LiteNetLib client");
    return 2;
}

Log($"connecting to {host}:{port} (timeout {timeout.TotalSeconds}s)");
client.Connect(host, port, "");

var sw = Stopwatch.StartNew();
while (!done && sw.Elapsed < timeout)
{
    client.PollEvents();
    Thread.Sleep(15);

    if (initDataRequested && !disconnecting)
    {
        disconnecting = true;
        Log("closing connection cleanly");
        client.DisconnectAll();
    }
}

client.Stop();

Console.WriteLine();
Console.WriteLine("RESULT");
Console.WriteLine($"  protocol_ok        = {gotProtocolOk}");
Console.WriteLine($"  standalone_server  = {isStandalone}");
Console.WriteLine($"  bootstrap_mode     = {(bootstrap.HasValue ? bootstrap.Value.bootstrap.ToString() : "n/a")}");
Console.WriteLine($"  settings_missing   = {(bootstrap.HasValue ? bootstrap.Value.settingsMissing.ToString() : "n/a")}");
Console.WriteLine($"  save_missing       = {(bootstrap.HasValue ? bootstrap.Value.saveMissing.ToString() : "n/a")}");
Console.WriteLine($"  username_ok        = {usernameOk}");
Console.WriteLine($"  init_data_requested= {initDataRequested}");
Console.WriteLine($"  disconnect_reason  = {disconnectReason ?? "none"}");

var pass = gotProtocolOk && isStandalone;
Console.WriteLine(pass ? "PASS" : "FAIL");
return pass ? 0 : 1;

static void Send<T>(NetPeer peer, T packet) where T : struct, IPacket
{
    var serialized = packet.Serialize();
    var full = new byte[1 + serialized.data.Length];
    full[0] = (byte)((byte)serialized.id & 0x3F);
    serialized.data.CopyTo(full, 1);
    peer.Send(full, DeliveryMethod.ReliableOrdered);
}

static void Log(string msg) => Console.WriteLine($"[{DateTime.Now:HH:mm:ss.fff}] {msg}");
