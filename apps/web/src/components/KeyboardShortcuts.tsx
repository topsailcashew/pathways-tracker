import React, { useState, useEffect } from 'react';
import { IoCloseOutline, IoKeyOutline } from 'react-icons/io5';

interface ShortcutCategory {
    category: string;
    shortcuts: Array<{
        keys: string[];
        description: string;
    }>;
}

const defaultShortcutCategories: ShortcutCategory[] = [
    {
        category: 'Navigation',
        shortcuts: [
            { keys: ['G', 'D'], description: 'Go to Dashboard' },
            { keys: ['G', 'M'], description: 'Go to Members' },
            { keys: ['G', 'T'], description: 'Go to Tasks' },
            { keys: ['G', 'A'], description: 'Go to Analytics' },
            { keys: ['G', 'S'], description: 'Go to Settings' },
        ],
    },
    {
        category: 'Actions',
        shortcuts: [
            { keys: ['Ctrl', 'K'], description: 'Global Search' },
            { keys: ['N'], description: 'New Member/Task (context)' },
            { keys: ['E'], description: 'Edit Selected (context)' },
            { keys: ['Delete'], description: 'Delete Selected (context)' },
            { keys: ['?'], description: 'Show Keyboard Shortcuts' },
        ],
    },
    {
        category: 'General',
        shortcuts: [
            { keys: ['ESC'], description: 'Close Modal/Dialog' },
            { keys: ['Enter'], description: 'Submit Form' },
            { keys: ['Ctrl', 'S'], description: 'Save (in forms)' },
        ],
    },
];

export const KeyboardShortcutsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <IoKeyOutline size={28} className="text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-800">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <IoCloseOutline size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {defaultShortcutCategories.map((category, index) => (
                        <div key={index}>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">{category.category}</h3>
                            <div className="space-y-3">
                                {category.shortcuts.map((shortcut, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-2">
                                        <span className="text-gray-700">{shortcut.description}</span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, keyIdx) => (
                                                <React.Fragment key={keyIdx}>
                                                    <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                                                        {key}
                                                    </kbd>
                                                    {keyIdx < shortcut.keys.length - 1 && (
                                                        <span className="text-gray-400 text-sm mx-1">then</span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 text-center text-sm text-gray-600">
                    Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">?</kbd> anytime to view shortcuts
                </div>
            </div>
        </div>
    );
};

/**
 * Hook to manage keyboard shortcuts globally
 */
export const useKeyboardShortcuts = (onNavigate?: (path: string) => void) => {
    const [showHelp, setShowHelp] = useState(false);
    const [sequenceKeys, setSequenceKeys] = useState<string[]>([]);

    useEffect(() => {
        let sequenceTimer: NodeJS.Timeout;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore shortcuts when typing in inputs
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target instanceof HTMLSelectElement
            ) {
                // Except for Ctrl+K for search and ? for help
                if (!((e.ctrlKey || e.metaKey) && e.key === 'k') && e.key !== '?') {
                    return;
                }
            }

            // Show help
            if (e.key === '?' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setShowHelp(true);
                return;
            }

            // Close help
            if (e.key === 'Escape' && showHelp) {
                e.preventDefault();
                setShowHelp(false);
                return;
            }

            // Handle navigation sequences (G + X)
            if (e.key.toLowerCase() === 'g' && sequenceKeys.length === 0) {
                e.preventDefault();
                setSequenceKeys(['g']);
                sequenceTimer = setTimeout(() => setSequenceKeys([]), 1000);
                return;
            }

            if (sequenceKeys.length > 0) {
                clearTimeout(sequenceTimer);
                const key = e.key.toLowerCase();

                if (sequenceKeys[0] === 'g') {
                    e.preventDefault();
                    switch (key) {
                        case 'd':
                            onNavigate?.('/dashboard');
                            break;
                        case 'm':
                            onNavigate?.('/members');
                            break;
                        case 't':
                            onNavigate?.('/tasks');
                            break;
                        case 'a':
                            onNavigate?.(('/analytics'));
                            break;
                        case 's':
                            onNavigate?.('/settings');
                            break;
                    }
                    setSequenceKeys([]);
                }
                return;
            }

            // Save shortcut in forms
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                // Let forms handle this with their own save logic
                const form = (e.target as HTMLElement).closest('form');
                if (form) {
                    e.preventDefault();
                    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(sequenceTimer);
        };
    }, [sequenceKeys, showHelp, onNavigate]);

    return {
        showShortcutsHelp: showHelp,
        openShortcutsHelp: () => setShowHelp(true),
        closeShortcutsHelp: () => setShowHelp(false),
    };
};

export default KeyboardShortcutsModal;
