import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { TablesPage } from './pages/TablesPage';
import { MenuPosPage } from './pages/MenuPosPage';
import { KitchenPage } from './pages/KitchenPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { DashboardPage } from './pages/DashboardPage';
import { MenuManagementPage } from './pages/MenuManagementPage';
import { StaffPage } from './pages/StaffPage';
import { SettingsPage } from './pages/SettingsPage';
import { InventoryPage } from './pages/InventoryPage';
import { PayrollPage } from './pages/PayrollPage';
import { CancellationReport } from './components/dashboard/CancellationReport';
import { CustomerOrderPage } from './pages/CustomerOrderPage';
import { PromotionManagementPage } from './pages/PromotionManagementPage';
import { CustomerManagementPage } from './pages/CustomerManagementPage';

const AppContent = () => {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('customer-portal');

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-neutral-300">Đang khởi tạo hệ thống Hoàng Gia Quán...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // If viewing Customer Portal
  if (activeTab === 'customer-portal') {
    return (
      <div className="min-h-screen bg-neutral-950">
        <CustomerOrderPage onSwitchToAdmin={() => setActiveTab('tables')} />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'tables':
        return <TablesPage />;
      case 'menu-pos':
        return <MenuPosPage />;
      case 'kitchen':
        return <KitchenPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'promotions':
        return isAdmin ? <PromotionManagementPage /> : <TablesPage />;
      case 'customers':
        return isAdmin ? <CustomerManagementPage /> : <TablesPage />;
      case 'dashboard':
        return isAdmin ? <DashboardPage /> : <TablesPage />;
      case 'inventory':
        return isAdmin ? <InventoryPage /> : <TablesPage />;
      case 'payroll':
        return isAdmin ? <PayrollPage /> : <TablesPage />;
      case 'cancellations':
        return isAdmin ? <CancellationReport /> : <TablesPage />;
      case 'menu-manage':
        return isAdmin ? <MenuManagementPage /> : <TablesPage />;
      case 'staff':
        return isAdmin ? <StaffPage /> : <TablesPage />;
      case 'settings':
        return isAdmin ? <SettingsPage /> : <TablesPage />;
      default:
        return <TablesPage />;
    }
  };

  return (
    <OrderProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </OrderProvider>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
