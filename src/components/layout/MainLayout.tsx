"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-bg-cards">
      <Sidebar
        menuOpen={menuOpen}
        onLogoClick={() => setMenuOpen(true)}
        onCloseMenu={() => setMenuOpen(false)}
      />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</main>
    </div>
  );
}
