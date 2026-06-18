import { Eyebrow } from "@/components/Card";
import { ChatWindow } from "@/components/ChatWindow";

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Conversation</Eyebrow>
        <h1 className="font-display text-2xl font-light text-paper">Ask Cipher</h1>
        <p className="mt-1 text-sm text-paper-dim">
          Anything not covered by a dedicated screen. Cipher remembers what you've told it.
        </p>
      </div>
      <ChatWindow />
    </div>
  );
}
