import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { SITE } from "./site";

// Outgoing email over SMTP. Works with any provider, including Gmail with an app
// password (SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_USER=you@gmail.com).

export const emailEnabled = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter: Transporter | null = null;

function transport(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
  const from = process.env.EMAIL_FROM || `${SITE.name} <${process.env.SMTP_USER}>`;
  await transport().sendMail({ from, to, subject, text, html });
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function passwordResetEmail(link: string): { subject: string; text: string; html: string } {
  const subject = `Reset your ${SITE.name} password`;
  const text = `Someone asked to reset the password for your ${SITE.name} account.

Reset it here (the link works for 1 hour):
${link}

If this wasn't you, ignore this email; your password stays the same.`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1d1d22;max-width:480px">
<p>Someone asked to reset the password for your ${SITE.name} account.</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 18px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none">Reset password</a></p>
<p style="color:#6b6b73;font-size:14px">The link works for 1 hour. If this wasn't you, ignore this email; your password stays the same.</p>
</div>`;
  return { subject, text, html };
}
