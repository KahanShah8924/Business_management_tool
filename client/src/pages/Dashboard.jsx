import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await api.get('/user/profile');
        if (mounted) setProfile(res.data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
        navigate('/login', { replace: true });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      // Call backend to trigger Clear-Site-Data header
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      // Always clear local state and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const businessName = profile?.business?.name || profile?.businessName || 'Business';
  const userEmail = profile?.email || 'user@example.com';
  const title = location.pathname.includes('/ledger')
    ? 'Ledger'
    : location.pathname.includes('/invoices')
      ? 'Invoicing'
      : 'Dashboard';

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="no-print w-72 bg-white shadow-xl flex flex-col z-20 transition-all duration-300">
        <div className="h-20 flex items-center px-8 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
          <h1 className="text-2xl font-extrabold text-white tracking-wide">BMT</h1>
          <span className="ml-2 text-blue-100 text-xs font-medium bg-blue-800 px-2 py-0.5 rounded-full">BETA</span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>

          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `flex items-center px-5 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="text-lg mr-3">📊</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/dashboard/invoices"
            className={({ isActive }) =>
              `flex items-center px-5 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="text-lg mr-3">🧾</span>
            Invoicing
          </NavLink>

          <NavLink
            to="/dashboard/ledger"
            className={({ isActive }) =>
              `flex items-center px-5 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="text-lg mr-3">📒</span>
            Ledger
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-5 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors duration-200 font-medium"
          >
            <span className="mr-3">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
        {/* Top Header */}
        <header className="no-print bg-white/80 backdrop-blur-md shadow-sm h-20 flex items-center justify-between px-8 z-10 sticky top-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h2>
            {title === 'Dashboard' && <p className="text-sm text-gray-500 hidden sm:block">Overview of your business performance</p>}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-800 leading-tight">{businessName}</p>
                <p className="text-xs text-gray-500 font-medium">{userEmail}</p>
              </div>
              <div className="h-11 w-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white">
                {businessName?.[0]?.toUpperCase() || 'B'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet context={{ profile }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
