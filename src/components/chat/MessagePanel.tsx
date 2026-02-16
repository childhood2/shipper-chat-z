"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { MessageInput } from "@/components/ui/MessageInput";
import { SearchIcon, PhoneIcon, VideoIcon, DotsIcon } from "@/components/icons";
import { TrashIcon } from "@/components/icons/popups";

export type MessageItem = {
  id: string;
  content: string;
  type?: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
};

type MessagePanelProps = {
  contactName?: string | null;
  avatarUrl?: string | null;
  messages?: MessageItem[];
  loadingMessages?: boolean;
  currentUserId?: string | null;
  chatId?: string | null;
  /** Contact's lastSeenAt (ISO string); used to show Online/Offline. Refreshes when polled. */
  contactLastSeenAt?: string | null;
  /** Fallback when lastSeenAt is null: use last activity in this chat (ISO string) for "last seen" text. */
  contactLastActivityAt?: string | null;
  /** Header search: filter messages in this chat by content (case-insensitive). */
  searchInChatQuery?: string;
  onSendMessage?: (content: string) => void;
  onSendFile?: (url: string, fileName: string) => void;
  onSendAudio?: (url: string) => void;
  onOpenContactInfo?: () => void;
  /** Focus the header search input (e.g. for Win+K or clicking Search icon). */
  onFocusHeaderSearch?: () => void;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
  /** Delete a single message (e.g. from right-click context menu). */
  onDeleteMessage?: (messageId: string) => void;
};

/** Messages from the same sender within this window (ms) are grouped; one timestamp under the last. */
const MESSAGE_GROUP_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
/** Consider contact "online" if lastSeenAt is within this many ms. */
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

function formatLastSeenAgo(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "last seen just now";
  if (diffMins < 60) return `last seen ${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `last seen ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "last seen yesterday";
  if (diffDays < 7) return `last seen ${diffDays} days ago`;
  return `last seen on ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined })}`;
}

/** Today: time only (e.g. "12:25 AM"); other days: date + time */
function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

/** Call log message content: type, direction, status, optional duration. */
export type CallLogContent = {
  type: "audio" | "video";
  direction: "incoming" | "outgoing";
  status: "accepted" | "declined" | "missed";
  durationSeconds?: number;
};

function parseCallContent(content: string): CallLogContent | null {
  try {
    const o = JSON.parse(content) as CallLogContent;
    if (o && ["audio", "video"].includes(o.type) && ["incoming", "outgoing"].includes(o.direction) && ["accepted", "declined", "missed"].includes(o.status)) {
      return o;
    }
  } catch {
    // ignore
  }
  return null;
}

function formatCallDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${m}:00`;
}

/** Group consecutive messages from the same sender sent within MESSAGE_GROUP_WINDOW_MS. Call messages are never grouped. */
function groupMessages(messages: MessageItem[]): MessageItem[][] {
  if (messages.length === 0) return [];
  const groups: MessageItem[][] = [];
  let current: MessageItem[] = [messages[0]];
  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const m = messages[i];
    const isCall = (msg: MessageItem) => (msg.type || "text") === "call";
    const sameSender = prev.senderId === m.senderId;
    const prevTime = new Date(prev.createdAt).getTime();
    const currTime = new Date(m.createdAt).getTime();
    const withinWindow = currTime - prevTime <= MESSAGE_GROUP_WINDOW_MS;
    const noCallGrouping = !isCall(prev) && !isCall(m);
    if (sameSender && withinWindow && noCallGrouping) {
      current.push(m);
    } else {
      groups.push(current);
      current = [m];
    }
  }
  groups.push(current);
  return groups;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif)(\?.*)?$/i;

function parseAttachment(content: string): { url: string; fileName?: string } | null {
  try {
    const parsed = JSON.parse(content) as { url?: string; fileName?: string };
    if (parsed?.url) return { url: parsed.url, fileName: parsed.fileName };
  } catch {
    if (content.startsWith("/")) return { url: content };
  }
  return null;
}

function isImageFile(url: string, fileName?: string): boolean {
  const check = (fileName ?? url).toLowerCase();
  return IMAGE_EXT.test(check);
}

// Match URLs for linkification
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

function renderTextWithLinks(text: string, textClass: string): React.ReactNode {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (/^https?:\/\//i.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`${textClass} underline`}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function messageContentSearchable(content: string, type?: string): string {
  if (type === "file" || type === "audio") {
    try {
      const parsed = JSON.parse(content) as { fileName?: string; url?: string };
      return [parsed.fileName, parsed.url].filter(Boolean).join(" ") || content;
    } catch {
      return content;
    }
  }
  return content;
}

export function MessagePanel({
  contactName,
  avatarUrl,
  messages = [],
  loadingMessages = false,
  currentUserId,
  chatId,
  contactLastSeenAt,
  contactLastActivityAt,
  searchInChatQuery,
  onSendMessage,
  onSendFile,
  onSendAudio,
  onOpenContactInfo,
  onFocusHeaderSearch,
  onAudioCall,
  onVideoCall,
  onDeleteMessage,
}: MessagePanelProps) {
  const [messageDraft, setMessageDraft] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [messageMenu, setMessageMenu] = useState<{ messageId: string; x: number; y: number } | null>(null);
  const messageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!messageMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (messageMenuRef.current && !messageMenuRef.current.contains(e.target as Node)) {
        setMessageMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [messageMenu]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  const isOnline =
    !!contactLastSeenAt &&
    now - new Date(contactLastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
  const lastSeenIso = contactLastSeenAt ?? contactLastActivityAt ?? null;

  const query = searchInChatQuery?.trim().toLowerCase() ?? "";
  const displayMessages =
    query.length > 0
      ? messages.filter((m) => {
          if ((m.type || "text") === "call") return true;
          return messageContentSearchable(m.content, m.type).toLowerCase().includes(query);
        })
      : messages;

  if (!contactName) {
    return (
      <div className="flex-1 min-w-0 bg-surface-default rounded-24 overflow-hidden flex items-center justify-center">
        <span className="text-text-soft text-14 font-normal">Select a conversation</span>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 p-3 bg-surface-default overflow-hidden rounded-24 flex flex-col items-stretch">
      <div className="self-stretch pt-1 pb-4 px-3 flex items-center gap-3">
        <Avatar name={contactName} src={avatarUrl} size={40} />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="text-text-main text-14 font-medium">{contactName}</span>
          {isOnline ? (
            <span className="text-[var(--text-state-success,#38C793)] text-12 font-medium">Online</span>
          ) : lastSeenIso ? (
            <span className="text-text-soft text-12 font-normal">
              {formatLastSeenAgo(lastSeenIso)}
            </span>
          ) : (
            <span className="text-text-soft text-12 font-normal">last seen long ago</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-icon-sub">
          <IconButton aria-label="Search" onClick={() => onFocusHeaderSearch?.()}>
            <SearchIcon size={16} />
          </IconButton>
          <IconButton aria-label="Audio call" onClick={() => onAudioCall?.()}>
            <PhoneIcon size={16} />
          </IconButton>
          <IconButton aria-label="Video call" onClick={() => onVideoCall?.()}>
            <VideoIcon size={16} />
          </IconButton>
          <IconButton
            aria-label="Contact info"
            onClick={() => onOpenContactInfo?.()}
          >
            <DotsIcon size={16} />
          </IconButton>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3 bg-bg-cards overflow-hidden rounded-16 flex flex-col items-stretch gap-3">
        {loadingMessages ? (
          <div className="flex-1 flex items-center justify-center min-h-0">
            <span className="text-text-placeholder text-14">Loading messages…</span>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-0">
            <span className="text-text-placeholder text-14">
              {query ? "No messages match your search." : "No messages yet. Say hi!"}
            </span>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col justify-end overflow-hidden">
            {query && (
              <div className="py-1 px-3 shrink-0 self-center">
                <span className="text-text-sub text-12 font-normal">
                  {displayMessages.length} message{displayMessages.length !== 1 ? "s" : ""} found
                </span>
              </div>
            )}
            <div className="py-1 px-3 bg-surface-default rounded-[60px] self-center shrink-0">
              <span className="text-text-sub text-14 font-medium">Today</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-2">
              {groupMessages(displayMessages).map((group) => {
                const first = group[0];
                const isCall = (first.type || "text") === "call";
                const callData = isCall ? parseCallContent(first.content) : null;

                if (isCall && callData) {
                  const label =
                    callData.status === "missed"
                      ? `Missed ${callData.type === "video" ? "video" : "voice"} call`
                      : callData.status === "declined"
                        ? `Declined ${callData.type === "video" ? "video" : "voice"} call`
                        : callData.durationSeconds != null
                          ? `${callData.type === "video" ? "Video" : "Voice"} call · ${formatCallDuration(callData.durationSeconds)}`
                          : `${callData.type === "video" ? "Video" : "Voice"} call`;
                  const Icon = callData.type === "video" ? VideoIcon : PhoneIcon;
                  return (
                    <div
                      key={first.id}
                      className="flex flex-col items-center gap-0.5 py-1"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (onDeleteMessage) setMessageMenu({ messageId: first.id, x: e.clientX, y: e.clientY });
                      }}
                    >
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-12 bg-bg-tertiary text-text-sub text-12">
                        <Icon size={14} className="shrink-0 text-icon-sub" />
                        <span>{label}</span>
                      </div>
                      <span className="text-text-placeholder text-11">
                        {formatTime(first.createdAt)}
                      </span>
                    </div>
                  );
                }

                const isMe = currentUserId && first.senderId === currentUserId;
                const bubbleClass = `p-3 rounded-12 max-w-[80%] ${
                  isMe
                    ? "bg-bg-brand rounded-tl-12 rounded-tr-12 rounded-br-[4px] rounded-bl-12"
                    : "bg-surface-default rounded-t-12 rounded-tr-12 rounded-br-12 rounded-bl-[4px]"
                }`;
                const textClass = isMe
                  ? "text-text-main text-12 font-normal"
                  : "text-text-heading-primary text-12 font-normal";
                return (
                  <div
                    key={first.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} gap-0.5`}
                  >
                    {group.map((m) => {
                      const type = m.type || "text";
                      let body: React.ReactNode =
                        type === "text" || type === "emoji"
                          ? renderTextWithLinks(m.content, textClass)
                          : m.content;
                      if (type === "audio") {
                        const att = parseAttachment(m.content) || { url: m.content };
                        body = (
                          <audio
                            controls
                            className="max-w-full min-w-[180px] h-8"
                            src={att.url}
                            preload="metadata"
                          />
                        );
                      } else if (type === "file") {
                        const att = parseAttachment(m.content) || { url: m.content };
                        if (isImageFile(att.url, att.fileName)) {
                          body = (
                            <div className="flex flex-col gap-1">
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-8 overflow-hidden max-w-[240px] max-h-[200px] focus:outline-none focus:ring-2 focus:ring-brand"
                              >
                                <img
                                  src={att.url}
                                  alt={att.fileName || "Image"}
                                  className="w-full h-full object-contain max-w-[240px] max-h-[180px]"
                                />
                              </a>
                              {att.fileName && (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`${textClass} underline text-11 break-all`}
                                >
                                  {att.fileName}
                                </a>
                              )}
                            </div>
                          );
                        } else {
                          body = (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${textClass} underline break-all`}
                            >
                              {att.fileName || "File"}
                            </a>
                          );
                        }
                      }
                      return (
                        <div
                          key={m.id}
                          className={bubbleClass}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (onDeleteMessage) setMessageMenu({ messageId: m.id, x: e.clientX, y: e.clientY });
                          }}
                        >
                          {type === "text" || type === "emoji" ? (
                            <span className={textClass}>{body}</span>
                          ) : (
                            body
                          )}
                        </div>
                      );
                    })}
                    <div className="pt-1">
                      <span className="text-text-placeholder text-12 font-normal">
                        {formatTime(group[group.length - 1].createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {messageMenu && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setMessageMenu(null)} />
          <div
            ref={messageMenuRef}
            className="fixed z-50 w-[160px] p-1.5 bg-white rounded-12 shadow-lg border border-border-primary flex flex-col gap-0.5"
            style={{ left: messageMenu.x, top: messageMenu.y }}
          >
            <button
              type="button"
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-8 text-14 font-medium text-text-state-error hover:bg-surface-hover text-left"
              onClick={() => {
                onDeleteMessage?.(messageMenu.messageId);
                setMessageMenu(null);
              }}
            >
              <TrashIcon size={16} className="shrink-0" />
              Delete
            </button>
          </div>
        </>
      )}

      <div className="self-stretch pt-2">
        <MessageInput
          placeholder="Type any message..."
          value={messageDraft}
          onChange={setMessageDraft}
          chatId={chatId}
          disabled={!chatId}
          onSend={() => {
            if (messageDraft.trim() && onSendMessage) {
              onSendMessage(messageDraft.trim());
              setMessageDraft("");
            }
          }}
          onSendFile={onSendFile}
          onSendAudio={onSendAudio}
        />
      </div>
    </div>
  );
}
