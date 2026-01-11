/**
 * SIP/WebRTC Service for DaHooter Softphone
 *
 * This service handles all SIP communication using SIP.js library.
 * It supports multiple providers: FreePBX, RingCentral, 3CX, Asterisk, FreeSWITCH, and generic SIP.
 */

import { UserAgent, Registerer, Invitation, Inviter, Session, SessionState } from 'sip.js';
import type { ProviderConfig, Call, CallDirection } from '@/types';

export interface SipServiceConfig {
  provider: ProviderConfig;
  onIncomingCall?: (call: IncomingCallInfo) => void;
  onCallStateChange?: (callId: string, state: SessionState) => void;
  onRegistrationStateChange?: (registered: boolean) => void;
  onError?: (error: Error) => void;
}

export interface IncomingCallInfo {
  id: string;
  remoteNumber: string;
  remoteName?: string;
  isVideo: boolean;
}

class SipService {
  private userAgent: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private sessions: Map<string, Session> = new Map();
  private config: SipServiceConfig | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudio: HTMLAudioElement | null = null;

  constructor() {
    // Create audio element for remote audio
    this.remoteAudio = new Audio();
    this.remoteAudio.autoplay = true;
  }

  /**
   * Initialize the SIP service with provider configuration
   */
  async initialize(config: SipServiceConfig): Promise<void> {
    this.config = config;
    const { provider } = config;

    try {
      // Build WebSocket URI based on transport
      const wsProtocol = provider.transport === 'wss' ? 'wss' : 'ws';
      const wsUri = `${wsProtocol}://${provider.server}:${provider.port}/ws`;

      // Build SIP URI
      const sipUri = `sip:${provider.username}@${provider.server}`;
      const domain = provider.realm || provider.server;

      // Configure ICE servers
      const iceServers: RTCIceServer[] = [];

      // Add STUN servers
      if (provider.stunServers && provider.stunServers.length > 0) {
        iceServers.push({
          urls: provider.stunServers,
        });
      } else {
        // Default STUN servers
        iceServers.push({
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
          ],
        });
      }

      // Add TURN servers
      if (provider.turnServers) {
        provider.turnServers.forEach((turn) => {
          iceServers.push({
            urls: turn.urls,
            username: turn.username,
            credential: turn.credential,
          });
        });
      }

      // Create User Agent configuration
      const userAgentOptions = {
        uri: UserAgent.makeURI(sipUri),
        transportOptions: {
          server: wsUri,
          traceSip: true,
        },
        authorizationUsername: provider.authUsername || provider.username,
        authorizationPassword: provider.password,
        displayName: provider.name,
        sessionDescriptionHandlerFactoryOptions: {
          peerConnectionConfiguration: {
            iceServers,
          },
        },
        delegate: {
          onInvite: (invitation: Invitation) => this.handleIncomingCall(invitation),
        },
      };

      // Create User Agent
      this.userAgent = new UserAgent(userAgentOptions);

      // Start the User Agent
      await this.userAgent.start();

      // Create and send REGISTER
      this.registerer = new Registerer(this.userAgent, {
        expires: 600,
      });

      this.registerer.stateChange.addListener((state) => {
        const registered = state === 'Registered';
        config.onRegistrationStateChange?.(registered);
      });

      await this.registerer.register();

      console.log('SIP service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SIP service:', error);
      config.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Make an outgoing call
   */
  async makeCall(targetNumber: string, isVideo: boolean = false): Promise<string> {
    if (!this.userAgent || !this.config) {
      throw new Error('SIP service not initialized');
    }

    const callId = crypto.randomUUID();

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });

      // Build target URI
      const target = UserAgent.makeURI(`sip:${targetNumber}@${this.config.provider.server}`);
      if (!target) {
        throw new Error('Invalid target URI');
      }

      // Create inviter (outgoing call)
      const inviter = new Inviter(this.userAgent, target, {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: isVideo,
          },
        },
      });

      // Handle session state changes
      inviter.stateChange.addListener((state) => {
        this.handleSessionStateChange(callId, inviter, state);
      });

      // Store session
      this.sessions.set(callId, inviter);

      // Send INVITE
      await inviter.invite();

      return callId;
    } catch (error) {
      console.error('Failed to make call:', error);
      this.config.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Handle incoming call
   */
  private handleIncomingCall(invitation: Invitation): void {
    const callId = crypto.randomUUID();

    // Extract caller info from INVITE
    const remoteIdentity = invitation.remoteIdentity;
    const remoteNumber = remoteIdentity.uri.user || 'Unknown';
    const remoteName = remoteIdentity.displayName;

    // Check if it's a video call
    const sdp = invitation.body;
    const isVideo = sdp ? sdp.includes('m=video') : false;

    // Store session
    this.sessions.set(callId, invitation);

    // Handle session state changes
    invitation.stateChange.addListener((state) => {
      this.handleSessionStateChange(callId, invitation, state);
    });

    // Notify about incoming call
    this.config?.onIncomingCall?.({
      id: callId,
      remoteNumber,
      remoteName,
      isVideo,
    });
  }

  /**
   * Answer an incoming call
   */
  async answerCall(callId: string, withVideo: boolean = false): Promise<void> {
    const session = this.sessions.get(callId);
    if (!session || !(session instanceof Invitation)) {
      throw new Error('Invalid session or not an incoming call');
    }

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      });

      // Accept the invitation
      await session.accept({
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: withVideo,
          },
        },
      });
    } catch (error) {
      console.error('Failed to answer call:', error);
      this.config?.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Reject an incoming call
   */
  async rejectCall(callId: string): Promise<void> {
    const session = this.sessions.get(callId);
    if (!session || !(session instanceof Invitation)) {
      throw new Error('Invalid session or not an incoming call');
    }

    try {
      await session.reject();
      this.sessions.delete(callId);
    } catch (error) {
      console.error('Failed to reject call:', error);
      this.config?.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Hang up a call
   */
  async hangUp(callId: string): Promise<void> {
    const session = this.sessions.get(callId);
    if (!session) {
      throw new Error('Invalid session');
    }

    try {
      if (session.state === SessionState.Established) {
        await session.bye();
      } else if (session instanceof Inviter) {
        await session.cancel();
      } else if (session instanceof Invitation) {
        await session.reject();
      }

      this.cleanupSession(callId);
    } catch (error) {
      console.error('Failed to hang up:', error);
      this.config?.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Toggle mute
   */
  toggleMute(callId: string, muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Toggle hold
   */
  async toggleHold(callId: string, held: boolean): Promise<void> {
    const session = this.sessions.get(callId);
    if (!session) {
      throw new Error('Invalid session');
    }

    // SIP.js doesn't have a direct hold method, need to use session description handler
    // This would need to be implemented based on the specific use case
    console.log(`Hold ${held ? 'enabled' : 'disabled'} for call ${callId}`);
  }

  /**
   * Send DTMF tone
   */
  sendDTMF(callId: string, digit: string): void {
    const session = this.sessions.get(callId);
    if (!session) {
      throw new Error('Invalid session');
    }

    // Send DTMF using INFO message
    const options = {
      requestOptions: {
        body: {
          contentDisposition: 'render',
          contentType: 'application/dtmf-relay',
          content: `Signal=${digit}\r\nDuration=250`,
        },
      },
    };

    session.info(options);
  }

  /**
   * Transfer call (blind transfer)
   */
  async blindTransfer(callId: string, targetNumber: string): Promise<void> {
    const session = this.sessions.get(callId);
    if (!session) {
      throw new Error('Invalid session');
    }

    const target = UserAgent.makeURI(`sip:${targetNumber}@${this.config?.provider.server}`);
    if (!target) {
      throw new Error('Invalid transfer target');
    }

    try {
      await session.refer(target);
      this.cleanupSession(callId);
    } catch (error) {
      console.error('Failed to transfer call:', error);
      this.config?.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Handle session state changes
   */
  private handleSessionStateChange(callId: string, session: Session, state: SessionState): void {
    console.log(`Call ${callId} state changed to:`, state);

    this.config?.onCallStateChange?.(callId, state);

    if (state === SessionState.Established) {
      // Setup remote audio
      this.setupRemoteMedia(session);
    } else if (state === SessionState.Terminated) {
      this.cleanupSession(callId);
    }
  }

  /**
   * Setup remote media for playback
   */
  private setupRemoteMedia(session: Session): void {
    const sessionDescriptionHandler = session.sessionDescriptionHandler;
    if (!sessionDescriptionHandler) {
      console.warn('No session description handler');
      return;
    }

    // Get remote stream from peer connection
    // This is a simplified version - actual implementation depends on SIP.js version
    const peerConnection = (sessionDescriptionHandler as unknown as { peerConnection: RTCPeerConnection }).peerConnection;
    if (peerConnection) {
      const receivers = peerConnection.getReceivers();
      if (receivers.length > 0) {
        const remoteStream = new MediaStream();
        receivers.forEach((receiver) => {
          if (receiver.track) {
            remoteStream.addTrack(receiver.track);
          }
        });

        if (this.remoteAudio) {
          this.remoteAudio.srcObject = remoteStream;
        }
      }
    }
  }

  /**
   * Cleanup session resources
   */
  private cleanupSession(callId: string): void {
    this.sessions.delete(callId);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    // End all active sessions
    for (const [callId] of this.sessions) {
      try {
        await this.hangUp(callId);
      } catch {
        // Ignore errors during cleanup
      }
    }

    // Unregister
    if (this.registerer) {
      try {
        await this.registerer.unregister();
      } catch {
        // Ignore errors during cleanup
      }
    }

    // Stop user agent
    if (this.userAgent) {
      try {
        await this.userAgent.stop();
      } catch {
        // Ignore errors during cleanup
      }
    }

    this.userAgent = null;
    this.registerer = null;
    this.sessions.clear();
  }

  /**
   * Get available media devices
   */
  async getMediaDevices(): Promise<{
    audioInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  }> {
    const devices = await navigator.mediaDevices.enumerateDevices();

    return {
      audioInputs: devices.filter((d) => d.kind === 'audioinput'),
      audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
      videoInputs: devices.filter((d) => d.kind === 'videoinput'),
    };
  }

  /**
   * Set audio output device
   */
  async setAudioOutputDevice(deviceId: string): Promise<void> {
    if (this.remoteAudio && 'setSinkId' in this.remoteAudio) {
      await (this.remoteAudio as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(deviceId);
    }
  }
}

// Export singleton instance
export const sipService = new SipService();

// Provider-specific configuration helpers
export const providerConfigs = {
  freepbx: {
    defaultPort: 8089,
    transport: 'wss' as const,
    features: {
      voiceCalls: true,
      videoCalls: true,
      messaging: false,
      presence: true,
      voicemail: true,
      callRecording: true,
      callTransfer: true,
      conferencing: true,
      callParking: true,
      callQueues: true,
      ivr: true,
      fax: true,
    },
  },
  ringcentral: {
    server: 'sip.ringcentral.com',
    defaultPort: 5060,
    transport: 'wss' as const,
    features: {
      voiceCalls: true,
      videoCalls: true,
      messaging: true,
      presence: true,
      voicemail: true,
      callRecording: true,
      callTransfer: true,
      conferencing: true,
      callParking: false,
      callQueues: true,
      ivr: true,
      fax: true,
    },
  },
  '3cx': {
    defaultPort: 5090,
    transport: 'wss' as const,
    features: {
      voiceCalls: true,
      videoCalls: true,
      messaging: true,
      presence: true,
      voicemail: true,
      callRecording: true,
      callTransfer: true,
      conferencing: true,
      callParking: true,
      callQueues: true,
      ivr: true,
      fax: false,
    },
  },
  asterisk: {
    defaultPort: 8088,
    transport: 'wss' as const,
    features: {
      voiceCalls: true,
      videoCalls: true,
      messaging: false,
      presence: true,
      voicemail: true,
      callRecording: true,
      callTransfer: true,
      conferencing: true,
      callParking: true,
      callQueues: true,
      ivr: true,
      fax: true,
    },
  },
  freeswitch: {
    defaultPort: 7443,
    transport: 'wss' as const,
    features: {
      voiceCalls: true,
      videoCalls: true,
      messaging: false,
      presence: true,
      voicemail: true,
      callRecording: true,
      callTransfer: true,
      conferencing: true,
      callParking: true,
      callQueues: true,
      ivr: true,
      fax: true,
    },
  },
  twilio: {
    server: 'voice.twilio.com',
    defaultPort: 443,
    transport: 'wss' as const,
    features: {
      voiceCalls: true,
      videoCalls: true,
      messaging: true,
      presence: false,
      voicemail: true,
      callRecording: true,
      callTransfer: true,
      conferencing: true,
      callParking: false,
      callQueues: true,
      ivr: true,
      fax: false,
    },
  },
  vonage: {
    server: 'sip.nexmo.com',
    defaultPort: 5060,
    transport: 'wss' as const,
    features: {
      voiceCalls: true,
      videoCalls: false,
      messaging: true,
      presence: false,
      voicemail: false,
      callRecording: true,
      callTransfer: true,
      conferencing: true,
      callParking: false,
      callQueues: false,
      ivr: true,
      fax: false,
    },
  },
  'generic-sip': {
    defaultPort: 5060,
    transport: 'wss' as const,
    features: {
      voiceCalls: true,
      videoCalls: true,
      messaging: false,
      presence: false,
      voicemail: false,
      callRecording: false,
      callTransfer: true,
      conferencing: false,
      callParking: false,
      callQueues: false,
      ivr: false,
      fax: false,
    },
  },
};
