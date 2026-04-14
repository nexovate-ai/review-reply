import Anthropic from "@anthropic-ai/sdk";

const PROHIBITED_PHRASES = [
  "we guarantee",
  "I promise",
  "your treatment was correct",
  "that shouldn't have happened",
  "we'll give you a refund",
  "free consultation",
  "our prices are the lowest",
  "other dentists would",
  "your insurance should",
  "we never make mistakes",
];

function buildSystemPrompt(vertical) {
  return [
    `You are a ${vertical} practice reputation management specialist.`,
    "Generate a professional response to this review. Rules:",
    "- Never admit liability or make promises the business can't keep",
    "- Never offer specific compensation in the response",
    "- Never reference HIPAA or patient records",
    "- Include empathy for negative experiences",
    "- Keep responses under 150 words",
    "- End with an invitation to discuss offline for negative reviews",
    "- Address the reviewer directly",
    "- Reference specific details from their review to show you read it",
    "",
    `Prohibited phrases (never use these): ${PROHIBITED_PHRASES.join(", ")}`,
  ].join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reviewText, rating, practiceName } = req.body;

  if (!reviewText || !rating) {
    return res.status(400).json({ error: "reviewText and rating are required" });
  }

  if (reviewText.length > 2000) {
    return res.status(400).json({ error: "Review text must be under 2000 characters" });
  }

  const ratingNum = parseInt(rating, 10);
  if (ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  const model =
    ratingNum <= 2 ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001";

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = buildSystemPrompt("dental");
  const userPrompt = [
    practiceName ? `Practice: ${practiceName}` : "",
    `Review (${ratingNum}/5 stars):`,
    "",
    reviewText,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

    return res.status(200).json({
      response: message.content[0].text,
      model: ratingNum <= 2 ? "sonnet" : "haiku",
    });
  } catch (err) {
    console.error("Anthropic API error:", err.message);
    return res.status(502).json({ error: "Failed to generate response. Please try again." });
  }
}
