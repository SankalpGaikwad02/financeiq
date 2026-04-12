import { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle, AlertTriangle, XCircle, Mail } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, CATEGORY_ICONS } from '../utils/helpers';
import { useNotification } from '../context/NotificationContext';

export default function AlertsPage() {
  const { addNotification } = useNotification();
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [email, setEmail] = useState('');

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/alerts/status');
      setStatuses(data);
    } catch (err) {
      if (err.response?.status === 400) setEmailConfigured(false);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleSendAlerts = async () => {
    setSending(true);
    try {
      const { data } = await api.post('/alerts/check');
      addNotification(data.message, data.alertsSent.length > 0 ? 'success' : 'info');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send alerts';
      if (msg.includes('not configured')) {
        setEmailConfigured(false);
        addNotification('Please configure email in your .env file first', 'warning');
      } else {
        addNotification(msg, 'error');
      }
    } finally { setSending(false); }
  };

  const statusConfig = {
    healthy:  { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Healthy', barColor: 'bg-emerald-500' },
    warning:  { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Warning (80%+)', barColor: 'bg-amber-400' },
    exceeded: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Exceeded!', barColor: 'bg-red-500' },
  };

  const atRisk = statuses.filter(s => s.status !== 'healthy');
  const healthy = statuses.filter(s => s.status === 'healthy');

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">🔔 Budget Alerts</h1>
          <p className="text-slate-400 text-sm">Get email notifications when budgets are at risk</p>
        </div>
        <button onClick={handleSendAlerts} disabled={sending}
          className="btn-primary flex items-center gap-2 text-sm">
          <Send size={14} /> {sending ? 'Sending...' : 'Send Alert Emails'}
        </button>
      </div>

      {/* Email setup card */}
      {!emailConfigured && (
        <div className="card border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex gap-3">
            <Mail size={24} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-amber-800 dark:text-amber-300 mb-1">Email Not Configured</p>
              <p className="text-amber-700 dark:text-amber-400 text-sm mb-3">
                To receive email alerts, add these two lines to your backend <code className="bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded text-xs">.env</code> file:
              </p>
              <div className="bg-slate-800 text-emerald-400 rounded-xl p-4 font-mono text-xs space-y-1">
                <p>EMAIL_USER=your.gmail@gmail.com</p>
                <p>EMAIL_PASS=your_16_char_app_password</p>
              </div>
              <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-xl">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">📋 How to get Gmail App Password:</p>
                <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
                  <li>Go to your Google Account → Security</li>
                  <li>Enable 2-Step Verification if not already on</li>
                  <li>Search for "App Passwords" in the search bar</li>
                  <li>Create one named "FinanceIQ" → copy the 16-char password</li>
                  <li>Paste it as EMAIL_PASS in your .env file</li>
                  <li>Restart the backend server</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* At-risk budgets */}
      {atRisk.length > 0 && (
        <div className="card">
          <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">
            ⚠️ Budgets Needing Attention ({atRisk.length})
          </h3>
          <div className="space-y-4">
            {atRisk.map(s => {
              const cfg = statusConfig[s.status];
              const Icon = cfg.icon;
              return (
                <div key={s.category} className={`p-4 rounded-xl ${cfg.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={cfg.color} />
                      <span className="font-semibold text-slate-800 dark:text-white text-sm">
                        {CATEGORY_ICONS[s.category]} {s.category}
                      </span>
                      <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <span className={`font-bold text-sm ${cfg.color}`}>{s.percentage}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${cfg.barColor}`}
                      style={{ width: `${Math.min(s.percentage, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Spent: {formatCurrency(s.spent)}</span>
                    <span>Limit: {formatCurrency(s.limit)}</span>
                    <span className={s.limit - s.spent < 0 ? 'text-red-500 font-bold' : ''}>
                      {s.limit - s.spent < 0 ? 'Over by ' + formatCurrency(Math.abs(s.limit - s.spent)) : 'Left: ' + formatCurrency(s.limit - s.spent)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Healthy budgets */}
      {healthy.length > 0 && (
        <div className="card">
          <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4">
            ✅ Healthy Budgets ({healthy.length})
          </h3>
          <div className="space-y-3">
            {healthy.map(s => (
              <div key={s.category} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">
                  {CATEGORY_ICONS[s.category]} {s.category}
                </span>
                <div className="w-32 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.percentage}%` }} />
                </div>
                <span className="text-xs font-bold text-emerald-600 w-10 text-right">{s.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && statuses.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-slate-400 font-medium mb-2">No budgets set yet</p>
          <p className="text-slate-400 text-sm">Set budgets first to track and receive alerts</p>
        </div>
      )}
    </div>
  );
}
