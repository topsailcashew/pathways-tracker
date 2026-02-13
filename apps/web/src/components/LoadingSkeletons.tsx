import React from 'react';

/**
 * Base Skeleton Component
 */
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

/**
 * Card Skeleton - For dashboard cards and panels
 */
export const CardSkeleton: React.FC = () => (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
    </div>
);

/**
 * Table Row Skeleton
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
    <tr className="border-b">
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} className="px-6 py-4">
                <Skeleton className="h-4 w-full" />
            </td>
        ))}
    </tr>
);

/**
 * Table Skeleton - Full table with headers and rows
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 5,
}) => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
            <thead className="bg-gray-50">
                <tr>
                    {Array.from({ length: columns }).map((_, i) => (
                        <th key={i} className="px-6 py-3">
                            <Skeleton className="h-4 w-24" />
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={columns} />
                ))}
            </tbody>
        </table>
    </div>
);

/**
 * List Item Skeleton - For member lists, task lists
 */
export const ListItemSkeleton: React.FC = () => (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow mb-3">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20" />
    </div>
);

/**
 * List Skeleton - Multiple list items
 */
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
    <div>
        {Array.from({ length: items }).map((_, i) => (
            <ListItemSkeleton key={i} />
        ))}
    </div>
);

/**
 * Form Skeleton - For forms and settings pages
 */
export const FormSkeleton: React.FC = () => (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <Skeleton className="h-8 w-1/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
        </div>
        <div className="flex justify-end gap-3 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
        </div>
    </div>
);

/**
 * Dashboard Grid Skeleton - For dashboard stats
 */
export const DashboardGridSkeleton: React.FC<{ cards?: number }> = ({ cards = 4 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: cards }).map((_, i) => (
            <CardSkeleton key={i} />
        ))}
    </div>
);

/**
 * Chart Skeleton - For analytics charts
 */
export const ChartSkeleton: React.FC = () => (
    <div className="bg-white rounded-lg shadow p-6">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
    </div>
);

/**
 * Profile Skeleton - For user profiles, member details
 */
export const ProfileSkeleton: React.FC = () => (
    <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-6 mb-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-2/3" />
                </div>
            ))}
        </div>
    </div>
);

/**
 * Modal Skeleton
 */
export const ModalSkeleton: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <Skeleton className="h-8 w-1/2 mb-6" />
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
    </div>
);

/**
 * Page Header Skeleton
 */
export const PageHeaderSkeleton: React.FC = () => (
    <div className="mb-8">
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-5 w-1/2" />
    </div>
);

/**
 * Full Page Skeleton - Complete page loading state
 */
export const PageSkeleton: React.FC = () => (
    <div className="p-8">
        <PageHeaderSkeleton />
        <DashboardGridSkeleton />
        <div className="mt-8">
            <TableSkeleton />
        </div>
    </div>
);

/**
 * Sidebar Skeleton - For navigation sidebar
 */
export const SidebarSkeleton: React.FC = () => (
    <div className="w-64 bg-gray-900 h-screen p-4 space-y-4">
        <Skeleton className="h-12 w-full bg-gray-700" />
        {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full bg-gray-700" />
        ))}
    </div>
);

/**
 * Timeline Skeleton - For activity feeds and history
 */
export const TimelineSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
    <div className="space-y-6">
        {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="flex gap-4">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
        ))}
    </div>
);

/**
 * Button Skeleton
 */
export const ButtonSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <Skeleton className={`h-10 w-32 ${className}`} />
);

/**
 * Badge Skeleton
 */
export const BadgeSkeleton: React.FC = () => <Skeleton className="h-6 w-20 rounded-full" />;

export default {
    Card: CardSkeleton,
    Table: TableSkeleton,
    TableRow: TableRowSkeleton,
    List: ListSkeleton,
    ListItem: ListItemSkeleton,
    Form: FormSkeleton,
    DashboardGrid: DashboardGridSkeleton,
    Chart: ChartSkeleton,
    Profile: ProfileSkeleton,
    Modal: ModalSkeleton,
    PageHeader: PageHeaderSkeleton,
    Page: PageSkeleton,
    Sidebar: SidebarSkeleton,
    Timeline: TimelineSkeleton,
    Button: ButtonSkeleton,
    Badge: BadgeSkeleton,
};
