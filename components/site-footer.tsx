"use client";

import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-primary/20 bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-nowrap items-center justify-between gap-3 px-4 py-3.5 text-xs sm:px-6 sm:text-sm lg:px-8">
        <p>
          <span className="text-primary-foreground/85">
            {" "}
            Đinh Sỹ Quốc Doanh · 48K14.2 · 2004
          </span>
        </p>
        <p className="min-w-0 truncate">
          <span className="text-primary-foreground/90">Create by </span>
          <span className="font-semibold text-primary-foreground">
            Doanh Dinh · 17
          </span>
        </p>
        <p className="shrink-0 text-right text-primary-foreground/90">
          CLB TechTonic · Khoa TK-TH · DUE
        </p>
      </div>
    </footer>
  );
}
