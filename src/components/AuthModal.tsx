'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { X, Copy, Check, AlertTriangle, User, KeyRound, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && <AuthModalBody onClose={onClose} />}
    </AnimatePresence>
  );
}

function AuthModalBody({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginUuid, setLoginUuid] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registeredUuid, setRegisteredUuid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, login, error, clearError } = useAuthStore();

  const handleClose = () => {
    clearError();
    onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (password !== confirmPassword) {
      useAuthStore.setState({ error: 'Passwords do not match' });
      return;
    }

    setIsSubmitting(true);
    const uuid = await register(password);
    setIsSubmitting(false);

    if (uuid) {
      setRegisteredUuid(uuid);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);
    const success = await login(loginUuid.trim(), loginPassword);
    setIsSubmitting(false);

    if (success) {
      handleClose();
    }
  };

  const handleCopy = async () => {
    if (registeredUuid) {
      await navigator.clipboard.writeText(registeredUuid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDoneWithRegistration = () => {
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md" 
          />

          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative z-10 w-full max-w-md bg-surface border border-border/60 rounded-3xl shadow-2xl shadow-primary/20 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-foreground/40 hover:text-foreground hover:bg-surface-hover rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {registeredUuid ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                      <Check className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Welcome aboard!</h2>
                      <p className="text-foreground/60 text-sm mt-0.5">Your account is ready.</p>
                    </div>
                  </div>

                  <div className="bg-surface-hover border border-yellow-500/30 rounded-2xl p-5 mb-6 shadow-inner">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                      <p className="text-yellow-400/90 text-sm leading-relaxed">
                        This UUID is your unique username. Save it somewhere safe — you will need it to log in. <strong className="text-yellow-400">It cannot be recovered if lost.</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 group relative">
                      <code className="flex-1 bg-background border border-border/50 rounded-xl px-4 py-3 text-sm font-mono text-primary break-all select-all transition-colors group-hover:border-primary/30">
                        {registeredUuid}
                      </code>
                      <button
                        onClick={handleCopy}
                        className="shrink-0 p-3 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95"
                        title="Copy UUID"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleDoneWithRegistration}
                    className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] active:scale-[0.98]"
                  >
                    I&apos;ve Saved My UUID — Continue
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col"
                >
                  {/* Header Decoration */}
                  <div className="h-32 bg-gradient-to-br from-primary/20 via-surface to-surface relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/30 blur-[50px] rounded-full"></div>
                    <div className="absolute top-8 left-8">
                      <h2 className="text-2xl font-bold tracking-tight">
                        {tab === 'login' ? 'Welcome Back' : 'Join GameTrack'}
                      </h2>
                      <p className="text-foreground/60 text-sm mt-1">
                        {tab === 'login' ? 'Enter your credentials to continue.' : 'Create your secure profile.'}
                      </p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-border/50 bg-surface/50">
                    <button
                      onClick={() => { setTab('login'); clearError(); }}
                      className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                        tab === 'login' ? 'text-foreground' : 'text-foreground/40 hover:text-foreground/80'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <KeyRound className="w-4 h-4" />
                        Sign In
                      </div>
                      {tab === 'login' && (
                        <motion.div 
                          layoutId="activeTab" 
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
                        />
                      )}
                    </button>
                    <button
                      onClick={() => { setTab('register'); clearError(); }}
                      className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                        tab === 'register' ? 'text-foreground' : 'text-foreground/40 hover:text-foreground/80'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <User className="w-4 h-4" />
                        Create Account
                      </div>
                      {tab === 'register' && (
                        <motion.div 
                          layoutId="activeTab" 
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
                        />
                      )}
                    </button>
                  </div>

                  {/* Form Content */}
                  <div className="p-8 relative min-h-[350px]">
                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3"
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <p>{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                    {tab === 'login' ? (
                      <motion.form 
                        key="login"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleLogin} 
                        className="space-y-5 absolute inset-0 p-8"
                      >
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-foreground/50 uppercase tracking-widest pl-1">
                            Your UUID
                          </label>
                          <input
                            type="text"
                            value={loginUuid}
                            onChange={(e) => setLoginUuid(e.target.value)}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            className="w-full bg-surface-hover border border-border/50 rounded-xl px-4 py-3.5 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-foreground/20"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-foreground/50 uppercase tracking-widest pl-1">
                            Password
                          </label>
                          <input
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full bg-surface-hover border border-border/50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-foreground/20"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full mt-2 py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Authenticating...</>
                          ) : (
                            'Sign In'
                          )}
                        </button>
                      </motion.form>
                    ) : (
                      <motion.form 
                        key="register"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleRegister} 
                        className="space-y-5 absolute inset-0 p-8"
                      >
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold">!</span>
                          </div>
                          <p className="text-primary/90 text-sm leading-relaxed">
                            A unique UUID will be generated as your username. You only need to set a secure password.
                          </p>
                        </div>
                        <div className="space-y-1.5 mt-2">
                          <label className="block text-xs font-bold text-foreground/50 uppercase tracking-widest pl-1">
                            Password
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full bg-surface-hover border border-border/50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-foreground/20"
                            required
                            minLength={6}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-foreground/50 uppercase tracking-widest pl-1">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            className="w-full bg-surface-hover border border-border/50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-foreground/20"
                            required
                            minLength={6}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full mt-2 py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account...</>
                          ) : (
                            'Create Account'
                          )}
                        </button>
                      </motion.form>
                    )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
  );
}
