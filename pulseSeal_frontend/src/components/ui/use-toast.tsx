// components/ui/use-toast.ts (create this file)
import { useState } from 'react';

export interface Toast {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (toast: Toast) => {
    setToasts(prev => [...prev, toast]);
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t !== toast));
    }, 5000);
  };

  return { toast, toasts };
}

// Simple Toast Component
export const ToastContainer: React.FC<{ toasts: Toast[] }> = ({ toasts }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={index}
          className={`p-4 rounded-md shadow-md ${
            toast.variant === 'destructive' 
              ? 'bg-red-100 text-red-900 border border-red-200' 
              : 'bg-green-100 text-green-900 border border-green-200'
          }`}
        >
          <h4 className="font-semibold">{toast.title}</h4>
          <p className="text-sm">{toast.description}</p>
        </div>
      ))}
    </div>
  );
};