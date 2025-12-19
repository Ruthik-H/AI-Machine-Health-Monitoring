// File Location: frontend/src/pages/Landing.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Zap, Shield, BarChart3, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AI Machine Health Monitor</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:opacity-90 transition"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl mb-8">
            <Activity className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to AI Machine Health Monitor
          </h1>

          <p className="text-xl text-gray-600 mb-10">
            Connect your machines in minutes — live data, alerts and charts.
          </p>

          <button
            onClick={() => navigate('/signup')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl shadow-2xl hover:opacity-90 transition-all hover:scale-105"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Free trial available
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <FeatureCard
            icon={Zap}
            title="Real-Time Monitoring"
            description="Get live sensor data from your ESP32 devices with instant alerts and notifications."
            gradient="from-yellow-500 to-orange-500"
          />
          <FeatureCard
            icon={BarChart3}
            title="Visual Analytics"
            description="Beautiful charts and dashboards to track temperature, vibration, current, and more."
            gradient="from-blue-500 to-cyan-500"
          />
          <FeatureCard
            icon={Shield}
            title="Predictive Alerts"
            description="AI-powered anomaly detection to prevent failures before they happen."
            gradient="from-purple-500 to-pink-500"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2024 AI Machine Health Monitor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, gradient }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100">
      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-6`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}