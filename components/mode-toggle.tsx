"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  const navSyncClass =
    "text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-hidden
        className={cn("shrink-0", navSyncClass, "opacity-50")}
        disabled
      >
        <Sun className="size-4" />
        <span className="sr-only">Giao diện</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("shrink-0", navSyncClass)}
      aria-label={
        isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
      }
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Moon className="size-4" />
      ) : (
        <Sun className="size-4" />
      )}
      <span className="sr-only">
        {isDark ? "Đang tối — bấm để sáng" : "Đang sáng — bấm để tối"}
      </span>
    </Button>
  );
}
