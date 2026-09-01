import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, NavTab } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { OrderPage } from './pages/OrderPage';
import { DepositPage } from './pages/DepositPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { DepositHistoryPage } from './pages/DepositHistoryPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { AuthModal } from './components/AuthModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { HowToTopUpModal } from './components/HowToTopUpModal';
import { HowToLoginModal } from './components/HowToLoginModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { Order } from './types';
import { AlightMotionLogo } from './components/AlightMotionLogo';
import { MessageCircle, Video, ShieldCheck, Heart } from 'lucide-react';
import { DEPOSIT_CONFIG } from './services/depositService';

function MainApp() {
  const { currentUser, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isWAOpen, setIsWAOpen] = useState(false);
  const [isHowToTopUpOpen, setIsHowToTopUpOpen] = useState(false);
  const [isHowToLoginOpen, setIsHowToLoginOpen] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleNavigate = (tab: NavTab) => {
    // If navigating to orders history, deposits history, or account without login, prompt auth
    if ((tab === 'orders-history' || tab === 'deposits-history' || tab === 'account') && !currentUser) {
      handleOpenAuthModal('login');
      return;
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-['Inter']">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        onOpenAuth={() => handleOpenAuthModal('login')}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-20 sm:pb-16">
        {currentTab === 'home' && (
          currentUser ? (
            <DashboardPage
              onNavigate={handleNavigate}
              onOpenOrderDetail={(order) => setSelectedOrderDetail(order)}
            />
          ) : (
            <HomePage
              onNavigate={handleNavigate}
              onOpenHowToTopUp={() => setIsHowToTopUpOpen(true)}
              onOpenHowToLogin={() => setIsHowToLoginOpen(true)}
              onOpenAuth={() => handleOpenAuthModal('login')}
              isLoggedIn={!!currentUser}
            />
          )
        )}

        {currentTab === 'order' && (
          <OrderPage
            onNavigate={handleNavigate}
            onOpenAuth={() => handleOpenAuthModal('login')}
            onOpenHowToLogin={() => setIsHowToLoginOpen(true)}
          />
        )}

        {currentTab === 'deposit' && (
          <DepositPage
            onNavigate={handleNavigate}
            onOpenHowToTopUp={() => setIsHowToTopUpOpen(true)}
            onOpenAuth={() => handleOpenAuthModal('login')}
          />
        )}

        {currentTab === 'orders-history' && (
          <OrderHistoryPage
            onNavigate={handleNavigate}
            onOpenOrderDetail={(order) => setSelectedOrderDetail(order)}
          />
        )}

        {currentTab === 'deposits-history' && (
          <DepositHistoryPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'account' && (
          <AccountPage
            onNavigate={handleNavigate}
            onOpenHowToTopUp={() => setIsHowToTopUpOpen(true)}
            onOpenHowToLogin={() => setIsHowToLoginOpen(true)}
            onOpenWhatsApp={() => setIsWAOpen(true)}
          />
        )}

        {currentTab === 'admin' && <AdminPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 backdrop-blur-md py-8 pb-24 sm:pb-8 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlightMotionLogo size="sm" />
            <span className="text-slate-500">|</span>
            <span>Alight Motion Pro Store Indonesia</span>
          </div>

          {/* Quick links in footer */}
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsWAOpen(true)}
              className="hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Grup WhatsApp</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsHowToLoginOpen(true)}
              className="hover:text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tutorial Login</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsHowToTopUpOpen(true)}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Cara Top Up
            </button>
          </div>

          <div className="text-slate-500 text-[11px] flex items-center gap-1">
            <span>© {new Date().getFullYear()} AM Premium Store. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        onOpenAuth={() => handleOpenAuthModal('login')}
      />

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onSuccess={() => {
          // If logged in, reload view
        }}
      />

      <WhatsAppModal
        isOpen={isWAOpen}
        onClose={() => setIsWAOpen(false)}
      />

      <HowToTopUpModal
        isOpen={isHowToTopUpOpen}
        onClose={() => setIsHowToTopUpOpen(false)}
        onGoToDeposit={() => handleNavigate('deposit')}
      />

      <HowToLoginModal
        isOpen={isHowToLoginOpen}
        onClose={() => setIsHowToLoginOpen(false)}
      />

      <OrderDetailModal
        isOpen={!!selectedOrderDetail}
        onClose={() => setSelectedOrderDetail(null)}
        order={selectedOrderDetail}
        onOpenTutorial={() => {
          setSelectedOrderDetail(null);
          setIsHowToLoginOpen(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
