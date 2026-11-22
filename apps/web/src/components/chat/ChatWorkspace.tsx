import React, { useState } from "react";
import { FaComments } from "react-icons/fa";
import { useChatWorkspace } from "@/features/chat/useChatWorkspace";
import { ChatHeader } from "./ChatHeader";
import { ConversationList } from "./ConversationList";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";

export interface ChatWorkspaceProps {
  role: "doctor" | "patient";
  isAr: boolean;
}

export function ChatWorkspace({ role, isAr }: ChatWorkspaceProps) {
  const {
    conversations,
    loadingConversations,
    conversationsError,
    reloadConversations,
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
    isTyping,
    presenceByUserId,
    connectionStatus,
  } = useChatWorkspace(role);

  const [searchQuery, setSearchQuery] = useState("");
  const isDoctor = role === "doctor";

  const peer = activeConversation
    ? isDoctor
      ? activeConversation.patient
      : activeConversation.doctor
    : null;

  const peerName =
    peer?.fullName ||
    peer?.email ||
    (isDoctor
      ? isAr
        ? "المريض"
        : "Patient"
      : isAr
        ? "الطبيب المعالج"
        : "Assigned Doctor");

  const peerSubtitle = isDoctor
    ? peer?.email
    : peer?.specialty || (isAr ? "طبيب" : "Doctor");

  const peerUserId = peer?.userId ? String(peer.userId) : "";
  const isPeerOnline = peerUserId ? Boolean(presenceByUserId[peerUserId]) : false;

  return (
    <div className="flex h-[calc(100vh-11.5rem)] min-h-[520px] overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-sm">
      {isDoctor && (
        <div
          className={`w-full shrink-0 md:block md:w-80 lg:w-96 ${
            activeChatId ? "hidden" : "block"
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeChatId={activeChatId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectChat={(chatId) => setActiveChatId(chatId)}
            presenceByUserId={presenceByUserId}
            loading={loadingConversations}
            error={conversationsError}
            onRetry={() => void reloadConversations()}
            isAr={isAr}
          />
        </div>
      )}

      <section
        className={`flex min-w-0 flex-1 flex-col ${
          isDoctor && !activeChatId ? "hidden md:flex" : "flex"
        }`}
      >
        {activeConversation ? (
          <>
            <ChatHeader
              participantName={peerName}
              participantSubtitle={peerSubtitle}
              isOnline={isPeerOnline}
              isTyping={isTyping}
              connectionStatus={connectionStatus}
              showBackButton={isDoctor}
              onBack={() => setActiveChatId(null)}
              isAr={isAr}
            />

            <MessageList
              messages={messages}
              myRole={role}
              loading={loadingMessages}
              loadingOlder={loadingOlder}
              hasMore={hasMore}
              error={messagesError}
              isTyping={isTyping}
              onLoadOlder={() => void loadOlderMessages()}
              onRetryMessage={(msg) => void sendMessage({ retryMessage: msg })}
              isAr={isAr}
            />

            <MessageComposer
              onSend={sendMessage}
              onTyping={notifyTyping}
              uploading={uploading}
              isAr={isAr}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-[var(--ui-muted)]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--ui-surface-2)]">
              <FaComments className="h-7 w-7 opacity-60" />
            </div>
            {loadingConversations ? (
              <p className="text-sm font-medium">
                {isAr ? "جارٍ تحميل المحادثات..." : "Loading conversations..."}
              </p>
            ) : conversationsError ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[var(--ui-danger)]">
                  {conversationsError}
                </p>
                <button
                  type="button"
                  onClick={() => void reloadConversations()}
                  className="rounded-xl bg-[var(--color-primary-500)] px-4 py-2 text-xs font-semibold text-white"
                >
                  {isAr ? "إعادة المحاولة" : "Retry"}
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-base font-bold text-[var(--ui-foreground)]">
                  {isDoctor
                    ? isAr
                      ? "اختر محادثة للبدء"
                      : "Select a conversation"
                    : isAr
                      ? "لا توجد محادثة متاحة"
                      : "No conversation available"}
                </h3>
                <p className="mt-1 max-w-sm text-xs">
                  {isDoctor
                    ? isAr
                      ? "اختر أحد المرضى من القائمة لعرض الرسائل والتواصل الفوري."
                      : "Choose a patient from the list to view messages and chat in real time."
                    : isAr
                      ? "سيتم ربطك بطبيبك المعالج فور تعيينه لحالتك."
                      : "You will be able to message your doctor once assigned."}
                </p>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
