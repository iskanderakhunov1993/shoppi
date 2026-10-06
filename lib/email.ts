import { Resend } from "resend";

/** True when a Resend key is configured. */
export const EMAIL_ENABLED = Boolean(process.env.RESEND_API_KEY);

/**
 * Verification / reset links may be handed back in the API response only
 * outside production. In production that would let anyone who knows an
 * email address confirm it or reset its password without owning it.
 */
export const EXPOSE_LINKS = process.env.NODE_ENV !== "production";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Resend's sandbox sender works without a verified domain, but only
// delivers to the email address on the Resend account itself — fine
// for this MVP's own testing, and swapped for a verified domain once
// one exists.
const FROM = process.env.RESEND_FROM_EMAIL ?? "Shoppi <onboarding@resend.dev>";

/**
 * Sends the verification email for real when RESEND_API_KEY is set.
 * Without a key configured (local dev with no key, or the key missing
 * for any reason), returns false so the caller can fall back to
 * showing the verify link inline instead of silently going nowhere.
 */
export async function sendVerificationEmail(email: string, verifyUrl: string): Promise<boolean> {
  if (!resend) return false;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Подтвердите почту — Shoppi",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 20px;">Добро пожаловать в Shoppi</h1>
          <p>Подтвердите почту, чтобы закончить регистрацию:</p>
          <p>
            <a href="${verifyUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; text-decoration: none; font-weight: 600;">
              Подтвердить email
            </a>
          </p>
          <p style="color: #737066; font-size: 13px;">Если вы не регистрировались в Shoppi, просто проигнорируйте это письмо.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return false;
  }
}

/** Same fallback behavior as sendVerificationEmail — see its comment. */
export async function sendResetPasswordEmail(email: string, resetUrl: string): Promise<boolean> {
  if (!resend) return false;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Восстановление пароля — Shoppi",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 20px;">Восстановление пароля</h1>
          <p>Ссылка действует час. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; text-decoration: none; font-weight: 600;">
              Задать новый пароль
            </a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to send reset email:", err);
    return false;
  }
}

const esc = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Weekly "new finds from your creators" email. */
export async function sendDigestEmail(opts: {
  email: string;
  total: number;
  items: { title: string; imageUrl?: string; price?: number; creatorName: string; url: string }[];
  allUrl: string;
  unsubscribeUrl: string;
}): Promise<boolean> {
  if (!resend) return false;
  const rows = opts.items
    .map(
      (i) => `
        <tr><td style="padding: 12px 0; border-bottom: 1px solid #e7e5e2;">
          <a href="${esc(i.url)}" style="color: #111; text-decoration: none; display: flex; gap: 14px; align-items: center;">
            ${i.imageUrl && /^https?:/.test(i.imageUrl) ? `<img src="${esc(i.imageUrl)}" width="64" height="64" alt="" style="object-fit: cover; background: #f4f3f1; flex: none;">` : ""}
            <span>
              <span style="display: block; font-weight: 600; font-size: 14px;">${esc(i.title)}</span>
              <span style="display: block; color: #737066; font-size: 12px; margin-top: 2px;">от ${esc(i.creatorName)}${i.price ? ` · ${i.price.toLocaleString("ru-RU")} ₽` : ""}</span>
            </span>
          </a>
        </td></tr>`
    )
    .join("");
  const word = (n: number) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return "новая рекомендация";
    if ([2, 3, 4].includes(m10) && ![12, 13, 14].includes(m100)) return "новые рекомендации";
    return "новых рекомендаций";
  };

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.email,
      subject: `${opts.total} ${word(opts.total)} от ваших блогеров — Shoppi`,
      headers: { "List-Unsubscribe": `<${opts.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #111;">
          <h1 style="font-size: 22px; font-weight: 400; font-family: Georgia, serif;">${opts.total} ${word(opts.total)} за неделю</h1>
          <p style="color: #737066;">Блогеры, на которых вы подписаны, добавили новые товары.</p>
          <table style="width: 100%; border-collapse: collapse;">${rows}</table>
          <p style="margin-top: 20px;">
            <a href="${esc(opts.allUrl)}" style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; text-decoration: none; font-weight: 600;">Смотреть все рекомендации</a>
          </p>
          <p style="color: #737066; font-size: 12px; margin-top: 28px;">
            Письмо приходит раз в неделю, если есть новинки. <a href="${esc(opts.unsubscribeUrl)}" style="color: #737066;">Отписаться</a>
          </p>
        </div>
      `,
    });
    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to send digest email:", err);
    return false;
  }
}
