import React, { useState, useEffect, useRef } from 'react';
import { IoSearchOutline, IoCloseOutline, IoPeopleOutline, IoCheckboxOutline } from 'react-icons/io5';
import * as membersApi from '../api/members';
import * as tasksApi from '../api/tasks';

interface SearchResult {
    id: string;
    type: 'member' | 'task';
    title: string;
    subtitle: string;
    onClick: () => void;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate?: (path: string, id: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const searchTimer = setTimeout(() => {
            performSearch(query);
        }, 300); // Debounce search

        return () => clearTimeout(searchTimer);
    }, [query]);

    const performSearch = async (searchQuery: string) => {
        setIsLoading(true);
        try {
            const [members, tasks] = await Promise.all([
                membersApi.getMembers(),
                tasksApi.getTasks(),
            ]);

            const searchLower = searchQuery.toLowerCase();
            const foundResults: SearchResult[] = [];

            // Search members
            members
                .filter(m =>
                    m.firstName.toLowerCase().includes(searchLower) ||
                    m.lastName.toLowerCase().includes(searchLower) ||
                    m.email?.toLowerCase().includes(searchLower) ||
                    m.phone?.includes(searchQuery)
                )
                .slice(0, 5)
                .forEach(member => {
                    foundResults.push({
                        id: member.id,
                        type: 'member',
                        title: `${member.firstName} ${member.lastName}`,
                        subtitle: member.email || member.phone || 'No contact info',
                        onClick: () => {
                            onNavigate?.('/members', member.id);
                            onClose();
                        },
                    });
                });

            // Search tasks
            tasks
                .filter(t =>
                    t.title.toLowerCase().includes(searchLower) ||
                    t.description?.toLowerCase().includes(searchLower)
                )
                .slice(0, 5)
                .forEach(task => {
                    foundResults.push({
                        id: task.id,
                        type: 'task',
                        title: task.title,
                        subtitle: task.description || 'No description',
                        onClick: () => {
                            onNavigate?.('/tasks', task.id);
                            onClose();
                        },
                    });
                });

            setResults(foundResults);
            setSelectedIndex(0);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            results[selectedIndex].onClick();
        }
    };

    useEffect(() => {
        if (resultsRef.current && results.length > 0) {
            const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
            selectedElement?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex, results]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-20">
            <div className="bg-white rounded-lg w-full max-w-2xl shadow-2xl">
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                    <IoSearchOutline size={24} className="text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search members, tasks..."
                        className="flex-1 outline-none text-lg"
                    />
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <IoCloseOutline size={24} />
                    </button>
                </div>

                {/* Results */}
                <div ref={resultsRef} className="max-h-96 overflow-y-auto">
                    {isLoading && (
                        <div className="p-8 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2">Searching...</p>
                        </div>
                    )}

                    {!isLoading && query && results.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <p>No results found for "{query}"</p>
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <div>
                            {results.map((result, index) => (
                                <button
                                    key={result.id}
                                    onClick={result.onClick}
                                    className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 text-left transition-colors ${
                                        index === selectedIndex ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg ${
                                        result.type === 'member' ? 'bg-blue-100' : 'bg-green-100'
                                    }`}>
                                        {result.type === 'member' ? (
                                            <IoPeopleOutline size={20} className="text-blue-600" />
                                        ) : (
                                            <IoCheckboxOutline size={20} className="text-green-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 truncate">{result.title}</p>
                                        <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                                    </div>
                                    <div className="text-xs text-gray-400 uppercase">
                                        {result.type}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {!query && !isLoading && (
                        <div className="p-8 text-center text-gray-500">
                            <IoSearchOutline size={48} className="mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">Start typing to search</p>
                            <p className="text-sm mt-1">Search for members, tasks, and more</p>
                        </div>
                    )}
                </div>

                {/* Keyboard Hints */}
                <div className="border-t border-gray-200 p-3 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">↑</kbd>
                            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">↵</kbd>
                            Select
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">ESC</kbd>
                            Close
                        </span>
                    </div>
                    <div className="text-gray-400">
                        Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Ctrl+K</kbd> to search
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Custom hook to manage global search
 */
export const useGlobalSearch = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return {
        isSearchOpen: isOpen,
        openSearch: () => setIsOpen(true),
        closeSearch: () => setIsOpen(false),
    };
};

export default GlobalSearch;
