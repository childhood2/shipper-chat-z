"use client";

import { MessageCircleIcon, ArchiveIconSvg } from "@/components/icons/chat";
import { MuteIcon, ChevronRightIcon, UserCircleIcon, UploadIcon, XIcon } from "@/components/icons/popups";

export type MessageSettingsAction =
  | "mark-unread"
  | "archive"
  | "mute"
  | "contact-info"
  | "export-chat"
  | "clear-chat";

type MessageSettingsPopupProps = {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: MessageSettingsAction) => void;
};

const rowBase =
  "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-8 text-14 font-medium text-text-main hover:bg-surface-hover";

export function MessageSettingsPopup({
  x,
  y,
  onClose,
  onAction,
}: MessageSettingsPopupProps) {
  return (
    <div
      className="fixed z-50 w-[200px] p-2 bg-white rounded-16 shadow-[0px_0px_24px_rgba(0,0,0,0.06)] outline outline-1 outline-border-primary outline-offset-[-0.5px] flex flex-col gap-1"
      style={{ left: x, top: y }}
    >
      <button
        type="button"
        className={rowBase}
        onClick={() => { onAction("mark-unread"); onClose(); }}
      >
        <MessageCircleIcon className="shrink-0 text-icon-main" size={16} />
        <span>Mark as unread</span>
      </button>
      <button
        type="button"
        className={rowBase}
        onClick={() => { onAction("archive"); onClose(); }}
      >
        <ArchiveIconSvg className="shrink-0 text-icon-main" size={16} />
        <span>Archive</span>
      </button>
      <button
        type="button"
        className={rowBase}
        onClick={() => { onAction("mute"); onClose(); }}
      >
        <MuteIcon className="shrink-0 text-icon-main" size={16} />
        <span className="flex-1 text-left">Mute</span>
        <ChevronRightIcon className="shrink-0 text-icon-main" size={16} />
      </button>
      <button
        type="button"
        className={rowBase}
        onClick={() => { onAction("contact-info"); onClose(); }}
      >
        <UserCircleIcon className="shrink-0 text-icon-main" size={16} />
        <span>Contact info</span>
      </button>
      <button
        type="button"
        className={rowBase}
        onClick={() => { onAction("export-chat"); onClose(); }}
      >
        <UploadIcon className="shrink-0 text-icon-main" size={16} />
        <span>Export chat</span>
      </button>
      <button
        type="button"
        className={rowBase}
        onClick={() => { onAction("clear-chat"); onClose(); }}
      >
        <XIcon className="shrink-0 text-icon-main" size={16} />
        <span>Clear chat</span>
      </button>
    </div>
  );
}
