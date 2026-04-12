export const formatCurrency = (amount, currency = '₹') => {
  return `${currency}${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Welcome';
};

export const CATEGORY_ICONS = {
  Food: '🍔',
  Transport: '🚕',
  Shopping: '🛍️',
  Bills: '💡',
  Entertainment: '🎬',
  Health: '💊',
  Education: '📚',
  Salary: '💼',
  Investment: '📈',
  Other: '📦',
};

export const CATEGORY_COLORS = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Shopping: '#a855f7',
  Bills: '#eab308',
  Entertainment: '#ec4899',
  Health: '#10b981',
  Education: '#6366f1',
  Salary: '#14b8a6',
  Investment: '#22c55e',
  Other: '#94a3b8',
};

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export const EXPENSE_CATEGORIES = ['Food','Transport','Shopping','Bills','Entertainment','Health','Education','Other'];
export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, 'Salary', 'Investment'];
