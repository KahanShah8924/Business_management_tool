import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function DashboardHome() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/user/profile');
        if (mounted) setProfile(res.data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800">Dashboard</h3>
      <p className="text-sm text-gray-600 mt-1">
        {loading ? 'Loading business context…' : `Business: ${profile?.business?.name || profile?.businessName || '-'}`}
      </p>
    </div>
  );
}

