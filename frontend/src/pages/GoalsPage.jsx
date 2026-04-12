import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import { useNotification } from '../context/NotificationContext';

const EMOJIS = ['🎯', '✈️', '🏠', '🚗', '💍', '🎓', '💻', '📱', '🏋️', '🌟'];
const COLORS = ['#6366f1', '#10b981', '#f97316', '#ec4899', '#3b82f6', '#eab308', '#14b8a6', '#a855f7'];

const defaultForm = { title: '', targetAmount: '', savedAmount: '', deadline: '', emoji: '🎯', color: '#6366f1' };

export default function GoalsPage() {
  const { addNotification } = useNotification();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [depositId, setDepositId] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');

  const fetchGoals = async () => {
    try {
      const { data } = await api.get('/goals');
      setGoals(data);
    } catch {
      addNotification('Failed to load goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/goals/${editId}`, {
          ...form,
          targetAmount: parseFloat(form.targetAmount),
          savedAmount: parseFloat(form.savedAmount || 0)
        });
        setGoals(prev => prev.map(g => g._id === editId ? data : g));
        addNotification('Goal updated!', 'success');
      } else {
        const { data } = await api.post('/goals', {
          ...form,
          targetAmount: parseFloat(form.targetAmount),
          savedAmount: parseFloat(form.savedAmount || 0)
        });
        setGoals(prev => [data, ...prev]);
        addNotification('Goal created!', 'success');
      }
      setShowForm(false);
      setForm(defaultForm);
      setEditId(null);
    } catch (err) {
      addNotification(err.response?.data?.message || 'Failed to save goal', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      setGoals(prev => prev.filter(g => g._id !== id));
      addNotification('Goal deleted', 'success');
    } catch {
      addNotification('Failed to delete', 'error');
    }
  };

  const handleDeposit = async (goal) => {
    if (!depositAmount) return;
    const newSaved = Math.min(goal.savedAmount + parseFloat(depositAmount), goal.targetAmount);
    try {
      const { data } = await api.put(`/goals/${goal._id}`, { savedAmount: newSaved });
      setGoals(prev => prev.map(g => g._id === goal._id ? data : g));
      addNotification(`₹${depositAmount} added to "${goal.title}"!`, 'success');
      setDepositId(null);
      setDepositAmount('');
    } catch {
      addNotification('Failed to update goal', 'error');
    }
  };

  const startEdit = (goal) => {
    setForm({
      title: goal.title,
      targetAmount: goal.targetAmount,
      savedAmount: goal.savedAmount,
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
      emoji: goal.emoji,
      color: goal.color,
    });
    setEditId(goal._id);
    setShowForm(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Financial Goals</h1>
          <p className="text-slate-400 text-sm">Set targets and watch your savings grow</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Goal
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card animate-slide-up">
          <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">{editId ? 'Edit Goal' : 'Create New Goal'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Goal Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="e.g. Trip to Goa" required />
              </div>
              <div>
                <label className="label">Target Amount (₹)</label>
                <input type="number" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} className="input" placeholder="50000" required min="1" />
              </div>
              <div>
                <label className="label">Already Saved (₹)</label>
                <input type="number" value={form.savedAmount} onChange={e => setForm(f => ({ ...f, savedAmount: e.target.value }))} className="input" placeholder="0" min="0" />
              </div>
              <div>
                <label className="label">Deadline (optional)</label>
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Pick an Emoji</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(em => (
                  <button key={em} type="button" onClick={() => setForm(f => ({ ...f, emoji: em }))}
                    className={`text-2xl w-10 h-10 rounded-xl transition-all ${form.emoji === em ? 'bg-brand-100 dark:bg-brand-900 ring-2 ring-brand-500' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Color</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">{editId ? 'Update Goal' : 'Create Goal'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Goals grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : goals.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">🎯</p>
          <p className="text-slate-500 font-medium mb-1">No goals yet</p>
          <p className="text-slate-400 text-sm mb-4">Create your first financial goal to start tracking your savings</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Create a Goal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(g => {
            const pct = Math.min(Math.round((g.savedAmount / g.targetAmount) * 100), 100);
            const remaining = g.targetAmount - g.savedAmount;
            return (
              <div key={g._id} className="card hover:shadow-md transition-all duration-200 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{g.emoji}</span>
                    <div>
                      <h3 className="font-display font-bold text-slate-800 dark:text-white">{g.title}</h3>
                      {g.deadline && (
                        <p className="text-xs text-slate-400">By {new Date(g.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => startEdit(g)} className="text-slate-400 hover:text-brand-500 transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(g._id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(g.savedAmount)}</span>
                    <span className="text-slate-400">{formatCurrency(g.targetAmount)}</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: g.color }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs font-bold" style={{ color: g.color }}>{pct}% complete</span>
                    <span className="text-xs text-slate-400">{formatCurrency(remaining)} to go</span>
                  </div>
                </div>

                {/* Deposit */}
                {depositId === g._id ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      className="input text-sm"
                      placeholder="Amount (₹)"
                      min="1"
                      autoFocus
                    />
                    <button onClick={() => handleDeposit(g)} className="btn-primary px-3"><Check size={16} /></button>
                    <button onClick={() => setDepositId(null)} className="btn-secondary px-3">✕</button>
                  </div>
                ) : (
                  pct < 100 && (
                    <button
                      onClick={() => { setDepositId(g._id); setDepositAmount(''); }}
                      className="w-full text-sm font-semibold text-center py-2 rounded-xl border-2 border-dashed transition-all hover:border-solid"
                      style={{ borderColor: g.color, color: g.color }}
                    >
                      + Add Savings
                    </button>
                  )
                )}

                {pct >= 100 && (
                  <div className="text-center py-2 text-emerald-500 font-bold text-sm">🎉 Goal Achieved!</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
