import fetch from "node-fetch";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface TavilyResponse {
  query: string;
  results: SearchResult[];
  answer?: string;           // Tavily's own AI summary (we use this too)
  responseTime: number;
}

/**
 * Executes a real-time web search using Tavily Search API.
 * Returns structured results + an optional AI-generated answer snippet.
 *
 * Tavily docs: https://docs.tavily.com/docs/tavily-api/rest_api
 */
export async function runWebSearch(
  query: string,
  options: {
    maxResults?: number;
    searchDepth?: "basic" | "advanced";
    includeAnswer?: boolean;
    includeDomains?: string[];
    excludeDomains?: string[];
  } = {}
): Promise<TavilyResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set in environment variables.");
  }

  const {
    maxResults = 5,
    searchDepth = "advanced",
    includeAnswer = true,
    includeDomains = [],
    excludeDomains = [],
  } = options;

  const body = {
    api_key: apiKey,
    query,
    search_depth: searchDepth,
    include_answer: includeAnswer,
    include_raw_content: false,
    max_results: maxResults,
    ...(includeDomains.length > 0 && { include_domains: includeDomains }),
    ...(excludeDomains.length > 0 && { exclude_domains: excludeDomains }),
  };

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as any;

  return {
    query: data.query,
    answer: data.answer,
    responseTime: data.response_time,
    results: (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
      publishedDate: r.published_date,
    })),
  };
}

/**
 * Formats search results into a clean context string for Gemini.
 */
export function formatSearchResultsForPrompt(data: TavilyResponse): string {
  const lines: string[] = [
    `Web search results for: "${data.query}"`,
    `Retrieved ${data.results.length} results in ${data.responseTime}s`,
    "",
  ];

  if (data.answer) {
    lines.push(`Quick Answer: ${data.answer}`, "");
  }

  data.results.forEach((r, i) => {
    lines.push(
      `[${i + 1}] ${r.title}`,
      `URL: ${r.url}`,
      ...(r.publishedDate ? [`Published: ${r.publishedDate}`] : []),
      `${r.content}`,
      ""
    );
  });

  return lines.join("\n");
}
