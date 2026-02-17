"use client";

import { forwardRef } from "react";
import { SearchIcon } from "@/components/icons";

function WinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M0 0h7v7H0V0zm8 0h8v7H8V0zM0 8h7v8H0V8zm8 0h8v8H8V8z" />
    </svg>
  );
}

function ShortcutBadge({
  isWin,
  keyLabel = "K",
  className = "",
}: {
  isWin: boolean;
  keyLabel?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 px-2 rounded-md bg-[#E8E5DF] text-[#404040] text-12 font-semibold shrink-0 ${className}`}
      title={isWin ? `Win+${keyLabel}` : `⌘+${keyLabel}`}
    >
      {isWin ? (
        <WinIcon className="w-3.5 h-3.5" />
      ) : (
        <span className="text-[0.7rem] leading-none">⌘</span>
      )}
      <span className="text-[0.65rem] font-bold opacity-80">+</span>
      <span>{keyLabel}</span>
    </span>
  );
}

type SearchInputProps = {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** Shortcut label (e.g. "Win+K") for accessibility. */
  shortcutBadge?: string;
  /** Show shortcut badge (icon + K) with rounded rectangle. Uses platform: Win on Windows, ⌘ on Mac. */
  shortcutKey?: string;
  /** Platform: true = Windows, false = Mac. Default from navigator.platform. */
  isWin?: boolean;
  className?: string;
  inputClassName?: string;
  "aria-label"?: string;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      placeholder = "Search",
      value,
      onChange,
      shortcutBadge,
      shortcutKey,
      isWin = typeof navigator !== "undefined" && /Win/i.test(navigator.platform),
      className = "",
      inputClassName = "",
      "aria-label": ariaLabel = "Search",
    },
    ref
  ) {
    const isControlled = value !== undefined && onChange !== undefined;
    const showShortcut = shortcutBadge != null || shortcutKey != null;
    const keyLabel = shortcutKey ?? (shortcutBadge?.split("+").pop() ?? "K");

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <SearchIcon size={14} className="shrink-0 text-icon-soft" />
        <input
          ref={ref}
          type="search"
          role="searchbox"
          placeholder={placeholder}
          value={isControlled ? value : undefined}
          defaultValue={isControlled ? undefined : ""}
          onChange={(e) => onChange?.(e.target.value)}
          aria-label={ariaLabel}
          className={`flex-1 min-w-0 border-none bg-transparent text-12 font-normal text-text-main placeholder:text-text-soft outline-none ${inputClassName}`}
        />
        {showShortcut && (
          <ShortcutBadge isWin={isWin} keyLabel={keyLabel} />
        )}
      </div>
    );
  }
);
