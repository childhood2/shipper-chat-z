"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { ArrowRightIcon, EditIcon, GiftIcon, SunIcon, LogoutIcon } from "@/components/icons";
import type { User } from "next-auth";

type MenuPopupProps = {
  user?: User | null;
  onClose: () => void;
};

const iconWrapDefault =
  "flex shrink-0 items-center justify-center rounded-6 bg-bg-cards p-1.5 text-[#28303F] transition-colors group-hover:bg-white";
const menuRowClass =
  "group inline-flex w-full items-center gap-2 rounded-8 px-1.5 py-1.5 text-14 font-medium leading-5 text-text-heading-primary transition-colors hover:bg-surface-hover";

export function MenuPopup({ user, onClose }: MenuPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const name = user?.name ?? user?.email ?? "";
  const email = user?.email ?? "";

  return (
    <>
      <div className="fixed inset-0 z-40" aria-hidden onClick={onClose} />
      <div
        ref={popupRef}
        className="fixed left-4 top-24 z-50 inline-flex w-[307px] flex-col items-start justify-start gap-1 overflow-hidden rounded-16 bg-white py-1 shadow-[0px_1px_13.8px_1px_rgba(18,18,18,0.1)]"
      >
        {/* James: Go back to dashboard, Rename file — list wrapper p 4 rounded 12 gap 4; items p 6 rounded 8 gap 8; Rename file has bg-tertiary + icon white */}
        <div className="flex w-full flex-col items-center justify-center gap-2 px-1">
          <div className="flex w-full flex-col gap-1 rounded-12 p-1">
            <Link
              href="/"
              className={menuRowClass}
              onClick={onClose}
            >
              <span className={iconWrapDefault}>
                <ArrowRightIcon size={16} />
              </span>
              Go back to dashboard
            </Link>
            <button
              type="button"
              className={menuRowClass}
              onClick={() => {
                const name = typeof window !== "undefined" ? window.prompt("Rename file", "My file") : null;
                if (name != null && name.trim()) onClose();
              }}
            >
              <span className={iconWrapDefault}>
                <EditIcon size={16} />
              </span>
              Rename file
            </button>
          </div>
        </div>

        <div className="h-px w-full shrink-0 bg-border-primary" />

        {/* Brian: user name + email — px 4, list item p 8 rounded 8 inline-flex items-center gap 12 */}
        <div className="flex w-full flex-col items-start justify-start gap-2 px-1">
          <div className="inline-flex w-full items-center justify-start gap-3 overflow-hidden rounded-8 p-2">
            <div className="inline-flex min-w-0 flex-1 flex-col items-start justify-center gap-0.5">
              <span className="text-14 font-semibold leading-5 text-text-heading-primary">
                {name || "User"}
              </span>
              {email ? (
                <span className="w-full text-12 font-normal leading-[18px] text-text-placeholder">
                  {email}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Credits block — padding 10 L/R, card bg-tertiary p 8 rounded 8, progress bar, stats */}
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <div className="flex w-full flex-col gap-2 bg-white px-2.5 py-0">
            <div className="flex w-full flex-col gap-2 rounded-8 bg-bg-tertiary p-2">
              <div className="inline-flex w-full items-start justify-start gap-2">
                <div className="inline-flex min-w-0 flex-1 flex-col items-start justify-center gap-0.5">
                  <span className="text-12 font-normal leading-[18px] text-text-placeholder">
                    Credits
                  </span>
                  <span className="text-14 font-medium leading-5 text-[#09090B]">
                    20 left
                  </span>
                </div>
                <div className="inline-flex min-w-0 flex-1 flex-col items-end justify-center gap-0.5">
                  <span className="text-right text-12 font-normal leading-[18px] text-text-placeholder">
                    Renews in
                  </span>
                  <span className="text-right text-14 font-medium leading-5 text-[#09090B]">
                    6h 24m
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col items-start justify-start gap-2">
                <div className="relative h-2 w-full overflow-hidden rounded-[4px] bg-senary">
                  <div
                    className="absolute left-0 top-0 h-2 rounded-[4px] bg-brand"
                    style={{ width: 169 }}
                  />
                </div>
                <div className="inline-flex w-full items-center justify-between">
                  <span className="text-12 font-normal leading-5 text-[#5F5F5D]">
                    5 of 25 used today
                  </span>
                  <span className="text-12 font-normal leading-[18px] text-brand">
                    +25 tomorrow
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px w-full shrink-0 bg-border-primary" />

        {/* James: Win free credits, Theme Style */}
        <div className="flex w-full flex-col items-start justify-start gap-2 px-1">
          <div className="flex w-full flex-col gap-1 rounded-12 p-1">
            <button
              type="button"
              className={menuRowClass}
              onClick={onClose}
            >
              <span className={iconWrapDefault}>
                <GiftIcon size={16} />
              </span>
              Win free credits
            </button>
            <button
              type="button"
              className={menuRowClass}
              onClick={() => {
                onClose();
                document.documentElement.classList.toggle("dark");
              }}
            >
              <span className={iconWrapDefault}>
                <SunIcon size={16} />
              </span>
              Theme Style
            </button>
          </div>
        </div>

        <div className="h-px w-full shrink-0 bg-border-primary" />

        <div className="flex w-full flex-col items-start justify-start gap-2 px-1">
          <div className="flex w-full flex-col gap-1 rounded-12 p-1">
            <button
              type="button"
              className={menuRowClass}
              onClick={async () => {
                await fetch("/api/presence", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ online: false }),
                }).catch(() => {});
                signOut();
                onClose();
              }}
            >
              <span className={iconWrapDefault}>
                <LogoutIcon size={16} />
              </span>
              Log out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
