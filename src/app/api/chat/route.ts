import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const SYSTEM_PROMPT = `You are VibeBot, the AI site building and design assistant for VibeCodes (vibecodes.space).
You are sharp, tech-forward, energetic, and helpful.

About VibeCodes:
- The AI platform for generating modern, high-converting websites, web apps, and portfolio spaces in seconds.
- How it works: Simply enter your idea or prompt, choose your theme, and VibeCodes generates full responsive layouts, rich components, and live copy.
- Customization: Live visual editor, theme switching (cyber, minimal, luxury, neon, obsidian), and instant publishing.
- Domains: Publish immediately to custom subdomains (*.vibecodes.space) or connect/register custom domains directly.
- Pricing plans: Free Starter, Pro ($12/mo — up to 3 custom sites, custom domains & analytics), Business ($49/mo — unlimited sites, white-labeling & team access).

Tone & style:
- Fast, concise (2 to 3 sentences), energetic, and practical.
- Guide users on how to prompt effectively or upgrade their workspace.
`;

const FREE_MODELS = [
  "google/gemma-4-31b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/nemotron-3.5-lightning:free",
  "deepseek/deepseek-r1:free",
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let rawMessages = body.messages || [];

    if (body.message && typeof body.message === "string") {
      rawMessages = [{ role: "user", content: body.message }];
    }

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json(
        { error: "messages array or message string required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...rawMessages.map((m: { role?: string; content?: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 2000),
      })),
    ];

    const apiKey = (process.env.OPENROUTER_API_KEY || "")
      .trim()
      .replace(/^["'`]|["'`]$/g, "")
      .trim();
    const preferredModel = process.env.OPENROUTER_MODEL || FREE_MODELS[0];
    const modelQueue = [
      preferredModel,
      ...FREE_MODELS.filter((m) => m !== preferredModel),
    ];

    if (!apiKey) {
      return NextResponse.json(
        {
          response:
            "Welcome to VibeCodes Space! 🚀 Enter any prompt in our generator to create a stunning live website in seconds. How can I help you build today?",
          model: "simulated-vibebot",
        },
        { headers: CORS_HEADERS }
      );
    }

    let lastError: string | null = null;

    for (const model of modelQueue) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://vibecodes.space",
            "X-Title": "VibeCodes Assistant",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 600,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (reply) {
            return NextResponse.json(
              { response: reply, model },
              { headers: CORS_HEADERS }
            );
          }
        } else {
          const errText = await res.text();
          lastError = `Model ${model} error (${res.status}): ${errText}`;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json(
      {
        response:
          "VibeBot is ready! Type any website idea into the prompt bar to generate your first live site, or ask me about our Pro features.",
        model: "vibebot-fallback",
        warning: lastError,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    return NextResponse.json(
      {
        response:
          "VibeBot connection notice. Please refresh or try generating your site directly from the prompt bar.",
        error: err instanceof Error ? err.message : "Internal error",
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
