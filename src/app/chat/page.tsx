"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { TopBar } from "@/components/chat/TopBar";
import { ChatList } from "@/components/chat/ChatList";
import { MessagePanel } from "@/components/chat/MessagePanel";
import { MessageSettingsPopup, type MessageSettingsAction } from "@/components/chat/MessageSettingsPopup";
import { ContactInfoPopup } from "../../components/chat/ContactInfoPopup";
import { IncomingCallModal, type IncomingCallPayload } from "@/components/chat/IncomingCallModal";
import type { ChatListEntry } from "@/components/chat/ChatList";
import type { NewMessageMember } from "@/components/chat/NewMessagePopup";
import { CONTACT_INFO_PANEL_GAP_PX } from "@/lib/layout";

export default function ChatPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ChatListEntry[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: string; content: string; type?: string; createdAt: string; senderId: string; senderName: string; senderImage: string | null }[]>([]);
  const [users, setUsers] = useState<NewMessageMember[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const currentUserId = session?.user?.id ?? null;

  const [messageSettings, setMessageSettings] = useState<{
    chatId: string;
    x: number;
    y: number;
  } | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState<{
    chatId: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    anchor: { x: number; y: number };
    anchorPlacement?: "left" | "right";
    position?: { top: number; right: number };
  } | null>(null);

  const topBarRef = useRef<HTMLDivElement>(null);
  const messagePanelRef = useRef<HTMLDivElement>(null);
  const headerSearchInputRef = useRef<HTMLInputElement>(null);
  /** Header search: searches only in the selected chat. */
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  /** Real-time presence for selected chat (polled every 2s); key = chatId, value = lastSeenAt ISO */
  const [presenceByChatId, setPresenceByChatId] = useState<Record<string, string | null>>({});
  /** Active call: type, contact name, start time for call log duration. */
  const [activeCall, setActiveCall] = useState<{
    type: "audio" | "video";
    contactName: string;
    chatId: string;
    startedAt: number;
  } | null>(null);
  /** Incoming call modal (full-screen accept/decline). */
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);

  const selectedItem = selectedChatId ? items.find((i) => i.id === selectedChatId) : null;

  const getContactInfoPosition = useCallback(() => {
    if (!topBarRef.current || !messagePanelRef.current) return undefined;
    const top = topBarRef.current.getBoundingClientRect().top;
    const panelRect = messagePanelRef.current.getBoundingClientRect();
    const right = window.innerWidth - panelRect.right + CONTACT_INFO_PANEL_GAP_PX;
    const bottom = panelRect.bottom;
    return { top, right, bottom };
  }, []);

  const fetchChats = useCallback(async (silent = false) => {
    if (!silent) setLoadingChats(true);
    try {
      const res = await fetch("/api/chats");
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => {
          const merged = data.map((apiItem: ChatListEntry) => {
            const current = prev.find((i) => i.id === apiItem.id);
            return {
              ...apiItem,
              isUnread: current?.isUnread === true || (apiItem as { isUnread?: boolean }).isUnread,
              isArchived: current?.isArchived === true || (apiItem as { isArchived?: boolean }).isArchived,
            };
          });
          const mergedIds = new Set(merged.map((i: ChatListEntry) => i.id));
          const archivedOnly = prev.filter(
            (i: ChatListEntry) => (i as { isArchived?: boolean }).isArchived && !mergedIds.has(i.id)
          );
          return [...merged, ...archivedOnly];
        });
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      if (!silent) setLoadingChats(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchChats();
    fetchUsers();
  }, [fetchChats, fetchUsers]);

  // Header search hotkey: Win+K (Windows) / ⌘+K (Mac) focuses the search input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        headerSearchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Poll chat list so new conversations and contact presence (lastSeenAt) stay updated
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChats(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  // Real-time presence: poll selected chat's contact status every 2s so "Online" updates without refresh
  useEffect(() => {
    if (!selectedChatId) return;
    const poll = () => {
      fetch(`/api/chats/${selectedChatId}/presence`)
        .then((r) => (r.ok ? r.json() : { lastSeenAt: null }))
        .then((data: { lastSeenAt: string | null }) => {
          setPresenceByChatId((prev) => ({ ...prev, [selectedChatId]: data.lastSeenAt ?? null }));
          setItems((prev) =>
            prev.map((it) =>
              it.id === selectedChatId ? { ...it, lastSeenAt: data.lastSeenAt ?? null } : it
            )
          );
        })
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [selectedChatId]);

  // Heartbeat: only while chat app has focus → show "Online"; on blur → one final ping so others see "last seen just now"
  useEffect(() => {
    if (!session?.user?.id) return;
    const sendHeartbeat = () => {
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: true }),
      }).catch(() => {});
    };
    let interval: ReturnType<typeof setInterval> | null = null;
    const clearHeartbeatInterval = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const startHeartbeat = () => {
      clearHeartbeatInterval();
      sendHeartbeat();
      interval = setInterval(sendHeartbeat, 8000);
    };
    const stopHeartbeat = () => {
      clearHeartbeatInterval();
      sendHeartbeat();
    };
    if (document.visibilityState === "visible") startHeartbeat();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") startHeartbeat();
      else stopHeartbeat();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearHeartbeatInterval();
    };
  }, [session?.user?.id]);

  const fetchMessages = useCallback((chatId: string) => {
    return fetch(`/api/chats/${chatId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setMessages)
      .catch(() => setMessages([]));
  }, []);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    fetchMessages(selectedChatId).finally(() => setLoadingMessages(false));
  }, [selectedChatId, fetchMessages]);

  useEffect(() => {
    if (!selectedChatId) return;
    const interval = setInterval(() => {
      fetchMessages(selectedChatId);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedChatId, fetchMessages]);

  const handleMessageSettingsAction = useCallback((action: MessageSettingsAction) => {
    if (!messageSettings) return;
    if (action === "mark-unread") {
      setItems((prev) =>
        prev.map((it) =>
          it.id === messageSettings.chatId ? { ...it, isUnread: true, isArchived: false } : it
        )
      );
    }
    if (action === "archive") {
      setItems((prev) =>
        prev.map((it) =>
          it.id === messageSettings.chatId ? { ...it, isArchived: true, isUnread: false } : it
        )
      );
    }
    if (action === "mute") {
      setItems((prev) =>
        prev.map((it) =>
          it.id === messageSettings.chatId ? { ...it, isMuted: !(it as { isMuted?: boolean }).isMuted } : it
        )
      );
    }
    if (action === "contact-info") {
      const item = items.find((i) => i.id === messageSettings.chatId);
      if (item) {
        setContactInfo({
          chatId: item.id,
          name: item.name,
          email: (item as { email?: string | null }).email ?? "",
          avatarUrl: item.avatarUrl,
          anchor: { x: messageSettings.x, y: messageSettings.y },
          position: getContactInfoPosition(),
        });
      }
    }
    if (action === "export-chat") {
      (async () => {
        try {
          const res = await fetch(`/api/chats/${messageSettings.chatId}/messages`);
          if (!res.ok) return;
          const data = await res.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `chat-${messageSettings.chatId}-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(a.href);
        } catch {}
      })();
    }
    if (action === "clear-chat") {
      if (typeof window !== "undefined" && window.confirm("Are you sure?")) {
        const chatIdToRemove = messageSettings.chatId;
        (async () => {
          try {
            const res = await fetch(`/api/chats/${chatIdToRemove}`, { method: "DELETE" });
            if (res.ok) {
              setItems((prev) => prev.filter((it) => it.id !== chatIdToRemove));
              if (selectedChatId === chatIdToRemove) setSelectedChatId(null);
            }
          } catch {}
        })();
      }
    }
    setMessageSettings(null);
  }, [messageSettings, items, selectedChatId, getContactInfoPosition]);

  const handleSelectUserNewMessage = useCallback(async (userId: string) => {
    setNewMessageOpen(false);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: userId }),
      });
      if (!res.ok) return;
      const { chatId, otherUser } = await res.json();
      setSelectedChatId(chatId);
      setItems((prev) => {
        const exists = prev.some((c) => c.id === chatId);
        if (exists) return prev;
        return [
          {
            id: chatId,
            otherUserId: otherUser?.id ?? null,
            name: otherUser.name,
            avatarUrl: otherUser.avatarUrl ?? null,
            preview: undefined,
            isUnread: false,
            isArchived: false,
          },
          ...prev,
        ];
      });
    } catch {}
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      options?: { type?: "text" | "emoji" | "audio" | "file" | "call"; senderId?: string; chatId?: string }
    ) => {
      const chatId = options?.chatId ?? selectedChatId;
      if (!chatId || !content.trim()) return;
      try {
        const type = options?.type ?? "text";
        const body: { content: string; type: string; senderId?: string } = {
          content: content.trim(),
          type,
        };
        if (type === "call" && options?.senderId) body.senderId = options.senderId;
        const res = await fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) return;
        const msg = await res.json();
        if (chatId === selectedChatId) setMessages((prev) => [...prev, msg]);
      } catch {}
    },
    [selectedChatId]
  );

  const handleSendMessage = useCallback(
    (content: string) => sendMessage(content),
    [sendMessage]
  );

  const handleSendFile = useCallback(
    (url: string, fileName: string) => {
      sendMessage(JSON.stringify({ url, fileName }), { type: "file" });
    },
    [sendMessage]
  );

  const handleSendAudio = useCallback(
    (url: string) => {
      sendMessage(JSON.stringify({ url }), { type: "audio" });
    },
    [sendMessage]
  );

  const handleFocusHeaderSearch = useCallback(() => {
    headerSearchInputRef.current?.focus();
  }, []);

  const handleStartAudioCall = useCallback(() => {
    if (selectedItem?.name && selectedChatId) {
      setActiveCall({
        type: "audio",
        contactName: selectedItem.name,
        chatId: selectedChatId,
        startedAt: Date.now(),
      });
      setContactInfo(null);
    }
  }, [selectedItem?.name, selectedChatId]);

  const handleStartVideoCall = useCallback(() => {
    if (selectedItem?.name && selectedChatId) {
      setActiveCall({
        type: "video",
        contactName: selectedItem.name,
        chatId: selectedChatId,
        startedAt: Date.now(),
      });
      setContactInfo(null);
    }
  }, [selectedItem?.name, selectedChatId]);

  const handleEndCall = useCallback(() => {
    if (!activeCall) return;
    const durationSeconds = Math.floor((Date.now() - activeCall.startedAt) / 1000);
    const content = JSON.stringify({
      type: activeCall.type,
      direction: "outgoing" as const,
      status: "accepted" as const,
      durationSeconds,
    });
    sendMessage(content, { type: "call", chatId: activeCall.chatId });
    setActiveCall(null);
  }, [activeCall, sendMessage]);

  const handleAcceptIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    setSelectedChatId(incomingCall.chatId);
    setActiveCall({
      type: incomingCall.type,
      contactName: incomingCall.fromName,
      chatId: incomingCall.chatId,
      startedAt: Date.now(),
    });
    setIncomingCall(null);
    setContactInfo(null);
  }, [incomingCall]);

  const handleDeclineIncomingCall = useCallback(async () => {
    if (!incomingCall) return;
    const content = JSON.stringify({
      type: incomingCall.type,
      direction: "incoming" as const,
      status: "declined" as const,
    });
    try {
      await sendMessage(content, {
        type: "call",
        chatId: incomingCall.chatId,
        senderId: incomingCall.fromUserId,
      });
    } finally {
      setIncomingCall(null);
    }
    if (incomingCall.chatId === selectedChatId) {
      const res = await fetch(`/api/chats/${incomingCall.chatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    }
  }, [incomingCall, selectedChatId, sendMessage]);

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!selectedChatId) return;
      if (typeof window !== "undefined" && !window.confirm("Delete this message?")) return;
      try {
        const res = await fetch(`/api/chats/${selectedChatId}/messages/${messageId}`, { method: "DELETE" });
        if (res.ok) {
          setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        }
      } catch {}
    },
    [selectedChatId]
  );

  const handleSimulateIncomingCall = useCallback(
    (type: "audio" | "video") => {
      if (!selectedItem?.otherUserId || !selectedChatId) return;
      setIncomingCall({
        chatId: selectedChatId,
        fromUserId: selectedItem.otherUserId,
        fromName: selectedItem.name,
        avatarUrl: selectedItem.avatarUrl ?? null,
        type,
      });
    },
    [selectedItem, selectedChatId]
  );

  const selectedContact = contactInfo
    ? { id: contactInfo.chatId, name: contactInfo.name, email: contactInfo.email, avatarUrl: contactInfo.avatarUrl }
    : null;

  return (
    <div className="p-3 flex-1 flex flex-col gap-3 min-h-0 overflow-hidden bg-bg-cards relative">
      <div ref={topBarRef} className="shrink-0">
        <TopBar
          searchValue={headerSearchQuery}
          onSearchChange={setHeaderSearchQuery}
          searchInputRef={headerSearchInputRef}
        />
      </div>
      <div className="flex-1 min-h-0 flex flex-row gap-3 overflow-hidden min-w-0">
        <ChatList
          items={items}
          loading={loadingChats}
          onNewMessage={() => setNewMessageOpen((o) => !o)}
          onSelectChat={(id) => setSelectedChatId(id)}
          onOpenMessageSettings={(id, anchor) =>
            setMessageSettings({ chatId: id, x: anchor.x, y: anchor.y })
          }
          onArchive={(id) =>
            setItems((prev) =>
              prev.map((it) => (it.id === id ? { ...it, isArchived: true, isUnread: false } : it))
            )
          }
          onMarkUnread={(id) =>
            setItems((prev) =>
              prev.map((it) => (it.id === id ? { ...it, isUnread: true, isArchived: false } : it))
            )
          }
          newMessageOpen={newMessageOpen}
          onNewMessageClose={() => setNewMessageOpen(false)}
          onNewMessageSelectUser={handleSelectUserNewMessage}
          newMessageMembers={users}
        />
        <div ref={messagePanelRef} className="flex-1 min-w-0 min-h-0 flex flex-col">
          <MessagePanel
            contactName={selectedItem?.name ?? null}
            avatarUrl={selectedItem?.avatarUrl ?? null}
            messages={messages}
            loadingMessages={loadingMessages}
            currentUserId={currentUserId}
            chatId={selectedChatId}
            contactLastSeenAt={
              (selectedChatId ? presenceByChatId[selectedChatId] : undefined) ??
              selectedItem?.lastSeenAt ??
              null
            }
            contactLastActivityAt={
              selectedItem?.lastActivityAt != null
                ? typeof selectedItem.lastActivityAt === "string"
                  ? selectedItem.lastActivityAt
                  : new Date(selectedItem.lastActivityAt).toISOString()
                : null
            }
            searchInChatQuery={headerSearchQuery}
            onSendMessage={handleSendMessage}
            onSendFile={handleSendFile}
            onSendAudio={handleSendAudio}
            onFocusHeaderSearch={handleFocusHeaderSearch}
            onAudioCall={handleStartAudioCall}
            onVideoCall={handleStartVideoCall}
            onDeleteMessage={handleDeleteMessage}
            onOpenContactInfo={() => {
              if (!selectedChatId || !selectedItem) return;
              setContactInfo({
                chatId: selectedChatId,
                name: selectedItem.name,
                email: (selectedItem as { email?: string | null }).email ?? "",
                avatarUrl: selectedItem.avatarUrl,
                anchor: { x: 0, y: 0 },
                position: getContactInfoPosition(),
              });
            }}
          />
        </div>
      </div>

      {messageSettings && (
        <MessageSettingsPopup
          x={messageSettings.x}
          y={messageSettings.y}
          onClose={() => setMessageSettings(null)}
          onAction={handleMessageSettingsAction}
        />
      )}

      {contactInfo && selectedContact && (
        <ContactInfoPopup
          contactId={contactInfo.chatId}
          name={selectedContact.name}
          email={selectedContact.email}
          avatarUrl={selectedContact.avatarUrl}
          anchor={contactInfo.anchor}
          anchorPlacement={contactInfo.anchorPlacement}
          position={contactInfo.position}
          messages={messages}
          onClose={() => setContactInfo(null)}
          onAudioCall={handleStartAudioCall}
          onVideoCall={handleStartVideoCall}
          onSimulateIncomingCall={handleSimulateIncomingCall}
        />
      )}

      {activeCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-16 shadow-lg p-6 max-w-sm w-full mx-4 flex flex-col items-center gap-4">
            <p className="text-14 text-text-main text-center">
              {activeCall.type === "audio" ? "Audio" : "Video"} call with{" "}
              <span className="font-semibold">{activeCall.contactName}</span>
            </p>
            <p className="text-12 text-text-soft text-center">
              Call in progress. Connect your own calling (WebRTC, Twilio, etc.) here.
            </p>
            <button
              type="button"
              onClick={handleEndCall}
              className="w-full py-2.5 rounded-10 bg-[var(--text-state-error)] text-white text-14 font-medium"
            >
              End call
            </button>
          </div>
        </div>
      )}

      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}
    </div>
  );
}
