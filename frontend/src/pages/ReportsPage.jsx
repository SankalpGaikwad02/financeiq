import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';
import api from '../utils/api';
import { formatCurrency, CATEGORY_COLORS, MONTHS } from '../utils/helpers';

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/transactions/summary?month=${month}&year=${year}`);
        setSummary(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [month]);

  const pieData = summary?.categoryBreakdown
    ? Object.entries(summary.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  const barData = summary?.categoryBreakdown
    ? Object.entries(summary.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Financial Reports</h1>
        <p className="text-slate-400 text-sm">Detailed insights into your financial health</p>
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

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Income', value: summary?.income, color: 'text-emerald-500' },
              { label: 'Expenses', value: summary?.expenses, color: 'text-red-500' },
              { label: 'Net Balance', value: summary?.balance, color: summary?.balance >= 0 ? 'text-brand-600' : 'text-red-500' },
              { label: 'Savings Rate', value: `${summary?.savingsRate}%`, color: summary?.savingsRate >= 20 ? 'text-emerald-500' : 'text-amber-500', isStr: true },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                <p className={`font-display font-bold text-xl ${s.color}`}>
                  {s.isStr ? s.value : formatCurrency(s.value ?? 0)}
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 7-day trend */}
            <div className="card">
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">📈 7-Day Spending Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={summary?.last7Days || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(v) => [formatCurrency(v), 'Spent']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Donut chart */}
            <div className="card">
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">🍩 Spending by Category</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                      {pieData.map(entry => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [formatCurrency(v), '']} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No expense data for this month</div>
              )}
            </div>

            {/* Bar chart */}
            <div className="card lg:col-span-2">
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">📊 Spending by Category (Bar)</h3>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      formatter={(v) => [formatCurrency(v), 'Spent']}
                      contentStyle={{ borderRadius: '12px', border: 'none' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barData.map(entry => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No expense data for this month</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
