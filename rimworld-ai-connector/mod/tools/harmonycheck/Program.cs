// usage: harmonycheck <refDir with Assembly-CSharp.dll> <mod Source dir>
using System.Reflection;
using System.Text.RegularExpressions;

if (args.Length < 2) { Console.Error.WriteLine("usage: harmonycheck <refDir> <sourceDir>"); return 2; }
var refDir = args[0]; var srcDir = args[1];
var resolver = new PathAssemblyResolver(Directory.GetFiles(refDir, "*.dll"));
using var mlc = new MetadataLoadContext(resolver, coreAssemblyName: "mscorlib");
var asms = new[] { "Assembly-CSharp.dll", "UnityEngine.CoreModule.dll" }
    .Select(f => Path.Combine(refDir, f)).Where(File.Exists).Select(mlc.LoadFromAssemblyPath).ToList();
Console.WriteLine($"Assembly-CSharp {asms[0].GetName().Version}");
var flags = BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static;

var patchRe = new Regex(@"HarmonyPatch\(typeof\((?<type>[\w.]+)\)\s*,\s*""(?<member>\w+)""(?:\s*,\s*MethodType\.(?<kind>\w+))?");
var accessRe = new Regex(@"AccessTools\.(?<kind>Field|Method|Property|PropertyGetter|PropertySetter)\(typeof\((?<type>[\w.]+)\)\s*,\s*""(?<member>\w+)""");
var targets = new List<(string type, string member, string kind, string where)>();
foreach (var f in Directory.EnumerateFiles(srcDir, "*.cs", SearchOption.AllDirectories))
{
    if (f.Contains("/obj/") || f.Contains("/bin/")) continue;
    var text = File.ReadAllText(f);
    foreach (Match m in patchRe.Matches(text))
        targets.Add((m.Groups["type"].Value, m.Groups["member"].Value, m.Groups["kind"].Success ? m.Groups["kind"].Value : "Method", Path.GetFileName(f)));
    foreach (Match m in accessRe.Matches(text))
        targets.Add((m.Groups["type"].Value, m.Groups["member"].Value, m.Groups["kind"].Value, Path.GetFileName(f)));
}
int bad = 0;
foreach (var (typeName, member, kind, where) in targets.Distinct())
{
    var simple = typeName.Contains('.') ? typeName[(typeName.LastIndexOf('.') + 1)..] : typeName;
    var types = asms.SelectMany(a => a.GetTypes()).Where(t => t.Name == simple).ToList();
    if (types.Count == 0) { Console.WriteLine($"MISSING TYPE   {typeName} ({where})"); bad++; continue; }
    bool ok = types.Any(t => kind switch
    {
        "Getter" or "Setter" or "Property" or "PropertyGetter" or "PropertySetter" => t.GetProperty(member, flags) != null,
        "Field" => t.GetField(member, flags) != null,
        "Constructor" => true,
        _ => t.GetMethods(flags).Any(x => x.Name == member) || t.GetProperty(member, flags) != null,
    });
    Console.WriteLine($"{(ok ? "ok      " : "MISSING ")} {types[0].FullName}.{member} [{kind}] ({where})");
    if (!ok) bad++;
}
Console.WriteLine(bad == 0 ? $"ALL {targets.Distinct().Count()} TARGETS PRESENT" : $"{bad} MISSING");
return bad == 0 ? 0 : 1;
