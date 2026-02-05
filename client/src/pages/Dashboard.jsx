import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Dashboard = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('invoicing');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/user/profile');
                setProfile(res.data);
            } catch (err) {
                console.error("Failed to fetch profile", err);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        fetchProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-blue-600">BMT</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('invoicing')}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center ${activeTab === 'invoicing' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                    >
                        {/* Icon placeholder */}
                        <span className="mr-3">📄</span> Invoicing
                    </button>
                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center ${activeTab === 'ledger' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                    >
                        {/* Icon placeholder */}
                        <span className="mr-3">📒</span> Ledger
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded transition-colors">
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8">
                    <h2 className="text-xl font-semibold text-gray-800 capitalize">{activeTab}</h2>

                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-800">{profile?.businessName || 'Business Name'}</p>
                            <p className="text-xs text-gray-500">{profile?.email || 'user@example.com'}</p>
                        </div>
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                            {profile?.businessName?.[0]?.toUpperCase() || 'B'}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'invoicing' && (
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
                            <h3 className="text-lg font-bold text-gray-700 mb-4">Invoicing Module</h3>
                            <div className="flex items-center justify-center h-64 text-gray-400 bg-gray-50 rounded-lg dashed-border">
                                Content for Invoicing goes here
                            </div>
                        </div>
                    )}

                    {activeTab === 'ledger' && (
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
                            <h3 className="text-lg font-bold text-gray-700 mb-4">Ledger Book</h3>
                            <div className="flex items-center justify-center h-64 text-gray-400 bg-gray-50 rounded-lg dashed-border">
                                Content for Ledger goes here
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
