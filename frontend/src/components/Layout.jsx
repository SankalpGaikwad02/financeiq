import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target, BarChart3,
  Settings, LogOut, Menu, X, Moon, Sun, Wallet,
  RefreshCw, Users, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/budgets', icon: PieChart, label: 'Budgets' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

const extraItems = [
  { to: '/recurring', icon: RefreshCw, label: 'Recurring' },
  { to: '/splits', icon: Users, label: 'Split Expenses' },
  { to: '/alerts', icon: Bell, label: 'Budget Alerts' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
        ${isActive
          ? 'bg-brand-600 text-white shadow-sm shadow-brand-200'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`
      }
    >
      <Icon size={17} />
      {label}
    </NavLink>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
        bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <Wallet size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-slate-800 dark:text-white">FinanceIQ</span>
          <button className="ml-auto lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Main</p>
          {navItems.map(item => <NavItem key={item.to} {...item} />)}

          <div className="pt-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Features</p>
            {extraItems.map(item => <NavItem key={item.to} {...item} />)}
          </div>

          <div className="pt-3">
            <NavItem to="/settings" icon={Settings} label="Settings" />
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-700 space-y-1">
          <button onClick={toggle}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
            <LogOut size={17} /> Logout
          </button>
          <div className="flex items-center gap-3 px-3 py-2 mt-2">
            <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500"><Menu size={22} /></button>
          <span className="font-display font-bold text-slate-800 dark:text-white">FinanceIQ</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
