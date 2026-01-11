import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Star,
  Phone,
  Video,
  MessageSquare,
  MoreVertical,
  User,
  Building,
  ChevronRight,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAppStore } from '@/stores/appStore';
import { useCallStore } from '@/stores/callStore';
import { cn, getInitials, getPresenceColor, generateGradient } from '@/utils/helpers';
import type { Contact } from '@/types';

export function ContactList() {
  const { contacts, searchQuery, toggleFavorite } = useAppStore();
  const { initiateCall } = useCallStore();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  const filteredContacts = useMemo(() => {
    let result = contacts;

    if (filter === 'favorites') {
      result = result.filter((c) => c.isFavorite);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.displayName.toLowerCase().includes(query) ||
          c.company?.toLowerCase().includes(query) ||
          c.phoneNumbers.some((p) => p.number.includes(query))
      );
    }

    // Sort: favorites first, then alphabetically
    return result.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.displayName.localeCompare(b.displayName);
    });
  }, [contacts, searchQuery, filter]);

  // Group contacts by first letter
  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    filteredContacts.forEach((contact) => {
      const letter = contact.displayName[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(contact);
    });
    return groups;
  }, [filteredContacts]);

  const handleCall = (number: string, isVideo: boolean = false) => {
    initiateCall(number, isVideo);
  };

  return (
    <div className="h-full flex">
      {/* Contact list */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="p-4 border-b border-surface-800/50">
          <div className="flex items-center gap-3 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
              <input
                type="text"
                placeholder="Search contacts..."
                className="input-glass pl-10"
              />
            </div>

            {/* Add contact */}
            <motion.button
              className="btn-primary flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Contact</span>
            </motion.button>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'favorites'] as const).map((f) => (
              <motion.button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                  filter === f
                    ? 'bg-aurora-500/20 text-aurora-400 border border-aurora-500/30'
                    : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800/50'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {f === 'favorites' && <Star className="w-4 h-4 inline mr-1.5" />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {Object.entries(groupedContacts).map(([letter, letterContacts]) => (
            <div key={letter} className="mb-6">
              <h3 className="text-sm font-semibold text-surface-400 mb-2 px-2">
                {letter}
              </h3>
              <div className="space-y-1">
                {letterContacts.map((contact) => (
                  <motion.div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={cn(
                      'flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors',
                      selectedContact?.id === contact.id
                        ? 'bg-aurora-500/10 border border-aurora-500/30'
                        : 'hover:bg-surface-800/50'
                    )}
                    whileHover={{ x: 4 }}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ background: generateGradient(contact.displayName) }}
                      >
                        {contact.avatar ? (
                          <img
                            src={contact.avatar}
                            alt={contact.displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(contact.displayName)
                        )}
                      </div>
                      {contact.presence && (
                        <div
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-900',
                            getPresenceColor(contact.presence)
                          )}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-surface-100 truncate">
                          {contact.displayName}
                        </span>
                        {contact.isFavorite && (
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      {contact.company && (
                        <p className="text-sm text-surface-400 truncate">
                          {contact.company}
                        </p>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(contact.phoneNumbers[0]?.number);
                        }}
                        className="p-2 rounded-lg hover:bg-aurora-500/20 text-surface-400 hover:text-aurora-400 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Phone className="w-4 h-4" />
                      </motion.button>
                    </div>

                    <ChevronRight className="w-4 h-4 text-surface-500" />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}

          {filteredContacts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-surface-400">
              <User className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-1">No contacts found</p>
              <p className="text-sm">
                {searchQuery ? 'Try a different search term' : 'Add your first contact'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact detail panel */}
      <AnimatePresence>
        {selectedContact && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-l border-surface-800/50 overflow-hidden"
          >
            <ContactDetail
              contact={selectedContact}
              onClose={() => setSelectedContact(null)}
              onCall={handleCall}
              onToggleFavorite={toggleFavorite}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ContactDetailProps {
  contact: Contact;
  onClose: () => void;
  onCall: (number: string, isVideo?: boolean) => void;
  onToggleFavorite: (id: string) => void;
}

function ContactDetail({ contact, onClose, onCall, onToggleFavorite }: ContactDetailProps) {
  return (
    <div className="h-full flex flex-col w-[380px]">
      {/* Header */}
      <div className="p-6 text-center border-b border-surface-800/50">
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-semibold shadow-glow"
            style={{ background: generateGradient(contact.displayName) }}
          >
            {contact.avatar ? (
              <img
                src={contact.avatar}
                alt={contact.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(contact.displayName)
            )}
          </div>
          {contact.presence && (
            <div
              className={cn(
                'absolute bottom-1 right-1 w-5 h-5 rounded-full border-3 border-surface-900',
                getPresenceColor(contact.presence)
              )}
            />
          )}
        </div>

        <h2 className="text-xl font-semibold text-surface-100 mb-1">
          {contact.displayName}
        </h2>
        {contact.jobTitle && contact.company && (
          <p className="text-surface-400 text-sm">
            {contact.jobTitle} at {contact.company}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <motion.button
            onClick={() => onCall(contact.phoneNumbers[0]?.number)}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Phone className="w-5 h-5" />
            <span className="text-xs">Call</span>
          </motion.button>

          <motion.button
            onClick={() => onCall(contact.phoneNumbers[0]?.number, true)}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-aurora-500/20 text-aurora-400 hover:bg-aurora-500/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Video className="w-5 h-5" />
            <span className="text-xs">Video</span>
          </motion.button>

          <motion.button
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-cosmic-500/20 text-cosmic-400 hover:bg-cosmic-500/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">Message</span>
          </motion.button>

          <motion.button
            onClick={() => onToggleFavorite(contact.id)}
            className={cn(
              'flex flex-col items-center gap-1 p-3 rounded-xl transition-colors',
              contact.isFavorite
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-surface-700/50 text-surface-400 hover:bg-surface-700'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Star className={cn('w-5 h-5', contact.isFavorite && 'fill-current')} />
            <span className="text-xs">Favorite</span>
          </motion.button>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {/* Phone numbers */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-surface-400 mb-3">Phone Numbers</h3>
          <div className="space-y-2">
            {contact.phoneNumbers.map((phone, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-800/30 hover:bg-surface-800/50 transition-colors group"
              >
                <div>
                  <p className="text-surface-100">{phone.number}</p>
                  <p className="text-xs text-surface-400 capitalize">{phone.type}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button
                    onClick={() => onCall(phone.number)}
                    className="p-2 rounded-lg hover:bg-emerald-500/20 text-surface-400 hover:text-emerald-400 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Phone className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={() => onCall(phone.number, true)}
                    className="p-2 rounded-lg hover:bg-aurora-500/20 text-surface-400 hover:text-aurora-400 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Video className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email */}
        {contact.emails && contact.emails.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-surface-400 mb-3">Email</h3>
            <div className="space-y-2">
              {contact.emails.map((email, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-surface-800/30"
                >
                  <p className="text-surface-100">{email.address}</p>
                  <p className="text-xs text-surface-400 capitalize">{email.type}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Company info */}
        {contact.company && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-surface-400 mb-3">Company</h3>
            <div className="p-3 rounded-xl bg-surface-800/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-700 flex items-center justify-center">
                <Building className="w-5 h-5 text-surface-400" />
              </div>
              <div>
                <p className="text-surface-100">{contact.company}</p>
                {contact.jobTitle && (
                  <p className="text-xs text-surface-400">{contact.jobTitle}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div>
            <h3 className="text-sm font-medium text-surface-400 mb-3">Notes</h3>
            <div className="p-3 rounded-xl bg-surface-800/30">
              <p className="text-surface-300 text-sm">{contact.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
