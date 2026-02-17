"use client";

import { Avatar } from "@/components/ui/Avatar";
import { SlideActionButton } from "@/components/ui/SlideActionButton";
import { ArchiveIconSvg, CheckIcon, ChecksIcon } from "@/components/icons";

export type ChatListItemProps = {
  id: string;
  name: string;
  otherUserId?: string | null;
  avatarUrl?: string | null;
  preview?: string | null;
  lastActivityAt?: string | Date | null;
  lastSeenAt?: string | null;
  isUnread?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onArchive?: () => void;
  onMarkUnread?: () => void;
};

/** Last chat time: today → "11:20 PM"; this week → "Fri"; older → "2/3/2026" */
function formatLastChatTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  }
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.floor((startOfToday - startOfD) / 86400000);
  if (daysAgo >= 1 && daysAgo < 7) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  return d.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit", year: "numeric" });
}

const itemBlock =
  "flex-1 min-w-0 flex items-center gap-3 p-3 rounded-12 bg-[#F3F3EE]";
const actionClass =
  "w-16 min-w-16 self-stretch p-3 rounded-12 bg-[#1E9A80] text-white shrink-0";

export function ChatListItem({
  id,
  name,
  avatarUrl,
  preview,
  lastActivityAt,
  isUnread,
  onClick,
  onContextMenu,
  onArchive,
  onMarkUnread,
  isArchived,
  isMuted,
}: ChatListItemProps) {
  const itemContent = (
    <>
      <Avatar name={name} src={avatarUrl} size={40} />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-14 font-medium text-text-main truncate">
            {name}
          </span>
          <span className="text-12 text-text-sub shrink-0">
            {formatLastChatTime(lastActivityAt)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {preview && (
            <span className="text-12 text-text-placeholder truncate flex-1 min-w-0">
              {preview}
            </span>
          )}
          {isUnread ? (
            <CheckIcon className="shrink-0 text-icon-soft" size={16} />
          ) : (
            <ChecksIcon className="shrink-0 text-icon-soft" size={16} />
          )}
        </div>
      </div>
    </>
  );

  return (
    <div
      className="w-full flex items-stretch gap-2 pl-3"
      data-chat-id={id}
    >
      <button
        type="button"
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={`${itemBlock} text-left hover:opacity-95 transition-opacity cursor-pointer border-0`}
      >
        {itemContent}
      </button>
      {!isUnread && isArchived && onArchive && (
        <SlideActionButton
          label="Archive"
          icon={<ArchiveIconSvg size={18} className="text-white" />}
          onClick={(e) => { e.stopPropagation(); onArchive(); }}
          className={actionClass}
        />
      )}
    </div>
  );
}
