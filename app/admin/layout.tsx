'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { TOURNAMENT_LOGO_URL, TOURNAMENT_NAME } from '@/lib/tournament';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
      setMobileNavOpen(false);
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  const closeMobile = () => setMobileNavOpen(false);

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur supports-backdrop-filter:bg-card/80 lg:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Mở menu"
        >
          <Menu className="size-5" />
        </Button>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          Admin · {TOURNAMENT_NAME}
        </span>
        <ModeToggle />
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[min(18rem,88vw)] p-0 lg:hidden">
          <SheetTitle className="sr-only">Menu quản trị</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
                  <Image
                    src={TOURNAMENT_LOGO_URL}
                    alt={TOURNAMENT_NAME}
                    width={36}
                    height={36}
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
              <p className="mt-3 text-xs text-muted-foreground">Quản lý giải</p>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              <NavLink
                href="/admin"
                label="Tỉ số & trạng thái"
                icon="T"
                active={pathname === '/admin'}
                onNavigate={closeMobile}
              />
              <NavLink
                href="/admin/events"
                label="Diễn biến trận"
                icon="D"
                active={pathname === '/admin/events'}
                onNavigate={closeMobile}
              />
              <NavLink
                href="/admin/teams"
                label="Master — Đội"
                icon="Đ"
                active={pathname === '/admin/teams'}
                onNavigate={closeMobile}
              />
              <NavLink
                href="/admin/groups"
                label="Vòng bảng"
                icon="B"
                active={pathname === '/admin/groups'}
                onNavigate={closeMobile}
              />
              <NavLink
                href="/admin/schedules"
                label="Lịch thi đấu"
                icon="L"
                active={pathname === '/admin/schedules'}
                onNavigate={closeMobile}
              />
            </nav>
            <div className="border-t border-border p-3">
              <Button onClick={handleLogout} variant="outline" className="w-full" size="sm">
                Đăng xuất
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="p-4 sm:p-6 border-b border-border">
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
          <p className="text-xs text-muted-foreground">Quản lý giải</p>
        </div>

        <nav className="flex-1 space-y-1 p-3 sm:p-4">
          <NavLink
            href="/admin"
            label="Tỉ số & trạng thái"
            icon="T"
            active={pathname === '/admin'}
          />
          <NavLink
            href="/admin/events"
            label="Diễn biến trận"
            icon="D"
            active={pathname === '/admin/events'}
          />
          <NavLink
            href="/admin/teams"
            label="Master — Đội"
            icon="Đ"
            active={pathname === '/admin/teams'}
          />
          <NavLink
            href="/admin/groups"
            label="Vòng bảng"
            icon="B"
            active={pathname === '/admin/groups'}
          />
          <NavLink
            href="/admin/schedules"
            label="Lịch thi đấu"
            icon="L"
            active={pathname === '/admin/schedules'}
          />
        </nav>

        <div className="border-t border-border p-3 sm:p-4">
          <Button onClick={handleLogout} variant="outline" className="w-full" size="sm">
            Đăng xuất
          </Button>
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-background">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-5 sm:py-6 lg:p-8">
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
  onNavigate,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link href={href} onClick={onNavigate} className="block">
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer sm:px-4 ${
          active
            ? 'bg-primary/15 text-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        <div className="w-6 h-6 bg-primary rounded flex shrink-0 items-center justify-center text-xs font-bold text-primary-foreground">
          {icon}
        </div>
        <span className="text-sm leading-snug">{label}</span>
      </div>
    </Link>
  );
}
