import React from 'react';
import { Home, ShoppingBag, Wallet, User, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { NavTab } from './Navbar';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAuth: () => void;
}

export function BottomNav({ currentTab, onSelectTab, onOpenAuth }: BottomNavProps) {
  const { currentUser, userProfile, isAdmin } = useAuth();

  const handleTabClick = (tab: NavTab) => {
    if (tab === 'account' && !currentUser) {
      onOpenAuth();
      return;
    }
    onSelectTab(tab);
  };

  const navTabs: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'order', label: 'Order', icon: ShoppingBag },
    { id: 'deposit', label: 'Deposit', icon: Wallet },
    { id: 'account', label: 'Akun', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 block">
      {/* Background blur container with top border and subtle shadow */}
      <div className="w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around">
          {navTabs.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentTab === item.id ||
              (item.id === 'account' && (currentTab === 'orders-history' || currentTab === 'deposits-history'));
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer min-w-[64px] ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Active animated background indicator */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  
                  {/* Small badge or dot for specific states */}
                  {item.id === 'deposit' && currentUser && (userProfile?.balance || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <span className={`text-[11px] mt-1 font-medium tracking-tight ${isActive ? 'font-bold text-emerald-400' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Admin shortcut if logged in as Admin */}
          {isAdmin && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer min-w-[64px] ${
                currentTab === 'admin' ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              {currentTab === 'admin' && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-cyan-500/15 border border-cyan-500/30 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <ShieldCheck className="w-5 h-5" />
              <span className={`text-[11px] mt-1 font-medium tracking-tight ${currentTab === 'admin' ? 'font-bold text-cyan-400' : ''}`}>
                Admin
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
