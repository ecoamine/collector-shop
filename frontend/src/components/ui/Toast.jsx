import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const types = {
  success: { Icon: CheckCircle, className: 'border-success/40 bg-success/10 text-success' },
  error: { Icon: XCircle, className: 'border-danger/40 bg-danger/10 text-danger' },
  info: { Icon: Info, className: 'border-primary/40 bg-primary/10 text-primary' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = 'info') => add(message, type),
    [add]
  );
  toast.success = (message) => add(message, 'success');
  toast.error = (message) => add(message, 'error');
  toast.info = (message) => add(message, 'info');

  const portal = typeof document !== 'undefined' && (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const { Icon, className } = types[t.type] || types.info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-glass ${className}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium flex-1">{t.message}</p>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className="p-1 rounded-lg hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {typeof document !== 'undefined' && createPortal(portal, document.body)}
    </ToastContext.Provider>
  );
}
