import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3500);
  }, []);

  const remove = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={() => remove(n.id)}
            className={`notification-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium cursor-pointer max-w-sm
              ${n.type === 'success' ? 'bg-emerald-500 text-white' : ''}
              ${n.type === 'error' ? 'bg-red-500 text-white' : ''}
              ${n.type === 'warning' ? 'bg-amber-500 text-white' : ''}
              ${n.type === 'info' ? 'bg-brand-600 text-white' : ''}
            `}
          >
            <span>{n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : n.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
