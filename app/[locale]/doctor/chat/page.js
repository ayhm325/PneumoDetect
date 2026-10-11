"use client";

import DoctorLayout from "../DoctorLayout";
import { useToast } from "../../../components/ui/ToastProvider";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import useSocket from "../../../components/chat/useSocket.client";
import ChatActionsPopover from "../../../components/chat/ChatActionsPopover.client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaComments,
  FaSearch,
  FaPaperPlane,
  FaPaperclip,
  FaCircle,
  FaPhone,
  FaVideo,
  FaCheck,
  FaCheckDouble,
  FaFilePdf,
  FaFileAlt,
} from "react-icons/fa";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { formatTime } from "../../../lib/date";
import { Button, Card } from "../../../../src/components/ui";

export default function Page() {
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const t = useTranslations("doctorChat");
  const ui = useTranslations("ui");

  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const placeholder = ui("placeholder");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-US";
  const formatMsgTime = useCallback(
    (value) => formatTime(value, dateLocale, placeholder),
    [dateLocale, placeholder],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [conversations, setConversations] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [messagesMap, setMessagesMap] = useState({});
  const [loadingChats, setLoadingChats] = useState(true);
  const [socketMismatch, setSocketMismatch] = useState(false);
  const [jwtToken, setJwtToken] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [uploadProgress, setUploadProgress] = useState({
    uploading: false,
    percent: 0,
    filename: null,
  });

  const socket = useSocket();
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const loadedMessagesRef = useRef(new Set());

  // Fetch JWT token on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/token", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (mounted && data?.token) setJwtToken(data.token);
        }
      } catch (e) {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Connect socket with JWT when available and register handlers
  useEffect(() => {
    if (!socket || !jwtToken) return;
    try {
      socket.connect({ token: jwtToken });
    } catch (e) {}

    // Verify socket identity matches current JWT to avoid mismatched sessions
    try {
      // decode JWT payload to get expected user id (no verification, just parse)
      const decodePayload = (tok) => {
        try {
          const parts = tok.split(".");
          if (parts.length < 2) return null;
          const b = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const json = decodeURIComponent(
            atob(b)
              .split("")
              .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join(""),
          );
          return JSON.parse(json);
        } catch (e) {
          return null;
        }
      };
      const expected = decodePayload(jwtToken);
      const expectedUserId = expected && expected.id;

      const onMe = (info) => {
        try {
          const actualId = info && info.id;
          if (!info || !actualId) return;
          // compare as strings to avoid type mismatch false-negatives
          if (expectedUserId && String(actualId) !== String(expectedUserId)) {
            // mismatch: disconnect and mark mismatch so UI prompts re-login
            try {
              socket.disconnect && socket.disconnect();
            } catch (e) {}
            try {
              const userKey = socket && socket.__app_userKey;
              if (
                userKey &&
                globalThis.__app_socket_by_user &&
                globalThis.__app_socket_by_user[userKey]
              ) {
                delete globalThis.__app_socket_by_user[userKey];
              } else {
                delete globalThis.__app_socket;
                try {
                  globalThis.__app_socket_refcount = 0;
                } catch (e) {}
                delete globalThis.__app_socket_userId;
              }
            } catch (e) {}
            setSocketMismatch(true);
          }
        } catch (e) {
          console.error("whoami check failed", e);
        }
      };

      try {
        socket.emitEvent && socket.emitEvent("whoami");
        // listen for server's 'me' reply
        socket.onPresence && socket.onPresence(() => {}); // no-op to ensure socket exists
        socket.on && socket.on("me", onMe);
      } catch (e) {}

      // cleanup listener on unmount/cleanup
      const cleanupWhoami = () => {
        try {
          socket && socket.off && socket.off("me", onMe);
        } catch (e) {}
      };

      // ensure cleanup in effect return
      // note: we can't directly modify the returned cleanup closures here, but we remove the listener below in the main return
      // store on window for potential removal
      window.__chat_cleanup_whoami = cleanupWhoami;
    } catch (e) {
      /* ignore */
    }

    const offMessage = socket.onMessage((msg) => {
      try {
        if (!msg) return;
        // normalize incoming message fields: some servers/clients use different keys
        const chatId =
          msg.chatId ??
          (msg.chat &&
            (typeof msg.chat === "string" ? msg.chat : msg.chat.id)) ??
          msg.chat_id ??
          msg.roomId ??
          msg.threadId ??
          null;
        const messageId = msg.id ?? msg._id ?? msg.messageId ?? null;
        const clientKey = msg.clientKey ?? msg.client_key ?? null;

        const mapped = {
          ...msg,
          id: messageId || msg.id,
          chatId,
          time: formatMsgTime(msg.createdAt),
        };

        if (!chatId) {
          console.warn(
            "[onMessage] received message without chatId - ignoring",
            msg,
          );
          return;
        }
        const chatKey = String(chatId);

        setMessagesMap((m) => {
          const list = m[chatKey] || [];
          // avoid duplicates when the same client already added the message optimistically
          if (messageId && list.some((x) => x.id === messageId)) return m;
          if (clientKey && list.some((x) => x.clientKey === clientKey))
            return m;
          return { ...m, [chatKey]: [...list, mapped] };
        });

        setConversations((cs) =>
          cs.map((c) => {
            if (c.id !== chatKey) return c;
            const isIncomingFromPatient =
              msg.sender === "patient" || mapped.sender === "patient";
            const isActiveChat =
              selectedChat && chatKey === String(selectedChat);
            const nextUnread =
              !isActiveChat && isIncomingFromPatient
                ? Number(c.unreadCount || 0) + 1
                : Number(c.unreadCount || 0);
            return {
              ...c,
              lastMessage: msg.text || "",
              lastMessageTime: mapped.time,
              unreadCount: nextUnread,
            };
          }),
        );

        if (selectedChat && chatKey === String(selectedChat)) {
          try {
            socket.emitEvent &&
              socket.emitEvent("delivered_ack", {
                messageIds: [messageId || msg.id],
              });
          } catch (e) {}
          // If this is a patient message and the doctor is viewing the chat, mark as read.
          try {
            if (
              (msg.sender === "patient" || mapped.sender === "patient") &&
              (messageId || msg.id)
            ) {
              socket.emitEvent &&
                socket.emitEvent("read_ack", {
                  messageIds: [messageId || msg.id],
                });
            }
          } catch (e) {}
        }
      } catch (e) {
        console.error("onMessage handler", e);
      }
    });

    const offTyping = socket.onTyping(({ userId, typing }) => {
      try {
        if (!userId) return;
        setTypingUsers((s) => ({ ...s, [userId]: typing }));
        if (typing) {
          // auto-clear after 3s to avoid stuck state
          setTimeout(
            () => setTypingUsers((s) => ({ ...s, [userId]: false })),
            3000,
          );
        }
      } catch (e) {
        console.error("typing handler", e);
      }
    });

    const offPresence = socket.onPresence(({ userId, online }) => {
      setConversations((cs) =>
        cs.map((c) =>
          c.patientUserId && String(c.patientUserId) === String(userId)
            ? { ...c, online }
            : c,
        ),
      );
    });

    const offUpdate = socket.onMessageUpdate((upd) => {
      try {
        if (!upd || !upd.id) return;
        setMessagesMap((m) => {
          const chatEntries = Object.keys(m).reduce(
            (acc, k) => ({
              ...acc,
              [k]: m[k].map((msg) =>
                msg.id === upd.id ? { ...msg, status: upd.status } : msg,
              ),
            }),
            {},
          );
          return { ...m, ...chatEntries };
        });
      } catch (e) {
        console.error("message_update handler", e);
      }
    });

    const offRead = socket.onMessageRead((info) => {
      try {
        if (!info || !info.messageId) return;
        setMessagesMap((m) => {
          const chatEntries = Object.keys(m).reduce(
            (acc, k) => ({
              ...acc,
              [k]: m[k].map((msg) =>
                msg.id === info.messageId ? { ...msg, status: "read" } : msg,
              ),
            }),
            {},
          );
          return { ...m, ...chatEntries };
        });
      } catch (e) {
        console.error("message_read handler", e);
      }
    });

    try {
      const offConnErr = socket.onConnectError((err) => {
        if (
          err &&
          err.message &&
          (err.message === "invalid_token" || err.message === "unauthenticated")
        ) {
          setSocketMismatch(true);
        }
      });
      // ensure cleanup of connect_error listener
      // append to cleanup list
      const originalReturn = () => {
        try {
          offConnErr && offConnErr();
        } catch (e) {}
      };
      // we'll call originalReturn in final cleanup along with others
    } catch (e) {}

    return () => {
      try {
        offMessage && offMessage();
      } catch (e) {}
      try {
        offTyping && offTyping();
      } catch (e) {}
      try {
        offPresence && offPresence();
      } catch (e) {}
      try {
        offUpdate && offUpdate();
      } catch (e) {}
      try {
        offRead && offRead();
      } catch (e) {}
      try {
        if (window.__chat_cleanup_whoami) {
          window.__chat_cleanup_whoami();
          window.__chat_cleanup_whoami = null;
        }
      } catch (e) {}
    };
  }, [socket, jwtToken, selectedChat, t, showSuccess, formatMsgTime]);

  // Load conversations and patients
  useEffect(() => {
    let mounted = true;
    async function loadChatsAndPatients() {
      try {
        const res = await fetch("/api/chat/doctor", { credentials: "include" });
        if (res.status === 403) {
          showError(t("forbiddenRedirectToast"));
          router.push(`/${locale}/patient/chat`);
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          showError(data.error || t("fetchConversationsError"));
          return;
        }

        const convs = (data.chats || []).map((c) => ({
          id: String(c.id),
          patientId: c.patient?.id ? String(c.patient.id) : null,
          patientUserId: c.patient?.userId ? String(c.patient.userId) : null,
          patientName: c.patient?.fullName || t("patientFallbackName"),
          lastMessage: c.messages?.[0]?.text || "",
          lastMessageTime: formatMsgTime(c.messages?.[0]?.createdAt),
          unreadCount: Number(c.unreadCount || 0),
          online: false,
          avatar: "👨",
        }));

        if (!mounted) return;
        setConversations(convs);
        // Don't auto-open a specific patient's chat on first visit.
        // Keep the previous selection only if it still exists.
        setSelectedChat((prev) =>
          prev && convs.some((c) => String(c.id) === String(prev))
            ? prev
            : null,
        );

        const res2 = await fetch("/api/doctor/patients", {
          credentials: "include",
        });
        const patients = res2.ok ? await res2.json() : [];
        setAllPatients(patients);
      } catch (e) {
        console.error(e);
        showError(t("fetchDataError"));
      } finally {
        if (mounted) setLoadingChats(false);
      }
    }
    loadChatsAndPatients();
    return () => {
      mounted = false;
    };
  }, [locale, router, showError, t, formatMsgTime]);

  const patientIdToConversation = useMemo(() => {
    const map = {};
    conversations.forEach((c) => {
      if (c.patientId) map[c.patientId] = c;
    });
    return map;
  }, [conversations]);

  const requestedPatientId = useMemo(() => {
    try {
      const pid = searchParams?.get("patientId");
      return pid ? String(pid) : null;
    } catch {
      return null;
    }
  }, [searchParams]);

  const openedFromPatientRef = useRef(null);

  // If navigated from patients page with ?patientId=..., open (or create) that conversation.
  useEffect(() => {
    if (!requestedPatientId) return;
    if (loadingChats) return;
    if (openedFromPatientRef.current === requestedPatientId) return;
    openedFromPatientRef.current = requestedPatientId;

    const conv = patientIdToConversation[requestedPatientId];
    if (conv?.id) {
      setSelectedChat(String(conv.id));
      setConversations((cs) =>
        cs.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
      );
      return;
    }

    // No existing conversation yet — create one (same behavior as "start new chat" button).
    (async () => {
      try {
        const res = await fetch(`/api/chat/patient`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ patientId: requestedPatientId }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.chat?.id) {
          const patient = allPatients.find(
            (p) => String(p.id) === requestedPatientId,
          );
          const newConv = {
            id: String(data.chat.id),
            patientId: requestedPatientId,
            patientName: patient?.fullName || t("patientFallbackName"),
            lastMessage: "",
            lastMessageTime: "",
            unreadCount: 0,
            online: false,
            avatar: "👨",
          };
          setConversations((prev) => {
            if (prev.some((c) => String(c.id) === String(newConv.id)))
              return prev;
            return [...prev, newConv];
          });
          setSelectedChat(String(data.chat.id));
        } else {
          showError(data?.error || t("startChatFailed"));
        }
      } catch {
        showError(t("startChatFailed"));
      }
    })();
  }, [
    requestedPatientId,
    loadingChats,
    patientIdToConversation,
    allPatients,
    showError,
    t,
  ]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return allPatients;
    return allPatients.filter((p) =>
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allPatients, searchQuery]);

  const currentChat = selectedChat
    ? conversations.find((c) => c.id === selectedChat)
    : null;
  const currentMessages = useMemo(() => {
    return selectedChat ? messagesMap[selectedChat] || [] : [];
  }, [selectedChat, messagesMap]);

  const lastMessageKey = useMemo(() => {
    const last = currentMessages[currentMessages.length - 1];
    if (!last) return "";
    return String(
      last.id ||
        last.clientKey ||
        last.createdAt ||
        last.time ||
        currentMessages.length,
    );
  }, [currentMessages]);

  // Auto-scroll to bottom when messages change (send/receive)
  useEffect(() => {
    if (!selectedChat) return;
    const id = setTimeout(() => {
      try {
        const el = messagesContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      } catch (e) {}
    }, 0);
    return () => clearTimeout(id);
  }, [selectedChat, lastMessageKey]);

  // Load message history for the selected chat (so refresh doesn't clear messages)
  useEffect(() => {
    if (!selectedChat) return;
    const chatKey = String(selectedChat);
    if (loadedMessagesRef.current.has(chatKey)) return;

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/chat/${chatKey}/messages`, {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          // Avoid spamming toasts; log for debugging
          console.warn("Failed to load chat messages", res.status, data);
          return;
        }

        const mapped = (data.messages || []).map((msg) => ({
          ...msg,
          time: formatMsgTime(msg.createdAt),
        }));

        loadedMessagesRef.current.add(chatKey);
        // Reset unread badge when opening the chat (server marks messages as read best-effort).
        setConversations((cs) =>
          cs.map((c) => (c.id === chatKey ? { ...c, unreadCount: 0 } : c)),
        );
        setMessagesMap((m) => {
          const existing = m[chatKey] || [];
          if (!existing.length) return { ...m, [chatKey]: mapped };
          const merged = [...mapped];
          for (const ex of existing) {
            if (ex?.id && merged.some((x) => x?.id === ex.id)) continue;
            if (
              ex?.clientKey &&
              merged.some((x) => x?.clientKey === ex.clientKey)
            )
              continue;
            merged.push(ex);
          }
          return { ...m, [chatKey]: merged };
        });

        // scroll to bottom after hydration
        setTimeout(() => {
          try {
            const el = messagesContainerRef.current;
            if (el) el.scrollTop = el.scrollHeight;
          } catch (e) {}
        }, 0);
      } catch (e) {
        if (e?.name === "AbortError") return;
        console.error("Failed to load messages", e);
      }
    })();

    return () => controller.abort();
  }, [selectedChat, formatMsgTime]);

  // Keep socket subscribed to the currently selected chat room so doctors
  // receive patient messages/presence in real time.
  // Join ALL chat rooms in the left list so online/offline updates without reload.
  const _joinedChatsRef = useRef(new Set());
  useEffect(() => {
    if (!socket) return;
    try {
      const next = new Set((conversations || []).map((c) => String(c.id)));
      // join new rooms
      for (const id of next) {
        if (!_joinedChatsRef.current.has(id)) {
          try {
            socket.join && socket.join(id);
          } catch (e) {}
          _joinedChatsRef.current.add(id);
        }
      }
      // leave removed rooms
      for (const id of Array.from(_joinedChatsRef.current)) {
        if (!next.has(id)) {
          try {
            socket.leave && socket.leave(id);
          } catch (e) {}
          _joinedChatsRef.current.delete(id);
        }
      }
    } catch (e) {
      /* ignore */
    }
  }, [socket, conversations]);

  // Leave all joined rooms only when the socket changes or the page unmounts.
  useEffect(() => {
    if (!socket) return;
    const joined = _joinedChatsRef.current;
    return () => {
      try {
        for (const id of Array.from(joined)) {
          try {
            socket.leave && socket.leave(id);
          } catch (e) {}
        }
        joined.clear();
      } catch (e) {
        /* ignore */
      }
    };
  }, [socket]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) {
      showError(t("emptyMessage"));
      return;
    }
    const chatKey = String(selectedChat);
    const tempId = `tmp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      chatId: chatKey,
      sender: "doctor",
      text: messageInput,
      status: "sent",
      time: formatMsgTime(new Date().toISOString()),
      clientKey: tempId,
    };
    setMessagesMap((m) => ({
      ...m,
      [chatKey]: [...(m[chatKey] || []), tempMsg],
    }));
    setConversations((cs) =>
      cs.map((c) =>
        c.id === chatKey ? { ...c, lastMessage: messageInput } : c,
      ),
    );
    const textToSend = messageInput;
    setMessageInput("");

    const removeTemp = () =>
      setMessagesMap((m) => ({
        ...m,
        [chatKey]: (m[chatKey] || []).filter((x) => x.id !== tempId),
      }));

    try {
      if (socket && socket.connected) {
        socket.sendMessage(
          { chatId: chatKey, text: textToSend, clientKey: tempId },
          (res) => {
            if (res?.ok && res.message) {
              setMessagesMap((m) => {
                const list = (m[chatKey] || []).filter((x) => x.id !== tempId);
                // If server message already delivered via 'message' event, avoid adding duplicate
                if (
                  res.message &&
                  list.some(
                    (x) =>
                      (res.message.id && x.id === res.message.id) ||
                      (res.message.clientKey &&
                        x.clientKey === res.message.clientKey),
                  )
                ) {
                  return { ...m, [chatKey]: list };
                }
                return {
                  ...m,
                  [chatKey]: [
                    ...list,
                    {
                      ...res.message,
                      time: formatMsgTime(res.message.createdAt),
                    },
                  ],
                };
              });
              showSuccess(t("messageSent"));
            } else {
              removeTemp();
              showError(res?.error || t("errorSendMessage"));
            }
          },
        );
      } else {
        const res = await fetch(`/api/chat/${selectedChat}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text: textToSend }),
        });
        const data = await res.json();
        if (!res.ok) {
          removeTemp();
          showError(data.error || t("errorSendMessage"));
          return;
        }
        const res2 = await fetch(`/api/chat/${chatKey}/messages`, {
          credentials: "include",
        });
        const refreshed = await res2.json();
        if (res2.ok) {
          const mapped = (refreshed.messages || []).map((msg) => ({
            ...msg,
            time: formatMsgTime(msg.createdAt),
          }));
          setMessagesMap((m) => ({ ...m, [chatKey]: mapped }));
        }
        showSuccess(t("messageSent"));
      }
    } catch (e) {
      console.error(e);
      removeTemp();
      showError(t("connectionError"));
    }
  };

  const handleAttachment = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      "image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file || !selectedChat) return;
      // Create temp message for optimistic UI and retry support
      const tempId = `tmpfile-${Date.now()}`;
      const tempMsg = {
        id: tempId,
        chatId: selectedChat,
        sender: "doctor",
        status: "sent",
        time: formatMsgTime(new Date().toISOString()),
        clientKey: tempId,
        file,
      };
      setMessagesMap((m) => ({
        ...m,
        [selectedChat]: [...(m[selectedChat] || []), tempMsg],
      }));
      try {
        // Initialize upload (returns an upload URL + key)
        const initRes = await fetch("/api/uploads/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            chatId: selectedChat,
            filename: file.name,
            contentType: file.type,
          }),
        });
        const initData = await initRes.json();
        if (!initRes.ok || !initData?.uploadUrl) {
          setMessagesMap((m) => ({
            ...m,
            [selectedChat]: (m[selectedChat] || []).map((mm) =>
              mm.id === tempId ? { ...mm, status: "failed" } : mm,
            ),
          }));
          // Send message containing the file metadata via socket (fallback to HTTP)
          return;
        }

        // Upload with progress using XHR (fetch doesn't support progress reliably)
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", initData.uploadUrl, true);
          // set content-type for S3 signed PUTs if provided
          if (initData.provider === "s3" && file.type) {
            xhr.setRequestHeader("Content-Type", file.type);
          }
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              const percent = Math.round((ev.loaded / ev.total) * 100);
              setUploadProgress({
                uploading: true,
                percent,
                filename: file.name,
              });
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error("Upload failed"));
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.send(file);
        });

        // Complete upload and get public URL
        const compRes = await fetch("/api/uploads/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            chatId: selectedChat,
            key: initData.key,
            filename: file.name,
            contentType: file.type,
            provider: initData.provider,
            bucket: initData.bucket,
            region: initData.region,
          }),
        });
        const compData = await compRes.json();
        if (!compRes.ok || !compData?.url) {
          setMessagesMap((m) => ({
            ...m,
            [selectedChat]: (m[selectedChat] || []).map((mm) =>
              mm.id === tempId ? { ...mm, status: "failed" } : mm,
            ),
          }));
          showError(compData?.error || t("uploadCompleteFailed"));
          return;
        }
        // Send message containing the file metadata via socket (fallback to HTTP)
        try {
          if (socket && socket.connected) {
            socket.sendMessage(
              {
                chatId: selectedChat,
                fileUrl: compData.url,
                mimeType: compData.contentType || file.type,
                fileName: compData.filename || file.name,
                clientKey: tempId,
              },
              (res) => {
                if (res && res.ok && res.message) {
                  setMessagesMap((m) => {
                    const list = (m[selectedChat] || []).filter(
                      (x) => x.id !== tempId,
                    );
                    // avoid duplicates if message already emitted
                    if (
                      res.message &&
                      list.some(
                        (x) =>
                          (res.message.id && x.id === res.message.id) ||
                          (res.message.clientKey &&
                            x.clientKey === res.message.clientKey),
                      )
                    ) {
                      return { ...m, [selectedChat]: list };
                    }
                    return {
                      ...m,
                      [selectedChat]: [
                        ...list,
                        {
                          ...res.message,
                          time: formatMsgTime(res.message.createdAt),
                        },
                      ],
                    };
                  });
                  showSuccess(t("fileSent"));
                  setUploadProgress({
                    uploading: false,
                    percent: 0,
                    filename: null,
                  });
                } else {
                  // fallback to HTTP POST
                  (async () => {
                    const msgRes = await fetch(
                      `/api/chat/${selectedChat}/messages`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                          fileUrl: compData.url,
                          mimeType: compData.contentType || file.type,
                          fileName: compData.filename || file.name,
                          clientKey: tempId,
                        }),
                      },
                    );
                    if (!msgRes.ok) {
                      setMessagesMap((m) => ({
                        ...m,
                        [selectedChat]: (m[selectedChat] || []).map((mm) =>
                          mm.id === tempId ? { ...mm, status: "failed" } : mm,
                        ),
                      }));
                      const err = await msgRes.json().catch(() => ({}));
                      showError(
                        err.error || t("errorSendMessageWithFile"),
                        "error",
                      );
                      return;
                    }
                    const res2 = await fetch(
                      `/api/chat/${selectedChat}/messages`,
                      { credentials: "include" },
                    );
                    if (res2.ok) {
                      const refreshed = await res2.json();
                      const mapped = (refreshed.messages || []).map((m) => ({
                        ...m,
                        time: formatMsgTime(m.createdAt),
                      }));
                      setMessagesMap((m) => ({ ...m, [selectedChat]: mapped }));
                    }
                    showSuccess(t("fileSent"));
                    setUploadProgress({
                      uploading: false,
                      percent: 0,
                      filename: null,
                    });
                  })();
                }
              },
            );
          } else {
            const msgRes = await fetch(`/api/chat/${selectedChat}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                fileUrl: compData.url,
                mimeType: compData.contentType || file.type,
                fileName: compData.filename || file.name,
                clientKey: tempId,
              }),
            });
            if (!msgRes.ok) {
              setMessagesMap((m) => ({
                ...m,
                [selectedChat]: (m[selectedChat] || []).map((mm) =>
                  mm.id === tempId ? { ...mm, status: "failed" } : mm,
                ),
              }));
              const err = await msgRes.json().catch(() => ({}));
              showError(err.error || t("errorSendMessageWithFile"), "error");
              return;
            }
            const res2 = await fetch(`/api/chat/${selectedChat}/messages`, {
              credentials: "include",
            });
            if (res2.ok) {
              const mapped = (await res2.json()).messages.map((m) => ({
                ...m,
                time: formatMsgTime(m.createdAt),
              }));
              setMessagesMap((m) => ({ ...m, [selectedChat]: mapped }));
            }
            showSuccess(t("fileSent"));
            setUploadProgress({ uploading: false, percent: 0, filename: null });
          }
        } catch (e) {
          console.error("send file message failed", e);
          setMessagesMap((m) => ({
            ...m,
            [selectedChat]: (m[selectedChat] || []).map((mm) =>
              mm.id === tempId ? { ...mm, status: "failed" } : mm,
            ),
          }));
          showError(t("errorSendFileMessage"), "error");
          setUploadProgress({ uploading: false, percent: 0, filename: null });
        }
      } catch (e) {
        console.error(e);
        setMessagesMap((m) => ({
          ...m,
          [selectedChat]: (m[selectedChat] || []).map((mm) =>
            mm.id === tempId ? { ...mm, status: "failed" } : mm,
          ),
        }));
        showError(t("errorUploadFile"), "error");
      }
    };
    input.click();
  };

  const handleVoiceCall = () => showInfo(t("voiceCallStarted"));
  const handleVideoCall = () => showInfo(t("videoCallStarted"));

  const deleteSelectedChat = async () => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`/api/chat/${selectedChat}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || t("deleteConversationError"));
        return;
      }
      setConversations((cs) => cs.filter((c) => c.id !== selectedChat));
      setMessagesMap((m) => {
        const copy = { ...m };
        delete copy[selectedChat];
        return copy;
      });
      setSelectedChat((prev) => {
        const remaining = conversations.filter((c) => c.id !== prev);
        return remaining.length ? remaining[0].id : null;
      });
      showSuccess(t("deletedToast"));
    } catch (e) {
      console.error(e);
      showError(t("connectionError"));
    }
  };

  return (
    <DoctorLayout>
      <div className="h-screen bg-(--ui-surface-2) p-6 text-(--ui-foreground)">
        {socketMismatch && (
          <div className="mb-4 rounded-lg border-l-4 border-(--ui-danger) bg-(--ui-danger-bg) p-3 text-sm text-(--ui-danger-foreground)">
            <div className="flex items-start justify-between gap-4">
              <div>
                <strong>{t("socketMismatchTitle")}</strong>
                <div className="mt-1">{t("socketMismatchDescription")}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  fullWidth={false}
                  size="sm"
                  className="px-3"
                  onClick={() => window.location.reload()}
                >
                  {t("socketMismatchRetry")}
                </Button>
                <Button
                  variant="danger"
                  fullWidth={false}
                  size="sm"
                  className="px-3"
                  onClick={() => router.push(`/${locale}/login`)}
                >
                  {t("socketMismatchRelogin")}
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="mx-auto h-full max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-(--ui-foreground) flex items-center gap-3">
              <FaComments className="text-(--ui-info)" />
              {t("title")}
            </h1>
            <p className="mt-2 text-(--ui-muted-foreground)">{t("subtitle")}</p>
          </div>

          {/* Chat Container */}
          <div className="flex h-[calc(100%-120px)] gap-6 overflow-hidden">
            {/* Left Sidebar */}
            <Card className="flex w-80 shrink-0 flex-col overflow-hidden p-0">
              <div className="border-b border-(--ui-border) p-4">
                <div className="relative">
                  <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-(--ui-muted-foreground)" />
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-(--ui-border) bg-(--ui-surface) py-2 pr-10 pl-4 text-sm text-(--ui-foreground) placeholder:text-(--ui-muted-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredPatients.map((patient) => {
                  const conv = patientIdToConversation[String(patient.id)];
                  return (
                    <div
                      key={patient.id}
                      onClick={() => {
                        if (!conv) return;
                        setSelectedChat(conv.id);
                        // Optimistically clear badge when doctor opens this chat.
                        setConversations((cs) =>
                          cs.map((c) =>
                            c.id === conv.id ? { ...c, unreadCount: 0 } : c,
                          ),
                        );
                      }}
                      className={`cursor-pointer border-b border-(--ui-border) p-4 transition-all hover:bg-(--ui-surface-2) ${conv && selectedChat === conv.id ? "bg-(--ui-info-bg) border-l-4 border-l-(--ui-info)" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-(--ui-info-bg) text-2xl">
                          {conv?.avatar || "👤"}
                          {conv?.online ? (
                            <FaCircle className="absolute bottom-0 left-0 text-xs text-(--ui-success) bg-(--ui-surface) rounded-full" />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-(--ui-foreground) truncate">
                              {patient.fullName}
                            </h3>
                            <div className="flex items-center gap-2">
                              {conv?.unreadCount > 0 ? (
                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--ui-danger) px-1.5 text-xs font-semibold text-(--ui-danger-foreground)">
                                  {conv.unreadCount > 99
                                    ? "99+"
                                    : conv.unreadCount}
                                </span>
                              ) : null}
                              <span className="text-xs text-(--ui-muted-foreground)">
                                {conv?.lastMessageTime || ""}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-(--ui-muted-foreground) truncate">
                              {conv?.lastMessage || ""}
                            </p>
                            {!conv && (
                              <Button
                                variant="secondary"
                                fullWidth={false}
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const res = await fetch(
                                      `/api/chat/patient`,
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        credentials: "include",
                                        body: JSON.stringify({
                                          patientId: patient.id,
                                        }),
                                      },
                                    );
                                    const data = await res.json();
                                    if (res.ok && data.chat) {
                                      setConversations((prev) => [
                                        ...prev,
                                        {
                                          id: String(data.chat.id),
                                          patientId: patient.id
                                            ? String(patient.id)
                                            : null,
                                          patientName: patient.fullName,
                                          lastMessage: "",
                                          lastMessageTime: "",
                                          unreadCount: 0,
                                          online: false,
                                          avatar: "👨",
                                        },
                                      ]);
                                      setSelectedChat(String(data.chat.id));
                                    } else {
                                      showError(
                                        data.error || t("startChatFailed"),
                                        "error",
                                      );
                                    }
                                  } catch {
                                    showError(t("startChatFailed"), "error");
                                  }
                                }}
                              >
                                {t("startNewChat")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Right Side - Chat Window */}
            <Card className="flex flex-1 flex-col overflow-hidden p-0">
              {currentChat ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-(--ui-border) p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--ui-info-bg) text-2xl">
                          {currentChat.avatar}
                        </div>
                        {currentChat.online && (
                          <FaCircle className="absolute bottom-0 left-0 text-xs text-(--ui-success) bg-(--ui-surface) rounded-full" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-(--ui-foreground)">
                          {currentChat.patientName}
                        </h3>
                        <p className="text-sm text-(--ui-muted-foreground)">
                          {currentChat.online ? t("online") : t("offline")}
                        </p>
                        {currentChat &&
                          typingUsers[currentChat.patientUserId] && (
                            <p className="text-xs text-(--ui-muted-foreground)">
                              {t("typing")}
                            </p>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleVoiceCall}
                        className="rounded-lg p-2 text-(--ui-muted-foreground) hover:bg-(--ui-surface-2) hover:text-(--ui-info)"
                      >
                        <FaPhone />
                      </button>
                      <button
                        onClick={handleVideoCall}
                        className="rounded-lg p-2 text-(--ui-muted-foreground) hover:bg-(--ui-surface-2) hover:text-(--ui-info)"
                      >
                        <FaVideo />
                      </button>
                      <ChatActionsPopover
                        onDelete={deleteSelectedChat}
                        confirmText={t("confirmDelete.text")}
                        confirmYes={t("confirmDelete.yes")}
                        confirmNo={t("confirmDelete.no")}
                      />
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto bg-(--ui-surface-2) p-6"
                  >
                    <div className="space-y-4">
                      {currentMessages.map((msg, idx) => (
                        <div
                          key={`${msg.clientKey || msg.id}-${idx}`}
                          className={`flex ${msg.sender === "doctor" ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-md rounded-2xl px-4 py-3 ${msg.sender === "doctor" ? "bg-(--ui-info) text-(--ui-info-foreground) rounded-tr-sm" : "bg-(--ui-surface) text-(--ui-foreground) rounded-tl-sm shadow-(--shadow-soft) border border-(--ui-border)"}`}
                          >
                            {msg.fileUrl ||
                            (msg.file && typeof msg.file === "object") ? (
                              (() => {
                                const url =
                                  msg.fileUrl ||
                                  msg.file?.url ||
                                  (msg.file && URL.createObjectURL(msg.file));
                                const mime =
                                  msg.mimeType || msg.file?.type || "";
                                const name =
                                  msg.fileName ||
                                  msg.file?.name ||
                                  t("attachmentFallbackName");
                                if (mime && mime.startsWith("image/"))
                                  return (
                                    <Image
                                      src={url}
                                      alt={t("imageAlt")}
                                      className="max-w-full rounded object-contain"
                                      width={400}
                                      height={300}
                                    />
                                  );
                                if (mime && mime.includes("pdf"))
                                  return (
                                    <div className="flex items-center gap-2">
                                      <FaFilePdf className="text-(--ui-danger)" />
                                      <a
                                        href={url}
                                        target="_blank"
                                        className="underline"
                                      >
                                        {name}
                                      </a>
                                    </div>
                                  );
                                return (
                                  <div className="flex items-center gap-2">
                                    <FaFileAlt />
                                    <a
                                      href={url}
                                      target="_blank"
                                      className="underline"
                                    >
                                      {name}
                                    </a>
                                  </div>
                                );
                              })()
                            ) : (
                              <p className="text-sm">{msg.text}</p>
                            )}
                            <div
                              className={`mt-1 flex items-center justify-end gap-1 text-xs ${msg.sender === "doctor" ? "text-(--ui-info-foreground) opacity-80" : "text-(--ui-muted-foreground)"}`}
                            >
                              <span>{msg.time}</span>
                              {msg.sender === "doctor" &&
                                (msg.status === "sent" ? (
                                  <FaCheck />
                                ) : msg.status === "delivered" ? (
                                  <FaCheckDouble />
                                ) : msg.status === "read" ? (
                                  <FaCheckDouble className="text-(--ui-info-foreground)" />
                                ) : null)}
                              {msg.sender === "doctor" &&
                                msg.status === "failed" && (
                                  <button
                                    onClick={() => {
                                      // retry upload for this message
                                      try {
                                        const retryEvt = new CustomEvent(
                                          "chat:retry-upload",
                                          {
                                            detail: {
                                              chatId: msg.chatId,
                                              messageId: msg.id,
                                            },
                                          },
                                        );
                                        window.dispatchEvent(retryEvt);
                                      } catch (e) {
                                        console.error(e);
                                      }
                                    }}
                                    className="ml-2 text-xs px-2 py-1 rounded bg-(--ui-warning-bg) text-(--ui-warning-foreground)"
                                  >
                                    {t("retry")}
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-(--ui-border) bg-(--ui-surface) p-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleAttachment}
                        className="rounded-lg p-2 text-(--ui-muted-foreground) hover:bg-(--ui-surface-2) hover:text-(--ui-info)"
                      >
                        <FaPaperclip />
                      </button>
                      <div className="flex-1">
                        {uploadProgress.uploading && (
                          <div className="mb-2">
                            <div className="text-xs text-(--ui-muted-foreground)">
                              {t("uploadProgress", {
                                filename: uploadProgress.filename,
                                percent: uploadProgress.percent,
                              })}
                            </div>
                            <progress
                              value={uploadProgress.percent}
                              max={100}
                              className="h-2 w-full overflow-hidden rounded bg-(--ui-border) [&::-webkit-progress-bar]:bg-(--ui-border) [&::-webkit-progress-value]:bg-(--ui-info) [&::-moz-progress-bar]:bg-(--ui-info)"
                            />
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder={t("messageInput")}
                          value={messageInput}
                          onChange={(e) => {
                            setMessageInput(e.target.value);
                            try {
                              if (socket?.connected && selectedChat) {
                                socket.sendTyping(selectedChat, true);
                                if (typingTimeoutRef.current)
                                  clearTimeout(typingTimeoutRef.current);
                                typingTimeoutRef.current = setTimeout(
                                  () => socket.sendTyping(selectedChat, false),
                                  1500,
                                );
                              }
                            } catch {}
                          }}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleSendMessage()
                          }
                          className="flex-1 rounded-lg border border-(--ui-border) bg-(--ui-surface) px-4 py-3 text-sm text-(--ui-foreground) placeholder:text-(--ui-muted-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                        />
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        fullWidth={false}
                        size="sm"
                        className="h-11 w-11 p-0"
                      >
                        <FaPaperPlane />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <FaComments className="mx-auto mb-4 text-6xl text-(--ui-muted-foreground)" />
                    <p className="text-lg text-(--ui-muted-foreground)">
                      {t("selectChatPrompt")}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
