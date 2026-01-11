import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ViewType,
  Call,
  CallHistoryEntry,
  Contact,
  Conversation,
  Voicemail,
  ProviderConfig,
  UserSettings,
  PresenceStatus,
  AppNotification,
} from '@/types';

interface AppState {
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Providers
  providers: ProviderConfig[];
  activeProviderId: string | null;
  addProvider: (provider: ProviderConfig) => void;
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
  removeProvider: (id: string) => void;
  setActiveProvider: (id: string) => void;

  // Calls
  activeCalls: Call[];
  callHistory: CallHistoryEntry[];
  addCall: (call: Call) => void;
  updateCall: (id: string, updates: Partial<Call>) => void;
  removeCall: (id: string) => void;
  addToHistory: (entry: CallHistoryEntry) => void;
  clearHistory: () => void;

  // Contacts
  contacts: Contact[];
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  removeContact: (id: string) => void;
  toggleFavorite: (id: string) => void;

  // Conversations & Messages
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversation: (id: string | null) => void;

  // Voicemail
  voicemails: Voicemail[];
  markVoicemailRead: (id: string) => void;
  deleteVoicemail: (id: string) => void;

  // User Presence
  userPresence: PresenceStatus;
  setUserPresence: (status: PresenceStatus) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;

  // Notifications
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // UI State
  dialpadNumber: string;
  setDialpadNumber: (number: string) => void;
  appendToDialpad: (digit: string) => void;
  clearDialpad: () => void;
  backspaceDialpad: () => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  isCompactMode: boolean;
  toggleCompactMode: () => void;
}

const defaultSettings: UserSettings = {
  theme: 'dark',
  accentColor: 'aurora',
  ringtone: 'aurora-chime',
  ringVolume: 80,
  notificationSound: 'soft-ping',
  notificationVolume: 60,
  autoAnswer: false,
  autoAnswerDelay: 3,
  dndEnabled: false,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  showCallDuration: true,
  confirmBeforeHangup: false,
  startMinimized: false,
  minimizeToTray: true,
  launchOnStartup: false,
  language: 'en',
  dateFormat: 'MM/dd/yyyy',
  timeFormat: '12h',
};

const sampleContacts: Contact[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    displayName: 'Sarah Johnson',
    company: 'Acme Corp',
    jobTitle: 'Product Manager',
    phoneNumbers: [
      { type: 'mobile', number: '+1 (555) 123-4567', isPrimary: true },
      { type: 'work', number: '+1 (555) 987-6543', isPrimary: false },
    ],
    emails: [{ type: 'work', address: 'sarah.j@acme.com', isPrimary: true }],
    isFavorite: true,
    presence: 'available',
    source: 'local',
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Chen',
    displayName: 'Michael Chen',
    company: 'TechStart Inc',
    jobTitle: 'Software Engineer',
    phoneNumbers: [
      { type: 'mobile', number: '+1 (555) 234-5678', isPrimary: true },
    ],
    emails: [{ type: 'work', address: 'mchen@techstart.io', isPrimary: true }],
    isFavorite: true,
    presence: 'busy',
    source: 'local',
  },
  {
    id: '3',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    displayName: 'Emily Rodriguez',
    company: 'Design Studio',
    jobTitle: 'UX Designer',
    phoneNumbers: [
      { type: 'mobile', number: '+1 (555) 345-6789', isPrimary: true },
    ],
    emails: [{ type: 'work', address: 'emily@designstudio.co', isPrimary: true }],
    isFavorite: false,
    presence: 'away',
    source: 'local',
  },
  {
    id: '4',
    firstName: 'James',
    lastName: 'Wilson',
    displayName: 'James Wilson',
    company: 'Global Finance',
    jobTitle: 'CFO',
    phoneNumbers: [
      { type: 'work', number: '+1 (555) 456-7890', isPrimary: true },
    ],
    emails: [{ type: 'work', address: 'jwilson@globalfin.com', isPrimary: true }],
    isFavorite: false,
    presence: 'offline',
    source: 'local',
  },
  {
    id: '5',
    firstName: 'Lisa',
    lastName: 'Park',
    displayName: 'Lisa Park',
    company: 'Creative Agency',
    jobTitle: 'Creative Director',
    phoneNumbers: [
      { type: 'mobile', number: '+1 (555) 567-8901', isPrimary: true },
    ],
    emails: [{ type: 'work', address: 'lisa@creative.agency', isPrimary: true }],
    isFavorite: true,
    presence: 'available',
    source: 'local',
  },
];

const sampleHistory: CallHistoryEntry[] = [
  {
    id: 'h1',
    providerId: 'default',
    direction: 'outbound',
    remoteNumber: '+1 (555) 123-4567',
    remoteName: 'Sarah Johnson',
    startTime: new Date(Date.now() - 3600000),
    duration: 342,
    outcome: 'answered',
    isVideo: false,
  },
  {
    id: 'h2',
    providerId: 'default',
    direction: 'inbound',
    remoteNumber: '+1 (555) 234-5678',
    remoteName: 'Michael Chen',
    startTime: new Date(Date.now() - 7200000),
    duration: 0,
    outcome: 'missed',
    isVideo: false,
  },
  {
    id: 'h3',
    providerId: 'default',
    direction: 'outbound',
    remoteNumber: '+1 (555) 345-6789',
    remoteName: 'Emily Rodriguez',
    startTime: new Date(Date.now() - 86400000),
    duration: 1205,
    outcome: 'answered',
    isVideo: true,
  },
  {
    id: 'h4',
    providerId: 'default',
    direction: 'inbound',
    remoteNumber: '+1 (555) 999-0000',
    startTime: new Date(Date.now() - 172800000),
    duration: 45,
    outcome: 'voicemail',
    isVideo: false,
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentView: 'dialpad',
      setCurrentView: (view) => set({ currentView: view }),

      // Providers
      providers: [],
      activeProviderId: null,
      addProvider: (provider) =>
        set((state) => ({ providers: [...state.providers, provider] })),
      updateProvider: (id, updates) =>
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removeProvider: (id) =>
        set((state) => ({
          providers: state.providers.filter((p) => p.id !== id),
        })),
      setActiveProvider: (id) => set({ activeProviderId: id }),

      // Calls
      activeCalls: [],
      callHistory: sampleHistory,
      addCall: (call) =>
        set((state) => ({ activeCalls: [...state.activeCalls, call] })),
      updateCall: (id, updates) =>
        set((state) => ({
          activeCalls: state.activeCalls.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      removeCall: (id) =>
        set((state) => ({
          activeCalls: state.activeCalls.filter((c) => c.id !== id),
        })),
      addToHistory: (entry) =>
        set((state) => ({ callHistory: [entry, ...state.callHistory] })),
      clearHistory: () => set({ callHistory: [] }),

      // Contacts
      contacts: sampleContacts,
      addContact: (contact) =>
        set((state) => ({ contacts: [...state.contacts, contact] })),
      updateContact: (id, updates) =>
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      removeContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
        })),
      toggleFavorite: (id) =>
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
          ),
        })),

      // Conversations
      conversations: [],
      activeConversationId: null,
      setActiveConversation: (id) => set({ activeConversationId: id }),

      // Voicemail
      voicemails: [],
      markVoicemailRead: (id) =>
        set((state) => ({
          voicemails: state.voicemails.map((v) =>
            v.id === id ? { ...v, isNew: false } : v
          ),
        })),
      deleteVoicemail: (id) =>
        set((state) => ({
          voicemails: state.voicemails.filter((v) => v.id !== id),
        })),

      // Presence
      userPresence: 'available',
      setUserPresence: (status) => set({ userPresence: status }),

      // Settings
      settings: defaultSettings,
      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),

      // Notifications
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: crypto.randomUUID(),
              timestamp: new Date(),
              read: false,
            },
            ...state.notifications,
          ],
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),

      // UI State
      dialpadNumber: '',
      setDialpadNumber: (number) => set({ dialpadNumber: number }),
      appendToDialpad: (digit) =>
        set((state) => ({ dialpadNumber: state.dialpadNumber + digit })),
      clearDialpad: () => set({ dialpadNumber: '' }),
      backspaceDialpad: () =>
        set((state) => ({
          dialpadNumber: state.dialpadNumber.slice(0, -1),
        })),

      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      isCompactMode: false,
      toggleCompactMode: () =>
        set((state) => ({ isCompactMode: !state.isCompactMode })),
    }),
    {
      name: 'aurora-softphone-storage',
      partialize: (state) => ({
        providers: state.providers,
        contacts: state.contacts,
        callHistory: state.callHistory,
        settings: state.settings,
        userPresence: state.userPresence,
      }),
    }
  )
);
