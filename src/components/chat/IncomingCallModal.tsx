"use client";

import { Avatar } from "@/components/ui/Avatar";
import { PhoneIconLarge, VideoIconLarge } from "@/components/icons/popups";

export type IncomingCallPayload = {
  chatId: string;
  fromUserId: string;
  fromName: string;
  avatarUrl?: string | null;
  type: "audio" | "video";
};

type IncomingCallModalProps = {
  call: IncomingCallPayload;
  onAccept: () => void;
  onDecline: () => void;
};

export function IncomingCallModal({ call, onAccept, onDecline }: IncomingCallModalProps) {
  const isVideo = call.type === "video";
  const CallIcon = isVideo ? VideoIconLarge : PhoneIconLarge;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0D9488]">
      {/* Top: call type label */}
      <div className="pt-12 pb-4 flex flex-col items-center justify-center gap-2">
        <span className="text-white/90 text-12 font-medium uppercase tracking-wider">
          {isVideo ? "Video call" : "Voice call"}
        </span>
        <div className="relative">
          <Avatar
            name={call.fromName}
            src={call.avatarUrl}
            size={44}
            className="w-20 h-20 min-w-[80px] min-h-[80px] rounded-full border-4 border-white/30"
          />
        </div>
        <p className="text-white text-22 font-semibold mt-2">{call.fromName}</p>
        <p className="text-white/90 text-14 uppercase tracking-wide">Incoming</p>
      </div>

      {/* Bottom: actions */}
      <div className="flex-1 min-h-0 flex flex-col justify-end pb-12 px-8 bg-[#1F2937] rounded-t-24">
        <div className="flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={onDecline}
            className="flex flex-col items-center gap-2"
            aria-label="Decline"
          >
            <span className="w-16 h-16 rounded-full bg-[#EF4444] flex items-center justify-center text-white shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <span className="text-12 text-white/90 font-medium">Decline</span>
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex flex-col items-center gap-2"
            aria-label="Accept"
          >
            <span className="w-16 h-16 rounded-full bg-[#22C55E] flex items-center justify-center text-white shadow-lg">
              <CallIcon size={28} className="text-white" />
            </span>
            <span className="text-12 text-white/90 font-medium">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
