import Image from "next/image";

export default function TopBar() {
  return (
    <header className="w-full flex items-center justify-between bg-(--ui-surface) border-b border-(--ui-border) px-6 py-3">
      <div className="flex items-center gap-3">
        <Image
          src="/next.svg"
          alt="Doctor"
          width={36}
          height={36}
          className="rounded-full"
        />
        <span className="font-bold text-lg text-(--ui-foreground)">
          Dr. Ahmed Ali
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative">
          <span className="absolute top-0 right-0 w-2 h-2 bg-(--ui-danger) rounded-full"></span>
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            className="text-(--ui-muted-foreground)"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M12 8v4l2 2" strokeWidth="2" />
          </svg>
        </button>
        <button className="hover:bg-(--ui-surface-2) p-2 rounded">
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            className="text-(--ui-muted-foreground)"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M12 16v-4" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </header>
  );
}
