import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Equal, Sliders } from 'lucide-react';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { EXPENSE_CATEGORIES } from '../utils/helpers';

const MODES = ['expense', 'income', 'recurring', 'split'];

export default function AddTransactionModal({ onClose, onAdded }) {
  const { addNotification } = useNotification();
  const [mode, setMode] = useState('expense');
  const [loading, setLoading] = useState(false);
  const [splitMode, setSplitMode] = useState('equal'); // 'equal' or 'custom'

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

  // Auto-calculate equal shares whenever totalAmount or splitWith length changes
  useEffect(() => {
    if (splitMode === 'equal' && split.totalAmount) {
      const total = parseFloat(split.totalAmount) || 0;
      const totalPeople = split.splitWith.length + 1; // +1 for me
      const equalShare = total / totalPeople;
      const rounded = Math.round(equalShare * 100) / 100; // round to 2 decimal places
      setSplit(s => ({
        ...s,
        splitWith: s.splitWith.map(p => ({ ...p, share: rounded.toString() }))
      }));
    }
  }, [split.totalAmount, split.splitWith.length, splitMode]);

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

  // My share = total - sum of others' shares
  const myShare = () => {
    const total = parseFloat(split.totalAmount) || 0;
    if (splitMode === 'equal') {
      const totalPeople = split.splitWith.length + 1;
      return Math.round((total / totalPeople) * 100) / 100;
    }
    const othersTotal = split.splitWith.reduce((s, p) => s + (parseFloat(p.share) || 0), 0);
    return Math.max(0, Math.round((total - othersTotal) * 100) / 100);
  };

  // Total assigned check for custom mode
  const totalAssigned = () => {
    const othersTotal = split.splitWith.reduce((s, p) => s + (parseFloat(p.share) || 0), 0);
    return Math.round((othersTotal + myShare()) * 100) / 100;
  };

  const isOverBudget = () => {
    const total = parseFloat(split.totalAmount) || 0;
    return splitMode === 'custom' && totalAssigned() > total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let data;
      if (mode === 'split') {
        if (isOverBudget()) {
          addNotification("Shares exceed total bill amount!", 'error');
          setLoading(false);
          return;
        }
        const res = await api.post('/splits', {
          ...split,
          totalAmount: parseFloat(split.totalAmount),
          splitWith: split.splitWith
            .filter(p => p.name)
            .map(p => ({ name: p.name, share: parseFloat(p.share) || 0 }))
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
        const res = await api.post('/transactions', {
          ...form,
          type: mode === 'income' ? 'income' : 'expense',
          amount: parseFloat(form.amount)
        });
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
  const modeLabels = {
    expense: '➖ Expense', income: '➕ Income',
    recurring: '🔄 Recurring', split: '👥 Split'
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
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

          {/* ============ SPLIT MODE ============ */}
          {mode === 'split' ? (
            <>
              <div>
                <label className="label">What was the expense?</label>
                <input value={split.title}
                  onChange={e => setSplit(s => ({ ...s, title: e.target.value }))}
                  className="input" placeholder="e.g. Dinner at Taj" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Total Bill (₹)</label>
                  <input
                    type="number"
                    value={split.totalAmount}
                    onChange={e => setSplit(s => ({ ...s, totalAmount: e.target.value }))}
                    className="input"
                    placeholder="e.g. 1200.50"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={split.category}
                    onChange={e => setSplit(s => ({ ...s, category: e.target.value }))}
                    className="input">
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Split mode toggle - Equal vs Custom */}
              <div>
                <label className="label">How to split?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSplitMode('equal')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                      splitMode === 'equal'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Equal size={15} /> Equal Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('custom')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                      splitMode === 'custom'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                        : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Sliders size={15} /> Custom Split
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  {splitMode === 'equal'
                    ? '✅ Shares are calculated equally and update automatically'
                    : '✏️ Enter each person\'s share manually'}
                </p>
              </div>

              {/* People */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">
                    Split With
                    <span className="text-slate-400 font-normal ml-1">
                      ({split.splitWith.length + 1} people total including you)
                    </span>
                  </label>
                  <button type="button" onClick={addSplitPerson}
                    className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:underline">
                    <Plus size={12} /> Add person
                  </button>
                </div>

                <div className="space-y-3">
                  {split.splitWith.map((p, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Person {i + 1}
                        </span>
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
                        <label className="label">
                          Their Share (₹)
                          {splitMode === 'equal' && split.totalAmount && (
                            <span className="text-blue-500 font-normal ml-1">(auto-calculated)</span>
                          )}
                        </label>
                        <input
                          type="number"
                          value={p.share}
                          onChange={e => updateSplitPerson(i, 'share', e.target.value)}
                          className={`input ${splitMode === 'equal' ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 font-semibold' : ''}`}
                          placeholder="e.g. 35.50"
                          min="0"
                          step="0.01"
                          readOnly={splitMode === 'equal'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary card */}
              <div className={`rounded-xl p-3 space-y-2 ${isOverBudget() ? 'bg-red-50 dark:bg-red-900/20' : 'bg-brand-50 dark:bg-brand-900/20'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${isOverBudget() ? 'text-red-700 dark:text-red-300' : 'text-brand-700 dark:text-brand-300'}`}>
                    My share (recorded in expenses)
                  </span>
                  <span className={`font-display font-bold text-lg ${isOverBudget() ? 'text-red-600' : 'text-brand-600'}`}>
                    ₹{myShare().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {splitMode === 'custom' && split.totalAmount && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total assigned</span>
                    <span className={`font-semibold ${isOverBudget() ? 'text-red-500' : 'text-slate-500'}`}>
                      ₹{totalAssigned().toFixed(2)} / ₹{parseFloat(split.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                {isOverBudget() && (
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ Shares exceed the total bill! Please adjust.
                  </p>
                )}

                {splitMode === 'equal' && split.totalAmount && (
                  <p className="text-xs text-blue-500">
                    ₹{parseFloat(split.totalAmount).toFixed(2)} ÷ {split.splitWith.length + 1} people = ₹{myShare().toFixed(2)} each
                  </p>
                )}
              </div>

              <div>
                <label className="label">Date</label>
                <input type="date" value={split.date}
                  onChange={e => setSplit(s => ({ ...s, date: e.target.value }))}
                  className="input" />
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <input value={split.note}
                  onChange={e => setSplit(s => ({ ...s, note: e.target.value }))}
                  className="input" placeholder="Add a note..." />
              </div>
            </>
          ) : (
            /* ============ EXPENSE / INCOME / RECURRING ============ */
            <>
              <div>
                <label className="label">Title</label>
                <input name="title" value={form.title} onChange={handleChange} className="input"
                  placeholder={mode === 'recurring' ? 'e.g. Netflix, Rent, Gym' : 'e.g. Dinner at restaurant'} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount (₹)</label>
                  <input
                    name="amount"
                    type="number"
                    value={form.amount}
                    onChange={handleChange}
                    className="input"
                    placeholder="0.00"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input name="date" type="date" value={form.date} onChange={handleChange} className="input" required />
                </div>
              </div>
              <div>
                <label className="label">Category</label>
                <select name="category" value={form.category} onChange={handleChange} className="input">
                  {(mode === 'income' ? ['Salary', 'Investment', 'Other'] : EXPENSE_CATEGORIES).map(c => (
                    <option key={c}>{c}</option>
                  ))}
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
            <button type="submit" disabled={loading || isOverBudget()} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
