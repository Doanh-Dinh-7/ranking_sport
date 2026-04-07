"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import Image from "next/image";
import { TOURNAMENT_LOGO_URL, TOURNAMENT_NAME } from "@/lib/tournament";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        return;
      }

      // Redirect to admin dashboard
      router.push("/admin");
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-background px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="fixed top-3 right-3 z-50 sm:top-4 sm:right-4">
        <ModeToggle />
      </div>
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
              <Image
                src={TOURNAMENT_LOGO_URL}
                alt={TOURNAMENT_NAME}
                width={48}
                height={48}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
            <div className="min-w-0">
              <span className="text-foreground font-bold text-lg block leading-tight">
                Admin
              </span>
              <span className="text-xs text-muted-foreground">
                {TOURNAMENT_NAME}
              </span>
            </div>
          </div>
          <CardTitle>Đăng nhập</CardTitle>
          <CardDescription>Nhập thông tin quản trị viên</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Tên đăng nhập
              </label>
              <Input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Mật khẩu
              </label>
              <Input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Demo credentials (for testing):
              <br />
              Username:{" "}
              <code className="bg-muted px-1 py-0.5 rounded">admin</code>
              <br />
              Password:{" "}
              <code className="bg-muted px-1 py-0.5 rounded">
                tournament2026
              </code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
