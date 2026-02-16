"use client";

import { forwardRef, useState, useEffect } from "react";
import { SearchIcon } from "@/components/icons";

type SearchInputProps = {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** Shortcut label (e.g. "Win+K") for accessibility; shown as text if shortcutBadgeImage is not set. */
  shortcutBadge?: string;
  /** Image path for the shortcut badge (e.g. /shortcut-win-k.png). When set, this image is shown instead of shortcutBadge text. */
  shortcutBadgeImage?: string;
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
      shortcutBadgeImage,
      className = "",
      inputClassName = "",
      "aria-label": ariaLabel = "Search",
    },
    ref
  ) {
    const isControlled = value !== undefined && onChange !== undefined;
    const [imageError, setImageError] = useState(false);
    // Reset error when image URL changes (e.g. switch platform or retry)
    useEffect(() => {
      setImageError(false);
    }, [shortcutBadgeImage]);
    const isDataUrl = shortcutBadgeImage?.startsWith("data:");
    const showImage = shortcutBadgeImage && (isDataUrl || !imageError);
    // Use absolute URL for path-based images; data URLs are used as-is
    const imageSrc =
      typeof window !== "undefined" && shortcutBadgeImage?.startsWith("/")
        ? window.location.origin + shortcutBadgeImage
        : shortcutBadgeImage;
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
        {(shortcutBadge || shortcutBadgeImage) && (
          showImage ? (
            <img
              key={shortcutBadgeImage}
              src={imageSrc}
              alt={shortcutBadge ?? "Shortcut"}
              className="h-6 shrink-0 object-contain"
              width={56}
              height={24}
              onError={() => {
                if (!shortcutBadgeImage?.startsWith("data:")) setImageError(true);
              }}
            />
          ) : (
            <span className="h-6 px-1.5 bg-bg-cards rounded-6 text-text-heading-secondary text-12 font-normal shrink-0">
              {shortcutBadge}
            </span>
          )
        )}
      </div>
    );
  }
);
