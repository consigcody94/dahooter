import { motion } from 'framer-motion';
import {
  Phone,
  Video,
  Delete,
  User,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useCallStore } from '@/stores/callStore';
import { formatPhoneNumber } from '@/utils/helpers';

const dialpadButtons = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

export function Dialpad() {
  const { dialpadNumber, appendToDialpad, backspaceDialpad, clearDialpad, contacts } = useAppStore();
  const { initiateCall } = useCallStore();

  // Find matching contact
  const matchingContact = contacts.find((c) =>
    c.phoneNumbers.some((p) =>
      p.number.replace(/\D/g, '').includes(dialpadNumber.replace(/\D/g, ''))
    )
  );

  const handleCall = (isVideo: boolean = false) => {
    if (dialpadNumber.length > 0) {
      initiateCall(dialpadNumber, isVideo);
    }
  };

  const handleKeyPress = (digit: string) => {
    appendToDialpad(digit);
    // Play DTMF tone
    playDTMF(digit);
  };

  const playDTMF = (digit: string) => {
    // Create oscillator for DTMF tone
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const frequencies: Record<string, [number, number]> = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
    };

    const freqs = frequencies[digit];
    if (freqs) {
      oscillator.type = 'sine';
      oscillator.frequency.value = freqs[0];
      gainNode.gain.value = 0.1;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Number display */}
        <div className="glass-card p-6 mb-6">
          <div className="min-h-[80px] flex flex-col items-center justify-center">
            {matchingContact ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-aurora flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-medium text-surface-100">
                    {matchingContact.displayName}
                  </span>
                </div>
                <span className="text-surface-400 text-sm">
                  {formatPhoneNumber(dialpadNumber)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-light text-surface-100 tracking-wider">
                {formatPhoneNumber(dialpadNumber) || 'Enter number'}
              </span>
            )}
          </div>

          {/* Backspace button */}
          {dialpadNumber && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={backspaceDialpad}
              onContextMenu={(e) => {
                e.preventDefault();
                clearDialpad();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-surface-400 hover:text-surface-100 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Delete className="w-6 h-6" />
            </motion.button>
          )}
        </div>

        {/* Dialpad grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {dialpadButtons.map(({ digit, letters }) => (
            <motion.button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="dialpad-btn ripple"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="dialpad-btn-number">{digit}</span>
              {letters && <span className="dialpad-btn-letters">{letters}</span>}
            </motion.button>
          ))}
        </div>

        {/* Call buttons */}
        <div className="flex items-center justify-center gap-6">
          {/* Video call */}
          <motion.button
            onClick={() => handleCall(true)}
            className="call-btn call-btn-action"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            disabled={!dialpadNumber}
          >
            <Video className="w-6 h-6" />
          </motion.button>

          {/* Audio call */}
          <motion.button
            onClick={() => handleCall(false)}
            className="w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!dialpadNumber}
          >
            <Phone className="w-8 h-8" />
          </motion.button>

          {/* Placeholder for symmetry */}
          <div className="w-14 h-14" />
        </div>
      </div>
    </div>
  );
}
