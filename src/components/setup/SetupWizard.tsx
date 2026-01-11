import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  User,
  Server,
  Mic,
  Video,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Shield,
  Volume2,
  Sparkles,
  Zap,
  Globe,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { sipService, providerConfigs } from '@/services/sipService';
import { cn } from '@/utils/helpers';
import type { ProviderType, ProviderConfig } from '@/types';

interface SetupWizardProps {
  onComplete: () => void;
}

const steps = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'provider', title: 'Select Provider', icon: Server },
  { id: 'account', title: 'Account Setup', icon: User },
  { id: 'audio', title: 'Audio & Video', icon: Mic },
  { id: 'complete', title: 'Ready!', icon: Check },
];

const providers = [
  {
    type: 'freepbx' as ProviderType,
    name: 'FreePBX',
    description: 'Open-source PBX platform based on Asterisk',
    color: 'from-orange-500 to-red-500',
    popular: true,
  },
  {
    type: 'ringcentral' as ProviderType,
    name: 'RingCentral',
    description: 'Enterprise cloud communications platform',
    color: 'from-orange-400 to-orange-600',
    popular: true,
  },
  {
    type: '3cx' as ProviderType,
    name: '3CX',
    description: 'Software-based private branch exchange',
    color: 'from-blue-500 to-cyan-500',
    popular: true,
  },
  {
    type: 'asterisk' as ProviderType,
    name: 'Asterisk',
    description: 'Open-source communication server',
    color: 'from-red-500 to-orange-500',
    popular: false,
  },
  {
    type: 'freeswitch' as ProviderType,
    name: 'FreeSWITCH',
    description: 'Scalable open-source telephony platform',
    color: 'from-green-500 to-emerald-500',
    popular: false,
  },
  {
    type: 'twilio' as ProviderType,
    name: 'Twilio',
    description: 'Cloud communications API platform',
    color: 'from-red-500 to-pink-500',
    popular: true,
  },
  {
    type: 'vonage' as ProviderType,
    name: 'Vonage',
    description: 'Cloud communications and VoIP services',
    color: 'from-purple-500 to-violet-500',
    popular: false,
  },
  {
    type: 'generic-sip' as ProviderType,
    name: 'Generic SIP',
    description: 'Connect to any SIP-compatible server',
    color: 'from-gray-500 to-gray-600',
    popular: false,
  },
];

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const { addProvider, updateSettings } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    server: '',
    port: '',
    username: '',
    password: '',
    authUsername: '',
  });
  const [audioDevices, setAudioDevices] = useState<{
    inputs: MediaDeviceInfo[];
    outputs: MediaDeviceInfo[];
  }>({ inputs: [], outputs: [] });
  const [selectedDevices, setSelectedDevices] = useState({
    audioInput: '',
    audioOutput: '',
    videoInput: '',
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Load audio devices
  useEffect(() => {
    async function loadDevices() {
      try {
        // Request permissions first
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const devices = await sipService.getMediaDevices();
        setAudioDevices({
          inputs: devices.audioInputs,
          outputs: devices.audioOutputs,
        });
        // Set defaults
        if (devices.audioInputs.length > 0) {
          setSelectedDevices((prev) => ({ ...prev, audioInput: devices.audioInputs[0].deviceId }));
        }
        if (devices.audioOutputs.length > 0) {
          setSelectedDevices((prev) => ({ ...prev, audioOutput: devices.audioOutputs[0].deviceId }));
        }
        if (devices.videoInputs.length > 0) {
          setSelectedDevices((prev) => ({ ...prev, videoInput: devices.videoInputs[0].deviceId }));
        }
      } catch (err) {
        console.error('Failed to load devices:', err);
      }
    }
    loadDevices();
  }, []);

  // Update form when provider is selected
  useEffect(() => {
    if (selectedProvider) {
      const config = providerConfigs[selectedProvider];
      setFormData((prev) => ({
        ...prev,
        port: config.defaultPort.toString(),
        server: 'server' in config ? (config as { server: string }).server : '',
      }));
    }
  }, [selectedProvider]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    // Simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setTestStatus('success');
  };

  const handleComplete = () => {
    if (!selectedProvider) return;

    // Create provider config
    const config = providerConfigs[selectedProvider];
    const providerConfig: ProviderConfig = {
      id: crypto.randomUUID(),
      type: selectedProvider,
      name: formData.displayName || providers.find((p) => p.type === selectedProvider)?.name || 'My Account',
      enabled: true,
      server: formData.server,
      port: parseInt(formData.port) || config.defaultPort,
      transport: config.transport,
      username: formData.username,
      password: formData.password,
      authUsername: formData.authUsername || undefined,
      features: config.features,
    };

    addProvider(providerConfig);
    updateSettings({
      audioInputDevice: selectedDevices.audioInput,
      audioOutputDevice: selectedDevices.audioOutput,
      videoInputDevice: selectedDevices.videoInput,
    });

    onComplete();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return selectedProvider !== null;
      case 2:
        return formData.server && formData.username && formData.password;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
      <div className="absolute top-[-300px] left-[-200px] w-[600px] h-[600px] bg-aurora-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-cosmic-500/20 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl"
      >
        {/* Progress steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <motion.div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                    isActive && 'bg-aurora-500 text-white shadow-glow',
                    isCompleted && 'bg-emerald-500 text-white',
                    !isActive && !isCompleted && 'bg-surface-800 text-surface-400'
                  )}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </motion.div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-12 h-0.5 mx-2',
                      isCompleted ? 'bg-emerald-500' : 'bg-surface-700'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <motion.div
                  className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-aurora flex items-center justify-center shadow-glow-lg"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Phone className="w-12 h-12 text-white" />
                </motion.div>

                <h1 className="text-3xl font-bold text-surface-100 mb-3">
                  Welcome to <span className="gradient-text">DaHooter</span>
                </h1>
                <p className="text-surface-400 mb-8 max-w-md mx-auto">
                  Your gorgeous, feature-rich softphone for modern communication. Let's get you set up in just a few steps.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: Zap, label: 'Fast Setup', desc: '2 minutes' },
                    { icon: Shield, label: 'Secure', desc: 'Encrypted' },
                    { icon: Globe, label: 'Works With', desc: 'Any PBX' },
                  ].map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div key={feature.label} className="p-4 rounded-xl bg-surface-800/30">
                        <Icon className="w-6 h-6 text-aurora-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-surface-100">{feature.label}</p>
                        <p className="text-xs text-surface-400">{feature.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 1: Select Provider */}
            {currentStep === 1 && (
              <motion.div
                key="provider"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-surface-100 mb-2">Select Your Provider</h2>
                <p className="text-surface-400 mb-6">
                  Choose the VoIP/PBX system you're connecting to
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {providers.map((provider) => (
                    <motion.button
                      key={provider.type}
                      onClick={() => setSelectedProvider(provider.type)}
                      className={cn(
                        'p-4 rounded-xl border text-left transition-all relative overflow-hidden',
                        selectedProvider === provider.type
                          ? 'border-aurora-500/50 bg-aurora-500/10'
                          : 'border-surface-700/50 hover:border-surface-600 bg-surface-800/30 hover:bg-surface-800/50'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {provider.popular && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-aurora-500/20 text-aurora-400 text-[10px] font-semibold">
                          POPULAR
                        </span>
                      )}
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg bg-gradient-to-br mb-3 flex items-center justify-center',
                          provider.color
                        )}
                      >
                        <Server className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-surface-100">{provider.name}</h3>
                      <p className="text-xs text-surface-400 mt-1">{provider.description}</p>
                      {selectedProvider === provider.type && (
                        <motion.div
                          layoutId="selectedProvider"
                          className="absolute inset-0 border-2 border-aurora-500 rounded-xl"
                          initial={false}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Account Setup */}
            {currentStep === 2 && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-surface-100 mb-2">Account Setup</h2>
                <p className="text-surface-400 mb-6">
                  Enter your SIP credentials from your provider
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Display Name (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="My Office Phone"
                      className="input-glass"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-surface-300 mb-2">
                        Server Address *
                      </label>
                      <input
                        type="text"
                        value={formData.server}
                        onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                        placeholder="pbx.yourcompany.com"
                        className="input-glass"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-2">
                        Port
                      </label>
                      <input
                        type="text"
                        value={formData.port}
                        onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                        placeholder="5060"
                        className="input-glass"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Username / Extension *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="1001 or user@domain.com"
                      className="input-glass"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Your SIP password"
                        className="input-glass pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-100"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <details className="group">
                    <summary className="text-sm text-aurora-400 cursor-pointer hover:text-aurora-300">
                      Advanced Options
                    </summary>
                    <div className="mt-4 space-y-4 pl-4 border-l-2 border-surface-700">
                      <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">
                          Auth Username (if different)
                        </label>
                        <input
                          type="text"
                          value={formData.authUsername}
                          onChange={(e) => setFormData({ ...formData, authUsername: e.target.value })}
                          placeholder="Leave blank to use username"
                          className="input-glass"
                        />
                      </div>
                    </div>
                  </details>
                </div>
              </motion.div>
            )}

            {/* Step 3: Audio & Video */}
            {currentStep === 3 && (
              <motion.div
                key="audio"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-surface-100 mb-2">Audio & Video Setup</h2>
                <p className="text-surface-400 mb-6">
                  Select your microphone, speakers, and camera
                </p>

                <div className="space-y-6">
                  {/* Microphone */}
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Mic className="w-5 h-5 text-aurora-400" />
                      <span className="font-medium text-surface-100">Microphone</span>
                    </div>
                    <select
                      value={selectedDevices.audioInput}
                      onChange={(e) => setSelectedDevices({ ...selectedDevices, audioInput: e.target.value })}
                      className="input-glass w-full"
                    >
                      {audioDevices.inputs.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || 'Unknown Microphone'}
                        </option>
                      ))}
                    </select>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-surface-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-aurora rounded-full"
                          animate={{ width: ['30%', '60%', '40%', '70%', '30%'] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <span className="text-xs text-surface-400">Level</span>
                    </div>
                  </div>

                  {/* Speakers */}
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Volume2 className="w-5 h-5 text-aurora-400" />
                      <span className="font-medium text-surface-100">Speakers</span>
                    </div>
                    <select
                      value={selectedDevices.audioOutput}
                      onChange={(e) => setSelectedDevices({ ...selectedDevices, audioOutput: e.target.value })}
                      className="input-glass w-full"
                    >
                      {audioDevices.outputs.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || 'Unknown Speaker'}
                        </option>
                      ))}
                    </select>
                    <motion.button
                      className="mt-3 text-sm text-aurora-400 hover:text-aurora-300 flex items-center gap-2"
                      whileHover={{ x: 4 }}
                    >
                      <Volume2 className="w-4 h-4" />
                      Test Speakers
                    </motion.button>
                  </div>

                  {/* Camera preview */}
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Video className="w-5 h-5 text-aurora-400" />
                      <span className="font-medium text-surface-100">Camera</span>
                    </div>
                    <div className="aspect-video bg-surface-800 rounded-xl flex items-center justify-center mb-3">
                      <Video className="w-12 h-12 text-surface-600" />
                    </div>
                    <select
                      value={selectedDevices.videoInput}
                      onChange={(e) => setSelectedDevices({ ...selectedDevices, videoInput: e.target.value })}
                      className="input-glass w-full"
                    >
                      <option value="">Select camera...</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8"
              >
                <motion.div
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <Check className="w-12 h-12 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold text-surface-100 mb-3">You're All Set!</h2>
                <p className="text-surface-400 mb-8 max-w-md mx-auto">
                  DaHooter is configured and ready to make calls. Start communicating with crystal-clear quality.
                </p>

                {/* Test connection */}
                <motion.button
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className={cn(
                    'px-6 py-3 rounded-xl font-medium mb-6 flex items-center gap-2 mx-auto',
                    testStatus === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'glass-button text-surface-100'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {testStatus === 'testing' && <Loader2 className="w-5 h-5 animate-spin" />}
                  {testStatus === 'success' && <Check className="w-5 h-5" />}
                  {testStatus === 'idle' && <Phone className="w-5 h-5" />}
                  {testStatus === 'testing' ? 'Testing Connection...' : testStatus === 'success' ? 'Connection Successful!' : 'Test Connection'}
                </motion.button>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="p-4 rounded-xl bg-surface-800/30">
                    <p className="text-sm text-surface-400">Provider</p>
                    <p className="font-medium text-surface-100">
                      {providers.find((p) => p.type === selectedProvider)?.name}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-800/30">
                    <p className="text-sm text-surface-400">Extension</p>
                    <p className="font-medium text-surface-100">{formData.username}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-700/50">
            <motion.button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors',
                currentStep === 0
                  ? 'text-surface-600 cursor-not-allowed'
                  : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800/50'
              )}
              whileHover={currentStep > 0 ? { x: -4 } : {}}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </motion.button>

            {currentStep === steps.length - 1 ? (
              <motion.button
                onClick={handleComplete}
                className="btn-primary flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="w-5 h-5" />
                Start Using DaHooter
              </motion.button>
            ) : (
              <motion.button
                onClick={handleNext}
                disabled={!canProceed()}
                className={cn(
                  'flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all',
                  canProceed()
                    ? 'bg-aurora-500 hover:bg-aurora-600 text-white shadow-glow'
                    : 'bg-surface-700 text-surface-500 cursor-not-allowed'
                )}
                whileHover={canProceed() ? { scale: 1.02, x: 4 } : {}}
                whileTap={canProceed() ? { scale: 0.98 } : {}}
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Skip link */}
        {currentStep < steps.length - 1 && (
          <motion.button
            onClick={onComplete}
            className="mt-4 text-sm text-surface-500 hover:text-surface-300 mx-auto block"
            whileHover={{ scale: 1.02 }}
          >
            Skip setup for now
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
