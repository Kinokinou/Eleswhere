"use client";

import {
  BarChart3,
  CalendarDays,
  FileText,
  Map,
  MessageCircle,
  Settings,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { label: "Dashboard", href: "/", icon: BarChart3 },
  { label: "Map", href: "/map", icon: Map },
  { label: "Trips", href: "/trips", icon: CalendarDays },
  { label: "Drafts", href: "/drafts", icon: FileText },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "Yearly Report", href: "/yearly-report", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#151515]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-black/10 bg-white px-5 py-6 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-xl font-semibold tracking-[0px]">Eleswhere</div>
            <div className="text-xs text-black/45">memory map</div>
          </div>
        </Link>

        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                  active
                    ? "bg-black text-white"
                    : "text-black/70 hover:bg-black/[0.04] hover:text-black"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-lg border border-black/10 bg-[#f7f7f5] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8f35f] text-sm font-semibold">
              EU
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">本地用户</div>
              <div className="truncate text-xs text-black/45">@eleswhere.local</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
