import { ChatView } from "@/components/chat/chat-view";

export default function ChatPage() {
  // The shell's <main> scrolls; the chat manages its own scrolling, so give it the full height.
  return (
    <div className="h-full">
      <ChatView />
    </div>
  );
}
