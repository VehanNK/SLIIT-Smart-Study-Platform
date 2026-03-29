import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Calendar, LogOut, Zap, UserCircle, X } from 'lucide-react';

export function Sidebar({ onClose }) {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Groups', path: '/groups', icon: Users },
    { name: 'Resources', path: '/resources', icon: BookOpen },
    { name: 'Matching', path: '/matching', icon: Zap },
    { name: 'Sessions', path: '/sessions', icon: Calendar },
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="w-64 bg-dark text-white flex flex-col h-full shrink-0">
      <div className="p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            StudyHub<span className="text-primary">.</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">SLIIT Smart Study Platform</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
      <nav className="flex-1 px-4 space-y-1 mt-2">
        {links.map(link => {
          const active = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-150 ${active
                  ? 'bg-primary text-white shadow-lg shadow-indigo-900/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
            >
              <Icon size={20} />
              <span className="font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>
      {/* Logout button at bottom */}
      <div className="p-4 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
