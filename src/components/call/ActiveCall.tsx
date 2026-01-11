import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Pause,
  Play,
  Users,
  Grid3X3,
  ArrowRightLeft,
  Circle,
  Volume2,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  User,
} from 'lucide-react';
import { useCallStore } from '@/stores/callStore';
import { formatDuration, formatPhoneNumber, cn } from '@/utils/helpers';
import type { Call } from '@/types';

interface ActiveCallProps {
  call: Call;
}

export function ActiveCall({ call }: ActiveCallProps) {
  const {
    callDuration,
    hangUp,
    toggleMute,
    toggleHold,
    toggleVideo,
    startRecording,
    stopRecording,
    sendDTMF,
  } = useCallStore();

  const [showDTMF, setShowDTMF] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);

  // Audio visualization bars
  const [audioLevels, setAudioLevels] = useState([0.2, 0.5, 0.8, 0.6, 0.3]);

  useEffect(() => {
    // Simulate audio levels
    const interval = setInterval(() => {
      setAudioLevels([
        Math.random() * 0.8 + 0.2,
        Math.random() * 0.8 + 0.2,
        Math.random() * 0.8 + 0.2,
        Math.random() * 0.8 + 0.2,
        Math.random() * 0.8 + 0.2,
      ]);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const dtmfButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  const getCallStateText = () => {
    switch (call.state) {
      case 'dialing':
        return 'Calling...';
      case 'ringing':
        return 'Ringing...';
      case 'connected':
        return formatDuration(callDuration);
      case 'holding':
        return 'On Hold';
      case 'transferring':
        return 'Transferring...';
      default:
        return '';
    }
  };

  return (
    <div className="h-full w-full bg-surface-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-radial from-aurora-500/20 via-transparent to-transparent animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-radial from-cosmic-500/10 via-transparent to-transparent animate-pulse-slow animation-delay-500" />
      </div>

      {/* Video container (if video call) */}
      {call.isVideo && (
        <div className="absolute inset-0 bg-surface-900">
          {/* Remote video placeholder */}
          <div className="absolute inset-0 flex items-center justify-center bg-surface-800">
            <div className="text-surface-500">Remote video</div>
          </div>

          {/* Local video preview */}
          <motion.div
            className="absolute bottom-24 right-6 w-40 h-28 rounded-xl bg-surface-700 border border-surface-600 overflow-hidden shadow-glass-lg"
            drag
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-full h-full flex items-center justify-center text-surface-500 text-sm">
              Your video
            </div>
          </motion.div>
        </div>
      )}

      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-between py-12 px-6">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between">
          <motion.button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl glass-button text-surface-400 hover:text-surface-100"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </motion.button>

          {/* Call quality indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={cn(
                    'w-1 rounded-full',
                    bar <= 3 ? 'bg-emerald-400' : 'bg-surface-600'
                  )}
                  style={{ height: `${bar * 4}px` }}
                />
              ))}
            </div>
            <span className="text-xs text-surface-300">HD</span>
          </div>

          <motion.button
            className="p-2 rounded-xl glass-button text-surface-400 hover:text-surface-100"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreHorizontal className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Caller info */}
        <div className="flex flex-col items-center">
          {/* Avatar with audio visualization */}
          <div className="relative mb-6">
            <motion.div
              className="w-32 h-32 rounded-full bg-gradient-aurora flex items-center justify-center shadow-glow-lg"
              animate={{
                boxShadow:
                  call.state === 'connected'
                    ? [
                        '0 0 40px rgba(14, 165, 233, 0.4)',
                        '0 0 60px rgba(14, 165, 233, 0.6)',
                        '0 0 40px rgba(14, 165, 233, 0.4)',
                      ]
                    : '0 0 40px rgba(14, 165, 233, 0.4)',
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {call.remoteAvatar ? (
                <img
                  src={call.remoteAvatar}
                  alt={call.remoteName || 'Caller'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </motion.div>

            {/* Audio visualization ring */}
            {call.state === 'connected' && !call.isMuted && (
              <div className="absolute inset-0 flex items-center justify-center">
                {audioLevels.map((level, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-32 h-32 rounded-full border-2 border-aurora-400/30"
                    animate={{
                      scale: 1 + level * 0.3,
                      opacity: 1 - level * 0.5,
                    }}
                    transition={{ duration: 0.15 }}
                    style={{
                      rotate: `${i * 72}deg`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Muted indicator */}
            {call.isMuted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center"
              >
                <MicOff className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </div>

          {/* Name and number */}
          <h2 className="text-2xl font-semibold text-surface-100 mb-1">
            {call.remoteName || 'Unknown'}
          </h2>
          <p className="text-surface-400 mb-3">
            {formatPhoneNumber(call.remoteNumber)}
          </p>

          {/* Call state */}
          <div className="flex items-center gap-2">
            {call.state === 'connected' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
            <span
              className={cn(
                'text-lg font-mono',
                call.state === 'connected' ? 'text-emerald-400' : 'text-surface-300'
              )}
            >
              {getCallStateText()}
            </span>
          </div>

          {/* Recording indicator */}
          {call.isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-red-500/20 text-red-400"
            >
              <Circle className="w-3 h-3 fill-current animate-pulse" />
              <span className="text-sm font-medium">Recording</span>
            </motion.div>
          )}
        </div>

        {/* Call controls */}
        <div className="w-full max-w-md">
          {/* DTMF pad */}
          <AnimatePresence>
            {showDTMF && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card p-4 mb-6 overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-3">
                  {dtmfButtons.map((digit) => (
                    <motion.button
                      key={digit}
                      onClick={() => sendDTMF(digit)}
                      className="h-14 rounded-xl bg-surface-700/50 hover:bg-surface-600/70 text-surface-100 text-xl font-medium transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {digit}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Mute */}
            <motion.button
              onClick={toggleMute}
              className={cn(
                'call-btn call-btn-action',
                call.isMuted && 'bg-red-500/20 border-red-500/30 text-red-400'
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {call.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </motion.button>

            {/* Video toggle */}
            <motion.button
              onClick={toggleVideo}
              className={cn(
                'call-btn call-btn-action',
                !call.isVideo && 'bg-surface-600/50'
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {call.isVideo ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </motion.button>

            {/* Hold */}
            <motion.button
              onClick={toggleHold}
              className={cn(
                'call-btn call-btn-action',
                call.isOnHold && 'bg-amber-500/20 border-amber-500/30 text-amber-400'
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {call.isOnHold ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
            </motion.button>

            {/* Speaker */}
            <motion.button
              className="call-btn call-btn-action"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Volume2 className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Secondary controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {/* DTMF */}
            <motion.button
              onClick={() => setShowDTMF(!showDTMF)}
              className={cn(
                'call-btn call-btn-action w-12 h-12',
                showDTMF && 'bg-aurora-500/20 border-aurora-500/30 text-aurora-400'
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Grid3X3 className="w-5 h-5" />
            </motion.button>

            {/* Transfer */}
            <motion.button
              className="call-btn call-btn-action w-12 h-12"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowRightLeft className="w-5 h-5" />
            </motion.button>

            {/* Add call / Conference */}
            <motion.button
              className="call-btn call-btn-action w-12 h-12"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Users className="w-5 h-5" />
            </motion.button>

            {/* Record */}
            <motion.button
              onClick={call.isRecording ? stopRecording : startRecording}
              className={cn(
                'call-btn call-btn-action w-12 h-12',
                call.isRecording && 'bg-red-500/20 border-red-500/30 text-red-400'
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Circle className={cn('w-5 h-5', call.isRecording && 'fill-current')} />
            </motion.button>
          </div>

          {/* Hang up */}
          <div className="flex justify-center">
            <motion.button
              onClick={hangUp}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <PhoneOff className="w-8 h-8" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
