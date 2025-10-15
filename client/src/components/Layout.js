import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <nav className="gradient-bg text-white shadow-xl sticky top-0 z-50 backdrop-blur-lg">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-white text-revolution-primary w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-lg group-hover:scale-110 transition-transform">
                R
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight">
                  REVOLUTION
                </div>
                <div className="text-xs text-blue-100 font-medium">
                  Loaner Vehicle Management
                </div>
              </div>
            </Link>
            <div className="flex items-center space-x-2">
              <Link
                to="/"
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  location.pathname === '/'
                    ? 'bg-white text-revolution-primary shadow-lg'
                    : 'hover:bg-white/10 text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/reservations/new"
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  location.pathname === '/reservations/new'
                    ? 'bg-white text-revolution-primary shadow-lg'
                    : 'hover:bg-white/10 text-white'
                }`}
              >
                + New Reservation
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 animate-fade-in">
        {children}
      </main>

      <footer className="bg-revolution-dark text-gray-300 mt-16 py-8 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-revolution-primary w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white">
                R
              </div>
              <span className="font-bold text-white">REVOLUTION</span>
            </div>
            <p className="text-sm">
              © 2024 Revolution Automotive. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
