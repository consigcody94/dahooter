import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  Circle,
  Settings,
  LogOut,
  User,
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAppStore } from '@/stores/appStore';
import { cn, getPresenceColor, getPresenceLabel } from '@/utils/helpers';
import type { PresenceStatus } from '@/types';

const presenceOptions: { status: PresenceStatus; icon: typeof Circle; color: string }[] = [
  { status: 'available', icon: CheckCircle, color: 'text-emerald-400' },
  { status: 'busy', icon: XCircle, color: 'text-red-400' },
  { status: 'away', icon: Clock, color: 'text-amber-400' },
  { status: 'dnd', icon: MinusCircle, color: 'text-red-500' },
  { status: 'offline', icon: Circle, color: 'text-surface-400' },
];

export function Header() {
  const {
    currentView,
    userPresence,
    setUserPresence,
    searchQuery,
    setSearchQuery,
    settings,
    updateSettings,
    notifications,
  } = useAppStore();

  const [showSearch, setShowSearch] = useState(false);
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const viewTitles: Record<string, string> = {
    dialpad: 'Dialpad',
    contacts: 'Contacts',
    history: 'Call History',
    messages: 'Messages',
    voicemail: 'Voicemail',
    settings: 'Settings',
  };

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-surface-800/50">
      {/* Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-surface-100">
          {viewTitles[currentView]}
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-glass text-sm h-10"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => {
            setShowSearch(!showSearch);
            if (showSearch) setSearchQuery('');
          }}
          className="w-10 h-10 rounded-xl glass-button flex items-center justify-center text-surface-400 hover:text-surface-100"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Search className="w-5 h-5" />
        </motion.button>

        {/* Notifications */}
        <motion.button
          className="w-10 h-10 rounded-xl glass-button flex items-center justify-center text-surface-400 hover:text-surface-100 relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-nebula-500 rounded-full text-[10px] font-semibold flex items-center justify-center text-white">
              {unreadNotifications}
            </span>
          )}
        </motion.button>

        {/* Theme toggle */}
        <motion.button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl glass-button flex items-center justify-center text-surface-400 hover:text-surface-100"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </motion.button>

        {/* Presence dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <motion.button
              className="flex items-center gap-2 px-3 py-2 rounded-xl glass-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-aurora flex items-center justify-center text-white text-sm font-semibold">
                  U
                </div>
                <div
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-900',
                    getPresenceColor(userPresence)
                  )}
                />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-surface-100">User</p>
                <p className="text-xs text-surface-400">{getPresenceLabel(userPresence)}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-surface-400" />
            </motion.button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[200px] glass-card p-2 shadow-glass-lg z-50"
              sideOffset={8}
              align="end"
            >
              <div className="px-2 py-1.5 mb-2">
                <p className="text-sm font-medium text-surface-100">Set Status</p>
              </div>

              {presenceOptions.map(({ status, icon: Icon, color }) => (
                <DropdownMenu.Item
                  key={status}
                  onClick={() => setUserPresence(status)}
                  className={cn(
                    'flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer outline-none',
                    'hover:bg-surface-700/50 transition-colors',
                    userPresence === status && 'bg-surface-700/50'
                  )}
                >
                  <Icon className={cn('w-4 h-4', color)} />
                  <span className="text-sm text-surface-100">{getPresenceLabel(status)}</span>
                </DropdownMenu.Item>
              ))}

              <DropdownMenu.Separator className="h-px bg-surface-700/50 my-2" />

              <DropdownMenu.Item
                className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer outline-none hover:bg-surface-700/50 transition-colors"
              >
                <User className="w-4 h-4 text-surface-400" />
                <span className="text-sm text-surface-100">Profile</span>
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer outline-none hover:bg-surface-700/50 transition-colors"
              >
                <Settings className="w-4 h-4 text-surface-400" />
                <span className="text-sm text-surface-100">Settings</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-surface-700/50 my-2" />

              <DropdownMenu.Item
                className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer outline-none hover:bg-red-500/10 text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
