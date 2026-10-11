export default function ChatSystem() {
  // بيانات دردشة وهمية
  const patients = [
    {
      id: 1,
      name: "Mohamed Salah",
      lastMsg: "Thank you, doctor!",
      time: "10:30",
    },
    { id: 2, name: "Sara Ali", lastMsg: "I uploaded my X-ray.", time: "09:15" },
  ];
  const messages = [
    { from: "doctor", text: "Hello, how can I help you?", time: "10:00" },
    { from: "patient", text: "I have a cough.", time: "10:01" },
    { from: "doctor", text: "Please upload your X-ray.", time: "10:02" },
    { from: "patient", text: "I uploaded my X-ray.", time: "10:15" },
    { from: "doctor", text: "Thank you, doctor!", time: "10:30" },
  ];
  return (
    <section className="mt-4 flex min-h-[320px] w-full flex-col gap-4 rounded-xl border border-(--ui-border) bg-(--ui-surface) p-6 shadow md:flex-row">
      {/* Chat Sidebar */}
      <aside className="w-full md:w-64 border-r border-(--ui-border) pr-4 mb-4 md:mb-0">
        <h4 className="font-bold mb-2">Patients</h4>
        <ul>
          {patients.map((p) => (
            <li
              key={p.id}
              className="flex justify-between items-center py-2 border-b border-(--ui-border)"
            >
              <span>{p.name}</span>
              <span className="text-xs text-(--ui-muted-foreground)">
                {p.time}
              </span>
            </li>
          ))}
        </ul>
      </aside>
      {/* Chat Window */}
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto mb-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === "doctor" ? "justify-end" : "justify-start"} mb-1`}
            >
              <div
                className={`rounded-xl px-4 py-2 max-w-xs ${msg.from === "doctor" ? "bg-(--ui-info) text-(--ui-info-foreground)" : "bg-(--ui-surface-2) text-(--ui-foreground) border border-(--ui-border)"}`}
              >
                <span>{msg.text}</span>
                <span className="block text-xs text-(--ui-muted-foreground) mt-1 text-right">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </div>
        <form className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 border border-(--ui-border) rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--ui-ring) bg-(--ui-surface-2) text-(--ui-foreground)"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded bg-(--ui-info) text-(--ui-info-foreground) font-semibold hover:bg-(--ui-info)/90 transition"
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
