"use client";

import { SearchIcon, FilterIcon } from "@/components/icons";

type SearchFilterBarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;
};

/** Design: search-filter bar — search form (flex 1, h 40, py 10 px 10/5, rounded 10, outline) + filter button 40×40. 24px below All message row. */
export function SearchFilterBar({
  searchValue,
  onSearchChange,
  onFilterClick,
}: SearchFilterBarProps) {
  return (
    <div className="inline-flex w-full items-center justify-center gap-4">
      <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-10 py-2.5 pl-2.5 pr-1.5 outline outline-1 outline-border-primary outline-offset-[-1px]">
        <span className="relative flex shrink-0 items-center justify-center text-[var(--icons-icon-secondary,#262626)]">
          <SearchIcon size={16} />
        </span>
        <input
          type="search"
          role="searchbox"
          placeholder="Search in message"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          aria-label="Search in message"
          className="min-w-0 flex-1 border-none bg-transparent text-14 font-normal leading-5 text-text-main placeholder:text-text-heading-secondary outline-none"
        />
      </div>
      <button
        type="button"
        onClick={onFilterClick}
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-10 bg-surface-default outline outline-1 outline-border-primary outline-offset-[-1px]"
        aria-label="Filter"
      >
        <span className="text-[var(--icons-icon-secondary,#262626)]">
          <FilterIcon size={18} />
        </span>
      </button>
    </div>
  );
}
