import ChatMessage from "./ChatMessage";

export default function ChatViewer({ messages }) {
  return (
    <div className="mt-8 max-h-96 overflow-y-auto rounded-2xl border border-(--ui-border) bg-(--ui-surface) p-6">
      {messages.map((msg, idx) => (
        <ChatMessage key={idx} message={msg} isDoctor={msg.isDoctor} />
      ))}
    </div>
  );
}
