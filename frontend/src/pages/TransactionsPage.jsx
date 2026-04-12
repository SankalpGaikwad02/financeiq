import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Filter } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate, CATEGORY_ICONS, EXPENSE_CATEGORIES } from '../utils/helpers';
import AddTransactionModal from '../components/AddTransactionModal';
import { useNotification } from '../context/NotificationContext';

const ALL_CATS = ['All', ...EXPENSE_CATEGORIES, 'Salary', 'Investment'];

export default function TransactionsPage() {
  const { addNotification } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('All');

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/transactions?limit=100');
      setTransactions(data);
    } catch (err) {
      addNotification('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t._id !== id));
      addNotification('Transaction deleted', 'success');
    } catch {
      addNotification('Failed to delete', 'error');
    }
  };

  const filtered = transactions.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || t.type === filterType;
    const matchCat = filterCategory === 'All' || t.category === filterCategory;
    return matchSearch && matchType && matchCat;
  });

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Transactions</h1>
          <p className="text-slate-400 text-sm">Track all your income and expenses</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Summary mini-cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Income</p>
          <p className="font-display font-bold text-emerald-500 text-lg">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Expenses</p>
          <p className="font-display font-bold text-red-500 text-lg">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Net</p>
          <p className={`font-display font-bold text-lg ${totalIncome - totalExpense >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
            placeholder="Search transactions..."
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input w-auto">
          <option value="all">All Types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input w-auto">
          {ALL_CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Transaction list */}
      <div className="card divide-y divide-slate-50 dark:divide-slate-700 p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-400">No transactions found</p>
          </div>
        ) : (
          filtered.map(t => (
            <div key={t._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
              <span className="text-xl w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-xl shrink-0">
                {CATEGORY_ICONS[t.category] || '📦'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{t.title}</p>
                <p className="text-xs text-slate-400">{t.category} · {formatDate(t.date)}</p>
              </div>
              {t.note && <p className="text-xs text-slate-400 hidden md:block max-w-32 truncate">{t.note}</p>}
              <span className={`text-sm font-bold shrink-0 ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
              <button
                onClick={() => handleDelete(t._id)}
                className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <AddTransactionModal
          onClose={() => setShowModal(false)}
          onAdded={(newT) => setTransactions(prev => [newT, ...prev])}
        />
      )}
    </div>
  );
}
