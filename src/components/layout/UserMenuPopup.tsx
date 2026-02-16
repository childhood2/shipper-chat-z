"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogoutIcon, UploadIcon } from "@/components/icons";
import type { User } from "next-auth";

type UserMenuPopupProps = {
  user?: User | null;
  onClose: () => void;
  /** When set, position popup above this element (e.g. sidebar avatar button). */
  anchorRef?: React.RefObject<HTMLElement | null>;
};

/* Match menu.coffee: root Menu = width 307, py 4, white, shadow, rounded 16, gap 4. */
const menuItemClass =
  "inline-flex w-full items-center gap-2 rounded-8 px-1.5 py-1.5 text-14 font-medium leading-5 text-text-heading-primary";
const iconWrapClass = "flex shrink-0 items-center justify-center rounded-6 bg-bg-cards p-1.5";

export function UserMenuPopup({ user, onClose, anchorRef }: UserMenuPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { update: updateSession } = useSession();
  const [position, setPosition] = useState<{ top?: number; bottom?: number; left: number }>({
    top: 76,
    left: 16,
  });

  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        bottom: window.innerHeight - rect.top + 8,
        left: 16,
      });
    }
  }, [anchorRef]);

  const handleUploadAvatar = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;
      try {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("type", "avatar");
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.error || "Upload failed");
        }
        const { url } = await uploadRes.json();
        const patchRes = await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: url }),
        });
        if (!patchRes.ok) throw new Error("Update failed");
        await updateSession();
        onClose();
      } catch (err) {
        if (typeof window !== "undefined") {
          window.alert(err instanceof Error ? err.message : "Failed to upload avatar");
        }
      }
    },
    [updateSession, onClose]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const name = user?.name ?? user?.email ?? "User";
  const email = user?.email ?? "";

  const style: React.CSSProperties = {
    position: "fixed",
    left: position.left,
    zIndex: 50,
    ...(position.bottom != null ? { bottom: position.bottom } : { top: position.top ?? 76 }),
  };

  return (
    <>
      <div className="fixed inset-0 z-40" aria-hidden onClick={onClose} />
      <div
        ref={popupRef}
        className="z-50 inline-flex w-[307px] flex-col items-start justify-start gap-1 overflow-hidden rounded-16 bg-white py-1 shadow-[0px_1px_13.8px_1px_rgba(18,18,18,0.1)]"
        style={style}
      >
        <div className="flex w-full flex-col items-start justify-start gap-2 px-1">
          <div className="inline-flex w-full items-center justify-start gap-3 overflow-hidden rounded-8 p-2">
            <div className="inline-flex min-w-0 flex-1 flex-col items-start justify-center gap-0.5">
              <span className="text-14 font-semibold leading-5 text-text-heading-primary">
                {name}
              </span>
              {email ? (
                <span className="w-full text-12 font-normal leading-[18px] text-text-placeholder">
                  {email}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="h-px w-full shrink-0 bg-border-primary" />
        <div className="flex w-full flex-col items-start justify-start gap-2 px-1">
          <div className="flex w-full flex-col gap-1 rounded-12 p-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-hidden
              onChange={handleUploadAvatar}
            />
            <button
              type="button"
              className={menuItemClass}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className={iconWrapClass}>
                <UploadIcon size={16} />
              </span>
              Upload avatar
            </button>
            <button
              type="button"
              className={menuItemClass}
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
              <span className={iconWrapClass}>
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
