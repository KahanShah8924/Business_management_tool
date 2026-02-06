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
        navigate('/login');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  const businessName = profile?.business?.name || profile?.businessName || 'Business';
  const userEmail = profile?.email || 'user@example.com';
  const title = location.pathname.includes('/ledger')
    ? 'Ledger'
    : location.pathname.includes('/invoices')
      ? 'Invoicing'
      : 'Dashboard';

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="no-print w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-blue-600">BMT</h1>
          <p className="text-xs text-gray-500 mt-1">Business-first accounting</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `w-full block px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/dashboard/invoices"
            className={({ isActive }) =>
              `w-full block px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`
            }
          >
            Invoicing
          </NavLink>
          <NavLink
            to="/dashboard/ledger"
            className={({ isActive }) =>
              `w-full block px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`
            }
          >
            Ledger
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="no-print bg-white shadow-sm h-16 flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{businessName}</p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm">
              {businessName?.[0]?.toUpperCase() || 'B'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet context={{ profile }} />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
