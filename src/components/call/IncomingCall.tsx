import { motion } from 'framer-motion';
import { Phone, PhoneOff, Video, MessageSquare, User } from 'lucide-react';
import { useCallStore } from '@/stores/callStore';
import { formatPhoneNumber } from '@/utils/helpers';
import type { Call } from '@/types';

interface IncomingCallProps {
  call: Call;
}

export function IncomingCall({ call }: IncomingCallProps) {
  const { answerCall, rejectCall } = useCallStore();

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="glass-card p-8 w-full max-w-sm mx-4"
    >
      {/* Ringing animation */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Ripple rings */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute w-32 h-32 rounded-full border-2 border-aurora-400/30"
            animate={{
              scale: [1, 2],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: ring * 0.4,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Avatar */}
        <motion.div
          className="relative w-28 h-28 rounded-full bg-gradient-aurora flex items-center justify-center shadow-glow-lg"
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {call.remoteAvatar ? (
            <img
              src={call.remoteAvatar}
              alt={call.remoteName || 'Caller'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-14 h-14 text-white" />
          )}
        </motion.div>
      </div>

      {/* Caller info */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-surface-100 mb-2">
          {call.remoteName || 'Unknown Caller'}
        </h2>
        <p className="text-surface-400 mb-3">
          {formatPhoneNumber(call.remoteNumber)}
        </p>
        <div className="flex items-center justify-center gap-2 text-surface-300">
          {call.isVideo ? (
            <>
              <Video className="w-4 h-4" />
              <span className="text-sm">Incoming Video Call</span>
            </>
          ) : (
            <>
              <Phone className="w-4 h-4 animate-ring" />
              <span className="text-sm">Incoming Call</span>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-6">
        {/* Decline */}
        <motion.button
          onClick={rejectCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <PhoneOff className="w-7 h-7" />
        </motion.button>

        {/* Send to voicemail / Message */}
        <motion.button
          className="w-12 h-12 rounded-full bg-surface-700/50 hover:bg-surface-600/70 text-surface-300 hover:text-surface-100 flex items-center justify-center border border-surface-600/50 transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageSquare className="w-5 h-5" />
        </motion.button>

        {/* Answer */}
        <motion.button
          onClick={answerCall}
          className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all animate-pulse-slow"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Phone className="w-7 h-7" />
        </motion.button>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex justify-center gap-4">
        <motion.button
          className="text-sm text-surface-400 hover:text-surface-100 transition-colors"
          whileHover={{ scale: 1.05 }}
        >
          Remind me in 1 hour
        </motion.button>
        <span className="text-surface-600">•</span>
        <motion.button
          className="text-sm text-surface-400 hover:text-surface-100 transition-colors"
          whileHover={{ scale: 1.05 }}
        >
          Reply with message
        </motion.button>
      </div>
    </motion.div>
  );
}
