export type WebResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
  published_date?: string;
};

export async function searchWeb(query: string): Promise<string> {
  const key = process.env.TAVILY_API_KEY;

  if (!key) {
    return "No Tavily API key configured.";
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "advanced",
      max_results: 8,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!res.ok) {
    return `Tavily search failed: ${res.status}`;
  }

  const data = await res.json();
  const results: WebResult[] = data.results ?? [];

  if (!results.length) {
    return "No web results found.";
  }

  return results
    .map((r, i) => {
      return `Result ${i + 1}
Title: ${r.title}
URL: ${r.url}
Date: ${r.published_date ?? "unknown"}
Snippet: ${r.content}`;
    })
    .join("\n\n");
}