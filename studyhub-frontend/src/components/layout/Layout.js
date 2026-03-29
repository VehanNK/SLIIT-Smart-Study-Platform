import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';

export function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex w-full h-screen bg-background overflow-hidden relative">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-dark/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:transform-none lg:static transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Top Header with Hamburger */}
        <div className="lg:hidden flex items-center justify-between bg-dark text-white p-4">
          <h1 className="text-xl font-bold tracking-tight">StudyHub<span className="text-primary">.</span></h1>
          <button onClick={() => setMobileMenuOpen(true)} className="p-1">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        
        <div className="hidden lg:block">
          <Navbar />
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
