export default function ChatList({ chats, onSelect }) {
  return (
    <ul className="space-y-3">
      {chats.map((chat) => (
        <li
          key={chat.id}
          className="card-glass flex items-center gap-3 p-3 rounded-xl border border-(--ui-border) cursor-pointer hover:bg-(--ui-surface-2)/60"
          onClick={() => onSelect(chat)}
        >
          <span className="font-bold text-(--ui-foreground)">
            {chat.doctor}
          </span>
          <span className="mx-2 text-(--ui-muted-foreground)">→</span>
          <span className="font-bold text-(--ui-foreground)">
            {chat.patient}
          </span>
          <span className="ml-auto text-xs text-(--ui-muted-foreground)">
            {chat.lastMsg}
          </span>
        </li>
      ))}
    </ul>
  );
}