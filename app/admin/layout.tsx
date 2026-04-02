'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { TOURNAMENT_LOGO_URL, TOURNAMENT_NAME } from '@/lib/tournament';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginRoute) return;

    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/verify', { credentials: 'include' });
        if (!res.ok) {
          setIsAuthenticated(false);
          router.replace('/admin/login');
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        router.replace('/admin/login');
      }
    }

    checkAuth();
  }, [router, isLoginRoute]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
                <Image
                  src={TOURNAMENT_LOGO_URL}
                  alt={TOURNAMENT_NAME}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="text-foreground font-bold text-sm block truncate">Admin</span>
                <span className="text-[10px] text-muted-foreground truncate block leading-tight">
                  {TOURNAMENT_NAME}
                </span>
              </div>
            </div>
            <ModeToggle />
          </div>
          <p className="text-xs text-muted-foreground">Cập nhật kết quả trận</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink href="/admin" label="Kết quả trận đấu" icon="K" active={pathname === '/admin'} />
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Button onClick={handleLogout} variant="outline" className="w-full" size="sm">
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors cursor-pointer ${
          active
            ? 'bg-primary/15 text-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-xs font-bold text-primary-foreground">
          {icon}
        </div>
        <span className="text-sm">{label}</span>
      </div>
    </Link>
  );
}
