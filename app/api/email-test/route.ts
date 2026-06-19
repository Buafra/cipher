import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.MORNING_EMAIL_TO;
  const from = process.env.MORNING_EMAIL_FROM;

  if (!apiKey || !to || !from) {
    return NextResponse.json(
      { ok: false, error: "Missing email environment variables" },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  const email = await resend.emails.send({
    from,
    to,
    subject: "Cipher Email Test",
    html: `
      <h1>Cipher Email Test</h1>
      <p>Email delivery is working.</p>
    `,
  });

  return NextResponse.json({
    ok: true,
    email,
  });
}