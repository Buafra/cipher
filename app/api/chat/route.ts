import { NextRequest, NextResponse } from "next/server";
import { db, USER_ID } from "@/lib/supabase";
import { loadMemory, loadProfile } from "@/lib/memory";
import { buildSystemPrompt } from "@/lib/prompt";
import { resolveModelRoute, routeReasoning, type ChatTurn } from "@/lib/model-router";
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
    text = text.replace(/tomorrow|tomrrow|tmrw/i, "").trim();
  } else if (/today/i.test(text)) {
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

  text = text.replace(/\bat\b$/i, "").replace(/\s+/g, " ").trim();

  return { title: text, due_at: dueAt };
}

function needsLiveWeb(message: string) {
  return /(latest|today|current|now|recent|news|price|stock|crypto|bitcoin|btc|gold|silver|oil|weather|flight|hotel|market|rate|exchange|schedule|who won|result|source|search|verify|look up|updated)/i.test(
    message
  );
}

/**
 * POST /api/chat
 * Body: { message: string, conversationId?: string, webSearch?: boolean, selectedModel?: string, selectedAgent?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const {
      message,
      conversationId,
      webSearch = true,
      selectedModel = "Auto",
      selectedAgent = "Hermes",
    } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

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

      return NextResponse.json({
        reply,
        conversationId: convId,
        modelUsed: "System Task Parser",
        modelDisplayName: "System Task Parser",
        provider: "Cipher",
        routedModel: "System Task Parser",
        selectedModel,
        selectedAgent,
        searchUsed: false,
      });
    }

    const [profile, facts] = await Promise.all([loadProfile(), loadMemory()]);

    const { data: history } = await db
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);

    const route = resolveModelRoute(selectedModel);
    const useWeb = Boolean(webSearch) && needsLiveWeb(message);

    const webResults = useWeb
      ? await searchWeb(message)
      : "No live web search needed for this message, or web search is turned off in the UI.";

    const system = `${buildSystemPrompt(profile, facts)}

CIPHER RUNTIME STATUS:
- Active provider: ${route.provider}
- Active model id: ${route.modelId}
- Active model name: ${route.modelDisplayName}
- User-selected UI model: ${selectedModel}
- Actual router path: ${route.routedModel}
- User-selected UI agent: ${selectedAgent}
- Web search enabled for this request: ${useWeb ? "yes" : "no"}

IDENTITY RULE:
If the user asks what model, provider, agent, route, or search mode you are using, answer from the CIPHER RUNTIME STATUS above.
Do not say you do not have access to that information.
If the UI-selected model is Auto, explain the actual router path shown above.

LIVE WEB RESULTS FROM TAVILY:
${webResults}

RULES:
For current, live, recent, price, market, weather, news, travel, stock, crypto, regulation, product, or dated questions, use the Tavily results above first.
Use ONLY the live web results above for current facts.
If the Tavily results are stale, conflicting, missing timestamps, or not enough, say so clearly.
Do not invent prices, dates, headlines, sports results, flight times, or sources.
Always include source URLs when using live web results.
`;

    const turns: ChatTurn[] = (history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const result = await routeReasoning(system, turns, 1024, {
      selectedModel,
      webSearch: useWeb,
      maxSearches: 3,
    });

    await db.from("messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: result.text,
    });

    return NextResponse.json({
      reply: result.text,
      conversationId: convId,
      modelUsed: result.modelUsed,
      modelDisplayName: result.modelDisplayName,
      provider: result.provider,
      routedModel: result.routedModel,
      selectedModel: result.selectedModel,
      selectedAgent,
      searchUsed: useWeb,
    });
  } catch (err: any) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: err.message ?? "Something went wrong" }, { status: 500 });
  }
}
