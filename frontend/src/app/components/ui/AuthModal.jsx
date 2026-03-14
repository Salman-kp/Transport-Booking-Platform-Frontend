"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { User, Mail, Lock, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/lib/store';

export default function AuthModal({ isOpen, onClose, initialView = 'login' }) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    setView(initialView);
    setError('');
  }, [initialView, isOpen]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const onSubmit = async (data) => {
    setError('');
    try {
      if (view === 'login') {
        // Calls POST http://localhost:8080/api/auth/login
        const response = await api.post('/auth/login', { 
          email: data.email, 
          password: data.password 
        });
        
        // Go backend sets the HttpOnly cookie. We just set the UI state.
        // We use the email prefix as a display name since your Go backend currently only returns a message & token.
        const displayName = data.email.split('@')[0];
        setAuth({ email: data.email, name: displayName }); 
        
        onClose(); 
      } else {
        // Calls POST http://localhost:8080/api/auth/register
        await api.post('/auth/register', {
          email: data.email,
          password: data.password
        });
        router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`); 
        onClose(); 
        reset(); 
        
        // Push to verify page with their email
      }
    } catch (err) {
      // Handles the Go backend's custom fiber.Map errors
      const backendError = err.response?.data?.error || err.response?.data?.message;
      setError(backendError || `Failed to ${view}. Please try again.`);
    }
  };
  const handleClose = () => {
    reset();
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-[420px] w-full bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 relative"
            >
              {/* Close Button */}
              <button 
                onClick={handleClose}
                className="absolute top-5 right-5 z-20 p-2 bg-white/50 backdrop-blur-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all shadow-sm"
              >
                <X size={20} />
              </button>

              {/* Decorative Header Gradient */}
              <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white opacity-90 z-0" />

              <div className="relative px-8 pt-10 pb-8 z-10">
                
                {/* Brand & Greeting */}
                <div className="flex flex-col items-center mb-8">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center mb-4 p-2 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Image src="/main.png" alt="Logo" width={36} height={36} className="object-contain relative z-10" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {view === 'login' ? 'Welcome back' : 'Join TRIPneO'}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1 text-center px-4">
                    {view === 'login' ? 'Enter your details to access your account.' : 'Start your smart travel journey today.'}
                  </p>
                </div>

                {/* Segmented Tab Switcher */}
                <div className="flex p-1 bg-slate-100/80 rounded-2xl mb-8">
                  {['login', 'register'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => { setView(tab); reset(); setError(''); }}
                      className={`relative flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors z-10 capitalize tracking-wide ${view === tab ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {view === tab && (
                        <motion.div
                          layoutId="authTab"
                          className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
                          style={{ zIndex: -1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                      )}
                      {tab === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 text-center flex items-center justify-center gap-2"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  
                  {/* Register Only Fields */}
                  <AnimatePresence mode="popLayout">
                    {view === 'register' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, filter: "blur(10px)" }} 
                        animate={{ opacity: 1, height: 'auto', filter: "blur(0px)" }} 
                        exit={{ opacity: 0, height: 0, filter: "blur(10px)" }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                          </div>
                          <input 
                            type="text" 
                            {...register('name', { required: view === 'register' ? 'Name is required' : false })}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" 
                            placeholder="Full Name" 
                          />
                        </div>
                        {errors.name && <span className="text-xs font-bold text-red-500 mt-1.5 pl-2 block">{errors.name.message}</span>}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email Field */}
                  <div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input 
                        type="email" 
                        {...register('email', { required: 'Email is required' })}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" 
                        placeholder="Email Address" 
                      />
                    </div>
                    {errors.email && <span className="text-xs font-bold text-red-500 mt-1.5 pl-2 block">{errors.email.message}</span>}
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input 
                        type="password" 
                        {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" 
                        placeholder="Password" 
                      />
                    </div>
                    {errors.password && <span className="text-xs font-bold text-red-500 mt-1.5 pl-2 block">{errors.password.message}</span>}
                  </div>

                  {/* Forgot Password Link */}
                  <AnimatePresence>
                    {view === 'login' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="flex justify-end pt-1"
                      >
                        <a href="#" className="text-sm font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
                          Forgot password?
                        </a>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.button 
                    whileHover={{ scale: 1.01, translateY: -1 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                    type="submit" 
                    className="w-full flex justify-center items-center bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-emerald-300 disabled:to-emerald-300 disabled:shadow-none text-white font-bold text-lg py-3.5 px-4 rounded-2xl shadow-[0_8px_20px_-6px_rgba(16,185,129,0.4)] transition-all mt-6"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : (view === 'login' ? 'Sign In' : 'Create Account')}
                  </motion.button>
                </form>

                {/* Google OAuth */}
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-slate-400 font-semibold text-xs tracking-widest uppercase">Or continue with</span>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.01, translateY: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/login`}
                    type="button"
                    className="mt-6 w-full flex justify-center items-center gap-3 bg-white border-2 border-slate-100 text-slate-700 font-bold py-3.5 px-4 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm"
                  >
                    <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={20} height={20} />
                    Continue with Google
                  </motion.button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}