import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSocket from "@/components/chat/useSocket.client";
import {
  createClientKey,
  mergeMessages,
  type ChatMessageItem,
  type MessageDeliveryStatus,
} from "@/components/chat/chatUtils";
import {
  ensurePatientChat,
  fetchChatMessages,
  fetchDoctorChats,
  fetchPatientChats,
  markChatMessagesReadRest,
  sendChatMessageRest,
  uploadChatAttachment,
  type ChatConversation,
} from "./chatApi";

const STATUS_RANK: Record<MessageDeliveryStatus, number> = {
  failed: 0,
  sending: 1,
  sent: 2,
  delivered: 3,
  read: 4,
};

function mergeStatusMonotonic(
  current: MessageDeliveryStatus | undefined,
  incoming: MessageDeliveryStatus,
): MessageDeliveryStatus {
  if (!current) return incoming;
  return STATUS_RANK[incoming] >= STATUS_RANK[current] ? incoming : current;
}

function getConversationTimestamp(conv: ChatConversation): number {
  const last = conv.messages?.[0];
  const raw = last?.createdAt || last?.time || conv.updatedAt || 0;
  return raw ? new Date(raw).getTime() : 0;
}

export function sortConversations(list: ChatConversation[]): ChatConversation[] {
  return [...list].sort((a, b) => getConversationTimestamp(b) - getConversationTimestamp(a));
}

export function useChatWorkspace(role: "doctor" | "patient") {
  const socket = useSocket();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [typingByChatId, setTypingByChatId] = useState<Record<string, boolean>>({});
  const [presenceByUserId, setPresenceByUserId] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);

  const activeChatIdRef = useRef<string | null>(null);
  activeChatIdRef.current = activeChatId;

  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastTypingEmitRef = useRef<number>(0);
  const myUserIdRef = useRef<string | null>(null);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setConversationsError(null);
    try {
      let list = role === "doctor" ? await fetchDoctorChats() : await fetchPatientChats();
      if (role === "patient" && list.length === 0) {
        const created = await ensurePatientChat();
        if (created) list = [created];
      }
      const sorted = sortConversations(list);
      setConversations(sorted);
      setActiveChatId((prev) => {
        if (prev && sorted.some((c) => c.id === prev)) return prev;
        return role === "patient" && sorted[0] ? sorted[0].id : prev;
      });
    } catch (err) {
      setConversationsError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, [role]);

  // Connect canonical Socket.IO client once on mount
  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/token", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted) return;
        if (data?.user?.id) myUserIdRef.current = String(data.user.id);
        socket.connect(data?.token ? { token: data.token } : {});
        setPresenceByUserId(socket.getPresenceSnapshot());
      })
      .catch(() => {
        if (mounted) socket.connect({});
      });

    void loadConversations();

    return () => {
      mounted = false;
    };
  }, [socket, loadConversations]);

  // Mark incoming messages from the other party as read
  const acknowledgeReadForChat = useCallback(
    (chatId: string, list: ChatMessageItem[]) => {
      const otherSender = role === "doctor" ? "patient" : "doctor";
      const unreadIds = list
        .filter((m) => m.sender === otherSender && m.status !== "read" && m.id && !m.id.startsWith("tmp_"))
        .map((m) => m.id);
      if (unreadIds.length === 0) return;

      if (socket.connected) {
        socket.emitRead(unreadIds);
      } else {
        void markChatMessagesReadRest(chatId, unreadIds);
      }

      setMessages((prev) =>
        prev.map((m) => (unreadIds.includes(m.id) ? { ...m, status: "read" } : m)),
      );
      setConversations((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)),
      );
    },
    [role, socket],
  );

  const syncLatestMessages = useCallback(
    async (chatId: string, showSpinner: boolean) => {
      if (showSpinner) {
        setLoadingMessages(true);
        setMessagesError(null);
      }
      try {
        const res = await fetchChatMessages(chatId, { limit: 50 });
        if (activeChatIdRef.current !== chatId) return;
        setMessages((prev) => (showSpinner ? res.messages : mergeMessages(prev, res.messages)));
        if (showSpinner) setHasMore(res.hasMore);
        acknowledgeReadForChat(chatId, res.messages);
      } catch (err) {
        if (showSpinner && activeChatIdRef.current === chatId) {
          setMessagesError(err instanceof Error ? err.message : "Failed to load messages");
        }
      } finally {
        if (showSpinner && activeChatIdRef.current === chatId) {
          setLoadingMessages(false);
        }
      }
    },
    [acknowledgeReadForChat],
  );

  // Join active chat room, load history, and leave on switch
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      setHasMore(false);
      return;
    }

    let cancelled = false;
    setMessages([]);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, unreadCount: 0 } : c)),
    );

    const initRoom = async () => {
      await socket.join(activeChatId);
      if (!cancelled) {
        await syncLatestMessages(activeChatId, true);
      }
    };

    void initRoom();

    return () => {
      cancelled = true;
      socket.leave(activeChatId);
    };
  }, [activeChatId, socket, syncLatestMessages]);

  // Global real-time event listeners (registered once with stable socket API)
  useEffect(() => {
    const offMessage = socket.onMessage((raw: ChatMessageItem & { chatId?: string }) => {
      if (!raw?.id || !raw?.chatId) return;
      const incomingChatId = String(raw.chatId);
      const otherSender = role === "doctor" ? "patient" : "doctor";
      const isFromOther = raw.sender === otherSender;
      const isActive = activeChatIdRef.current === incomingChatId;

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === incomingChatId);
        if (!exists) {
          void loadConversations();
          return prev;
        }
        return sortConversations(
          prev.map((c) => {
            if (c.id !== incomingChatId) return c;
            const alreadyPreviewed = c.messages?.[0]?.id === raw.id;
            return {
              ...c,
              messages: [raw],
              unreadCount:
                isActive || !isFromOther || alreadyPreviewed
                  ? isActive
                    ? 0
                    : c.unreadCount
                  : (c.unreadCount || 0) + 1,
            };
          }),
        );
      });

      if (isActive) {
        setMessages((prev) => mergeMessages(prev, [raw]));
        if (isFromOther) {
          if (socket.connected) {
            socket.emitDelivered([raw.id]);
            socket.emitRead([raw.id]);
          } else {
            void markChatMessagesReadRest(incomingChatId, [raw.id]);
          }
        }
      }
    });

    const offConvUpdate = socket.onConversationUpdate(
      (evt: { chatId?: string; lastMessage?: ChatMessageItem; unreadDelta?: number }) => {
        if (!evt?.chatId || !evt.lastMessage) return;
        const targetChatId = String(evt.chatId);
        const isActive = activeChatIdRef.current === targetChatId;
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === targetChatId);
          if (!exists) {
            void loadConversations();
            return prev;
          }
          return sortConversations(
            prev.map((c) => {
              if (c.id !== targetChatId) return c;
              const alreadyPreviewed = c.messages?.[0]?.id === evt.lastMessage!.id;
              return {
                ...c,
                messages: [evt.lastMessage!],
                unreadCount: isActive
                  ? 0
                  : alreadyPreviewed
                    ? c.unreadCount
                    : (c.unreadCount || 0) + (evt.unreadDelta || 0),
              };
            }),
          );
        });
      },
    );

    const offUpdate = socket.onMessageUpdate(
      (upd: { id?: string; chatId?: string; status?: MessageDeliveryStatus }) => {
        if (!upd?.id || !upd.status) return;
        if (upd.chatId && activeChatIdRef.current !== String(upd.chatId)) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === upd.id
              ? { ...m, status: mergeStatusMonotonic(m.status, upd.status!) }
              : m,
          ),
        );
      },
    );

    const offRead = socket.onMessageRead((info: { messageId?: string; chatId?: string }) => {
      if (!info?.messageId) return;
      if (info.chatId && activeChatIdRef.current !== String(info.chatId)) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === info.messageId ? { ...m, status: mergeStatusMonotonic(m.status, "read") } : m,
        ),
      );
    });

    const offTyping = socket.onTyping(
      ({ userId, typing }: { userId?: string; typing?: boolean }) => {
        const chatId = activeChatIdRef.current;
        if (!chatId || (userId && myUserIdRef.current && String(userId) === myUserIdRef.current)) {
          return;
        }
        if (typingTimersRef.current[chatId]) {
          clearTimeout(typingTimersRef.current[chatId]);
        }
        setTypingByChatId((prev) => ({ ...prev, [chatId]: Boolean(typing) }));
        if (typing) {
          typingTimersRef.current[chatId] = setTimeout(() => {
            setTypingByChatId((prev) => ({ ...prev, [chatId]: false }));
          }, 3500);
        }
      },
    );

    const offPresence = socket.onPresence(({ userId, online }: { userId: string; online: boolean }) => {
      setPresenceByUserId((prev) => ({ ...prev, [String(userId)]: Boolean(online) }));
    });

    const offReconnect = socket.onReconnect(() => {
      const chatId = activeChatIdRef.current;
      if (chatId) {
        void syncLatestMessages(chatId, false);
      }
      void loadConversations();
    });

    return () => {
      offMessage();
      offConvUpdate();
      offUpdate();
      offRead();
      offTyping();
      offPresence();
      offReconnect();
    };
  }, [socket, role, loadConversations, syncLatestMessages]);

  // Reconcile missed messages when browser tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && activeChatIdRef.current) {
        void syncLatestMessages(activeChatIdRef.current, false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [syncLatestMessages]);

  const loadOlderMessages = useCallback(async () => {
    const chatId = activeChatIdRef.current;
    if (!chatId || loadingOlder || !hasMore || messages.length === 0) return;
    const oldest = messages[0];
    if (!oldest?.id || oldest.id.startsWith("tmp_")) return;

    setLoadingOlder(true);
    try {
      const res = await fetchChatMessages(chatId, { limit: 50, before: oldest.id });
      if (activeChatIdRef.current !== chatId) return;
      setMessages((prev) => mergeMessages(res.messages, prev));
      setHasMore(res.hasMore);
    } finally {
      setLoadingOlder(false);
    }
  }, [hasMore, loadingOlder, messages]);

  const sendMessage = useCallback(
    async (input: {
      text?: string;
      file?: File | null;
      retryMessage?: ChatMessageItem;
    }): Promise<boolean> => {
      const chatId = activeChatIdRef.current;
      if (!chatId) return false;

      const retry = input.retryMessage;
      const clientKey = retry?.clientKey || createClientKey();
      const text = (retry ? retry.text : input.text || "")?.trim() || "";

      let fileUrl = retry?.fileUrl || "";
      let mimeType = retry?.mimeType || "";
      let fileName = retry?.fileName || "";

      if (input.file) {
        setUploading(true);
        try {
          const uploaded = await uploadChatAttachment(chatId, input.file);
          fileUrl = uploaded.fileUrl;
          mimeType = uploaded.mimeType;
          fileName = uploaded.fileName;
        } finally {
          setUploading(false);
        }
      }

      if (!text && !fileUrl) return false;

      const optimistic: ChatMessageItem = {
        id: retry?.id || `tmp_${clientKey}`,
        chatId,
        sender: role,
        text: text || null,
        fileUrl: fileUrl || null,
        mimeType: mimeType || null,
        fileName: fileName || null,
        clientKey,
        status: "sent",
        localStatus: "sending",
        createdAt: retry?.createdAt || new Date().toISOString(),
      };

      setMessages((prev) => mergeMessages(prev, [optimistic]));
      socket.sendTyping(chatId, false);

      const payload = {
        chatId,
        text: text || undefined,
        clientKey,
        fileUrl: fileUrl || undefined,
        mimeType: mimeType || undefined,
        fileName: fileName || undefined,
      };

      // Try Socket.IO with 4s ack timeout, then fall back cleanly to REST (which also broadcasts to Socket.IO!)
      const socketAckResult = await new Promise<{ ok: boolean; message?: ChatMessageItem } | null>(
        (resolve) => {
          if (!socket.connected) {
            resolve(null);
            return;
          }
          let done = false;
          const timer = setTimeout(() => {
            if (!done) {
              done = true;
              resolve(null);
            }
          }, 4000);

          socket.sendMessage(payload, (ack?: { ok?: boolean; message?: ChatMessageItem; error?: string }) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            if (ack?.ok && ack.message) {
              resolve({ ok: true, message: ack.message });
            } else {
              resolve(null);
            }
          });
        },
      );

      if (socketAckResult?.ok && socketAckResult.message) {
        setMessages((prev) => mergeMessages(prev, [socketAckResult.message!]));
        return true;
      }

      try {
        const restRes = await sendChatMessageRest(chatId, {
          text: payload.text,
          clientKey: payload.clientKey,
          fileUrl: payload.fileUrl,
          mimeType: payload.mimeType,
          fileName: payload.fileName,
        });
        if (restRes.message) {
          setMessages((prev) => mergeMessages(prev, [restRes.message]));
          setConversations((prev) =>
            sortConversations(
              prev.map((c) => (c.id === chatId ? { ...c, messages: [restRes.message] } : c)),
            ),
          );
        }
        return true;
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientKey === clientKey || m.id === optimistic.id
              ? { ...m, localStatus: "failed" }
              : m,
          ),
        );
        return false;
      }
    },
    [role, socket],
  );

  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      const chatId = activeChatIdRef.current;
      if (!chatId) return;
      const now = Date.now();
      if (isTyping && now - lastTypingEmitRef.current < 1500) return;
      lastTypingEmitRef.current = isTyping ? now : 0;
      socket.sendTyping(chatId, isTyping);
    },
    [socket],
  );

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeChatId) || null,
    [conversations, activeChatId],
  );

  return {
    conversations,
    loadingConversations,
    conversationsError,
    reloadConversations: loadConversations,
    activeChatId,
    setActiveChatId,
    activeConversation,
    messages,
    loadingMessages,
    loadingOlder,
    hasMore,
    messagesError,
    loadOlderMessages,
    sendMessage,
    uploading,
    notifyTyping,
    isTyping: activeChatId ? Boolean(typingByChatId[activeChatId]) : false,
    presenceByUserId,
    connectionStatus: socket.connectionStatus as "connected" | "connecting" | "disconnected",
    connected: socket.connected,
  };
}
