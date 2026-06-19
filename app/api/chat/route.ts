import { NextRequest, NextResponse } from "next/server";
import { db, USER_ID } from "@/lib/supabase";
import { loadMemory, loadProfile } from "@/lib/memory";
import { buildSystemPrompt } from "@/lib/prompt";
import { reason, type ChatTurn } from "@/lib/claude";
import { searchWeb } from "@/lib/search";
export const runtime = "nodejs";
function parseTaskFromMessage(message: string) {
  const match = message.match(/(?:add task|create task|remind me to|todo)\s+(.+)/i);
  if (!match) return null;

  let text = match[1].trim();
  let dueAt: string | null = null;

  const now = new Date();

  function setDate(daysToAdd: number) {
    const d = new Date(now);
    d.setDate(d.getDate() + daysToAdd);
    d.setHours(9, 0, 0, 0);
    dueAt = d.toISOString();
  }

if (/tomorrow|tomrrow|tmrw/i.test(text)) {
    setDate(1);
text = text.replace(/tomorrow|tomrrow|tmrw/i, "").trim();  } else if (/today/i.test(text)) {
    setDate(0);
    text = text.replace(/today/i, "").trim();
  }

  const timeMatch = text.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);

  if (timeMatch && dueAt) {
    const d = new Date(dueAt);
    let hour = Number(timeMatch[1]);
    const minute = timeMatch[2] ? Number(timeMatch[2]) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();

    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;

    d.setHours(hour, minute, 0, 0);
    dueAt = d.toISOString();

    text = text.replace(timeMatch[0], "").trim();
  }

  text = text
    .replace(/\bat\b$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: text,
    due_at: dueAt,
  };
}
/**
 * POST /api/chat   (Layer 1 → Layer 3, via this relay)
 * Body: { message: string, conversationId?: string }
 *
 * This is the data flow from doc §4:
 *   1. receive the request
 *   2. gather stored context (memory + recent history)
 *   3. (live lookups would go here — see Phase 3)
 *   4. send combined context to the reasoning model
 *   5. return the reply and save it back to storage
 */
export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // Ensure a conversation exists.
    let convId = conversationId as string | undefined;
    if (!convId) {
      const { data, error } = await db
        .from("conversations")
        .insert({ user_id: USER_ID, title: message.slice(0, 40) })
        .select("id")
        .single();
      if (error) throw error;
      convId = data.id;
    }

    // Save the incoming user message.
    await db.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    });
const parsedTask = parseTaskFromMessage(message);

if (parsedTask) {
  const { data, error } = await db
    .from("tasks")
    .insert({
      user_id: USER_ID,
      title: parsedTask.title,
      notes: "",
      due_at: parsedTask.due_at,
      status: "open",
    })
    .select("*")
    .single();

  if (error) throw error;

  const dueText = data.due_at
    ? `\nDue: ${new Date(data.due_at).toLocaleString("en-AE", {
        timeZone: "Asia/Dubai",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`
    : "";

  const reply = `✅ Task added: ${data.title}${dueText}`;

  await db.from("messages").insert({
    conversation_id: convId,
    role: "assistant",
    content: reply,
  });

  return NextResponse.json({ reply, conversationId: convId });
}
    // 2 — gather stored context.
    const [profile, facts] = await Promise.all([loadProfile(), loadMemory()]);

    const { data: history } = await db
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);

const needsWeb =
  /(latest|today|current|now|recent|news|price|stock|crypto|bitcoin|btc|gold|silver|oil|weather|flight|hotel|market|rate|exchange|schedule|who won|result|source|search|verify|look up|updated)/i.test(message);

const webResults = needsWeb
  ? await searchWeb(message)
  : "No live web search needed for this message.";
const system = `${buildSystemPrompt(profile, facts)}

LIVE WEB RESULTS FROM TAVILY:
${webResults}

RULES:
For current, live, recent, price, market, weather, news, travel, stock, crypto, regulation, product, or dated questions, use the Tavily results above first.

Use ONLY the live web results above for current facts.

If the Tavily results are stale, conflicting, missing timestamps, or not enough, say so clearly.

Do not invent prices, dates, headlines, sports results, flight times, or sources.

Always include source URLs when using live web results.
`;    const turns: ChatTurn[] = (history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // 3 + 4 — reason, with live web access. Claude searches the web itself
    // only when the message actually needs current info (news, prices,
    // today's facts); otherwise it answers from memory + knowledge at no
    // search cost.
    const reply = await reason(system, turns, 1024, { webSearch: false });

    // 5 — persist the assistant reply.
    await db.from("messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: reply,
    });

    return NextResponse.json({ reply, conversationId: convId });
  } catch (err: any) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: err.message ?? "Something went wrong" }, { status: 500 });
  }
}
