import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, EXPENSE_CATEGORIES, CATEGORY_ICONS, MONTHS } from '../utils/helpers';
import { useNotification } from '../context/NotificationContext';

export default function BudgetsPage() {
  const { addNotification } = useNotification();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: 'Food', limit: '' });
  const [saving, setSaving] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/budgets?month=${month}&year=${year}`);
      setBudgets(data);
    } catch {
      addNotification('Failed to load budgets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBudgets(); }, [month]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.limit) return;
    setSaving(true);
    try {
      await api.post('/budgets', { ...form, limit: parseFloat(form.limit), month, year });
      addNotification('Budget saved!', 'success');
      setForm({ category: 'Food', limit: '' });
      fetchBudgets();
    } catch (err) {
      addNotification(err.response?.data?.message || 'Failed to save budget', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
      setBudgets(prev => prev.filter(b => b._id !== id));
      addNotification('Budget removed', 'success');
    } catch {
      addNotification('Failed to delete', 'error');
    }
  };

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Budget Tracker</h1>
        <p className="text-slate-400 text-sm">Set spending limits and track your budget health</p>
      </div>

      {/* Month selector */}
      <div className="flex gap-2 flex-wrap">
        {MONTHS.map((m, i) => (
          <button
            key={m}
            onClick={() => setMonth(i + 1)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              month === i + 1 ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {m.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Total Budgeted</p>
          <p className="font-display font-bold text-brand-600 text-xl">{formatCurrency(totalBudgeted)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Total Spent</p>
          <p className="font-display font-bold text-slate-800 dark:text-white text-xl">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Remaining</p>
          <p className={`font-display font-bold text-xl ${totalBudgeted - totalSpent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatCurrency(Math.max(0, totalBudgeted - totalSpent))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Add budget form */}
        <div className="card">
          <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">➕ Set Budget</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Monthly Limit (₹)</label>
              <input
                type="number"
                value={form.limit}
                onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
                className="input"
                placeholder="e.g. 5000"
                min="1"
                required
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving...' : 'Save Budget'}
            </button>
          </form>
        </div>

        {/* Budget bars */}
        <div className="lg:col-span-2 card">
          <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">📊 {MONTHS[month - 1]} Budget Overview</h3>
          {loading ? (
            <p className="text-slate-400 text-center py-8">Loading...</p>
          ) : budgets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">💸</p>
              <p className="text-slate-400 text-sm">No budgets set for this month.<br />Start by adding one!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {budgets.map(b => (
                <div key={b._id} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                      {CATEGORY_ICONS[b.category]} {b.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${b.percentage >= 100 ? 'text-red-500' : b.percentage >= 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                      </span>
                      <button onClick={() => handleDelete(b._id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${b.percentage >= 100 ? 'bg-red-500' : b.percentage >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{b.percentage}% used</span>
                    <span>{formatCurrency(Math.max(0, b.limit - b.spent))} left</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
