import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ type = 'info', message, onClose }) => {
    if (!message) return null;

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <AlertCircle className="w-5 h-5 text-rose-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    const bgColors = {
        success: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
        error: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200',
        info: 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
    };

    return (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-bounce ${bgColors[type]}`}>
            {icons[type]}
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="p-1 hover:opacity-70">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;
