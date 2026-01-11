import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  Voicemail,
  Clock,
  Trash2,
  MoreVertical,
  User,
  Search,
  Filter,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useCallStore } from '@/stores/callStore';
import {
  cn,
  formatPhoneNumber,
  formatCallDuration,
  formatRelativeTime,
  formatTime,
  getInitials,
  generateGradient,
} from '@/utils/helpers';
import type { CallHistoryEntry } from '@/types';

type FilterType = 'all' | 'missed' | 'incoming' | 'outgoing';

export function CallHistory() {
  const { callHistory, clearHistory, searchQuery, contacts } = useAppStore();
  const { initiateCall } = useCallStore();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredHistory = useMemo(() => {
    let result = callHistory;

    if (filter !== 'all') {
      result = result.filter((call) => {
        if (filter === 'missed') return call.outcome === 'missed';
        if (filter === 'incoming') return call.direction === 'inbound';
        if (filter === 'outgoing') return call.direction === 'outbound';
        return true;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (call) =>
          call.remoteNumber.includes(query) ||
          call.remoteName?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [callHistory, filter, searchQuery]);

  // Group by date
  const groupedHistory = useMemo(() => {
    const groups: Record<string, CallHistoryEntry[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filteredHistory.forEach((call) => {
      const callDate = new Date(call.startTime);
      callDate.setHours(0, 0, 0, 0);

      let label: string;
      if (callDate.getTime() === today.getTime()) {
        label = 'Today';
      } else if (callDate.getTime() === yesterday.getTime()) {
        label = 'Yesterday';
      } else {
        label = callDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(call);
    });

    return groups;
  }, [filteredHistory]);

  const getCallIcon = (call: CallHistoryEntry) => {
    if (call.outcome === 'missed') {
      return <PhoneMissed className="w-4 h-4 text-red-400" />;
    }
    if (call.outcome === 'voicemail') {
      return <Voicemail className="w-4 h-4 text-amber-400" />;
    }
    if (call.direction === 'inbound') {
      return <PhoneIncoming className="w-4 h-4 text-emerald-400" />;
    }
    return <PhoneOutgoing className="w-4 h-4 text-aurora-400" />;
  };

  const findContact = (number: string) => {
    return contacts.find((c) =>
      c.phoneNumbers.some((p) => p.number.replace(/\D/g, '') === number.replace(/\D/g, ''))
    );
  };

  const handleCall = (number: string) => {
    initiateCall(number);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-surface-800/50">
        <div className="flex items-center gap-3 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
            <input
              type="text"
              placeholder="Search call history..."
              className="input-glass pl-10"
            />
          </div>

          {/* Clear history */}
          <motion.button
            onClick={clearHistory}
            className="p-2.5 rounded-xl glass-button text-red-400 hover:bg-red-500/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'missed', 'incoming', 'outgoing'] as FilterType[]).map((f) => {
            const icons = {
              all: Phone,
              missed: PhoneMissed,
              incoming: PhoneIncoming,
              outgoing: PhoneOutgoing,
            };
            const Icon = icons[f];

            return (
              <motion.button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2',
                  filter === f
                    ? 'bg-aurora-500/20 text-aurora-400 border border-aurora-500/30'
                    : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800/50'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {Object.entries(groupedHistory).map(([date, calls]) => (
          <div key={date} className="mb-6">
            <h3 className="text-sm font-semibold text-surface-400 mb-3 px-2">
              {date}
            </h3>
            <div className="space-y-1">
              {calls.map((call) => {
                const contact = findContact(call.remoteNumber);
                const displayName = call.remoteName || contact?.displayName || 'Unknown';

                return (
                  <motion.div
                    key={call.id}
                    onClick={() => handleCall(call.remoteNumber)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-800/50 cursor-pointer transition-colors group"
                    whileHover={{ x: 4 }}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ background: generateGradient(displayName) }}
                      >
                        {contact?.avatar ? (
                          <img
                            src={contact.avatar}
                            alt={displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(displayName)
                        )}
                      </div>
                      {/* Call type indicator */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface-900 flex items-center justify-center">
                        {getCallIcon(call)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-medium truncate',
                            call.outcome === 'missed' ? 'text-red-400' : 'text-surface-100'
                          )}
                        >
                          {displayName}
                        </span>
                        {call.isVideo && (
                          <Video className="w-4 h-4 text-surface-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-surface-400 truncate">
                        {formatPhoneNumber(call.remoteNumber)}
                      </p>
                    </div>

                    {/* Time & duration */}
                    <div className="text-right">
                      <p className="text-sm text-surface-300">
                        {formatTime(new Date(call.startTime))}
                      </p>
                      {call.duration > 0 && (
                        <p className="text-xs text-surface-500 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {formatCallDuration(call.duration)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(call.remoteNumber);
                        }}
                        className="p-2 rounded-lg hover:bg-emerald-500/20 text-surface-400 hover:text-emerald-400 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Phone className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-surface-400">
            <Clock className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No call history</p>
            <p className="text-sm">
              {searchQuery || filter !== 'all'
                ? 'Try a different filter'
                : 'Your call history will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
