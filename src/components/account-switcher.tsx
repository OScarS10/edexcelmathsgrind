"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  USERS,
  setActiveUser,
  useActiveUserSnapshot,
} from "@/lib/profile/accounts";

export function AccountSwitcher() {
  const user = useActiveUserSnapshot();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Switch account"
        className="flex h-10 items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
          {user[0]}
        </span>
        <span className="hidden md:inline">{user}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Switch account
            </p>
            {USERS.map((name) => (
              <button
                key={name}
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                onClick={() => {
                  setActiveUser(name);
                  setOpen(false);
                }}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-black text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {name[0]}
                </span>
                {name}
                {name === user && (
                  <Check className="ml-auto h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}