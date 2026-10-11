"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChatActionsPopover from "../../../components/chat/ChatActionsPopover.client";
import useSocket from "../../../components/chat/useSocket.client";
import { useToast } from "../../../components/ui/ToastProvider";
import {
  FaPaperPlane,
  FaPaperclip,
  FaCheck,
  FaCheckDouble,
  FaFilePdf,
  FaFileAlt,
  FaVideo,
  FaPhone,
} from "react-icons/fa";
import useLocale from "../../../hooks/useLocale";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { formatTime } from "../../../lib/date";


export default function PatientChatPage() {
  const { locale } = useLocale();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const t = useTranslations("patientChat");

  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-US";

  const formatMsgTime = useCallback(
    (value) => formatTime(value, dateLocale, placeholder),
    [dateLocale, placeholder],
  );

  const [doctorChat, setDoctorChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    uploading: false,
    percent: 0,
    filename: null,
  });
  const [jwtToken, setJwtToken] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); // عداد الرسائل الجديدة
  const socket = useSocket();
  const messagesContainerRef = useRef(null);
  const presenceByUserIdRef = useRef(new Map());
  const missingChatRetryRef = useRef(0);

  const mergeFetchedMessages = useCallback((prev, fetched) => {
    const incoming = Array.isArray(fetched) ? fetched : [];
    const current = Array.isArray(prev) ? prev : [];
    const seen = new Set();
    const out = [];

    // Prefer server ordering (createdAt asc), then append any local-only messages.
    for (const m of incoming) {
      const key = m?.id
        ? `id:${m.id}`
        : m?.clientKey
          ? `ck:${m.clientKey}`
          : null;
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      out.push(m);
    }
    for (const m of current) {
      const key = m?.id
        ? `id:${m.id}`
        : m?.clientKey
          ? `ck:${m.clientKey}`
          : null;
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      out.push(m);
    }
    return out;
  }, []);

  // --- Load doctor info ---
  useEffect(() => {
    async function loadDoctor() {
      try {
        const profileRes = await fetch("/api/patient/profile", {
          credentials: "include",
        });
        const profileData = await profileRes.json();
        const doctor = profileData?.profile?.doctor;
        if (!doctor) {
          showError(t("noDoctorLinked"));
          setDoctorChat(null);
          return;
        }
        setDoctorChat({
          id: null,
          doctorName: doctor.fullName,
          doctorUserId:
            doctor.userId || doctor.id || (doctor.user && doctor.user.id),
          avatar: "👩‍⚕️",
          isOnline: false,
        });
      } catch (e) {
        showError(t("errorLoadingChat"));
        setDoctorChat(null);
      }
    }
    loadDoctor();
  }, [showError, t]);

  // Ensure a chat exists as soon as we know the patient has a linked doctor.
  // Presence is scoped per chat room, so we need a chatId to join and receive online status.
  useEffect(() => {
    if (!doctorChat) return;
    if (doctorChat.id) return;
    let mounted = true;
    const controller = new AbortController();
    (async () => {
      try {
        // First try GET in case chat already exists
        const res = await fetch("/api/chat/patient", {
          credentials: "include",
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          const chats = data.chats || [];
          if (mounted && chats.length) {
            const first = chats[0];
            const chatId = first.id;
            setDoctorChat((prev) =>
              prev
                ? {
                    ...prev,
                    id: chatId,
                    doctorName: first.doctor?.user?.fullName || prev.doctorName,
                    doctorUserId:
                      first.doctor?.user?.id ||
                      first.doctor?.userId ||
                      prev.doctorUserId,
                  }
                : prev,
            );

            // Load full messages immediately for first render.
            try {
              const mres = await fetch(`/api/chat/${chatId}/messages`, {
                credentials: "include",
                signal: controller.signal,
              });
              if (mres.ok) {
                const mdata = await mres.json();
                if (mounted) {
                  const mapped = (mdata.messages || []).map((m) => ({
                    ...m,
                    time: formatMsgTime(m.createdAt),
                  }));
                  setMessages((prev) => mergeFetchedMessages(prev, mapped));
                }
              }
            } catch (e) {
              /* ignore */
            }
            return;
          }
        }

        // Otherwise create/reuse chat (idempotent)
        const cres = await fetch("/api/chat/patient", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          credentials: "include",
          signal: controller.signal,
        });
        if (!cres.ok) return;
        const cdata = await cres.json();
        const chatId = cdata?.chat?.id;
        if (mounted && chatId) {
          setDoctorChat((prev) => (prev ? { ...prev, id: chatId } : prev));

          // Load messages immediately after chat is ensured.
          try {
            const mres = await fetch(`/api/chat/${chatId}/messages`, {
              credentials: "include",
              signal: controller.signal,
            });
            if (mres.ok) {
              const mdata = await mres.json();
              if (mounted) {
                const mapped = (mdata.messages || []).map((m) => ({
                  ...m,
                  time: formatMsgTime(m.createdAt),
                }));
                setMessages((prev) => mergeFetchedMessages(prev, mapped));
              }
            }
          } catch (e) {
            /* ignore */
          }
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      mounted = false;
      try {
        controller.abort();
      } catch (e) {}
    };
  }, [doctorChat, formatMsgTime, mergeFetchedMessages]);

  // --- Try to load existing chat messages whenever chatId becomes available ---
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    if (!doctorChat?.id) return;
    (async () => {
      try {
        const mres = await fetch(`/api/chat/${doctorChat.id}/messages`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!mres.ok) {
          // If chat was deleted/changed server-side, reset and let the ensure-chat flow recreate/reselect.
          if (mres.status === 404 && missingChatRetryRef.current < 1) {
            missingChatRetryRef.current += 1;
            if (mounted) {
              setMessages([]);
              setDoctorChat((prev) => (prev ? { ...prev, id: null } : prev));
            }
          }
          return;
        }
        const mdata = await mres.json();
        if (!mounted) return;
        const mapped = (mdata.messages || []).map((m) => ({
          ...m,
          time: formatMsgTime(m.createdAt),
        }));
        setMessages((prev) => mergeFetchedMessages(prev, mapped));
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
      try {
        controller.abort();
      } catch (e) {}
    };
  }, [doctorChat?.id, formatMsgTime, mergeFetchedMessages]);

  // fetch JWT token for socket auth
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

  // --- Socket connection ---
  const chatId = doctorChat?.id;
  const doctorUserId = doctorChat?.doctorUserId;

  // If we already received presence events before doctorUserId was known, apply them now.
  useEffect(() => {
    if (!doctorUserId) return;
    const v = presenceByUserIdRef.current.get(String(doctorUserId));
    if (typeof v === "boolean") {
      setDoctorChat((prev) => ({ ...prev, isOnline: v }));
    }
  }, [doctorUserId]);

  useEffect(() => {
    if (!socket) return;
    if (jwtToken) {
      try {
        socket.connect({ token: jwtToken });
      } catch (e) {
        socket.connect();
      }
    } else {
      socket.connect();
    }

    // join chat room if we already have a chat id so we receive live messages
    try {
      if (chatId && socket && socket.join) {
        socket.join(chatId);
      }
    } catch (e) {}

    const offMsg = socket.onMessage((msg) => {
      if (!msg) return;
      setMessages((prev) => {
        if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
        if (msg.clientKey && prev.some((m) => m.clientKey === msg.clientKey))
          return prev;
        return [
          ...prev,
          {
            ...msg,
            time: formatMsgTime(msg.createdAt),
          },
        ];
      });

      // If the chat is open and a doctor message arrives, mark it as read immediately.
      try {
        const incomingChatId = msg.chatId;
        if (
          incomingChatId &&
          chatId &&
          String(incomingChatId) === String(chatId) &&
          msg.sender === "doctor" &&
          msg.id
        ) {
          socket.emitEvent &&
            socket.emitEvent("read_ack", { messageIds: [msg.id] });
        }
      } catch (e) {}
    });

    const offUpdate = socket.onMessageUpdate((upd) => {
      if (!upd || !upd.id) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === upd.id ? { ...m, status: upd.status } : m)),
      );
    });

    const offRead = socket.onMessageRead((info) => {
      if (!info || !info.messageId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === info.messageId ? { ...m, status: "read" } : m,
        ),
      );
    });

    const offPresence = socket.onPresence(({ userId, online }) => {
      if (!userId) return;
      // Cache presence events so we can apply them even if doctorUserId isn't loaded yet.
      try {
        presenceByUserIdRef.current.set(String(userId), Boolean(online));
      } catch (e) {}

      // if presence refers to the linked doctor, update UI
      if (doctorUserId && String(userId) === String(doctorUserId)) {
        setDoctorChat((prev) => ({ ...prev, isOnline: Boolean(online) }));
      }
    });

    // --- تحديث عداد الرسائل الجديدة عند استقبال event من السيرفر ---
    const offUnread = socket.on && socket.on("unread_count_update", (data) => {
      if (data && typeof data.count === "number") setUnreadCount(data.count);
    });

    return () => {
      offMsg && offMsg();
      offUpdate && offUpdate();
      offRead && offRead();
      offPresence && offPresence();
      offUnread && offUnread();
    };
  }, [socket, jwtToken, chatId, doctorUserId, formatMsgTime]);


  // --- Auto scroll ---
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } catch (e) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  // --- تم إلغاء Polling لأن التحديث يتم عبر Socket event ---

  // --- Send message ---
  const handleSendMessage = async () => {
    let chatId = doctorChat.id;

    // إنشاء الدردشة إذا لم توجد
    if (!chatId) {
      try {
        const res = await fetch("/api/chat/patient", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.chat && data.chat.id) {
          chatId = data.chat.id;
          setDoctorChat((prev) => ({ ...prev, id: chatId }));
        } else {
          showError(data.error || t("createChatFailed"));
          return;
        }
      } catch (e) {
        showError(t("connectionError"));
        return;
      }
    }

    // --- Upload file if exists (presigned/init -> PUT -> complete) ---
    if (file) {
      const tempId = `tmpfile-${Date.now()}`;
      const tempMsg = {
        id: tempId,
        chatId,
        sender: "patient",
        status: "sent",
        time: formatMsgTime(new Date().toISOString()),
        clientKey: tempId,
        file,
      };
      setMessages((prev) => [...prev, tempMsg]);

      try {
        const initRes = await fetch("/api/uploads/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            chatId,
            filename: file.name,
            contentType: file.type,
          }),
        });
        const initData = await initRes.json();
        if (!initRes.ok || !initData?.uploadUrl) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          showError(initData?.error || t("errorSendFile"));
          setFile(null);
          return;
        }

        // upload with XHR for progress
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", initData.uploadUrl, true);
          if (initData.provider === "s3" && file.type)
            xhr.setRequestHeader("Content-Type", file.type);
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

        const compRes = await fetch("/api/uploads/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            chatId,
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
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          showError(compData?.error || t("errorSendFile"));
          setUploadProgress({ uploading: false, percent: 0, filename: null });
          setFile(null);
          return;
        }
        // update temp message to include file url
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, file: { ...file, url: compData.url } }
              : m,
          ),
        );
        setUploadProgress({ uploading: false, percent: 0, filename: null });

        // Notify server / room about the new message
        try {
          if (socket && socket.connected) {
            socket.sendMessage(
              {
                chatId,
                fileUrl: compData.url,
                mimeType: compData.contentType || file.type,
                fileName: compData.filename || file.name,
                clientKey: tempId,
              },
              (res) => {
                if (res && res.ok && res.message) {
                  setMessages((prev) => {
                    const filtered = prev.filter(
                      (x) => x.id !== tempId && x.id !== res.message.id,
                    );
                    const serverMsg = {
                      ...res.message,
                      time: formatMsgTime(res.message.createdAt),
                    };
                    return [...filtered, serverMsg];
                  });
                } else {
                  // fallback: try HTTP POST
                  (async () => {
                    try {
                      const r = await fetch(`/api/chat/${chatId}/messages`, {
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
                      if (r.ok) {
                        const d = await r.json();
                        // refresh messages
                        const r2 = await fetch(`/api/chat/${chatId}/messages`, {
                          credentials: "include",
                        });
                        if (r2.ok) {
                          const refreshed = await r2.json();
                          setMessages(
                            (refreshed.messages || []).map((m) => ({
                              ...m,
                              time: formatMsgTime(m.createdAt),
                            })),
                          );
                        }
                      }
                    } catch (e) {
                      console.error("fallback post message failed", e);
                    }
                  })();
                }
              },
            );
          } else {
            // socket not connected, use HTTP POST
            const r = await fetch(`/api/chat/${chatId}/messages`, {
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
            if (r.ok) {
              const r2 = await fetch(`/api/chat/${chatId}/messages`, {
                credentials: "include",
              });
              if (r2.ok) {
                const refreshed = await r2.json();
                setMessages(
                  (refreshed.messages || []).map((m) => ({
                    ...m,
                    time: formatMsgTime(m.createdAt),
                  })),
                );
              }
            }
          }
        } catch (e) {
          console.error("notify message failed", e);
        }
      } catch (e) {
        console.error(e);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        showError(t("connectionError"));
        setUploadProgress({ uploading: false, percent: 0, filename: null });
      } finally {
        setFile(null);
        return;
      }
    }

    // --- Send text message ---
    if (!messageInput.trim()) return;
    const tempId = `tmp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      chatId,
      sender: "patient",
      text: messageInput,
      status: "sent",
      time: formatMsgTime(new Date().toISOString()),
      clientKey: tempId,
    };
    setMessages((prev) => [...prev, tempMsg]);
    const textToSend = messageInput;
    setMessageInput("");

    if (socket && socket.connected) {
      socket.sendMessage(
        { chatId, text: textToSend, clientKey: tempId },
        (res) => {
          if (res && res.ok && res.message) {
            setMessages((prev) => {
              const filtered = prev.filter(
                (x) => x.id !== tempId && x.id !== res.message.id,
              );
              const serverMsg = {
                ...res.message,
                time: formatMsgTime(res.message.createdAt),
              };
              return [...filtered, serverMsg];
            });
          } else {
            setMessages((prev) => prev.filter((x) => x.id !== tempId));
            showError(res?.error || t("errorSendMessage"));
          }
        },
      );
    } else {
      try {
        const res = await fetch(`/api/chat/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text: textToSend }),
        });
        if (!res.ok) showError(t("errorSendMessage"));
      } catch (e) {
        showError(t("connectionError"));
        setMessages((prev) => prev.filter((x) => x.id !== tempId));
      }
    }
  };

  // send a file immediately after selection (no need to press send)
  const sendFileImmediate = async (selectedFile) => {
    if (!selectedFile) return;
    let chatId = doctorChat && doctorChat.id;

    if (!chatId) {
      try {
        const res = await fetch("/api/chat/patient", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.chat && data.chat.id) {
          chatId = data.chat.id;
          setDoctorChat((prev) => ({ ...prev, id: chatId }));
        } else {
          showError(data.error || t("createChatFailed"));
          return;
        }
      } catch (e) {
        showError(t("connectionError"));
        return;
      }
    }

    const tempId = `tmpfile-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      chatId,
      sender: "patient",
      status: "sent",
      time: formatMsgTime(new Date().toISOString()),
      clientKey: tempId,
      file: selectedFile,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setUploadProgress({
      uploading: true,
      percent: 0,
      filename: selectedFile.name,
    });

    try {
      const initRes = await fetch("/api/uploads/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          chatId,
          filename: selectedFile.name,
          contentType: selectedFile.type,
        }),
      });
      const initData = await initRes.json();
      if (!initRes.ok || !initData?.uploadUrl) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        showError(initData?.error || t("errorSendFile"));
        setUploadProgress({ uploading: false, percent: 0, filename: null });
        return;
      }

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", initData.uploadUrl, true);
        if (initData.provider === "s3" && selectedFile.type)
          xhr.setRequestHeader("Content-Type", selectedFile.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const percent = Math.round((ev.loaded / ev.total) * 100);
            setUploadProgress({
              uploading: true,
              percent,
              filename: selectedFile.name,
            });
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(selectedFile);
      });

      const compRes = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          chatId,
          key: initData.key,
          filename: selectedFile.name,
          contentType: selectedFile.type,
          provider: initData.provider,
          bucket: initData.bucket,
          region: initData.region,
        }),
      });
      const compData = await compRes.json();
      if (!compRes.ok || !compData?.url) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        showError(compData?.error || t("errorSendFile"));
        setUploadProgress({ uploading: false, percent: 0, filename: null });
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, file: { ...selectedFile, url: compData.url } }
            : m,
        ),
      );
      setUploadProgress({ uploading: false, percent: 0, filename: null });

      try {
        if (socket && socket.connected) {
          socket.sendMessage(
            {
              chatId,
              fileUrl: compData.url,
              mimeType: compData.contentType || selectedFile.type,
              fileName: compData.filename || selectedFile.name,
              clientKey: tempId,
            },
            (res) => {
              if (res && res.ok && res.message) {
                setMessages((prev) => {
                  const filtered = prev.filter(
                    (x) => x.id !== tempId && x.id !== res.message.id,
                  );
                  const serverMsg = {
                    ...res.message,
                    time: formatMsgTime(res.message.createdAt),
                  };
                  return [...filtered, serverMsg];
                });
              } else {
                (async () => {
                  try {
                    const r = await fetch(`/api/chat/${chatId}/messages`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        fileUrl: compData.url,
                        mimeType: compData.contentType || selectedFile.type,
                        fileName: compData.filename || selectedFile.name,
                        clientKey: tempId,
                      }),
                    });
                    if (r.ok) {
                      const r2 = await fetch(`/api/chat/${chatId}/messages`, {
                        credentials: "include",
                      });
                      if (r2.ok) {
                        const refreshed = await r2.json();
                        setMessages(
                          (refreshed.messages || []).map((m) => ({
                            ...m,
                            time: formatMsgTime(m.createdAt),
                          })),
                        );
                      }
                    }
                  } catch (e) {
                    console.error("fallback post message failed", e);
                  }
                })();
              }
            },
          );
        } else {
          const r = await fetch(`/api/chat/${chatId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              fileUrl: compData.url,
              mimeType: compData.contentType || selectedFile.type,
              fileName: compData.filename || selectedFile.name,
              clientKey: tempId,
            }),
          });
          if (r.ok) {
            const r2 = await fetch(`/api/chat/${chatId}/messages`, {
              credentials: "include",
            });
            if (r2.ok) {
              const refreshed = await r2.json();
              setMessages(
                (refreshed.messages || []).map((m) => ({
                  ...m,
                  time: formatMsgTime(m.createdAt),
                })),
              );
            }
          }
        }
      } catch (e) {
        console.error("notify message failed", e);
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      showError(t("connectionError"));
      setUploadProgress({ uploading: false, percent: 0, filename: null });
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      sendFileImmediate(selected);
    }
  };
  const handleRetryUpload = async (messageId) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || !msg.file) return;
    const theFile = msg.file && msg.file instanceof File ? msg.file : msg.file;
    // mark uploading
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, status: "uploading" } : m)),
    );
    try {
      const initRes = await fetch("/api/uploads/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          chatId: msg.chatId,
          filename: theFile.name,
          contentType: theFile.type,
        }),
      });
      const initData = await initRes.json();
      if (!initRes.ok || !initData?.uploadUrl)
        throw new Error(initData?.error || "init_failed");
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", initData.uploadUrl, true);
        if (initData.provider === "s3" && theFile.type)
          xhr.setRequestHeader("Content-Type", theFile.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable)
            setUploadProgress({
              uploading: true,
              percent: Math.round((ev.loaded / ev.total) * 100),
              filename: theFile.name,
            });
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("upload_failed"));
        };
        xhr.onerror = () => reject(new Error("upload_failed"));
        xhr.send(theFile);
      });
      const compRes = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          chatId: msg.chatId,
          key: initData.key,
          filename: theFile.name,
          contentType: theFile.type,
          provider: initData.provider,
          bucket: initData.bucket,
          region: initData.region,
        }),
      });
      const compData = await compRes.json();
      if (!compRes.ok || !compData?.url)
        throw new Error(compData?.error || "complete_failed");
      // send message with file metadata
      const msgRes = await fetch(`/api/chat/${msg.chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileUrl: compData.url,
          mimeType: compData.contentType || theFile.type,
          fileName: compData.filename || theFile.name,
        }),
      });
      if (!msgRes.ok) throw new Error("send_failed");
      // replace temp message with server message via fetching messages list
      const res2 = await fetch(`/api/chat/${msg.chatId}/messages`, {
        credentials: "include",
      });
      if (res2.ok) {
        const refreshed = await res2.json();
        const mapped = (refreshed.messages || []).map((m) => ({
          ...m,
          time: formatMsgTime(m.createdAt),
        }));
        setMessages(mapped);
      }
      setUploadProgress({ uploading: false, percent: 0, filename: null });
    } catch (e) {
      console.error("retry upload failed", e);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: "failed" } : m)),
      );
      setUploadProgress({ uploading: false, percent: 0, filename: null });
      showError(t("errorSendFile"));
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const handleDeleteChat = async () => {
    setMessages([]);
    showSuccess(t("chatCleared"));
  };

  return (
    <>
      <div className="min-h-screen bg-(--ui-surface) text-(--ui-foreground) p-4">
        <div className="mx-auto w-full max-w-5xl h-[calc(100vh-2rem)] rounded-2xl border border-(--ui-border) overflow-hidden flex flex-col bg-(--ui-surface)">
          {doctorChat ? (
            <>
              {/* Header */}
              <div className="bg-(--ui-surface) border-b border-(--ui-border) p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-(--ui-info-bg) border border-(--ui-info-border) flex items-center justify-center text-xl">
                      {doctorChat.avatar}
                    </div>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 shadow">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-(--ui-foreground)">
                      {doctorChat.doctorName}
                    </h3>
                    <div className="mt-0.5 inline-flex items-center gap-2 text-xs">
                      <span
                        className={`h-2 w-2 rounded-full ${doctorChat.isOnline ? "bg-(--ui-success)" : "bg-(--ui-muted-foreground)"}`}
                      />
                      <span
                        className={
                          doctorChat.isOnline
                            ? "text-(--ui-success)"
                            : "text-(--ui-muted-foreground)"
                        }
                      >
                        {doctorChat.isOnline ? t("online") : t("offline")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showInfo(t("voiceCallSoon"))}
                    className="p-2 hover:bg-(--ui-surface-2)/60 rounded-full"
                  >
                    <FaPhone />
                  </button>
                  <button
                    onClick={() => showInfo(t("videoCallSoon"))}
                    className="p-2 hover:bg-(--ui-surface-2)/60 rounded-full"
                  >
                    <FaVideo />
                  </button>
                  <ChatActionsPopover
                    onDelete={handleDeleteChat}
                    confirmText={t("confirmDelete")}
                    confirmYes={t("delete")}
                    confirmNo={t("cancel")}
                  />
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-(--ui-muted-foreground)">
                    {t("noMessagesYet")}
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={msg.clientKey || `${msg.id}-${idx}`}
                      className={`flex ${msg.sender === "patient" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.sender === "patient" ? "bg-(--ui-info) text-(--ui-info-foreground)" : "border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) shadow-sm"}`}
                      >
                        {(msg.file &&
                          typeof msg.file === "object" &&
                          typeof msg.file.type === "string") ||
                        msg.fileUrl ? (
                          (() => {
                            const url =
                              msg.fileUrl ||
                              msg.file?.url ||
                              (msg.file && URL.createObjectURL(msg.file));
                            const mime = msg.mimeType || msg.file?.type || "";
                            const name =
                              msg.fileName ||
                              msg.file?.name ||
                              t("attachmentFallbackName");
                            if (mime && mime.startsWith("image/")) {
                               
                              return (
                                <div className="relative w-full">
                                  <Image
                                    src={url}
                                    alt={t("attachmentImageAlt")}
                                    className="max-w-full rounded"
                                    unoptimized
                                    width={800}
                                    height={600}
                                  />
                                </div>
                              );
                            }
                            if (mime && mime.includes("pdf"))
                              return (
                                <div className="flex items-center gap-2">
                                  <FaFilePdf className="text-(--ui-danger)" />
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
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
                                  rel="noreferrer"
                                  className="underline"
                                >
                                  {name}
                                </a>
                              </div>
                            );
                          })()
                        ) : (
                          <p className="text-sm mb-1">{msg.text}</p>
                        )}
                        <div className="flex justify-between items-center mt-1 text-xs">
                          <span>{msg.time}</span>
                          <div className="flex items-center gap-2">
                            {msg.sender === "patient" && (
                              <span>
                                {msg.status === "sent" ? (
                                  <FaCheck />
                                ) : msg.status === "delivered" ? (
                                  <FaCheckDouble />
                                ) : msg.status === "read" ? (
                                  <FaCheckDouble className="text-(--ui-info) opacity-80" />
                                ) : null}
                              </span>
                            )}
                            {msg.status === "failed" && (
                              <button
                                onClick={() => handleRetryUpload(msg.id)}
                                className="text-xs px-2 py-1 rounded bg-(--ui-warning-bg) text-(--ui-foreground) border border-(--ui-warning-border)"
                              >
                                {t("retry")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="bg-(--ui-surface) border-t border-(--ui-border) p-3 flex gap-2 items-center">
                <label className="p-2 hover:bg-(--ui-surface-2)/60 rounded-full cursor-pointer">
                  <FaPaperclip className="text-(--ui-muted-foreground)" />
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
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
                        className="h-2 w-full overflow-hidden rounded border border-(--ui-border) bg-(--ui-surface-2) [&::-webkit-progress-bar]:bg-(--ui-surface-2) [&::-webkit-progress-value]:bg-(--ui-info) [&::-moz-progress-bar]:bg-(--ui-info)"
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t("messagePlaceholder")}
                    className="w-full px-4 py-2 border border-(--ui-border) rounded-full bg-(--ui-surface) text-(--ui-foreground) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring)"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() && !file}
                  className="rounded-full bg-(--ui-info) p-2 text-(--ui-info-foreground) transition-colors hover:bg-(--ui-info)/90 disabled:opacity-50"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-bold text-(--ui-foreground)">
                  {t("emptyStateTitle")}
                </h3>
                <p className="text-(--ui-muted-foreground)">
                  {t("emptyStateDescription")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
