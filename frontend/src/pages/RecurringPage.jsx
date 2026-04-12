import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Plus, Play } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate, CATEGORY_ICONS } from '../utils/helpers';
import { useNotification } from '../context/NotificationContext';
import AddTransactionModal from '../components/AddTransactionModal';

export default function RecurringPage() {
  const { addNotification } = useNotification();
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetch = async () => {
    try {
      const { data } = await api.get('/recurring');
      setRecurring(data);
    } catch { addNotification('Failed to load', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const { data } = await api.post('/recurring/process');
      addNotification(`✅ ${data.processed} transaction(s) generated!`, 'success');
      fetch();
    } catch { addNotification('Failed to process', 'error'); }
    finally { setProcessing(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Stop this recurring transaction?')) return;
    try {
      await api.delete(`/recurring/${id}`);
      setRecurring(r => r.filter(t => t._id !== id));
      addNotification('Recurring transaction stopped', 'success');
    } catch { addNotification('Failed to delete', 'error'); }
  };

  const intervalLabel = { monthly: 'Monthly', weekly: 'Weekly', yearly: 'Yearly' };
  const intervalColor = { monthly: 'bg-purple-100 text-purple-700', weekly: 'bg-blue-100 text-blue-700', yearly: 'bg-amber-100 text-amber-700' };

  const totalMonthly = recurring
    .filter(r => r.recurringInterval === 'monthly')
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">🔄 Recurring Transactions</h1>
          <p className="text-slate-400 text-sm">Manage your subscriptions and repeating expenses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleProcess} disabled={processing}
            className="btn-secondary flex items-center gap-2 text-sm">
            <Play size={14} /> {processing ? 'Processing...' : 'Process Due'}
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} /> Add Recurring
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Active Recurring</p>
          <p className="font-display font-bold text-2xl text-slate-800 dark:text-white">{recurring.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Monthly Commitment</p>
          <p className="font-display font-bold text-2xl text-red-500">{formatCurrency(totalMonthly)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Annual Commitment</p>
          <p className="font-display font-bold text-2xl text-amber-500">{formatCurrency(totalMonthly * 12)}</p>
        </div>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-display font-bold text-slate-800 dark:text-white">Active Subscriptions & Recurring Bills</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : recurring.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🔄</p>
            <p className="text-slate-400 font-medium mb-2">No recurring transactions yet</p>
            <p className="text-slate-400 text-sm mb-4">Add Netflix, rent, EMIs and other recurring bills</p>
            <button onClick={() => setShowModal(true)} className="btn-primary text-sm">Add First Recurring</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {recurring.map(r => (
              <div key={r._id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                <div className="w-11 h-11 flex items-center justify-center bg-purple-50 dark:bg-purple-900/30 rounded-xl text-xl shrink-0">
                  {CATEGORY_ICONS[r.category] || '🔄'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{r.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intervalColor[r.recurringInterval]}`}>
                      {intervalLabel[r.recurringInterval]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {r.category} · Next due: {r.nextDueDate ? formatDate(r.nextDueDate) : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-500 text-sm">{formatCurrency(r.amount)}</p>
                  <p className="text-xs text-slate-400">per {r.recurringInterval?.replace('ly', '')}</p>
                </div>
                <button onClick={() => handleDelete(r._id)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-2">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="card bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800">
        <div className="flex gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-semibold text-purple-800 dark:text-purple-300 text-sm mb-1">How Recurring Works</p>
            <p className="text-purple-700 dark:text-purple-400 text-xs">
              When you click <strong>"Process Due"</strong>, any recurring transactions past their due date will automatically be added to your transaction history. Your dashboard stats will update immediately.
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <AddTransactionModal
          onClose={() => setShowModal(false)}
          onAdded={() => fetch()}
          defaultMode="recurring"
        />
      )}
    </div>
  );
}
