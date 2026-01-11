import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Image,
  User,
} from 'lucide-react';
import { cn, getInitials, generateGradient, formatTime, getPresenceColor } from '@/utils/helpers';

// Sample conversation data
const sampleConversations = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: null,
    lastMessage: 'Thanks for the update! Let me know when you\'re free to discuss.',
    timestamp: new Date(Date.now() - 300000),
    unread: 2,
    presence: 'available',
  },
  {
    id: '2',
    name: 'Michael Chen',
    avatar: null,
    lastMessage: 'The project looks great. Can we schedule a call?',
    timestamp: new Date(Date.now() - 3600000),
    unread: 0,
    presence: 'busy',
  },
  {
    id: '3',
    name: 'Team Standup',
    isGroup: true,
    participants: 5,
    lastMessage: 'Emily: I\'ll have the designs ready by EOD',
    timestamp: new Date(Date.now() - 7200000),
    unread: 12,
  },
  {
    id: '4',
    name: 'Lisa Park',
    avatar: null,
    lastMessage: 'Perfect, see you tomorrow!',
    timestamp: new Date(Date.now() - 86400000),
    unread: 0,
    presence: 'offline',
  },
];

const sampleMessages = [
  {
    id: '1',
    senderId: 'other',
    content: 'Hey! How\'s the project coming along?',
    timestamp: new Date(Date.now() - 7200000),
    status: 'read',
  },
  {
    id: '2',
    senderId: 'me',
    content: 'Going well! Just finished the main components.',
    timestamp: new Date(Date.now() - 7100000),
    status: 'read',
  },
  {
    id: '3',
    senderId: 'other',
    content: 'That\'s awesome! Can you share a preview?',
    timestamp: new Date(Date.now() - 7000000),
    status: 'read',
  },
  {
    id: '4',
    senderId: 'me',
    content: 'Sure! Here\'s a quick screenshot of the new dashboard.',
    timestamp: new Date(Date.now() - 6900000),
    status: 'read',
    hasImage: true,
  },
  {
    id: '5',
    senderId: 'other',
    content: 'Thanks for the update! Let me know when you\'re free to discuss.',
    timestamp: new Date(Date.now() - 300000),
    status: 'read',
  },
];

export function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(sampleConversations[0]);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      // Send message logic
      setNewMessage('');
    }
  };

  return (
    <div className="h-full flex">
      {/* Conversation list */}
      <div className="w-80 border-r border-surface-800/50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-surface-800/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-100">Messages</h2>
            <motion.button
              className="p-2 rounded-lg glass-button text-surface-400 hover:text-surface-100"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              placeholder="Search messages..."
              className="input-glass pl-9 py-2 text-sm"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {sampleConversations.map((conv) => (
            <motion.div
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={cn(
                'flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-surface-800/30',
                selectedConversation?.id === conv.id
                  ? 'bg-aurora-500/10'
                  : 'hover:bg-surface-800/30'
              )}
              whileHover={{ x: 4 }}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ background: generateGradient(conv.name) }}
                >
                  {conv.isGroup ? (
                    <span className="text-sm">{conv.participants}</span>
                  ) : (
                    getInitials(conv.name)
                  )}
                </div>
                {conv.presence && (
                  <div
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-900',
                      getPresenceColor(conv.presence)
                    )}
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-surface-100 truncate">{conv.name}</span>
                  <span className="text-xs text-surface-500">
                    {formatTime(conv.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-surface-400 truncate">{conv.lastMessage}</p>
              </div>

              {/* Unread badge */}
              {conv.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-aurora-500 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                  {conv.unread}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-surface-800/50">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ background: generateGradient(selectedConversation.name) }}
              >
                {getInitials(selectedConversation.name)}
              </div>
              <div>
                <h3 className="font-medium text-surface-100">{selectedConversation.name}</h3>
                <p className="text-xs text-surface-400">
                  {selectedConversation.presence === 'available' ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                className="p-2.5 rounded-xl glass-button text-surface-400 hover:text-emerald-400"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Phone className="w-5 h-5" />
              </motion.button>
              <motion.button
                className="p-2.5 rounded-xl glass-button text-surface-400 hover:text-aurora-400"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Video className="w-5 h-5" />
              </motion.button>
              <motion.button
                className="p-2.5 rounded-xl glass-button text-surface-400 hover:text-surface-100"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MoreVertical className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
            {sampleMessages.map((msg) => {
              const isMe = msg.senderId === 'me';

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn('max-w-[70%] flex flex-col', isMe ? 'items-end' : 'items-start')}>
                    <div
                      className={cn(
                        'px-4 py-2.5 rounded-2xl',
                        isMe
                          ? 'bg-gradient-aurora text-white rounded-br-md'
                          : 'bg-surface-800/70 text-surface-100 rounded-bl-md'
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                      {msg.hasImage && (
                        <div className="mt-2 w-48 h-32 rounded-lg bg-surface-700 flex items-center justify-center">
                          <Image className="w-8 h-8 text-surface-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-xs text-surface-500">
                        {formatTime(msg.timestamp)}
                      </span>
                      {isMe && (
                        msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-aurora-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-surface-500" />
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Message input */}
          <div className="p-4 border-t border-surface-800/50">
            <div className="flex items-center gap-3">
              <motion.button
                className="p-2.5 rounded-xl glass-button text-surface-400 hover:text-surface-100"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Paperclip className="w-5 h-5" />
              </motion.button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="input-glass pr-12"
                />
                <motion.button
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-surface-400 hover:text-surface-100"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Smile className="w-5 h-5" />
                </motion.button>
              </div>

              <motion.button
                onClick={handleSend}
                className={cn(
                  'p-2.5 rounded-xl transition-colors',
                  newMessage.trim()
                    ? 'bg-aurora-500 text-white hover:bg-aurora-600'
                    : 'bg-surface-800/50 text-surface-500'
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={!newMessage.trim()}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-surface-400">
          <div className="text-center">
            <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm">Choose a chat to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}
