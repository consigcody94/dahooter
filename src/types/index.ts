// Provider Types
export type ProviderType =
  | 'freepbx'
  | 'ringcentral'
  | '3cx'
  | 'asterisk'
  | 'freeswitch'
  | 'generic-sip'
  | 'twilio'
  | 'vonage';

export interface ProviderConfig {
  id: string;
  type: ProviderType;
  name: string;
  enabled: boolean;
  // SIP Configuration
  server: string;
  port: number;
  transport: 'ws' | 'wss' | 'tcp' | 'udp' | 'tls';
  realm?: string;
  // Authentication
  username: string;
  password: string;
  authUsername?: string;
  // WebRTC
  stunServers?: string[];
  turnServers?: TurnServer[];
  // Features
  features: ProviderFeatures;
  // OAuth (for RingCentral, etc.)
  oauth?: OAuthConfig;
}

export interface TurnServer {
  urls: string;
  username?: string;
  credential?: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface ProviderFeatures {
  voiceCalls: boolean;
  videoCalls: boolean;
  messaging: boolean;
  presence: boolean;
  voicemail: boolean;
  callRecording: boolean;
  callTransfer: boolean;
  conferencing: boolean;
  callParking: boolean;
  callQueues: boolean;
  ivr: boolean;
  fax: boolean;
}

// Call Types
export type CallState =
  | 'idle'
  | 'dialing'
  | 'ringing'
  | 'incoming'
  | 'connected'
  | 'holding'
  | 'transferring'
  | 'ended';

export type CallDirection = 'inbound' | 'outbound';

export interface Call {
  id: string;
  providerId: string;
  direction: CallDirection;
  state: CallState;
  remoteNumber: string;
  remoteName?: string;
  remoteAvatar?: string;
  startTime?: Date;
  connectTime?: Date;
  endTime?: Date;
  duration: number;
  isVideo: boolean;
  isMuted: boolean;
  isOnHold: boolean;
  isRecording: boolean;
  quality?: CallQuality;
}

export interface CallQuality {
  mos: number; // Mean Opinion Score (1-5)
  jitter: number; // ms
  packetLoss: number; // percentage
  latency: number; // ms
}

export interface CallHistoryEntry {
  id: string;
  providerId: string;
  direction: CallDirection;
  remoteNumber: string;
  remoteName?: string;
  remoteAvatar?: string;
  startTime: Date;
  duration: number;
  outcome: 'answered' | 'missed' | 'voicemail' | 'rejected' | 'failed';
  isVideo: boolean;
  recording?: string;
  notes?: string;
}

// Contact Types
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  company?: string;
  jobTitle?: string;
  phoneNumbers: PhoneNumber[];
  emails: Email[];
  addresses?: Address[];
  notes?: string;
  isFavorite: boolean;
  presence?: PresenceStatus;
  source: 'local' | 'provider' | 'imported';
  providerId?: string;
  lastContacted?: Date;
  tags?: string[];
}

export interface PhoneNumber {
  type: 'mobile' | 'work' | 'home' | 'fax' | 'other';
  number: string;
  isPrimary: boolean;
}

export interface Email {
  type: 'work' | 'personal' | 'other';
  address: string;
  isPrimary: boolean;
}

export interface Address {
  type: 'work' | 'home' | 'other';
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Presence Types
export type PresenceStatus =
  | 'available'
  | 'busy'
  | 'away'
  | 'dnd'
  | 'offline'
  | 'on-call'
  | 'ringing';

export interface PresenceInfo {
  status: PresenceStatus;
  statusMessage?: string;
  lastSeen?: Date;
}

// Messaging Types
export interface Conversation {
  id: string;
  providerId: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
  isGroup: boolean;
  name?: string;
  avatar?: string;
}

export interface ConversationParticipant {
  id: string;
  number: string;
  name?: string;
  avatar?: string;
  presence?: PresenceStatus;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'audio' | 'video';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
}

// Voicemail Types
export interface Voicemail {
  id: string;
  providerId: string;
  callerNumber: string;
  callerName?: string;
  timestamp: Date;
  duration: number;
  isNew: boolean;
  transcription?: string;
  audioUrl: string;
}

// Settings Types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: 'aurora' | 'cosmic' | 'nebula' | 'custom';
  customAccentColor?: string;
  ringtone: string;
  ringVolume: number;
  notificationSound: string;
  notificationVolume: number;
  autoAnswer: boolean;
  autoAnswerDelay: number;
  dndEnabled: boolean;
  dndSchedule?: DndSchedule;
  audioInputDevice?: string;
  audioOutputDevice?: string;
  videoInputDevice?: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  showCallDuration: boolean;
  confirmBeforeHangup: boolean;
  startMinimized: boolean;
  minimizeToTray: boolean;
  launchOnStartup: boolean;
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

export interface DndSchedule {
  enabled: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  days: number[]; // 0-6 (Sunday-Saturday)
}

// Audio/Video Types
export interface MediaDevices {
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
}

export interface AudioLevels {
  input: number;
  output: number;
}

// App State Types
export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'call';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
}

export type ViewType =
  | 'dialpad'
  | 'contacts'
  | 'history'
  | 'messages'
  | 'voicemail'
  | 'settings';
