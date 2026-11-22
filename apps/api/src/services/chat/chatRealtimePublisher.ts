import type { Server } from "socket.io";

export interface ChatRealtimePublisher {
  publishNewMessage(input: {
    chatId: string;
    message: Record<string, unknown>;
    senderUserId?: string | null;
    recipientUserId?: string | null;
  }): void;
  publishMessageUpdate(input: {
    chatId: string;
    id: string;
    status: "delivered" | "read";
  }): void;
  publishMessageRead(input: {
    chatId: string;
    messageId: string;
    userId: string;
    timestamp: Date;
  }): void;
}

let activeIoServer: Server | null = null;

export function setChatRealtimeServer(io: Server | null): void {
  activeIoServer = io;
}

function getIoServer(): Server | null {
  if (activeIoServer) return activeIoServer;
  const globalIo = (globalThis as { __io?: Server }).__io;
  return globalIo || null;
}

export function createChatRealtimePublisher(
  getServer: () => Server | null = getIoServer,
): ChatRealtimePublisher {
  return {
    publishNewMessage({ chatId, message, senderUserId, recipientUserId }) {
      const io = getServer();
      if (!io) return;

      const payloadOut = {
        ...message,
        chatId,
        time: message.createdAt ?? new Date().toISOString(),
      };

      io.to(`chat:${chatId}`).emit("message", { ...payloadOut, __scope: "chat" });

      if (recipientUserId) {
        io.to(`user:${recipientUserId}`).emit("conversation_update", {
          chatId,
          lastMessage: payloadOut,
          unreadDelta: 1,
        });
        io.to(`user:${recipientUserId}`).emit("unread_count_update", {
          chatId,
          delta: 1,
        });
      }

      if (senderUserId) {
        io.to(`user:${senderUserId}`).emit("conversation_update", {
          chatId,
          lastMessage: payloadOut,
          unreadDelta: 0,
        });
      }
    },

    publishMessageUpdate({ chatId, id, status }) {
      const io = getServer();
      if (!io) return;
      io.to(`chat:${chatId}`).emit("message_update", { id, chatId, status });
    },

    publishMessageRead({ chatId, messageId, userId, timestamp }) {
      const io = getServer();
      if (!io) return;
      io.to(`chat:${chatId}`).emit("message_read", {
        messageId,
        chatId,
        userId,
        timestamp,
      });
    },
  };
}
