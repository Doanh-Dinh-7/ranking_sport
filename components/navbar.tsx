"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { TOURNAMENT_LOGO_URL, TOURNAMENT_NAME } from "@/lib/tournament";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/standings", label: "Bảng xếp hạng" },
  { href: "/knockout", label: "Vòng loại" },
  { href: "/fixtures", label: "Lịch thi đấu" },
  { href: "/venues", label: "Sân đấu" },
] as const;

function NavLinks({
  pathname,
  className,
  linkClassName,
  isMobileSheet,
}: {
  pathname: string;
  className?: string;
  linkClassName?: string;
  /** Bọc Link bằng SheetClose để đóng drawer trên mobile */
  isMobileSheet?: boolean;
}) {
  return (
    <ul className={cn("flex flex-col gap-1 md:flex-row md:gap-1", className)}>
      {navItems.map((item) => {
        const active = pathname === item.href;
        const inner = (
          <Link
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2.5 text-sm font-medium transition-colors md:py-2",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              linkClassName,
            )}
          >
            {item.label}
          </Link>
        );
        return (
          <li key={item.href}>
            {isMobileSheet ? <SheetClose asChild>{inner}</SheetClose> : inner}
          </li>
        );
      })}
    </ul>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex min-h-14 items-center justify-between gap-2 py-2 sm:min-h-16 sm:py-0">
          {/* Logo — co giãn, tránh tràn */}
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial md:min-w-0"
          >
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md ring-1 ring-border sm:h-9 sm:w-9">
              <Image
                src={TOURNAMENT_LOGO_URL}
                alt={TOURNAMENT_NAME}
                width={36}
                height={36}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <span className="truncate text-sm font-bold text-foreground sm:text-base md:max-w-[min(20rem,calc(100vw-8rem))]">
              {TOURNAMENT_NAME}
            </span>
          </Link>

          {/* Desktop: nav phải + hành động */}
          <div className="hidden min-w-0 flex-1 items-center justify-end md:flex ">
            <NavLinks pathname={pathname} />
          </div>

          {/* <div className="hidden shrink-0 items-center gap-2 md:flex">
            <ModeToggle />
            {!isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin">Admin</Link>
              </Button>
            )}
          </div> */}

          {/* Mobile: sheet menu */}
          <div className="flex shrink-0 items-center gap-1.5 md:hidden">
            {/* <ModeToggle /> */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label="Mở menu điều hướng"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex w-[min(100vw-1.5rem,20rem)] flex-col gap-0 p-0 sm:max-w-sm"
              >
                <SheetHeader className="border-b border-border px-4 py-4 text-left">
                  <SheetTitle className="text-base">Điều hướng</SheetTitle>
                </SheetHeader>
                <nav className="flex-1 overflow-y-auto px-2 py-3">
                  <NavLinks
                    pathname={pathname}
                    isMobileSheet
                    linkClassName="w-full text-left"
                  />
                </nav>
                {/* {!isAdmin && (
                  <div className="border-t border-border p-4">
                    <SheetClose asChild>
                      <Button variant="default" className="w-full" asChild>
                        <Link href="/admin">Vào trang Admin</Link>
                      </Button>
                    </SheetClose>
                  </div>
                )} */}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
