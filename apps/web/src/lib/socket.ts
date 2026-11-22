import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

let socketInstance: Socket | null = null;
let currentUserKey: string | null = null;
const joinedRooms = new Set<string>();
const presenceByUserId = new Map<string, boolean>();
const presenceSubscribers = new Set<(evt: { userId: string; online: boolean }) => void>();
const connectionSubscribers = new Set<(state: { connected: boolean; status: "connected" | "connecting" | "disconnected"; error?: string }) => void>();
const reconnectSubscribers = new Set<() => void>();
let hasConnectedOnce = false;

function decodeJwtUserId(token?: string): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    const parsed = JSON.parse(json) as { id?: string; userId?: string };
    return parsed?.id || parsed?.userId || null;
  } catch {
    return null;
  }
}

function notifyConnection(state: { connected: boolean; status: "connected" | "connecting" | "disconnected"; error?: string }) {
  for (const cb of connectionSubscribers) {
    try {
      cb(state);
    } catch {
      // ignore subscriber error
    }
  }
}

function bindCoreListeners(sock: Socket) {
  sock.on("connect", () => {
    const isReconnect = hasConnectedOnce;
    hasConnectedOnce = true;
    notifyConnection({ connected: true, status: "connected" });

    // Re-join previously authorized rooms on connect/reconnect
    for (const chatId of Array.from(joinedRooms)) {
      sock.emit("join", chatId, (ack?: { ok?: boolean; error?: string }) => {
        if (!ack?.ok) {
          joinedRooms.delete(chatId);
        }
      });
    }

    if (isReconnect) {
      for (const cb of reconnectSubscribers) {
        try {
          cb();
        } catch {
          // ignore
        }
      }
    }
  });

  sock.on("disconnect", () => {
    notifyConnection({ connected: false, status: "disconnected" });
  });

  sock.on("connect_error", (err: Error) => {
    notifyConnection({
      connected: false,
      status: "disconnected",
      error: err?.message || "connection_error",
    });
  });

  sock.io.on("reconnect_attempt", () => {
    notifyConnection({ connected: false, status: "connecting" });
  });

  sock.on("presence", (evt: { userId?: string; online?: boolean }) => {
    if (!evt?.userId) return;
    const uid = String(evt.userId);
    const online = Boolean(evt.online);
    presenceByUserId.set(uid, online);
    for (const cb of presenceSubscribers) {
      try {
        cb({ userId: uid, online });
      } catch {
        // ignore
      }
    }
  });
}

export function connectSocket(opts?: { token?: string }): Socket {
  const token = opts?.token;
  const nextUserId = decodeJwtUserId(token);

  if (socketInstance) {
    if (nextUserId && currentUserKey && nextUserId !== currentUserKey) {
      disconnectSocket();
    } else {
      if (token && (!socketInstance.auth || (socketInstance.auth as { token?: string }).token !== token)) {
        socketInstance.auth = { token };
      }
      if (!socketInstance.connected) {
        notifyConnection({ connected: false, status: "connecting" });
        socketInstance.connect();
      }
      return socketInstance;
    }
  }

  currentUserKey = nextUserId;
  hasConnectedOnce = false;
  socketInstance = io(SOCKET_URL, {
    withCredentials: true,
    auth: token ? { token } : undefined,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
    transports: ["websocket", "polling"],
  });

  notifyConnection({ connected: false, status: "connecting" });
  bindCoreListeners(socketInstance);
  return socketInstance;
}

export function getSocket(): Socket {
  if (!socketInstance) {
    return connectSocket();
  }
  return socketInstance;
}

export function disconnectSocket(): void {
  joinedRooms.clear();
  presenceByUserId.clear();
  hasConnectedOnce = false;
  currentUserKey = null;
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
  notifyConnection({ connected: false, status: "disconnected" });
}

export function joinChatRoom(chatId: string): Promise<{ ok: boolean; error?: string }> {
  const normalized = String(chatId || "").trim();
  if (!normalized) return Promise.resolve({ ok: false, error: "invalid_chat_id" });

  const sock = getSocket();
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({ ok: false, error: "join_timeout" });
      }
    }, 5000);

    sock.emit("join", normalized, (ack?: { ok?: boolean; error?: string }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (ack?.ok) {
        joinedRooms.add(normalized);
        resolve({ ok: true });
      } else {
        joinedRooms.delete(normalized);
        resolve({ ok: false, error: ack?.error || "join_rejected" });
      }
    });
  });
}

export function leaveChatRoom(chatId: string): void {
  const normalized = String(chatId || "").trim();
  if (!normalized) return;
  joinedRooms.delete(normalized);
  if (socketInstance?.connected) {
    socketInstance.emit("leave", normalized);
  }
}

export function subscribeConnectionState(
  cb: (state: { connected: boolean; status: "connected" | "connecting" | "disconnected"; error?: string }) => void,
): () => void {
  connectionSubscribers.add(cb);
  cb({
    connected: Boolean(socketInstance?.connected),
    status: socketInstance?.connected ? "connected" : socketInstance ? "connecting" : "disconnected",
  });
  return () => {
    connectionSubscribers.delete(cb);
  };
}

export function subscribeReconnect(cb: () => void): () => void {
  reconnectSubscribers.add(cb);
  return () => {
    reconnectSubscribers.delete(cb);
  };
}

export function subscribePresence(
  cb: (evt: { userId: string; online: boolean }) => void,
): () => void {
  presenceSubscribers.add(cb);
  return () => {
    presenceSubscribers.delete(cb);
  };
}

export function getCachedPresence(userId: string): boolean | undefined {
  return presenceByUserId.get(String(userId));
}

export function getAllCachedPresence(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const [k, v] of presenceByUserId.entries()) {
    result[k] = v;
  }
  return result;
}
