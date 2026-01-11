import { motion } from 'framer-motion';
import {
  Phone,
  Users,
  Clock,
  MessageSquare,
  Settings,
  Voicemail,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/utils/helpers';
import type { ViewType } from '@/types';

interface NavItem {
  id: ViewType;
  icon: typeof Phone;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dialpad', icon: Phone, label: 'Dialpad' },
  { id: 'contacts', icon: Users, label: 'Contacts' },
  { id: 'history', icon: Clock, label: 'History' },
  { id: 'messages', icon: MessageSquare, label: 'Messages', badge: 3 },
  { id: 'voicemail', icon: Voicemail, label: 'Voicemail', badge: 2 },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { currentView, setCurrentView, providers } = useAppStore();
  const isConnected = providers.length > 0;

  return (
    <aside className="w-20 h-full glass-dark flex flex-col items-center py-6 gap-2">
      {/* Logo */}
      <motion.div
        className="w-12 h-12 rounded-2xl bg-gradient-aurora flex items-center justify-center mb-6 shadow-glow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Phone className="w-6 h-6 text-white" />
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                'nav-item relative w-14 h-14',
                isActive && 'nav-item-active'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-aurora rounded-r-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Badge */}
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-nebula-500 rounded-full text-[10px] font-semibold flex items-center justify-center text-white">
                  {item.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Connection status */}
      <motion.div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        )}
        whileHover={{ scale: 1.1 }}
      >
        {isConnected ? (
          <Wifi className="w-5 h-5" />
        ) : (
          <WifiOff className="w-5 h-5" />
        )}
      </motion.div>
    </aside>
  );
}
