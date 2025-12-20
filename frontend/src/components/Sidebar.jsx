// frontend/src/components/Sidebar.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  BarChart3,
  PlusCircle,
  LogOut,
  Cpu,
  HelpCircle,
  Menu
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseClient';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Add Machine', path: '/add-machine', icon: PlusCircle },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="h-screen w-20 lg:w-64 fixed left-0 top-0 bg-white border-r border-slate-200 flex flex-col justify-between z-50 transition-all duration-300">

      {/* 1. Header / Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 flex-shrink-0">
          <Cpu className="text-white w-6 h-6" />
        </div>
        <div className="hidden lg:block">
          <h1 className="font-bold text-slate-900 text-lg leading-tight">DashPro</h1>
          <p className="text-xs text-slate-500 font-medium">Enterprise Monitor</p>
        </div>
      </div>

      {/* 2. Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <p className="hidden lg:block px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Platform</p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                ${active
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
              <span className={`hidden lg:block font-medium ${active ? 'text-white' : ''}`}>
                {item.label}
              </span>

              {/* Active Indicator Line */}
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-blue-500 lg:hidden"></div>}
            </button>
          );
        })}
      </nav>

      {/* 3. Footer / User Actions */}
      <div className="p-4 border-t border-slate-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all mb-2">
          <HelpCircle className="w-5 h-5" />
          <span className="hidden lg:block font-medium">Support</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;