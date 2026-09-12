import { Resend } from "resend";

export function appUrl() {
  return process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3030";
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

type SendEmailInput = { to: string; subject: string; html: string };

/**
 * Never throws: a failed notification must not roll back the ticket action that
 * triggered it.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:not-configured] would send "${subject}" to ${to}`);
    return;
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.EMAIL_FROM ?? "Deskly <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    if (error) console.error(`[email:failed] "${subject}" to ${to}:`, error.message);
  } catch (error) {
    console.error(`[email:failed] "${subject}" to ${to}:`, error);
  }
}
