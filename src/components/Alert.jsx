import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export const Alert = ({ type = 'info', message, onClose, className = '' }) => {
  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-rose-50 text-rose-800 border-rose-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200'
  };

  const icons = {
    info: <Info className="w-5 h-5 text-blue-500 mr-3 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 mr-3 shrink-0" />,
    warning: <Info className="w-5 h-5 text-amber-500 mr-3 shrink-0" />
  };

  return (
    <div className={`flex items-center p-3.5 border rounded-xl ${styles[type]} ${className}`}>
      {icons[type]}
      <div className="text-sm font-medium flex-1">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
