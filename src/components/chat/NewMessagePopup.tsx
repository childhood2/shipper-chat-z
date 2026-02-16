"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { SearchInput } from "@/components/ui/SearchInput";

export type NewMessageMember = { id: string; name: string; avatarUrl?: string | null };

type NewMessagePopupProps = {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  members?: NewMessageMember[];
};

const STUB_MEMBERS: NewMessageMember[] = [
  { id: "u1", name: "Adrian Kurt" },
  { id: "u2", name: "Bianca Lofre" },
  { id: "u3", name: "Diana Sayu" },
  { id: "u4", name: "Palmer Dian" },
  { id: "u5", name: "Sam Kohler" },
  { id: "u6", name: "Yuki Tanaka" },
];

export function NewMessagePopup({
  anchorRef,
  onClose,
  onSelectUser,
  members = STUB_MEMBERS,
}: NewMessagePopupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      )
        onClose();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, anchorRef]);

  const filtered = query.trim()
    ? members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
    : members;

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 w-[273px] p-3 bg-white rounded-16 flex flex-col gap-4 z-[1000] shadow-popup border border-border-primary outline-offset-[-0.5px]"
    >
      <SearchInput
        placeholder="Search name or email"
        value={query}
        onChange={setQuery}
        className="h-8 py-2.5 pl-2.5 pr-1 rounded-10 border border-border-secondary"
        aria-label="Search name or email"
      />
      <div className="max-h-[280px] overflow-auto flex flex-col gap-1">
        {filtered.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              onSelectUser(m.id);
              onClose();
            }}
            className="w-full py-1.5 px-2 rounded-8 border-none bg-transparent flex items-center gap-2.5 cursor-pointer text-left"
          >
            <Avatar name={m.name} src={m.avatarUrl} size={32} />
            <span className="text-text-main text-14 font-medium">{m.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
