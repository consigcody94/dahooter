import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { useCallStore } from '@/stores/callStore';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Dialpad } from '@/components/dialpad/Dialpad';
import { ContactList } from '@/components/contacts/ContactList';
import { CallHistory } from '@/components/history/CallHistory';
import { Messages } from '@/components/messages/Messages';
import { Settings } from '@/components/settings/Settings';
import { ActiveCall } from '@/components/call/ActiveCall';
import { IncomingCall } from '@/components/call/IncomingCall';
import { SetupWizard } from '@/components/setup/SetupWizard';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function App() {
  const { currentView, providers } = useAppStore();
  const { currentCall, incomingCall } = useCallStore();
  const [showSetup, setShowSetup] = useState(false);
  const [hasCheckedSetup, setHasCheckedSetup] = useState(false);

  // Check if user needs to go through setup
  useEffect(() => {
    const hasCompletedSetup = localStorage.getItem('dahooter-setup-complete');
    if (!hasCompletedSetup && providers.length === 0) {
      setShowSetup(true);
    }
    setHasCheckedSetup(true);
  }, [providers.length]);

  const handleSetupComplete = () => {
    localStorage.setItem('dahooter-setup-complete', 'true');
    setShowSetup(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dialpad':
        return <Dialpad />;
      case 'contacts':
        return <ContactList />;
      case 'history':
        return <CallHistory />;
      case 'messages':
        return <Messages />;
      case 'settings':
        return <Settings />;
      default:
        return <Dialpad />;
    }
  };

  // Don't render until we've checked setup status
  if (!hasCheckedSetup) {
    return (
      <div className="h-screen w-screen bg-surface-950 flex items-center justify-center">
        <motion.div
          className="w-16 h-16 rounded-2xl bg-gradient-aurora flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              d="M12 6v6l4 2"
            />
          </svg>
        </motion.div>
      </div>
    );
  }

  // Show setup wizard for new users
  if (showSetup) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  return (
    <div className="h-screen w-screen bg-surface-950 overflow-hidden relative">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-50 pointer-events-none" />

      {/* Decorative orbs */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-aurora-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-cosmic-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-nebula-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main layout */}
      <div className="relative h-full flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />

          <main className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="h-full"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Active call overlay */}
      <AnimatePresence>
        {currentCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50"
          >
            <ActiveCall call={currentCall} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming call modal */}
      <AnimatePresence>
        {incomingCall && !currentCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <IncomingCall call={incomingCall} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
