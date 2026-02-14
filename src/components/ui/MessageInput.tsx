"use client";

import {
  useRef,
  useState,
  useCallback,
} from "react";
import {
  MicrophoneIcon,
  MoodIcon,
  PaperclipIcon,
  SendIcon,
} from "@/components/icons";

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂",
  "😉", "😍", "🥰", "😘", "👍", "👋", "🙌", "👏", "❤️", "🔥",
  "⭐", "✨", "💯", "🎉", "🙏", "💪", "😎", "🤔", "😢", "😭",
];

type MessageInputProps = {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSend?: () => void;
  onSendFile?: (url: string, fileName: string) => void;
  onSendAudio?: (url: string) => void;
  chatId?: string | null;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

function StopIconComponent({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="currentColor"
      className={className}
    >
      <rect x="2" y="2" width="10" height="10" rx="1" />
    </svg>
  );
}

export function MessageInput({
  placeholder = "Type any message...",
  value = "",
  onChange,
  onSend,
  onSendFile,
  onSendAudio,
  chatId,
  disabled = false,
  className = "",
  "aria-label": ariaLabel = "Message",
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<{ url: string } | null>(null);
  const [pendingFile, setPendingFile] = useState<{ url: string; fileName: string } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleConfirmSend = useCallback(() => {
    if (pendingAudio && onSendAudio) {
      onSendAudio(pendingAudio.url);
      setPendingAudio(null);
      return;
    }
    if (pendingFile && onSendFile) {
      onSendFile(pendingFile.url, pendingFile.fileName);
      setPendingFile(null);
      return;
    }
    if (value.trim()) {
      onSend?.();
    }
  }, [pendingAudio, pendingFile, value, onSend, onSendAudio, onSendFile]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleConfirmSend();
    }
  };

  const uploadFile = useCallback(
    async (file: File, type: "file" | "audio" = "file") => {
      if (!chatId || (!onSendFile && !onSendAudio)) return;
      setUploading(true);
      try {
        const form = new FormData();
        form.set("file", file);
        form.set("chatId", chatId);
        form.set("type", type);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: form,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        if (type === "audio" && onSendAudio) {
          setPendingAudio({ url: data.url });
        } else if (type === "file" && onSendFile) {
          setPendingFile({
            url: data.url,
            fileName: data.fileName || file.name || "file",
          });
        }
      } catch {
        // silent
      } finally {
        setUploading(false);
      }
    },
    [chatId, onSendFile, onSendAudio]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onSendFile || !chatId) return;
    uploadFile(file, "file");
  };

  const startRecording = useCallback(() => {
    if (!navigator.mediaDevices?.getUserMedia || !onSendAudio || !chatId) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "recording.webm", { type: "audio/webm" });
        uploadFile(file, "audio");
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    }).catch(() => {});
  }, [chatId, onSendAudio, uploadFile]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setRecording(false);
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    onChange?.(value + emoji);
    setEmojiOpen(false);
    setTimeout(() => textInputRef.current?.focus(), 0);
  };

  const canSendText = value.trim().length > 0;
  const hasPending = !!pendingAudio || !!pendingFile;
  const canSend = canSendText || hasPending;
  const isDisabled = disabled || uploading;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.txt,.json,application/*"
        onChange={handleFileChange}
        aria-hidden
      />
      <div className="flex-1 min-w-0 relative flex flex-col gap-1">
        {hasPending && (
          <span className="text-11 text-text-soft px-1">
            {pendingAudio && "Voice message ready — press Enter or click Send"}
            {pendingFile && `File "${pendingFile.fileName}" ready — press Enter or click Send`}
          </span>
        )}
        <div className="h-10 py-3 pl-4 pr-1 rounded-full outline outline-1 outline-border-primary outline-offset-[-1px] flex items-center gap-1 bg-transparent">
          <input
            ref={textInputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={ariaLabel}
            disabled={isDisabled}
            className="flex-1 min-w-0 border-none bg-transparent text-12 font-normal text-text-main placeholder:text-text-soft outline-none disabled:opacity-60"
          />
        </div>
        {emojiOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              aria-hidden
              onClick={() => setEmojiOpen(false)}
            />
            <div className="absolute bottom-full left-0 mb-1 p-2 rounded-12 bg-surface-default border border-border-primary shadow-lg z-20 grid grid-cols-5 gap-1 max-h-32 overflow-auto">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-bg-cards"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 text-icon-sub">
        <button
          type="button"
          aria-label={recording ? "Stop recording" : "Record voice"}
          disabled={isDisabled || !chatId}
          className={`w-6 h-6 p-0 border-none bg-transparent flex items-center justify-center cursor-pointer disabled:opacity-50 ${recording ? "text-red-500" : ""}`}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? (
            <StopIconComponent size={14} />
          ) : (
            <MicrophoneIcon size={14} />
          )}
        </button>
        <button
          type="button"
          aria-label="Emoji"
          disabled={isDisabled}
          className="w-6 h-6 p-0 border-none bg-transparent flex items-center justify-center cursor-pointer disabled:opacity-50"
          onClick={() => setEmojiOpen((o) => !o)}
        >
          <MoodIcon size={14} />
        </button>
        <button
          type="button"
          aria-label="Attach file"
          disabled={isDisabled || !chatId}
          className="w-6 h-6 p-0 border-none bg-transparent flex items-center justify-center cursor-pointer disabled:opacity-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <PaperclipIcon size={14} />
        </button>
        <button
          type="button"
          aria-label="Send"
          disabled={isDisabled || !canSend}
          className="w-8 h-8 p-0 border-none rounded-full bg-brand flex items-center justify-center cursor-pointer text-icon-white disabled:opacity-50"
          onClick={handleConfirmSend}
        >
          <SendIcon size={16} />
        </button>
      </div>
    </div>
  );
}
