import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Phone,
  Bell,
  Palette,
  Volume2,
  Shield,
  Mic,
  Video,
  Globe,
  Server,
  Plus,
  Trash2,
  Edit2,
  Check,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';
import * as Select from '@radix-ui/react-select';
import * as Tabs from '@radix-ui/react-tabs';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/utils/helpers';
import type { ProviderType } from '@/types';

const providerTemplates: { type: ProviderType; name: string; logo: string }[] = [
  { type: 'freepbx', name: 'FreePBX', logo: '/providers/freepbx.svg' },
  { type: 'ringcentral', name: 'RingCentral', logo: '/providers/ringcentral.svg' },
  { type: '3cx', name: '3CX', logo: '/providers/3cx.svg' },
  { type: 'asterisk', name: 'Asterisk', logo: '/providers/asterisk.svg' },
  { type: 'freeswitch', name: 'FreeSWITCH', logo: '/providers/freeswitch.svg' },
  { type: 'twilio', name: 'Twilio', logo: '/providers/twilio.svg' },
  { type: 'vonage', name: 'Vonage', logo: '/providers/vonage.svg' },
  { type: 'generic-sip', name: 'Generic SIP', logo: '/providers/sip.svg' },
];

export function Settings() {
  const { settings, updateSettings, providers, addProvider, removeProvider } = useAppStore();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="h-full flex">
      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex"
        orientation="vertical"
      >
        {/* Sidebar */}
        <Tabs.List className="w-64 p-4 border-r border-surface-800/50 space-y-1">
          {[
            { id: 'general', icon: User, label: 'General' },
            { id: 'accounts', icon: Server, label: 'SIP Accounts' },
            { id: 'audio', icon: Volume2, label: 'Audio & Video' },
            { id: 'notifications', icon: Bell, label: 'Notifications' },
            { id: 'appearance', icon: Palette, label: 'Appearance' },
            { id: 'privacy', icon: Shield, label: 'Privacy' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Tabs.Trigger
                key={item.id}
                value={item.id}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                  activeTab === item.id
                    ? 'bg-aurora-500/20 text-aurora-400 border border-aurora-500/30'
                    : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800/50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {/* General Settings */}
          <Tabs.Content value="general" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-surface-100 mb-6">General Settings</h2>

              <div className="space-y-4">
                <SettingRow
                  label="Launch on startup"
                  description="Automatically start DaHooter when you log in"
                >
                  <SettingSwitch
                    checked={settings.launchOnStartup}
                    onCheckedChange={(checked) => updateSettings({ launchOnStartup: checked })}
                  />
                </SettingRow>

                <SettingRow
                  label="Start minimized"
                  description="Start the app minimized to system tray"
                >
                  <SettingSwitch
                    checked={settings.startMinimized}
                    onCheckedChange={(checked) => updateSettings({ startMinimized: checked })}
                  />
                </SettingRow>

                <SettingRow
                  label="Minimize to tray"
                  description="Keep the app running in the system tray when closed"
                >
                  <SettingSwitch
                    checked={settings.minimizeToTray}
                    onCheckedChange={(checked) => updateSettings({ minimizeToTray: checked })}
                  />
                </SettingRow>

                <SettingRow
                  label="Show call duration"
                  description="Display call duration during active calls"
                >
                  <SettingSwitch
                    checked={settings.showCallDuration}
                    onCheckedChange={(checked) => updateSettings({ showCallDuration: checked })}
                  />
                </SettingRow>

                <SettingRow
                  label="Confirm before hangup"
                  description="Ask for confirmation before ending a call"
                >
                  <SettingSwitch
                    checked={settings.confirmBeforeHangup}
                    onCheckedChange={(checked) => updateSettings({ confirmBeforeHangup: checked })}
                  />
                </SettingRow>
              </div>
            </div>
          </Tabs.Content>

          {/* SIP Accounts */}
          <Tabs.Content value="accounts" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-surface-100">SIP Accounts</h2>
              <motion.button
                className="btn-primary flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-5 h-5" />
                Add Account
              </motion.button>
            </div>

            {providers.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Server className="w-12 h-12 mx-auto mb-4 text-surface-400 opacity-50" />
                <h3 className="text-lg font-medium text-surface-100 mb-2">No accounts configured</h3>
                <p className="text-surface-400 mb-6">Add a SIP account to start making calls</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {providerTemplates.map((provider) => (
                    <motion.button
                      key={provider.type}
                      className="p-4 rounded-xl glass-button flex flex-col items-center gap-2 hover:border-aurora-500/30"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-surface-700 flex items-center justify-center">
                        <Phone className="w-6 h-6 text-aurora-400" />
                      </div>
                      <span className="text-sm font-medium text-surface-100">{provider.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="glass-card p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-aurora-500/20 flex items-center justify-center">
                        <Phone className="w-6 h-6 text-aurora-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-surface-100">{provider.name}</h3>
                        <p className="text-sm text-surface-400">{provider.username}@{provider.server}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        provider.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-700 text-surface-400'
                      )}>
                        {provider.enabled ? 'Connected' : 'Disconnected'}
                      </span>
                      <motion.button
                        className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-100"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => removeProvider(provider.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-surface-400 hover:text-red-400"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Tabs.Content>

          {/* Audio & Video Settings */}
          <Tabs.Content value="audio" className="space-y-6">
            <h2 className="text-xl font-semibold text-surface-100 mb-6">Audio & Video</h2>

            <div className="space-y-6">
              {/* Microphone */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Mic className="w-5 h-5 text-aurora-400" />
                  <h3 className="font-medium text-surface-100">Microphone</h3>
                </div>
                <select className="input-glass w-full">
                  <option>Default - Built-in Microphone</option>
                  <option>USB Microphone</option>
                  <option>Headset Microphone</option>
                </select>
                <div className="mt-3 h-2 bg-surface-800 rounded-full overflow-hidden">
                  <div className="h-full w-3/5 bg-gradient-aurora rounded-full animate-pulse" />
                </div>
              </div>

              {/* Speaker */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Volume2 className="w-5 h-5 text-aurora-400" />
                  <h3 className="font-medium text-surface-100">Speaker</h3>
                </div>
                <select className="input-glass w-full">
                  <option>Default - Built-in Speakers</option>
                  <option>External Speakers</option>
                  <option>Headphones</option>
                </select>
              </div>

              {/* Camera */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Video className="w-5 h-5 text-aurora-400" />
                  <h3 className="font-medium text-surface-100">Camera</h3>
                </div>
                <select className="input-glass w-full mb-4">
                  <option>Default - Built-in Camera</option>
                  <option>External Webcam</option>
                </select>
                <div className="aspect-video bg-surface-800 rounded-xl flex items-center justify-center">
                  <Video className="w-12 h-12 text-surface-600" />
                </div>
              </div>

              {/* Audio processing */}
              <div className="space-y-4">
                <SettingRow
                  label="Echo cancellation"
                  description="Reduce echo during calls"
                >
                  <SettingSwitch
                    checked={settings.echoCancellation}
                    onCheckedChange={(checked) => updateSettings({ echoCancellation: checked })}
                  />
                </SettingRow>

                <SettingRow
                  label="Noise suppression"
                  description="Filter background noise"
                >
                  <SettingSwitch
                    checked={settings.noiseSuppression}
                    onCheckedChange={(checked) => updateSettings({ noiseSuppression: checked })}
                  />
                </SettingRow>

                <SettingRow
                  label="Auto gain control"
                  description="Automatically adjust microphone volume"
                >
                  <SettingSwitch
                    checked={settings.autoGainControl}
                    onCheckedChange={(checked) => updateSettings({ autoGainControl: checked })}
                  />
                </SettingRow>
              </div>
            </div>
          </Tabs.Content>

          {/* Notifications */}
          <Tabs.Content value="notifications" className="space-y-6">
            <h2 className="text-xl font-semibold text-surface-100 mb-6">Notifications</h2>

            <div className="space-y-4">
              <SettingRow
                label="Do Not Disturb"
                description="Silence all incoming calls and notifications"
              >
                <SettingSwitch
                  checked={settings.dndEnabled}
                  onCheckedChange={(checked) => updateSettings({ dndEnabled: checked })}
                />
              </SettingRow>

              <SettingRow
                label="Auto-answer calls"
                description="Automatically answer incoming calls"
              >
                <SettingSwitch
                  checked={settings.autoAnswer}
                  onCheckedChange={(checked) => updateSettings({ autoAnswer: checked })}
                />
              </SettingRow>

              <div className="glass-card p-4">
                <label className="block text-sm font-medium text-surface-100 mb-2">
                  Ring Volume
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.ringVolume}
                  onChange={(e) => updateSettings({ ringVolume: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-surface-400 mt-1">
                  <span>0%</span>
                  <span>{settings.ringVolume}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="glass-card p-4">
                <label className="block text-sm font-medium text-surface-100 mb-2">
                  Notification Volume
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.notificationVolume}
                  onChange={(e) => updateSettings({ notificationVolume: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-surface-400 mt-1">
                  <span>0%</span>
                  <span>{settings.notificationVolume}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </Tabs.Content>

          {/* Appearance */}
          <Tabs.Content value="appearance" className="space-y-6">
            <h2 className="text-xl font-semibold text-surface-100 mb-6">Appearance</h2>

            <div className="glass-card p-4">
              <label className="block text-sm font-medium text-surface-100 mb-4">Theme</label>
              <div className="flex gap-3">
                {[
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'system', icon: Monitor, label: 'System' },
                ].map((theme) => {
                  const Icon = theme.icon;
                  return (
                    <motion.button
                      key={theme.value}
                      onClick={() => updateSettings({ theme: theme.value as 'light' | 'dark' | 'system' })}
                      className={cn(
                        'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors',
                        settings.theme === theme.value
                          ? 'bg-aurora-500/20 border-aurora-500/50 text-aurora-400'
                          : 'border-surface-700/50 text-surface-400 hover:border-surface-600'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{theme.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-4">
              <label className="block text-sm font-medium text-surface-100 mb-4">Accent Color</label>
              <div className="flex gap-3">
                {[
                  { value: 'aurora', color: 'bg-aurora-500', label: 'Aurora' },
                  { value: 'cosmic', color: 'bg-cosmic-500', label: 'Cosmic' },
                  { value: 'nebula', color: 'bg-nebula-500', label: 'Nebula' },
                ].map((accent) => (
                  <motion.button
                    key={accent.value}
                    onClick={() => updateSettings({ accentColor: accent.value as 'aurora' | 'cosmic' | 'nebula' })}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
                      settings.accentColor === accent.value
                        ? 'border-surface-500 bg-surface-800/50'
                        : 'border-surface-700/50 hover:border-surface-600'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={cn('w-5 h-5 rounded-full', accent.color)} />
                    <span className="text-sm font-medium text-surface-100">{accent.label}</span>
                    {settings.accentColor === accent.value && (
                      <Check className="w-4 h-4 text-aurora-400" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </Tabs.Content>

          {/* Privacy */}
          <Tabs.Content value="privacy" className="space-y-6">
            <h2 className="text-xl font-semibold text-surface-100 mb-6">Privacy & Security</h2>

            <div className="space-y-4">
              <div className="glass-card p-4">
                <h3 className="font-medium text-surface-100 mb-2">Encryption</h3>
                <p className="text-sm text-surface-400 mb-4">
                  All calls are encrypted using SRTP (Secure Real-time Transport Protocol)
                </p>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium">End-to-end encryption enabled</span>
                </div>
              </div>

              <div className="glass-card p-4">
                <h3 className="font-medium text-surface-100 mb-4">Data Management</h3>
                <div className="space-y-3">
                  <motion.button
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-800/50 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <span className="text-surface-100">Clear call history</span>
                    <ChevronRight className="w-5 h-5 text-surface-400" />
                  </motion.button>
                  <motion.button
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-800/50 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <span className="text-surface-100">Clear message history</span>
                    <ChevronRight className="w-5 h-5 text-surface-400" />
                  </motion.button>
                  <motion.button
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <span>Delete all data</span>
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl glass-card">
      <div>
        <p className="font-medium text-surface-100">{label}</p>
        {description && <p className="text-sm text-surface-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

interface SettingSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingSwitch({ checked, onCheckedChange }: SettingSwitchProps) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'w-11 h-6 rounded-full transition-colors relative',
        checked ? 'bg-aurora-500' : 'bg-surface-600'
      )}
    >
      <Switch.Thumb
        className={cn(
          'block w-5 h-5 rounded-full bg-white shadow-lg transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </Switch.Root>
  );
}
