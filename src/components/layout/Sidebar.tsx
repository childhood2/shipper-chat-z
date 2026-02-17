"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import {
  LogoIcon,
  HouseIcon,
  ChatIcon,
  CompassIcon,
  FolderIcon,
  ImagesIcon,
  StarIcon,
} from "@/components/icons";
import { MenuPopup } from "./MenuPopup";
import { UserMenuPopup } from "./UserMenuPopup";

type SidebarProps = {
  menuOpen?: boolean;
  onLogoClick?: () => void;
  onCloseMenu?: () => void;
};

const navItems = [
  { href: "/", icon: HouseIcon, label: "Home" },
  { href: "/chat", icon: ChatIcon, label: "Chat" },
  { href: "#", icon: CompassIcon, label: "Compass" },
  { href: "#", icon: FolderIcon, label: "Folder" },
  { href: "#", icon: ImagesIcon, label: "Images" },
] as const;

export function Sidebar({ onLogoClick }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative flex h-full shrink-0">
      <aside className="inline-flex h-full min-h-[100vh] w-[76px] min-w-[76px] flex-col items-center justify-between bg-bg-cards px-4 py-6 shrink-0">
        {/* Top: logo + nav */}
        <div className="flex flex-col items-center justify-center gap-8">
          <div className="flex w-full items-center justify-start gap-3">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((o) => !o);
              }}
              className="flex shrink-0 items-center justify-center rounded-full bg-brand p-[11px] transition-opacity hover:opacity-90"
              aria-label="Open menu"
            >
              <span className="relative flex h-[22px] w-[22px] items-center justify-center">
                <LogoIcon className="text-[var(--Icon-Neutral-Icon-Primary-Inverted,white)]" />
              </span>
            </button>
          </div>
          <nav className="flex flex-col items-center justify-start gap-2">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive =
                href === "/chat"
                  ? pathname?.startsWith("/chat")
                  : href === "/"
                    ? pathname === "/"
                    : false;
              return (
                <Link
                  key={label}
                  href={href}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-8 transition-colors ${
                    isActive
                      ? "bg-bg-brand outline outline-1 outline-offset-[-1px] outline-brand"
                      : ""
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center text-[var(--Icon-Neutral-Icon-Primary,#151515)]">
                    <Icon size={20} />
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Star + avatar */}
        <div className="flex w-11 flex-col items-center justify-center gap-6">
          <Link
            href="#"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-8 transition-opacity hover:opacity-80"
          >
            <span className="flex h-5 w-5 items-center justify-center text-[var(--Icon-Neutral-Icon-Primary,#151515)]">
              <StarIcon size={20} />
            </span>
          </Link>
          <button
            ref={avatarButtonRef}
            type="button"
            className="relative h-11 w-11 flex-shrink-0 rounded-full outline-none ring-0"
            aria-label="Open user menu"
            onClick={() => setUserMenuOpen((o) => !o)}
          >
            <Avatar
              name={user?.name ?? user?.email ?? "User"}
              src={user?.image ?? null}
              size={44}
            />
          </button>
        </div>
      </aside>

      {menuOpen && (
        <MenuPopup user={user} onClose={() => setMenuOpen(false)} />
      )}
      {userMenuOpen && (
        <UserMenuPopup
          user={user}
          onClose={() => setUserMenuOpen(false)}
          anchorRef={avatarButtonRef}
        />
      )}
    </div>
  );
}

