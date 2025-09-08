import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Import components directly to avoid lazy loading issues
import AdminLogin from './pages/auth/AdminLogin';
import InvestorLogin from './pages/auth/InvestorLogin';
import AdminDashboard from './pages/admin/Dashboard';
import InvestorDashboard from './pages/investor/Dashboard';
import WithdrawalsPage from './pages/admin/WithdrawalsPage';
import InvestorsListPage from './pages/admin/InvestorsList';
import MessagesPage from './pages/admin/MessagesPage';
import SettingsPage from './pages/admin/SettingsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import CommissionsPage from './pages/admin/CommissionsPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import PerformanceReportsPage from './pages/admin/PerformanceReportsPage';
import InvestorProfile from './pages/admin/InvestorProfile';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';

function App() {
  const { user, isLoading } = useAuth();
  
  console.log('🔄 App rendering - User:', user?.email || 'Not logged in', 'Loading:', isLoading);

  // Show loading screen while auth is initializing
  if (isLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/investor-login" element={<InvestorLogin />} />
        
        {/* Protected admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/withdrawals" element={
          <ProtectedRoute role="admin">
            <WithdrawalsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/investors" element={
          <ProtectedRoute role="admin">
            <InvestorsListPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/messages" element={
          <ProtectedRoute role="admin">
            <MessagesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/settings" element={
          <ProtectedRoute role="admin">
            <SettingsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/analytics" element={
          <ProtectedRoute role="admin">
            <AnalyticsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/commissions" element={
          <ProtectedRoute role="admin">
            <CommissionsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/transactions" element={
          <ProtectedRoute role="admin">
            <TransactionsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/performance-reports" element={
          <ProtectedRoute role="admin">
            <PerformanceReportsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/investor/:id" element={
          <ProtectedRoute role="admin">
            <InvestorProfile />
          </ProtectedRoute>
        } />
        
        {/* Protected investor routes */}
        <Route path="/investor" element={
          <ProtectedRoute role="investor">
            <InvestorDashboard />
          </ProtectedRoute>
        } />
        
        {/* Root redirect */}
        <Route path="/" element={
          user ? (
            user.role === 'admin' ? <Navigate to="/admin" replace /> : 
            user.role === 'investor' ? <Navigate to="/investor" replace /> :
            <Navigate to="/login" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;