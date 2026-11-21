import dynamic from "next/dynamic";

const RecentChatsClient = dynamic(() => import("./RecentChats.client"), {
  ssr: false,
});

export default function RecentChats(props) {
  return <RecentChatsClient {...props} />;
}
