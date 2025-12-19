// File Location: frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseClient';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ REAL LOGIN HANDLER
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      if (error.code === 'auth/user-not-found')
        setError('No account found with this email.');
      else if (error.code === 'auth/wrong-password')
        setError('Incorrect password.');
      else if (error.code === 'auth/invalid-email')
        setError('Invalid email format.');
      else setError('Login failed.');
    }

    setLoading(false);
  };

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    },
    exit: { opacity: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Main Content */}
      <div className="w-full max-w-md relative z-10 perspective-1000">

        {/* Logo & Welcome */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
          className="text-center mb-10"
        >
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              y: [0, -10, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-accent-cyan via-accent-violet to-accent-fuchsia rounded-3xl shadow-[0_0_50px_rgba(139,92,246,0.5)] mb-6 backdrop-blur-md border border-white/20"
          >
            <Activity className="w-12 h-12 text-white drop-shadow-lg" />
          </motion.div>

          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white mb-3 tracking-tight filter drop-shadow-lg">
            Welcome Back
          </h1>
          <p className="text-lg text-blue-200/80 font-medium tracking-wide">Enter the future of monitoring</p>
        </motion.div>

        {/* Login Form Card */}
        <motion.div
          initial={{ y: 100, opacity: 0, rotateX: -10 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          className="glass-card-dark border-t border-l border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group"
        >
          {/* Neon Glow Hover Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-accent-cyan via-accent-fuchsia to-accent-violet opacity-0 group-hover:opacity-20 transition duration-1000 blur-xl"></div>

          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center gap-3 backdrop-blur-md"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm font-medium text-red-200">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-200/80 ml-1">Email Address</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50 group-focus-within/input:text-accent-cyan transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:outline-none focus:bg-white/10 focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/50 transition-all duration-300"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-200/80 ml-1">Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50 group-focus-within/input:text-accent-fuchsia transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:outline-none focus:bg-white/10 focus:border-accent-fuchsia/50 focus:ring-1 focus:ring-accent-fuchsia/50 transition-all duration-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)" }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full relative overflow-hidden group/btn bg-gradient-to-r from-accent-violet via-accent-fuchsia to-accent-violet bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white font-bold py-4 rounded-xl shadow-lg border border-white/20"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <Sparkles className="w-5 h-5" /></>
                )}
              </span>
            </motion.button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center bg-white/5 rounded-xl py-4 border border-white/5">
            <p className="text-sm text-blue-200/60">
              New to DashPro?{" "}
              <Link to="/signup" className="text-accent-cyan font-bold hover:text-white transition-colors underline decoration-transparent hover:decoration-accent-cyan/50 underline-offset-4">
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
