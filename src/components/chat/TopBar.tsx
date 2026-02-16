"use client";

import { SearchInput } from "@/components/ui/SearchInput";
import { IconButton } from "@/components/ui/IconButton";
import { MessageBubbleIcon, BellIcon, SettingsIcon } from "@/components/icons";

type TopBarProps = {
  /** Controlled value for header search (search in selected chat). */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Ref to focus the search input (e.g. for Win+K / ⌘+K hotkey). */
  searchInputRef?: React.RefObject<HTMLInputElement>;
};

export function TopBar({
  searchValue,
  onSearchChange,
  searchInputRef,
}: TopBarProps) {
  const isWin = typeof navigator !== "undefined" && /Win/i.test(navigator.platform);
  const shortcutBadge = isWin ? "Win+K" : "⌘+K";
  const shortcutBadgeImage = isWin ? "/shortcut-win-k.png" : undefined;
  return (
    <header className="self-stretch bg-surface-default rounded-16 flex items-center justify-between w-full shrink-0 px-6 py-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-5 h-5 shrink-0 text-icon-sub">
          <MessageBubbleIcon size={20} />
        </div>
        <span className="text-14 font-medium text-text-main leading-5">
          Message
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-[300px] h-8 rounded-10 border border-border-primary flex items-center pl-2.5 pr-1 py-2 gap-2 bg-surface-default">
          <SearchInput
            ref={searchInputRef}
            placeholder="Search"
            value={searchValue}
            onChange={onSearchChange}
            shortcutBadge={shortcutBadge}
            shortcutBadgeImage={shortcutBadgeImage}
            className="flex-1 min-w-0 h-full gap-2"
            inputClassName="text-12 placeholder:text-text-soft"
            aria-label="Search in chat"
          />
        </div>
        <div className="flex items-center gap-3">
          <IconButton
            aria-label="Notifications"
            className="!w-8 !h-8 rounded-8 border border-border-primary outline-offset-[-1px]"
          >
            <BellIcon size={16} />
          </IconButton>
          <IconButton
            aria-label="Settings"
            className="!w-8 !h-8 rounded-8 border border-border-primary outline-offset-[-1px]"
          >
            <SettingsIcon size={16} />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
