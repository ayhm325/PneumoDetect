"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  connectSocket,
  disconnectSocket,
  getAllCachedPresence,
  getCachedPresence,
  getSocket,
  joinChatRoom,
  leaveChatRoom,
  subscribeConnectionState,
  subscribePresence,
  subscribeReconnect,
} from "@/lib/socket";

export default function useSocket() {
  const [connState, setConnState] = useState({
    connected: false,
    status: "disconnected",
    error: undefined,
  });

  useEffect(() => {
    return subscribeConnectionState((next) => {
      setConnState(next);
    });
  }, []);

  const connect = useCallback((opts = {}) => {
    return connectSocket(opts);
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
  }, []);

  const join = useCallback((chatId) => {
    return joinChatRoom(chatId);
  }, []);

  const leave = useCallback((chatId) => {
    leaveChatRoom(chatId);
  }, []);

  const sendMessage = useCallback((payload, ack) => {
    const sock = getSocket();
    if (!sock || !sock.connected) {
      if (typeof ack === "function") ack({ error: "not_connected" });
      return false;
    }
    sock.emit("message", payload, ack);
    return true;
  }, []);

  const sendTyping = useCallback((chatId, typing) => {
    const sock = getSocket();
    if (sock?.connected && chatId) {
      sock.emit("typing", { chatId, typing: Boolean(typing) });
    }
  }, []);

  const emitDelivered = useCallback((messageIds, ack) => {
    const sock = getSocket();
    if (!sock?.connected || !Array.isArray(messageIds) || messageIds.length === 0) return;
    sock.emit("delivered_ack", { messageIds }, ack);
  }, []);

  const emitRead = useCallback((messageIds, ack) => {
    const sock = getSocket();
    if (!sock?.connected || !Array.isArray(messageIds) || messageIds.length === 0) return;
    sock.emit("read_ack", { messageIds }, ack);
  }, []);

  const on = useCallback((event, handler) => {
    const sock = getSocket();
    sock.on(event, handler);
    return () => {
      sock.off(event, handler);
    };
  }, []);

  const onMessage = useCallback((handler) => on("message", handler), [on]);
  const onMessageUpdate = useCallback((handler) => on("message_update", handler), [on]);
  const onMessageRead = useCallback((handler) => on("message_read", handler), [on]);
  const onTyping = useCallback((handler) => on("typing", handler), [on]);
  const onConversationUpdate = useCallback((handler) => on("conversation_update", handler), [on]);
  const onConnectError = useCallback((handler) => on("connect_error", handler), [on]);

  const onPresence = useCallback((handler) => {
    return subscribePresence(handler);
  }, []);

  const onReconnect = useCallback((handler) => {
    return subscribeReconnect(handler);
  }, []);

  const getPresence = useCallback((userId) => getCachedPresence(userId), []);
  const getPresenceSnapshot = useCallback(() => getAllCachedPresence(), []);

  const connStateRef = useRef(connState);
  connStateRef.current = connState;

  return useMemo(
    () => ({
      get connected() {
        return connStateRef.current.connected;
      },
      get connectionStatus() {
        return connStateRef.current.status;
      },
      get connectionError() {
        return connStateRef.current.error;
      },
      connect,
      disconnect,
      join,
      leave,
      sendMessage,
      sendTyping,
      emitDelivered,
      emitRead,
      on,
      onMessage,
      onMessageUpdate,
      onMessageRead,
      onTyping,
      onPresence,
      onConversationUpdate,
      onConnectError,
      onReconnect,
      getPresence,
      getPresenceSnapshot,
    }),
    [
      connect,
      disconnect,
      join,
      leave,
      sendMessage,
      sendTyping,
      emitDelivered,
      emitRead,
      on,
      onMessage,
      onMessageUpdate,
      onMessageRead,
      onTyping,
      onPresence,
      onConversationUpdate,
      onConnectError,
      onReconnect,
      getPresence,
      getPresenceSnapshot,
    ],
  );
}
