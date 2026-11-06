import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export const Alert = ({ type = 'info', message, onClose, className = '' }) => {
  const styles = {
    info: 'bg-neutral-50 text-neutral-900 border-neutral-200',
    success: 'bg-neutral-50 text-neutral-900 border-neutral-200',
    error: 'bg-neutral-50 text-neutral-900 border-neutral-200',
    warning: 'bg-neutral-50 text-neutral-900 border-neutral-200'
  };

  const icons = {
    info: <Info className="w-5 h-5 text-neutral-500 mr-3 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-neutral-500 mr-3 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-neutral-500 mr-3 shrink-0" />,
    warning: <Info className="w-5 h-5 text-neutral-500 mr-3 shrink-0" />
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
