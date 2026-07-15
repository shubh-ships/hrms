'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { SidebarProvider } from '@/components/ui/sidebar';
import DashboardNavbar from '@/components/dashboard/common/DashboardNavbar';
import DashboardSidebar from '@/components/dashboard/common/DashboardSidebar';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useRouter, usePathname } from 'next/navigation';
import { resetAuthState } from '@/features/auth/authSlice'; // Adjust path
import { hasHrmsAccess, hasTaskAccess } from '@/components/config/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
    children: ReactNode;
    defaultOpen: boolean;
}

export default function DashboardClientLayout({
    children,
    defaultOpen,
}: Props) {
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [displayChildren, setDisplayChildren] = useState<ReactNode>(null);
    const [isAuthCleared, setIsAuthCleared] = useState(false);

    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();

    const {
        role: rawRole,
        token,
        isSuperUser,
        isOrganizer,
        orgPermissions
    } = useAppSelector(state => state.auth);

    const userRole = rawRole?.toLowerCase();
    const hasValidAuth = !!token && !!userRole; // Check BOTH token AND role

    // Set client-side hydration
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Handle children display with loading
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setDisplayChildren(children);
            setIsLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [pathname, children]);

    // Storage event listener (cross-tab)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'token' && e.newValue === null && pathname.startsWith('/dashboard')) {
                dispatch(resetAuthState());
                setIsAuthCleared(true);
                router.replace('/');
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('storage', handleStorageChange);
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [dispatch, router, pathname]);

    // SINGLE SOURCE OF TRUTH: Auth guard FIRST (blocks everything if no auth)
    useEffect(() => {
        // If no valid auth AND on dashboard → IMMEDIATE redirect to root
        if (isClient && pathname.startsWith('/dashboard') && !hasValidAuth) {
            router.replace('/');
            return;
        }
    }, [isClient, pathname, hasValidAuth, router]);

    // Role-based redirect (ONLY if auth is valid)
    useEffect(() => {
        // Skip if no auth or already cleared
        if (!isClient || !hasValidAuth || isAuthCleared) return;

        if (userRole && orgPermissions) {
            const { isHRMS_enabled, isTaskManagement_enabled } = orgPermissions;
            const isAdmin = isOrganizer || userRole === 'admin';
            const isSuperAdmin = isSuperUser || userRole === 'super_admin';

            let targetPath: string | null = null;

            if (isSuperAdmin) {
                if (!pathname.startsWith('/dashboard/super_admin')) targetPath = '/dashboard/super_admin';
            } else if (isAdmin) {
                if (!pathname.startsWith('/dashboard/admin')) targetPath = '/dashboard/admin';
            } else {
                if (!pathname.startsWith('/dashboard/dynamic')) targetPath = '/dashboard/dynamic';
            }

            if (targetPath && pathname !== targetPath) {
                router.replace(targetPath);
            }
        }
    }, [userRole, isSuperUser, isOrganizer, orgPermissions, pathname, router, isClient, hasValidAuth, isAuthCleared]);

    // Show spinner if not client OR no valid auth
    if (!isClient || !hasValidAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        );
    }

    const isAdminRoute = pathname.startsWith('/dashboard/admin');
    const isSuperAdminRoute = pathname.startsWith('/dashboard/super_admin');
    const isDynamicRoute = pathname.startsWith('/dashboard/dynamic');

    let dashboardType: 'super_admin' | 'admin' | 'dynamic' = 'dynamic';
    if (isSuperAdminRoute) dashboardType = 'super_admin';
    else if (isAdminRoute) dashboardType = 'admin';

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SidebarProvider defaultOpen={false}>
                <div className="flex w-full h-screen">
                    <DashboardSidebar
                        dashboardType={dashboardType}
                        orgPermissions={orgPermissions}
                    />
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <DashboardNavbar
                            dashboardType={dashboardType}
                            orgPermissions={orgPermissions}
                        />
                        <main className="flex-1 p-4 overflow-auto bg-muted/50">
                            <div
                                className="transition-opacity duration-300"
                                style={{ opacity: isLoading ? 0.5 : 1 }}
                            >
                                {isLoading ? <DashboardSkeleton /> : displayChildren}
                            </div>
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </ThemeProvider>
    );
}

// DashboardSkeleton component (unchanged)
function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-6 space-y-3 shadow-sm">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-full lg:col-span-4 rounded-lg border bg-card p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-9 w-32" />
                    </div>
                    <Skeleton className="h-[300px] w-full rounded-md" />
                </div>
                <div className="col-span-full lg:col-span-3 rounded-lg border bg-card p-6 space-y-4 shadow-sm">
                    <Skeleton className="h-6 w-32" />
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                                <div className="space-y-2 flex-1 min-w-0">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="rounded-lg border bg-card shadow-sm">
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-40" />
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-9 w-24" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 pb-3 border-b">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-4 w-8" />
                                <div className="flex items-center space-x-3 flex-1">
                                    <Skeleton className="h-10 w-10 rounded" />
                                    <Skeleton className="h-4 flex-1" />
                                </div>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-8 w-16 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-6 space-y-3 shadow-sm">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-20 w-full rounded" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                ))}
            </div>
        </div>
    );
}
