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
