import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { addNotification } = useNotification();
  const { dark, toggle } = useTheme();
  const [form, setForm] = useState({ name: user?.name || '', monthlyIncome: user?.monthlyIncome || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/update', {
        name: form.name,
        monthlyIncome: parseFloat(form.monthlyIncome)
      });
      updateUser(data);
      addNotification('Profile updated successfully!', 'success');
    } catch (err) {
      addNotification(err.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Settings</h1>
        <p className="text-slate-400 text-sm">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="card">
        <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">👤 Profile Settings</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email} disabled className="input opacity-60 cursor-not-allowed" />
          </div>
          <div>
            <label className="label">Monthly Income (₹)</label>
            <input
              type="number"
              value={form.monthlyIncome}
              onChange={e => setForm(f => ({ ...f, monthlyIncome: e.target.value }))}
              className="input"
              placeholder="e.g. 50000"
              min="0"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className="card">
        <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">🎨 Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Dark Mode</p>
            <p className="text-xs text-slate-400">Switch between light and dark theme</p>
          </div>
          <button
            onClick={toggle}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${dark ? 'bg-brand-600' : 'bg-slate-200'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${dark ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">ℹ️ About</h3>
        <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex justify-between">
            <span>App Name</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">FinanceIQ</span>
          </div>
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Stack</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">React + Node.js + MongoDB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
