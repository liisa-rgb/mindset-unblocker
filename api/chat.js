// Cheapest-first ranking by model family. Lower number = cheaper tier.
// Pricing reference ($/1M in / $/1M out): haiku 1/5, sonnet 3/15, opus 5/25, fable 10/50.
// Floor is Sonnet: cheaper tiers (Haiku) are intentionally excluded to keep
// coaching quality up while still always picking the cheapest qualifying model.
const TIER_RANK = { sonnet: 0, opus: 1, fable: 2 };

function rankModel(id) {
  for (const [family, rank] of Object.entries(TIER_RANK)) {
    if (id.includes(family)) return rank;
  }
  return 99; // below the floor (e.g. haiku) or unknown family — never selected unless nothing else exists
}

// Module-scope cache survives across warm serverless invocations.
let cachedModel = null;
let cachedAt = 0;
const MODEL_CACHE_MS = 60 * 60 * 1000; // 1 hour
const FALLBACK_MODEL = "claude-sonnet-4-6"; // cheapest Sonnet-tier model if discovery fails

// Query the Models API and pick the cheapest currently-available model.
// Retired models never appear in this list, so they can never be selected.
async function getCheapestModel(apiKey, { force = false } = {}) {
  const now = Date.now();
  if (!force && cachedModel && now - cachedAt < MODEL_CACHE_MS) {
    return cachedModel;
  }

  const res = await fetch("https://api.anthropic.com/v1/models?limit=100", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });

  if (!res.ok) {
    // Listing failed — reuse last known good model, or the safe fallback.
    return cachedModel || FALLBACK_MODEL;
  }

  const { data } = await res.json();
  const ids = (data || []).map((m) => m.id);
  // Sort cheapest tier first; within a tier prefer the newest (reverse lexicographic).
  ids.sort((a, b) => rankModel(a) - rankModel(b) || b.localeCompare(a));

  cachedModel = ids[0] || FALLBACK_MODEL;
  cachedAt = now;
  return cachedModel;
}

async function callAnthropic(apiKey, model, { system, messages }) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages,
    }),
  });
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const { messages, system } = req.body;

    let model = await getCheapestModel(apiKey);
    let response = await callAnthropic(apiKey, model, { system, messages });

    // Self-heal: if the cached model was retired since we last looked,
    // refresh the model list and retry once with the new cheapest model.
    if (response.status === 404) {
      model = await getCheapestModel(apiKey, { force: true });
      response = await callAnthropic(apiKey, model, { system, messages });
    }

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({ error: errorData });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
