"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChatListItem, type ChatListItemProps } from "./ChatListItem";
import { NewMessagePopup } from "./NewMessagePopup";
import { SearchFilterBar } from "./SearchFilterBar";
import { Button } from "@/components/ui/Button";
import { PencilPlusIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/Avatar";
import type { NewMessageMember } from "./NewMessagePopup";

export type ChatListEntry = Omit<ChatListItemProps, "onContextMenu" | "onClick">;

export type SearchMessageResult = {
  messageId: string;
  chatId: string;
  content: string;
  createdAt: string;
  contactName: string | null;
  contactImage: string | null;
};

/** Search results: always show only exact time (e.g. "12:25 AM"), no date */
function formatSearchTime(date: string): string {
  const d = new Date(date);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const SNIPPET_MAX = 80;

type ChatListProps = {
  items?: ChatListEntry[];
  loading?: boolean;
  onNewMessage?: () => void;
  onSelectChat?: (id: string) => void;
  onOpenContactInfo?: (id: string, anchor: { x: number; y: number }) => void;
  onOpenMessageSettings?: (id: string, anchor: { x: number; y: number }) => void;
  onArchive?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
  newMessageOpen?: boolean;
  onNewMessageClose?: () => void;
  onNewMessageSelectUser?: (userId: string) => void;
  newMessageMembers?: NewMessageMember[];
};

export function ChatList({
  items = [],
  loading = false,
  onNewMessage,
  onSelectChat,
  onOpenContactInfo,
  onOpenMessageSettings,
  onArchive,
  onMarkUnread,
  newMessageOpen,
  onNewMessageClose,
  onNewMessageSelectUser,
  newMessageMembers = [],
}: ChatListProps) {
  const newMessageButtonRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMessageResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const trimmedQuery = searchQuery.trim();
  const showSearchResults = trimmedQuery.length > 0;

  const runSearch = useCallback(async (q: string) => {
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/chats/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data.results) ? data.results : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (trimmedQuery.length === 0) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    const t = setTimeout(() => runSearch(trimmedQuery), 300);
    return () => clearTimeout(t);
  }, [trimmedQuery, runSearch]);

  const handleSelectSearchResult = useCallback(
    (chatId: string) => {
      onSelectChat?.(chatId);
      setSearchQuery("");
      setSearchResults(null);
    },
    [onSelectChat]
  );

  return (
    <div className="w-[400px] min-w-[400px] h-full min-h-0 flex flex-col overflow-hidden p-6 bg-surface-default rounded-24 gap-6">
      {onNewMessage && (
        <div ref={newMessageButtonRef} className="flex justify-between items-center relative">
          <span className="text-text-main text-14 font-medium">All messages</span>
          <Button variant="primary" onClick={onNewMessage}>
            <PencilPlusIcon />
            New message
          </Button>
          {newMessageOpen && onNewMessageClose && onNewMessageSelectUser && (
            <NewMessagePopup
              anchorRef={newMessageButtonRef}
              onClose={onNewMessageClose}
              onSelectUser={onNewMessageSelectUser}
              members={newMessageMembers}
            />
          )}
        </div>
      )}

      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-2 items-stretch">
        {showSearchResults ? (
          searchLoading ? (
            <span className="text-text-placeholder text-14">Searching…</span>
          ) : searchResults && searchResults.length > 0 ? (
            searchResults.map((r) => {
              const name = r.contactName ?? "Unknown";
              const snippet =
                r.content.length > SNIPPET_MAX
                  ? r.content.slice(0, SNIPPET_MAX).trim() + "…"
                  : r.content;
              return (
                <button
                  key={r.messageId}
                  type="button"
                  onClick={() => handleSelectSearchResult(r.chatId)}
                  className="flex items-center gap-3 p-3 rounded-12 bg-[#F3F3EE] w-full text-left hover:bg-[#e8e8e2] transition-colors"
                >
                  <Avatar name={name} src={r.contactImage} size={40} />
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-14 font-medium text-text-main truncate">{name}</span>
                      <span className="text-12 text-text-sub shrink-0">
                        {formatSearchTime(r.createdAt)}
                      </span>
                    </div>
                    <span className="text-12 text-text-placeholder truncate block">{snippet}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <span className="text-text-placeholder text-14">No messages match your search.</span>
          )
        ) : loading ? (
          <span className="text-text-placeholder text-14">Loading…</span>
        ) : (
          items.map((item) => (
            <ChatListItem
              key={item.id}
              {...item}
              onClick={() => onSelectChat?.(item.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                onOpenMessageSettings?.(item.id, { x: e.clientX, y: e.clientY });
              }}
              onArchive={onArchive ? () => onArchive(item.id) : undefined}
              onMarkUnread={onMarkUnread ? () => onMarkUnread(item.id) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
