import { create } from 'zustand';
import type { Call, CallState, CallQuality } from '@/types';

interface CallStore {
  // Current call state
  currentCall: Call | null;
  incomingCall: Call | null;
  callQueue: Call[];

  // Call actions
  initiateCall: (number: string, isVideo?: boolean) => void;
  receiveCall: (call: Call) => void;
  answerCall: () => void;
  rejectCall: () => void;
  hangUp: () => void;

  // In-call actions
  toggleMute: () => void;
  toggleHold: () => void;
  toggleVideo: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  sendDTMF: (digit: string) => void;

  // Transfer
  blindTransfer: (number: string) => void;
  attendedTransfer: (number: string) => void;

  // Conference
  mergeCall: () => void;

  // Quality monitoring
  updateCallQuality: (quality: CallQuality) => void;

  // Duration tracking
  callDuration: number;
  startDurationTimer: () => void;
  stopDurationTimer: () => void;

  // Internal
  _durationInterval: ReturnType<typeof setInterval> | null;
  _updateCallState: (state: Partial<Call>) => void;
}

export const useCallStore = create<CallStore>((set, get) => ({
  currentCall: null,
  incomingCall: null,
  callQueue: [],
  callDuration: 0,
  _durationInterval: null,

  initiateCall: (number, isVideo = false) => {
    const call: Call = {
      id: crypto.randomUUID(),
      providerId: 'default',
      direction: 'outbound',
      state: 'dialing',
      remoteNumber: number,
      startTime: new Date(),
      duration: 0,
      isVideo,
      isMuted: false,
      isOnHold: false,
      isRecording: false,
    };

    set({ currentCall: call });

    // Simulate connection (replace with actual SIP logic)
    setTimeout(() => {
      const currentCall = get().currentCall;
      if (currentCall && currentCall.id === call.id) {
        set({
          currentCall: {
            ...currentCall,
            state: 'ringing',
          },
        });
      }
    }, 1000);
  },

  receiveCall: (call) => {
    const currentCall = get().currentCall;
    if (currentCall) {
      // Queue the call if already on a call
      set((state) => ({ callQueue: [...state.callQueue, call] }));
    } else {
      set({ incomingCall: call });
    }
  },

  answerCall: () => {
    const { incomingCall, startDurationTimer } = get();
    if (incomingCall) {
      set({
        currentCall: {
          ...incomingCall,
          state: 'connected',
          connectTime: new Date(),
        },
        incomingCall: null,
      });
      startDurationTimer();
    }
  },

  rejectCall: () => {
    set({ incomingCall: null });
  },

  hangUp: () => {
    const { stopDurationTimer, callQueue } = get();
    stopDurationTimer();

    // Move next queued call to incoming if exists
    if (callQueue.length > 0) {
      const [nextCall, ...remainingQueue] = callQueue;
      set({
        currentCall: null,
        incomingCall: nextCall,
        callQueue: remainingQueue,
        callDuration: 0,
      });
    } else {
      set({
        currentCall: null,
        callDuration: 0,
      });
    }
  },

  toggleMute: () => {
    const { currentCall } = get();
    if (currentCall) {
      set({
        currentCall: {
          ...currentCall,
          isMuted: !currentCall.isMuted,
        },
      });
    }
  },

  toggleHold: () => {
    const { currentCall } = get();
    if (currentCall) {
      set({
        currentCall: {
          ...currentCall,
          isOnHold: !currentCall.isOnHold,
          state: currentCall.isOnHold ? 'connected' : 'holding',
        },
      });
    }
  },

  toggleVideo: () => {
    const { currentCall } = get();
    if (currentCall) {
      set({
        currentCall: {
          ...currentCall,
          isVideo: !currentCall.isVideo,
        },
      });
    }
  },

  startRecording: () => {
    const { currentCall } = get();
    if (currentCall) {
      set({
        currentCall: {
          ...currentCall,
          isRecording: true,
        },
      });
    }
  },

  stopRecording: () => {
    const { currentCall } = get();
    if (currentCall) {
      set({
        currentCall: {
          ...currentCall,
          isRecording: false,
        },
      });
    }
  },

  sendDTMF: (digit) => {
    // This would send DTMF tones via SIP
    console.log('Sending DTMF:', digit);
  },

  blindTransfer: (number) => {
    const { currentCall } = get();
    if (currentCall) {
      set({
        currentCall: {
          ...currentCall,
          state: 'transferring',
        },
      });
      // Implement blind transfer logic
    }
  },

  attendedTransfer: (number) => {
    // Implement attended transfer logic
  },

  mergeCall: () => {
    // Implement conference merge logic
  },

  updateCallQuality: (quality) => {
    const { currentCall } = get();
    if (currentCall) {
      set({
        currentCall: {
          ...currentCall,
          quality,
        },
      });
    }
  },

  startDurationTimer: () => {
    const interval = setInterval(() => {
      set((state) => ({ callDuration: state.callDuration + 1 }));
    }, 1000);
    set({ _durationInterval: interval });
  },

  stopDurationTimer: () => {
    const { _durationInterval } = get();
    if (_durationInterval) {
      clearInterval(_durationInterval);
      set({ _durationInterval: null });
    }
  },

  _updateCallState: (updates) => {
    const { currentCall } = get();
    if (currentCall) {
      set({
        currentCall: {
          ...currentCall,
          ...updates,
        },
      });
    }
  },
}));
