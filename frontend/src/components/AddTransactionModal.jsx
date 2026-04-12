import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { EXPENSE_CATEGORIES } from '../utils/helpers';

const MODES = ['expense', 'income', 'recurring', 'split'];

export default function AddTransactionModal({ onClose, onAdded }) {
  const { addNotification } = useNotification();
  const [mode, setMode] = useState('expense');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '', amount: '', type: 'expense', category: 'Food',
    date: new Date().toISOString().split('T')[0], note: '',
    recurringInterval: 'monthly'
  });

  const [split, setSplit] = useState({
    title: '', totalAmount: '', category: 'Food',
    date: new Date().toISOString().split('T')[0], note: '',
    splitWith: [{ name: '', share: '' }]
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const addSplitPerson = () =>
    setSplit(s => ({ ...s, splitWith: [...s.splitWith, { name: '', share: '' }] }));

  const removeSplitPerson = i =>
    setSplit(s => ({ ...s, splitWith: s.splitWith.filter((_, idx) => idx !== i) }));

  const updateSplitPerson = (i, field, value) =>
    setSplit(s => {
      const updated = [...s.splitWith];
      updated[i] = { ...updated[i], [field]: value };
      return { ...s, splitWith: updated };
    });

  const myShare = () => {
    const total = parseFloat(split.totalAmount) || 0;
    const othersTotal = split.splitWith.reduce((s, p) => s + (parseFloat(p.share) || 0), 0);
    return Math.max(0, total - othersTotal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let data;
      if (mode === 'split') {
        const res = await api.post('/splits', {
          ...split,
          totalAmount: parseFloat(split.totalAmount),
          splitWith: split.splitWith.filter(p => p.name && p.share)
        });
        data = res.data;
      } else if (mode === 'recurring') {
        const nextDue = new Date(form.date);
        if (form.recurringInterval === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
        else if (form.recurringInterval === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
        else nextDue.setFullYear(nextDue.getFullYear() + 1);
        const res = await api.post('/transactions', {
          ...form, type: 'expense', amount: parseFloat(form.amount),
          isRecurring: true, nextDueDate: nextDue
        });
        data = res.data;
      } else {
        const res = await api.post('/transactions', { ...form, type: mode === 'income' ? 'income' : 'expense', amount: parseFloat(form.amount) });
        data = res.data;
      }
      onAdded(data);
      onClose();
      addNotification('Transaction added! ✅', 'success');
    } catch (err) {
      addNotification(err.response?.data?.message || 'Failed to add', 'error');
    } finally {
      setLoading(false);
    }
  };

  const modeColors = {
    expense: 'bg-red-500 text-white', income: 'bg-emerald-500 text-white',
    recurring: 'bg-purple-500 text-white', split: 'bg-blue-500 text-white'
  };
  const modeLabels = { expense: '➖ Expense', income: '➕ Income', recurring: '🔄 Recurring', split: '👥 Split' };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white">Add Transaction</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Mode tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
            {MODES.map(m => (
              <button key={m} type="button" onClick={() => {
                setMode(m);
                if (m === 'income') setForm(f => ({ ...f, type: 'income', category: 'Salary' }));
                else if (m === 'expense') setForm(f => ({ ...f, type: 'expense', category: 'Food' }));
                else if (m === 'recurring') setForm(f => ({ ...f, type: 'expense', category: 'Food' }));
              }}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === m ? modeColors[m] : 'text-slate-500 dark:text-slate-400'}`}>
                {modeLabels[m]}
              </button>
            ))}
          </div>

          {mode === 'split' ? (
            <>
              <div>
                <label className="label">What was the expense?</label>
                <input value={split.title} onChange={e => setSplit(s => ({ ...s, title: e.target.value }))}
                  className="input" placeholder="e.g. Dinner at Taj" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Total Bill (₹)</label>
                  <input type="number" value={split.totalAmount}
                    onChange={e => setSplit(s => ({ ...s, totalAmount: e.target.value }))}
                    className="input" placeholder="1200" required min="0" />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={split.category} onChange={e => setSplit(s => ({ ...s, category: e.target.value }))} className="input">
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Split With</label>
                  <button type="button" onClick={addSplitPerson}
                    className="text-xs text-brand-600 font-semibold flex items-center gap-1">
                    <Plus size={12} /> Add person
                  </button>
                </div>
                <div className="space-y-3">
                  {split.splitWith.map((p, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Person {i + 1}</span>
                        {split.splitWith.length > 1 && (
                          <button type="button" onClick={() => removeSplitPerson(i)}
                            className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1">
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="label">Name</label>
                        <input
                          value={p.name}
                          onChange={e => updateSplitPerson(i, 'name', e.target.value)}
                          className="input"
                          placeholder="e.g. Rahul, Priya, Amit"
                        />
                      </div>
                      <div>
                        <label className="label">Their Share (₹)</label>
                        <input
                          type="number"
                          value={p.share}
                          onChange={e => updateSplitPerson(i, 'share', e.target.value)}
                          className="input"
                          placeholder="e.g. 400"
                          min="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm font-medium text-brand-700 dark:text-brand-300">My share (what gets recorded)</span>
                <span className="font-display font-bold text-brand-600">₹{myShare().toLocaleString('en-IN')}</span>
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" value={split.date} onChange={e => setSplit(s => ({ ...s, date: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <input value={split.note} onChange={e => setSplit(s => ({ ...s, note: e.target.value }))} className="input" placeholder="Add a note..." />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Title</label>
                <input name="title" value={form.title} onChange={handleChange} className="input"
                  placeholder={mode === 'recurring' ? 'e.g. Netflix, Rent, Gym' : 'e.g. Dinner at restaurant'} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount (₹)</label>
                  <input name="amount" type="number" value={form.amount} onChange={handleChange}
                    className="input" placeholder="0" required min="0" />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input name="date" type="date" value={form.date} onChange={handleChange} className="input" required />
                </div>
              </div>
              <div>
                <label className="label">Category</label>
                <select name="category" value={form.category} onChange={handleChange} className="input">
                  {(mode === 'income' ? ['Salary', 'Investment', 'Other'] : EXPENSE_CATEGORIES).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {mode === 'recurring' && (
                <div>
                  <label className="label">Repeats Every</label>
                  <select name="recurringInterval" value={form.recurringInterval} onChange={handleChange} className="input">
                    <option value="weekly">Week</option>
                    <option value="monthly">Month</option>
                    <option value="yearly">Year</option>
                  </select>
                  <p className="text-xs text-purple-500 mt-1.5 font-medium">🔄 Auto-generates a new transaction each period</p>
                </div>
              )}
              <div>
                <label className="label">Note (optional)</label>
                <input name="note" value={form.note} onChange={handleChange} className="input" placeholder="Add a note..." />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
