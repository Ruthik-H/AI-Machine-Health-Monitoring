// File Location: frontend/src/pages/Landing.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Zap, Shield, BarChart3, ArrowRight, LayoutDashboard, Cpu, Network } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md border-b border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-accent-cyan to-accent-violet rounded-xl flex items-center justify-center shadow-lg shadow-accent-cyan/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">DashPro AI</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 text-blue-100 hover:text-white font-medium transition-colors"
              >
                Log In
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/signup')}
                className="px-6 py-2.5 bg-gradient-to-r from-accent-violet to-accent-fuchsia rounded-lg font-bold shadow-lg shadow-accent-violet/25 hover:shadow-accent-violet/50 transition-all border border-white/20"
              >
                Get Started
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6"
      >
        <div className="max-w-7xl mx-auto text-center relative z-10">

          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse"></span>
            <span className="text-sm font-medium text-accent-cyan tracking-wide">AI-POWERED PREDICTIVE MAINTENANCE</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight tracking-tight">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white/70 filter drop-shadow-2xl">
              Monitor Machines
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan via-accent-violet to-accent-fuchsia">
              Like Never Before
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl md:text-2xl text-blue-100/60 mb-12 max-w-3xl mx-auto leading-relaxed">
            Real-time IoT telemetry, predictive failure analysis, and instant alerts.
            All wrapped in a stunning, high-performance interface.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              onClick={() => navigate('/signup')}
              className="group relative px-8 py-4 bg-white text-black text-lg font-bold rounded-xl shadow-2xl hover:bg-blue-50 transition-colors flex items-center gap-3"
            >
              Start Monitoring Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white/5 text-white text-lg font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md"
            >
              View Demo
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-3 gap-8"
          >
            <FeatureCard
              icon={Zap}
              title="Real-Time Telemetry"
              description="Sub-second latency data from your ESP32 devices. Watch voltage, current, and temperature change live."
              color="from-yellow-400 to-orange-500"
            />
            <FeatureCard
              icon={Cpu}
              title="AI Anomaly Detection"
              description="Our ML models analyze vibration patterns to predict failures weeks before they happen."
              color="from-accent-cyan to-blue-500"
            />
            <FeatureCard
              icon={LayoutDashboard}
              title="Stunning Visuals"
              description="Data doesn't have to be boring. Interactive charts, heatmaps, and 3D visualizations."
              color="from-accent-fuchsia to-purple-500"
            />
          </motion.div>
        </div>
      </div>

      {/* Stats / Trust Section */}
      <div className="py-20 border-t border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <Stat number="99.9%" label="Uptime" />
          <Stat number="50ms" label="Latency" />
          <Stat number="10k+" label="Sensors" />
          <Stat number="24/7" label="Support" />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="w-8 h-8 text-accent-violet" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-violet to-accent-fuchsia">DashPro AI</span>
          </div>
          <p className="text-white/40 mb-8 max-w-md text-center">
            Empowering the next generation of industrial IoT with beautiful, performant software.
          </p>
          <div className="text-white/20 text-sm">
            © 2024 AI Machine Health Monitor. Built for the future.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }) {
  return (
    <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-2 backdrop-blur-sm">
      <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-blue-100/60 leading-relaxed font-medium">{description}</p>
    </div>
  );
}

function Stat({ number, label }) {
  return (
    <div>
      <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-2">{number}</div>
      <div className="text-sm font-bold text-accent-cyan uppercase tracking-widest">{label}</div>
    </div>
  );
}
