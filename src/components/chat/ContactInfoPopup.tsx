"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { CloseIcon, PhoneIconLarge, VideoIconLarge } from "@/components/icons/popups";

export type SharedLink = {
  url: string;
  title?: string;
  createdAt?: string;
};

type MessageForShared = {
  id: string;
  content: string;
  type?: string;
  createdAt: string;
};

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif)(\?.*)?$/i;
const URL_REGEX = /https?:\/\/[^\s]+/gi;

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

function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX) || [];
  return Array.from(new Set(matches));
}

function getMonthKey(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "long" });
}

function getDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFileExt(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i >= 0 ? fileName.slice(i + 1).toLowerCase() : "";
}

function groupByMonth<T extends { createdAt: string }>(
  items: T[]
): { month: string; items: T[] }[] {
  const byMonth = new Map<string, T[]>();
  for (const item of items) {
    const key = getMonthKey(item.createdAt);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(item);
  }
  const order = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return Array.from(byMonth.entries())
    .sort((a, b) => order.indexOf(b[0]) - order.indexOf(a[0]))
    .map(([month, items]) => ({ month, items }));
}

type ContactInfoPopupProps = {
  contactId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  anchor: { x: number; y: number };
  anchorPlacement?: "left" | "right";
  position?: { top: number; right: number; bottom?: number };
  /** Messages in this chat; used to derive shared Media, Links, Docs */
  messages?: MessageForShared[];
  sharedLinks?: SharedLink[];
  onClose: () => void;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
  /** Simulate an incoming call from this contact (for testing the incoming-call modal). */
  onSimulateIncomingCall?: (type: "audio" | "video") => void;
};

type TabId = "media" | "link" | "docs";

const tabStyles = {
  base: "flex-1 py-2 text-center text-14 font-medium rounded-8 text-text-main",
  active: "bg-white border border-border-primary",
  inactive: "bg-bg-tertiary border border-transparent",
};

export function ContactInfoPopup({
  name,
  email,
  avatarUrl,
  anchor,
  position,
  messages = [],
  sharedLinks = [],
  onClose,
  onAudioCall,
  onVideoCall,
  onSimulateIncomingCall,
}: ContactInfoPopupProps) {
  const [activeTab, setActiveTab] = useState<TabId>("media");
  const style = position
    ? {
        top: position.top,
        right: position.right,
        ...(position.bottom != null && position.bottom > position.top
          ? { height: position.bottom - position.top }
          : {}),
      }
    : { left: anchor.x, top: anchor.y };

  const { sharedMedia, sharedLinksDerived, sharedDocs } = useMemo(() => {
    const media: { url: string; fileName?: string; createdAt: string }[] = [];
    const links: { url: string; title?: string; createdAt: string }[] = [];
    const docs: { url: string; fileName: string; createdAt: string; ext: string }[] = [];

    for (const m of messages) {
      const type = m.type || "text";
      if (type === "file") {
        const att = parseAttachment(m.content) || { url: m.content };
        if (isImageFile(att.url, att.fileName)) {
          media.push({ url: att.url, fileName: att.fileName, createdAt: m.createdAt });
        } else {
          const fileName = att.fileName || "file";
          docs.push({
            url: att.url,
            fileName,
            createdAt: m.createdAt,
            ext: getFileExt(fileName),
          });
        }
      } else if (type === "text" || type === "emoji") {
        const urls = extractUrls(m.content);
        for (const url of urls) {
          links.push({
            url,
            title: getDomain(url),
            createdAt: m.createdAt,
          });
        }
      }
    }

    // Legacy: merge in sharedLinks if provided (no createdAt -> use "now" for grouping)
    for (const link of sharedLinks) {
      if ("createdAt" in link && link.createdAt) {
        links.push({ url: link.url, title: link.title, createdAt: link.createdAt });
      } else {
        links.push({ url: link.url, title: link.title, createdAt: new Date().toISOString() });
      }
    }

    const mediaByMonth = groupByMonth(media);
    const linksByMonth = groupByMonth(links);
    const docsByMonth = groupByMonth(docs);

    return {
      sharedMedia: mediaByMonth,
      sharedLinksDerived: linksByMonth,
      sharedDocs: docsByMonth,
    };
  }, [messages, sharedLinks]);

  return (
    <div
      className="fixed z-50 w-[450px] max-h-[calc(100vh-24px)] flex flex-col bg-surface-default border border-border-primary rounded-24 shadow-popup overflow-hidden"
      style={style}
    >
      <div className="flex items-center justify-between shrink-0 p-6 pb-4">
        <h2 className="text-14 font-semibold text-text-main">Contact Info</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-8 text-icon-main hover:bg-surface-hover"
          aria-label="Close"
        >
          <CloseIcon size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-6 pb-6 overflow-auto min-h-0">
        <div className="flex flex-col items-center gap-3">
          <Avatar name={name} src={avatarUrl} size={44} />
          <div className="text-center">
            <p className="text-14 font-semibold text-text-main">{name}</p>
            <p className="text-12 text-text-soft">{email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              onAudioCall?.();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-8 border border-border-primary bg-white text-text-main text-14 font-medium hover:bg-surface-hover"
          >
            <PhoneIconLarge size={18} />
            Audio
          </button>
          <button
            type="button"
            onClick={() => {
              onVideoCall?.();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-8 border border-border-primary bg-white text-text-main text-14 font-medium hover:bg-surface-hover"
          >
            <VideoIconLarge size={18} />
            Video
          </button>
        </div>
        {onSimulateIncomingCall && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSimulateIncomingCall("audio")}
              className="flex-1 py-2 rounded-8 border border-dashed border-border-primary text-text-soft text-12 hover:bg-surface-hover"
            >
              Test incoming voice call
            </button>
            <button
              type="button"
              onClick={() => onSimulateIncomingCall("video")}
              className="flex-1 py-2 rounded-8 border border-dashed border-border-primary text-text-soft text-12 hover:bg-surface-hover"
            >
              Test incoming video call
            </button>
          </div>
        )}

        <div className="flex gap-1 p-1 rounded-12 bg-bg-tertiary">
          <button
            type="button"
            className={`${tabStyles.base} ${activeTab === "media" ? tabStyles.active : tabStyles.inactive}`}
            onClick={() => setActiveTab("media")}
          >
            Media
          </button>
          <button
            type="button"
            className={`${tabStyles.base} ${activeTab === "link" ? tabStyles.active : tabStyles.inactive}`}
            onClick={() => setActiveTab("link")}
          >
            Link
          </button>
          <button
            type="button"
            className={`${tabStyles.base} ${activeTab === "docs" ? tabStyles.active : tabStyles.inactive}`}
            onClick={() => setActiveTab("docs")}
          >
            Docs
          </button>
        </div>

        {activeTab === "media" && (
          <div className="flex flex-col gap-4">
            {sharedMedia.length === 0 ? (
              <p className="text-12 text-text-soft py-2">No media shared yet.</p>
            ) : (
              sharedMedia.map(({ month, items }) => (
                <div key={month} className="flex flex-col gap-2">
                  <span className="text-12 text-text-soft font-medium">{month}</span>
                  <div className="grid grid-cols-3 gap-2">
                    {items.map((item, i) => (
                      <a
                        key={`${item.url}-${i}`}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-8 overflow-hidden bg-bg-tertiary border border-border-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand"
                      >
                        <img
                          src={item.url}
                          alt={item.fileName || "Media"}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "link" && (
          <div className="flex flex-col gap-4">
            {sharedLinksDerived.length === 0 ? (
              <p className="text-12 text-text-soft py-2">No links shared yet.</p>
            ) : (
              sharedLinksDerived.map(({ month, items }) => (
                <div key={month} className="flex flex-col gap-2">
                  <span className="text-12 text-text-soft font-medium">{month}</span>
                  <div className="flex flex-col gap-1">
                    {items.map((item, i) => (
                      <a
                        key={`${item.url}-${i}`}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-3 p-2 rounded-8 border border-border-primary hover:bg-surface-hover"
                      >
                        <div className="w-10 h-10 shrink-0 rounded-6 bg-bg-tertiary flex items-center justify-center text-12 text-text-soft">
                          🔗
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                          <span className="text-12 text-text-main font-medium truncate">
                            {item.url}
                          </span>
                          {item.title && (
                            <span className="text-12 text-text-soft truncate">
                              {item.title}
                            </span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "docs" && (
          <div className="flex flex-col gap-4">
            {sharedDocs.length === 0 ? (
              <p className="text-12 text-text-soft py-2">No docs shared yet.</p>
            ) : (
              sharedDocs.map(({ month, items }) => (
                <div key={month} className="flex flex-col gap-2">
                  <span className="text-12 text-text-soft font-medium">{month}</span>
                  <div className="flex flex-col gap-1">
                    {items.map((item, i) => (
                      <a
                        key={`${item.url}-${i}`}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-3 p-2 rounded-8 border border-border-primary hover:bg-surface-hover"
                      >
                        <div className="w-10 h-10 shrink-0 rounded-6 bg-bg-tertiary flex items-center justify-center text-10 font-semibold text-text-soft uppercase">
                          {item.ext || "file"}
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                          <span className="text-12 text-text-main font-medium truncate">
                            {item.fileName}
                          </span>
                          <span className="text-11 text-text-soft">
                            — · {item.ext}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
