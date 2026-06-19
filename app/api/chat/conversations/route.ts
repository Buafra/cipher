async function deleteConversation(id: string) {
  const confirmed = confirm("Delete this chat? This cannot be undone.");
  if (!confirmed) return;

  const res = await fetch("/api/chat/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deleteId: id }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    alert(data.error ?? "Failed to delete chat");
    return;
  }

  setConversations(data.conversations ?? []);

  if (conversationId === id) {
    setConversationId(undefined);
    setTurns([]);
  }
}