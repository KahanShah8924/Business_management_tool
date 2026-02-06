import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/DashboardHome';
import RequireAuth from './components/RequireAuth';
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceCreate from './pages/invoices/InvoiceCreate';
import InvoiceView from './pages/invoices/InvoiceView';
import LedgerPage from './pages/ledger/LedgerPage';

function App() {
  // Global bfcache detection to prevent back-button bypass
  React.useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        // Page was loaded from bfcache (back/forward cache)
        // Force a reload to re-run auth checks
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="invoices/new" element={<InvoiceCreate />} />
            <Route path="invoices/:id" element={<InvoiceView />} />
            <Route path="ledger" element={<LedgerPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
