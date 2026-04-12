import { useState, useEffect, useCallback } from 'react';
import { Plus, TrendingUp, ArrowRight, GripVertical, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getGreeting, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/helpers';
import StatCard from '../components/StatCard';
import AddTransactionModal from '../components/AddTransactionModal';

// Default widget order stored in localStorage
const DEFAULT_WIDGETS = ['hero','stats','charts','transactions','budget','insights','goals'];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [insights, setInsights] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Drag state
  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard_widget_order');
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
    } catch { return DEFAULT_WIDGETS; }
  });
  const [dragOver, setDragOver] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const fetchAll = async () => {
    try {
      const [s, t, b, g, i] = await Promise.all([
        api.get('/transactions/summary'),
        api.get('/transactions?limit=5'),
        api.get('/budgets'),
        api.get('/goals'),
        api.get('/insights'),
      ]);
      setSummary(s.data);
      setTransactions(t.data);
      setBudgets(b.data);
      setGoals(g.data.slice(0, 3));
      setInsights(i.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // Save widget order to localStorage
  const saveOrder = useCallback((order) => {
    setWidgets(order);
    localStorage.setItem('dashboard_widget_order', JSON.stringify(order));
  }, []);

  const resetOrder = () => saveOrder(DEFAULT_WIDGETS);

  // Drag handlers
  const onDragStart = (e, id) => { setDragging(id); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e, id) => { e.preventDefault(); setDragOver(id); };
  const onDrop = (e, targetId) => {
    e.preventDefault();
    if (dragging === targetId) return;
    const newOrder = [...widgets];
    const fromIdx = newOrder.indexOf(dragging);
    const toIdx = newOrder.indexOf(targetId);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragging);
    saveOrder(newOrder);
    setDragging(null);
    setDragOver(null);
  };
  const onDragEnd = () => { setDragging(null); setDragOver(null); };

  const pieData = summary?.categoryBreakdown
    ? Object.entries(summary.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const WIDGET_COMPONENTS = {
    hero: (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-purple-600 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <p className="text-white/70 text-sm font-medium mb-1">PERSONAL FINANCE DASHBOARD</p>
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          {insights[0] && <p className="text-white/80 text-sm mb-4">{insights[0].icon} {insights[0].message}</p>}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-white text-brand-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition-all active:scale-95">
              <Plus size={16} /> Add Transaction
            </button>
            <button onClick={() => navigate('/reports')}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95">
              <TrendingUp size={16} /> View Reports
            </button>
          </div>
        </div>
        <div className="absolute top-6 right-8 hidden lg:block text-right">
          <p className="text-white/60 text-xs uppercase tracking-wider">Total Balance</p>
          <p className="font-display text-3xl font-bold">{formatCurrency(summary?.balance ?? 0)}</p>
        </div>
      </div>
    ),

    stats: (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={formatCurrency(summary?.income ?? 0)} icon="💼" color="green" subtitle="This month" />
        <StatCard title="Total Expenses" value={formatCurrency(summary?.expenses ?? 0)} icon="🛍️" color="red" subtitle="This month" />
        <StatCard title="Savings Rate" value={`${summary?.savingsRate ?? 0}%`} icon="🐷"
          color={summary?.savingsRate >= 20 ? 'green' : 'amber'}
          subtitle={summary?.savingsRate >= 20 ? 'On track!' : 'Aim for 20%'} />
        <StatCard title="Net Balance" value={formatCurrency(summary?.balance ?? 0)} icon="💰" color="brand"
          subtitle={summary?.balance >= 0 ? 'Positive ✅' : 'Overspent ❌'} />
      </div>
    ),

    charts: (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">📈 Spending Trend (Last 7 Days)</h3>
          {summary?.last7Days?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={summary.last7Days}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip formatter={(v) => [`₹${v}`, 'Spent']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet — add some transactions!</div>
          )}
        </div>
        <div className="card">
          <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">🍩 Category Breakdown</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map(entry => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />)}
                </Pie>
                <Tooltip formatter={(v) => [`₹${v}`, '']} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No expenses recorded yet</div>
          )}
        </div>
      </div>
    ),

    transactions: (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-slate-800 dark:text-white">🧾 Recent Transactions</h3>
          <button onClick={() => navigate('/transactions')} className="text-xs text-brand-500 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight size={12} />
          </button>
        </div>
        {transactions.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(t => (
              <div key={t._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <span className="text-xl w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-xl">
                  {CATEGORY_ICONS[t.category] || '📦'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{t.title}</p>
                  <p className="text-xs text-slate-400">{t.category}</p>
                </div>
                <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),

    budget: (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-slate-800 dark:text-white">💳 Budget Tracker</h3>
          <button onClick={() => navigate('/budgets')} className="text-xs text-brand-500 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            Manage <ArrowRight size={12} />
          </button>
        </div>
        {budgets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm mb-3">No budgets set yet</p>
            <button onClick={() => navigate('/budgets')} className="btn-primary text-sm">Set Budgets</button>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.slice(0, 4).map(b => (
              <div key={b._id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{CATEGORY_ICONS[b.category]} {b.category}</span>
                  <span className={`font-semibold ${b.percentage >= 100 ? 'text-red-500' : b.percentage >= 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${b.percentage >= 100 ? 'bg-red-500' : b.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    ),

    insights: (
      <div className="card">
        <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">🤖 Smart Insights</h3>
        {insights.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Add transactions to see insights</p>
        ) : (
          <div className="space-y-3">
            {insights.map((ins, i) => (
              <div key={i} className={`flex gap-3 p-3 rounded-xl text-sm
                ${ins.type === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : ''}
                ${ins.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : ''}
                ${ins.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : ''}
                ${ins.type === 'info' || ins.type === 'tip' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' : ''}
              `}>
                <span className="text-base">{ins.icon}</span>
                <p>{ins.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    ),

    goals: goals.length === 0 ? null : (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-slate-800 dark:text-white">🎯 Financial Goals</h3>
          <button onClick={() => navigate('/goals')} className="text-xs text-brand-500 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.map(g => {
            const pct = Math.min(Math.round((g.savedAmount / g.targetAmount) * 100), 100);
            return (
              <div key={g._id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{g.emoji}</span>
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{g.title}</p>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>{formatCurrency(g.savedAmount)} saved</span>
                  <span>{formatCurrency(g.targetAmount)} goal</span>
                </div>
                <div className="h-2.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: g.color }} />
                </div>
                <p className="text-right text-xs font-bold mt-1" style={{ color: g.color }}>{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>
    ),
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Edit mode toggle */}
      <div className="flex justify-end gap-2">
        {editMode && (
          <button onClick={resetOrder} className="btn-secondary flex items-center gap-2 text-sm">
            <RotateCcw size={13} /> Reset Layout
          </button>
        )}
        <button
          onClick={() => setEditMode(e => !e)}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
            editMode ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <GripVertical size={14} /> {editMode ? 'Done Editing' : 'Arrange Widgets'}
        </button>
      </div>

      {/* Widget area */}
      <div className="space-y-5">
        {widgets.map(id => {
          const component = WIDGET_COMPONENTS[id];
          if (!component) return null;
          return (
            <div
              key={id}
              draggable={editMode}
              onDragStart={e => onDragStart(e, id)}
              onDragOver={e => onDragOver(e, id)}
              onDrop={e => onDrop(e, id)}
              onDragEnd={onDragEnd}
              className={`transition-all duration-200 ${editMode ? 'cursor-grab active:cursor-grabbing' : ''} ${
                dragOver === id && dragging !== id ? 'scale-[1.01] ring-2 ring-brand-400 ring-offset-2 rounded-2xl' : ''
              } ${dragging === id ? 'opacity-50' : 'opacity-100'}`}
            >
              {editMode && (
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <GripVertical size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-400 font-medium capitalize">{id} widget — drag to reorder</span>
                </div>
              )}
              {component}
            </div>
          );
        })}
      </div>

      {showModal && (
        <AddTransactionModal onClose={() => setShowModal(false)} onAdded={() => fetchAll()} />
      )}
    </div>
  );
}
