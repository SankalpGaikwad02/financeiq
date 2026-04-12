import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate, CATEGORY_ICONS } from '../utils/helpers';
import { useNotification } from '../context/NotificationContext';
import AddTransactionModal from '../components/AddTransactionModal';

export default function SplitsPage() {
  const { addNotification } = useNotification();
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchSplits = async () => {
    try {
      const { data } = await api.get('/splits');
      setSplits(data);
    } catch { addNotification('Failed to load splits', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSplits(); }, []);

  const handleSettle = async (splitId, personIndex) => {
    try {
      const { data } = await api.put(`/splits/${splitId}/settle/${personIndex}`);
      setSplits(prev => prev.map(s => s._id === splitId ? data : s));
      addNotification('Updated settlement status!', 'success');
    } catch { addNotification('Failed to update', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this split expense?')) return;
    try {
      await api.delete(`/splits/${id}`);
      setSplits(prev => prev.filter(s => s._id !== id));
      addNotification('Split expense deleted', 'success');
    } catch { addNotification('Failed to delete', 'error'); }
  };

  const totalOwed = splits.reduce((sum, s) => {
    const unsettled = s.splitWith?.filter(p => !p.settled).reduce((a, p) => a + p.share, 0) || 0;
    return sum + unsettled;
  }, 0);

  const totalRecovered = splits.reduce((sum, s) => {
    const settled = s.splitWith?.filter(p => p.settled).reduce((a, p) => a + p.share, 0) || 0;
    return sum + settled;
  }, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">👥 Split Expenses</h1>
          <p className="text-slate-400 text-sm">Track shared bills and who owes you what</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> Add Split
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Total Splits</p>
          <p className="font-display font-bold text-2xl text-slate-800 dark:text-white">{splits.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Still Owed to You</p>
          <p className="font-display font-bold text-2xl text-amber-500">{formatCurrency(totalOwed)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Recovered</p>
          <p className="font-display font-bold text-2xl text-emerald-500">{formatCurrency(totalRecovered)}</p>
        </div>
      </div>

      {/* Split cards */}
      {loading ? (
        <div className="card p-8 text-center text-slate-400">Loading...</div>
      ) : splits.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-slate-400 font-medium mb-2">No split expenses yet</p>
          <p className="text-slate-400 text-sm mb-4">Track shared dinners, trips, and bills</p>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm">Add First Split</button>
        </div>
      ) : (
        <div className="space-y-4">
          {splits.map(s => (
            <div key={s._id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-xl text-xl">
                    {CATEGORY_ICONS[s.category] || '💸'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{s.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(s.date)} · {s.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Total bill</p>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(s.totalAmount)}</p>
                  </div>
                  <button onClick={() => handleDelete(s._id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* My share */}
              <div className="flex items-center justify-between py-2.5 px-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl mb-3">
                <span className="text-sm font-medium text-brand-700 dark:text-brand-300">My share (recorded)</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">{formatCurrency(s.myShare)}</span>
              </div>

              {/* Split with */}
              {s.splitWith?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Split With</p>
                  <div className="space-y-2">
                    {s.splitWith.map((person, idx) => (
                      <div key={idx} className={`flex items-center justify-between py-2 px-3 rounded-xl transition-colors ${
                        person.settled ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-50 dark:bg-slate-700/50'
                      }`}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleSettle(s._id, idx)}
                            className={`transition-colors ${person.settled ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-400'}`}>
                            {person.settled ? <CheckCircle size={18} /> : <Circle size={18} />}
                          </button>
                          <span className={`text-sm font-medium ${person.settled ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {person.name}
                          </span>
                          {person.settled && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Settled ✓</span>}
                        </div>
                        <span className={`font-bold text-sm ${person.settled ? 'text-slate-400' : 'text-amber-500'}`}>
                          {formatCurrency(person.share)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {s.note && <p className="text-xs text-slate-400 mt-2 italic">"{s.note}"</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddTransactionModal
          onClose={() => setShowModal(false)}
          onAdded={() => fetchSplits()}
        />
      )}
    </div>
  );
}
