import { useTranslations } from "@/lib/compat/intl";

export default function ChatSidebar({ chats, onSelect }) {
  const t = useTranslations("adminChat");
  const chatListTitle = t("sidebarTitle");
  return (
    <aside className="w-64 h-full border-r border-(--ui-border) bg-(--ui-surface) p-4">
      <h3 className="mb-4 text-lg font-bold text-foreground">
        {chatListTitle}
      </h3>
      <ul className="space-y-3">
        {chats.map((chat) => (
          <li
            key={chat.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-(--ui-border) bg-(--ui-surface-2) p-3 hover:opacity-90"
            onClick={() => onSelect(chat)}
          >
            <span className="font-semibold text-foreground">{chat.doctor}</span>
            <span className="mx-2 text-(--ui-muted-2)">?</span>
            <span className="font-semibold text-foreground">
              {chat.patient}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
