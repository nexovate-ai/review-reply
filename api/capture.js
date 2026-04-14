export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, practiceName, source } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  // For now, log to Vercel logs. Once we have a database or email service
  // connected, this will insert into prospects/suppression tables and
  // trigger the audit report email sequence.
  console.log(
    JSON.stringify({
      event: "email_capture",
      email,
      practiceName: practiceName || "",
      source: source || "review-reply",
      timestamp: new Date().toISOString(),
    })
  );

  return res.status(200).json({ ok: true });
}
