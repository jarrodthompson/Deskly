const BRAND = "#06b6d4";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:8px">${label}</a>`;
}

function quote(body: string) {
  return `<div style="border-left:3px solid ${BORDER};padding:2px 0 2px 14px;margin:18px 0;color:${TEXT};font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(body)}</div>`;
}

function layout(heading: string, inner: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:24px 12px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:14px;overflow:hidden">
    <tr><td style="padding:22px 28px;border-bottom:1px solid ${BORDER}">
      <span style="display:inline-block;width:26px;height:26px;background:${BRAND};border-radius:7px;color:#ffffff;font-weight:700;font-size:14px;text-align:center;line-height:26px;vertical-align:middle">D</span>
      <span style="font-weight:600;font-size:15px;color:${TEXT};margin-left:9px;vertical-align:middle">Deskly</span>
    </td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 14px;font-size:19px;line-height:1.35;color:${TEXT};font-weight:600">${heading}</h1>
      ${inner}
    </td></tr>
    <tr><td style="padding:16px 28px;border-top:1px solid ${BORDER};color:${MUTED};font-size:12px">
      You are receiving this because of activity on your Deskly support ticket.
    </td></tr>
  </table>
</body></html>`;
}

function paragraph(html: string) {
  return `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${TEXT}">${html}</p>`;
}

function meta(label: string) {
  return `<p style="margin:0 0 18px;font-size:13px;color:${MUTED}">${escapeHtml(label)}</p>`;
}

type TicketRef = { ticketLabel: string; subject: string; url: string };

export function ticketCreatedEmail({ ticketLabel, subject, url, customerName }: TicketRef & { customerName: string }) {
  return {
    subject: `[${ticketLabel}] We received your request: ${subject}`,
    html: layout("We've got your request", [
      paragraph(`Hi ${escapeHtml(customerName)}, thanks for getting in touch. Your ticket has been logged and our support team will pick it up shortly.`),
      meta(`${ticketLabel} — ${subject}`),
      button(url, "View your ticket"),
    ].join("")),
  };
}

export function agentRepliedEmail({ ticketLabel, subject, url, agentName, body }: TicketRef & { agentName: string; body: string }) {
  return {
    subject: `[${ticketLabel}] ${subject}`,
    html: layout(`${escapeHtml(agentName)} replied to your ticket`, [
      meta(`${ticketLabel} — ${subject}`),
      quote(body),
      button(url, "Reply in the portal"),
    ].join("")),
  };
}

export function customerRepliedEmail({ ticketLabel, subject, url, customerName, body }: TicketRef & { customerName: string; body: string }) {
  return {
    subject: `[${ticketLabel}] New customer reply: ${subject}`,
    html: layout(`${escapeHtml(customerName)} replied`, [
      meta(`${ticketLabel} — ${subject}`),
      quote(body),
      button(url, "Open ticket"),
    ].join("")),
  };
}

export function ticketResolvedEmail({ ticketLabel, subject, url }: TicketRef) {
  return {
    subject: `[${ticketLabel}] Resolved: ${subject}`,
    html: layout("Your ticket has been resolved", [
      paragraph("Our team has marked this ticket as resolved. If the problem isn't fully sorted, reply on the ticket and it will reopen automatically."),
      meta(`${ticketLabel} — ${subject}`),
      button(url, "View ticket and leave feedback"),
    ].join("")),
  };
}

export function ticketAssignedEmail({ ticketLabel, subject, url, agentName }: TicketRef & { agentName: string }) {
  return {
    subject: `[${ticketLabel}] Assigned to you: ${subject}`,
    html: layout("A ticket was assigned to you", [
      paragraph(`Hi ${escapeHtml(agentName)}, this ticket is now yours.`),
      meta(`${ticketLabel} — ${subject}`),
      button(url, "Open in Deskly"),
    ].join("")),
  };
}
