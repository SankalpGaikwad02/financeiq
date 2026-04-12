export default function StatCard({ title, value, subtitle, icon, color = 'brand', trend }) {
  const colorMap = {
    brand: 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
    green: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="card hover:shadow-md transition-shadow duration-200 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl ${colorMap[color]}`}>
          {icon}
        </span>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-50 text-red-500 dark:bg-red-900/30'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-display font-bold text-slate-800 dark:text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
