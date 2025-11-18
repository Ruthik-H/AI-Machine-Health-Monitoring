// File Location: frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings, 
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', active: true },
    { icon: Users, label: 'Customers', path: '/customers', active: false },
    { icon: ShoppingCart, label: 'Orders', path: '/orders', active: false },
    { icon: Package, label: 'Products', path: '/products', active: false },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', active: false },
    { icon: FileText, label: 'Reports', path: '/reports', active: false },
    { icon: Settings, label: 'Settings', path: '/settings', active: false },
    { icon: HelpCircle, label: 'Help', path: '/help', active: false },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 relative`}
    >
      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                active
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section - User Tier Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">Pro Plan</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
            <button className="w-full mt-2 bg-white text-blue-600 text-xs font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>
      )}

      {/* Collapsed Bottom Icon */}
      {isCollapsed && (
        <div className="p-4 border-t border-gray-200 flex justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
        </div>
      )}
    </aside>
  );
}