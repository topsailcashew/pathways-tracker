import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { IoCheckmarkCircle, IoWarning, IoCloseCircle, IoInformationCircle, IoClose } from 'react-icons/io5';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showWarning: (message: string) => void;
    showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (message: string, type: ToastType = 'info') => {
            const id = Date.now().toString();
            const newToast: Toast = { id, message, type };

            setToasts((prev) => [...prev, newToast]);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                removeToast(id);
            }, 5000);
        },
        [removeToast]
    );

    const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
    const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
    const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
    const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <ToastNotification
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

interface ToastNotificationProps {
    toast: Toast;
    onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <IoCheckmarkCircle className="w-6 h-6 text-green-500" />;
            case 'error':
                return <IoCloseCircle className="w-6 h-6 text-red-500" />;
            case 'warning':
                return <IoWarning className="w-6 h-6 text-yellow-500" />;
            case 'info':
            default:
                return <IoInformationCircle className="w-6 h-6 text-blue-500" />;
        }
    };

    const getBgColor = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'info':
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <div
            className={`${getBgColor()} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]
                        flex items-start gap-3 animate-slideIn`}
        >
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
            <p className="flex-1 text-sm text-gray-800">{toast.message}</p>
            <button
                onClick={onClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <IoClose className="w-5 h-5" />
            </button>
        </div>
    );
};
