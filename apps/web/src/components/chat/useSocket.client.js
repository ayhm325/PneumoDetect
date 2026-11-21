"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { io } from "socket.io-client";

// Client hook to connect to Socket.io server.
// Usage:
// const { connect, sendMessage, onMessage, connected } = useSocket();

export default function useSocket({ url } = {}) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const getPresenceStore = useCallback(() => {
    globalThis.__app_presence_store = globalThis.__app_presence_store || {
      byUserId: new Map(),
    };
    return globalThis.__app_presence_store;
  }, []);

  const bindPresenceCache = useCallback(
    (sock) => {
      if (!sock) return;
      try {
        if (sock.__app_presenceCacheBound) return;
        sock.__app_presenceCacheBound = true;
      } catch (e) {
        // If we can't mark it, still try to bind (worst case duplicates are harmless).
      }

      const handler = (evt) => {
        try {
          if (!evt || !evt.userId) return;
          const store = getPresenceStore();
          store.byUserId.set(String(evt.userId), Boolean(evt.online));
        } catch (e) {}
      };

      try {
        sock.on("presence", handler);
      } catch (e) {}
    },
    [getPresenceStore],
  );

  const getUserKeyForSocket = useCallback((sock) => {
    try {
      return sock && sock.__app_userKey
        ? String(sock.__app_userKey)
        : "__anon__";
    } catch {
      return "__anon__";
    }
  }, []);

  const getJoinedRoomsForUser = useCallback((userKey) => {
    globalThis.__app_socket_joinedRooms_by_user =
      globalThis.__app_socket_joinedRooms_by_user || new Map();
    const m = globalThis.__app_socket_joinedRooms_by_user;
    const key = String(userKey || "__anon__");
    if (m.has(key)) return m.get(key);
    const set = new Set();
    m.set(key, set);
    return set;
  }, []);

  const rejoinAllRooms = useCallback(
    (sock) => {
      if (!sock) return;
      try {
        const userKey = getUserKeyForSocket(sock);
        const joined = getJoinedRoomsForUser(userKey);
        if (!joined || !joined.size) return;
        for (const chatId of joined) {
          try {
            sock.emit("join", chatId);
          } catch (e) {}
        }
      } catch (e) {}
    },
    [getJoinedRoomsForUser, getUserKeyForSocket],
  );

  // Helper to find any existing global socket (prefer hook socketRef)
  const getGlobalSocket = useCallback(() => {
    if (socketRef.current) return socketRef.current;
    const map = globalThis.__app_socket_by_user;
    if (map && typeof map === "object") {
      const keys = Object.keys(map);
      if (keys.length) return map[keys[0]].socket;
    }
    return (globalThis.__app_socket && globalThis.__app_socket.socket) || null;
  }, []);
  // Create or reuse a global, reference-counted socket instance to avoid
  // multiple connections during HMR or when multiple components mount.
  const connect = useCallback(
    (opts = {}) => {
      // If we already have a socket for the same user, reuse it; otherwise ensure previous socket is cleaned up
      const providedToken =
        opts.token ||
        (typeof window !== "undefined" ? window.__DEV_TOKEN : undefined);
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
      const newPayload = providedToken ? decodePayload(providedToken) : null;
      const newUserId =
        newPayload && (newPayload.id ?? newPayload.userId ?? null);

      if (socketRef.current) {
        // If existing hook socket is for a different user, and we know newUserId, ensure we don't keep wrong user
        const existingUserKey = socketRef.current.__app_userKey || null;
        if (
          newUserId &&
          existingUserKey &&
          String(newUserId) !== String(existingUserKey)
        ) {
          try {
            socketRef.current.disconnect();
          } catch (e) {}
          socketRef.current = null;
        } else {
          return socketRef.current;
        }
      }

      const devToken =
        typeof window !== "undefined" ? window.__DEV_TOKEN : undefined;
      const authToken =
        opts.token || devToken ? opts.token || devToken : undefined;
      const auth = authToken ? { token: authToken } : undefined;
      const defaultUrl =
        typeof window !== "undefined" &&
        (devToken || process.env.NODE_ENV === "development")
          ? typeof window !== "undefined" &&
            (window.__DEV_SOCKET_URL || globalThis.__DEV_SOCKET_URL)
            ? window.__DEV_SOCKET_URL || globalThis.__DEV_SOCKET_URL
            : "http://localhost:4000"
          : typeof window !== "undefined"
            ? window.location.origin
            : "";

      const socketKey = url || defaultUrl;

      // reuse per-user socket if present and for same URL
      const map = globalThis.__app_socket_by_user || {};
      const userKey = newUserId || "__anon__";
      if (map[userKey] && map[userKey].url === socketKey) {
        map[userKey].refcount = (map[userKey].refcount || 0) + 1;
        socketRef.current = map[userKey].socket;
        // attach per-hook listeners for connect/disconnect but keep references
        const existing = socketRef.current;
        const onConnect = () => {
          setConnected(true);
          rejoinAllRooms(existing);
        };
        const onDisconnect = () => setConnected(false);
        existing.on("connect", onConnect);
        existing.on("disconnect", onDisconnect);
        // store a per-hook cleanup so we only remove the handlers added by this hook
        socketRef.current._myCleanup = () => {
          try {
            existing.off("connect", onConnect);
            existing.off("disconnect", onDisconnect);
          } catch (e) {}
        };

        // If a token was provided and differs from the current socket auth, update it and force reconnect
        const newToken = authToken;
        try {
          if (newToken && existing.auth?.token !== newToken) {
            existing.auth = { token: newToken };
            try {
              if (existing.connected) existing.disconnect();
              existing.connect();
            } catch (e) {}
          }
        } catch (e) {}

        // Ensure we cache presence events even if no page has subscribed yet.
        try {
          bindPresenceCache(existing);
        } catch (e) {}

        return socketRef.current;
      }

      // create new socket but do not autoConnect to control when we connect
      const socket = io(socketKey, {
        auth,
        withCredentials: true,
        transports: ["websocket", "polling"],
        autoConnect: false,
        reconnectionAttempts: 5,
        reconnectionDelayMax: 2000,
      });

      // store in per-user map
      try {
        const userKeyStore = newUserId || "__anon__";
        globalThis.__app_socket_by_user = globalThis.__app_socket_by_user || {};
        globalThis.__app_socket_by_user[userKeyStore] = {
          socket,
          url: socketKey,
          refcount:
            (globalThis.__app_socket_by_user[userKeyStore]?.refcount || 0) + 1,
        };
        // tag socket with userKey for cleanup
        try {
          socket.__app_userKey = userKeyStore;
        } catch (e) {}
        // also set legacy pointer for compatibility
        globalThis.__app_socket = { socket, url: socketKey };
        try {
          globalThis.__app_socket_userId = newUserId;
        } catch (e) {}
      } catch (e) {}

      // set up per-hook listeners and save cleanup
      const onConnect = () => {
        setConnected(true);
        rejoinAllRooms(socket);
      };
      const onDisconnect = () => setConnected(false);
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket._myCleanup = () => {
        try {
          socket.off("connect", onConnect);
          socket.off("disconnect", onDisconnect);
        } catch (e) {}
      };

      // Ensure we cache presence events even if no page has subscribed yet.
      try {
        bindPresenceCache(socket);
      } catch (e) {}

      // initiate connection
      try {
        socket.connect();
      } catch (e) {
        // ignore connect errors; connect will retry according to socket.io settings
      }

      socketRef.current = socket;
      return socket;
    },
    [url, rejoinAllRooms, bindPresenceCache],
  );

  const disconnect = useCallback(() => {
    const sock = socketRef.current;
    if (!sock) return;
    // run per-hook cleanup (remove handlers added by this hook)
    try {
      if (sock._myCleanup) {
        sock._myCleanup();
        sock._myCleanup = null;
      }
    } catch (e) {}
    // Prefer per-user map refcounts
    try {
      const userKey = sock.__app_userKey || "__anon__";
      const map = globalThis.__app_socket_by_user || {};
      if (map[userKey]) {
        map[userKey].refcount = Math.max((map[userKey].refcount || 1) - 1, 0);
        if (map[userKey].refcount === 0) {
          try {
            sock.disconnect();
          } catch (e) {}
          try {
            delete globalThis.__app_socket_by_user[userKey];
          } catch (e) {}
          try {
            if (globalThis.__app_socket_joinedRooms_by_user)
              globalThis.__app_socket_joinedRooms_by_user.delete(
                String(userKey),
              );
          } catch (e) {}
          // clean legacy pointer if it matches
          try {
            if (
              globalThis.__app_socket &&
              globalThis.__app_socket.socket === sock
            ) {
              delete globalThis.__app_socket;
              delete globalThis.__app_socket_userId;
            }
          } catch (e) {}
        }
        socketRef.current = null;
        return;
      }
    } catch (e) {}

    // fallback: legacy global refcount
    try {
      globalThis.__app_socket_refcount = Math.max(
        (globalThis.__app_socket_refcount || 1) - 1,
        0,
      );
      if (globalThis.__app_socket_refcount === 0) {
        try {
          sock.disconnect();
        } catch (e) {}
        delete globalThis.__app_socket;
        delete globalThis.__app_socket_refcount;
      }
    } catch (e) {}
    socketRef.current = null;
  }, []);

  const join = useCallback(
    (chatId) => {
      const sock = socketRef.current || getGlobalSocket();
      if (!sock) return;
      const userKey = getUserKeyForSocket(sock);
      const joined = getJoinedRoomsForUser(userKey);
      if (joined.has(chatId)) return;
      try {
        sock.emit("join", chatId);
        joined.add(chatId);
      } catch (e) {}
    },
    [getGlobalSocket, getJoinedRoomsForUser, getUserKeyForSocket],
  );

  const leave = useCallback(
    (chatId) => {
      const sock = socketRef.current || getGlobalSocket();
      if (!sock) return;
      try {
        sock.emit("leave", chatId);
        const userKey = getUserKeyForSocket(sock);
        const joined =
          globalThis.__app_socket_joinedRooms_by_user &&
          globalThis.__app_socket_joinedRooms_by_user.get(String(userKey));
        if (joined) joined.delete(chatId);
      } catch (e) {}
    },
    [getGlobalSocket, getUserKeyForSocket],
  );

  const sendMessage = useCallback((payload, cb) => {
    if (!socketRef.current) return cb && cb({ error: "not_connected" });

    // Ensure a stable clientKey exists for idempotency. Prefer native crypto
    // in browsers, fallback to a timestamp-based key if unavailable.
    try {
      if (!payload.clientKey) {
        if (
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
        ) {
          payload.clientKey = crypto.randomUUID();
        } else {
          payload.clientKey = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        }
      }
    } catch (e) {
      payload.clientKey =
        payload.clientKey ||
        `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    socketRef.current.emit("message", payload, cb);
  }, []);

  const sendTyping = useCallback((chatId, typing = true) => {
    if (!socketRef.current) return;
    socketRef.current.emit("typing", { chatId, typing });
  }, []);

  const onTyping = useCallback(
    (handler) => {
      const sock = socketRef.current || getGlobalSocket();
      if (!sock) return;
      sock.on("typing", handler);
      return () => {
        try {
          sock.off("typing", handler);
        } catch (e) {}
      };
    },
    [getGlobalSocket],
  );

  const onPresence = useCallback(
    (handler) => {
      const sock = socketRef.current || getGlobalSocket();
      if (!sock) return;

      // Replay current online users asynchronously so late subscribers don't miss the
      // initial snapshot (which is emitted at connect time).
      try {
        const store = getPresenceStore();
        const replay = () => {
          try {
            for (const [userId, online] of store.byUserId.entries()) {
              if (!online) continue;
              try {
                handler({ userId, online: true });
              } catch (e) {}
            }
          } catch (e) {}
        };
        try {
          if (typeof queueMicrotask === "function") queueMicrotask(replay);
          else setTimeout(replay, 0);
        } catch (e) {
          try {
            setTimeout(replay, 0);
          } catch (e2) {}
        }
      } catch (e) {}

      sock.on("presence", handler);
      return () => {
        try {
          sock.off("presence", handler);
        } catch (e) {}
      };
    },
    [getGlobalSocket, getPresenceStore],
  );

  const on = useCallback(
    (event, handler) => {
      const sock = socketRef.current || getGlobalSocket();
      if (!sock || !event || typeof handler !== "function") return;
      try {
        sock.on(event, handler);
      } catch (e) {}
      return () => {
        try {
          sock.off && sock.off(event, handler);
        } catch (e) {}
      };
    },
    [getGlobalSocket],
  );

  const off = useCallback(
    (event, handler) => {
      const sock = socketRef.current || getGlobalSocket();
      if (!sock || !event || typeof handler !== "function") return;
      try {
        sock.off && sock.off(event, handler);
      } catch (e) {}
    },
    [getGlobalSocket],
  );

  const onMessage = useCallback(
    (handler) => {
      const sock = socketRef.current || getGlobalSocket();
      if (!sock) return;
      sock.on("message", handler);
      return () => {
        try {
          sock.off("message", handler);
        } catch (e) {}
      };
    },
    [getGlobalSocket],
  );

  const onMessageUpdate = useCallback(
    (handler) => {
      const sock = socketRef.current || getGlobalSocket();
      if (!sock) return;
      sock.on("message_update", handler);
      return () => {
        try {
          sock.off("message_update", handler);
        } catch (e) {}
      };
    },
    [getGlobalSocket],
  );

  const onMessageRead = useCallback(
    (handler) => {
      const sock = socketRef.current || getGlobalSocket();
      if (!sock) return;
      sock.on("message_read", handler);
      return () => {
        try {
          sock.off("message_read", handler);
        } catch (e) {}
      };
    },
    [getGlobalSocket],
  );

  const onConnectError = useCallback(
    (handler) => {
      const sock = socketRef.current || getGlobalSocket();
      if (!sock) return;
      sock.on("connect_error", handler);
      return () => {
        try {
          sock.off("connect_error", handler);
        } catch (e) {}
      };
    },
    [getGlobalSocket],
  );

  const emitEvent = useCallback(
    (event, payload, cb) => {
      const sock = socketRef.current || getGlobalSocket();
      if (!sock) return cb && cb({ error: "not_connected" });
      try {
        sock.emit(event, payload, cb);
      } catch (e) {
        if (cb) cb({ error: "emit_failed" });
      }
    },
    [getGlobalSocket],
  );

  useEffect(() => {
    return () => {
      // remove per-hook listeners and decrease global refcount
      try {
        if (socketRef.current && socketRef.current._myCleanup) {
          socketRef.current._myCleanup();
          socketRef.current._myCleanup = null;
        }
      } catch (e) {}
      disconnect();
    };
  }, [disconnect]);

  // Memoize returned API so its identity is stable across renders.
  const api = useMemo(
    () => ({
      connect,
      disconnect,
      join,
      leave,
      sendMessage,
      sendTyping,
      onMessage,
      onMessageUpdate,
      onMessageRead,
      onTyping,
      onPresence,
      on,
      off,
      emitEvent,
      onConnectError,
      connected,
    }),
    [
      connect,
      disconnect,
      join,
      leave,
      sendMessage,
      sendTyping,
      onMessage,
      onMessageUpdate,
      onMessageRead,
      onTyping,
      onPresence,
      on,
      off,
      emitEvent,
      onConnectError,
      connected,
    ],
  );

  return api;
}
