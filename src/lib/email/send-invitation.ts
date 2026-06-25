import { Resend } from "resend";

export interface SendInvitationParams {
  to: string;
  importerOrgName: string;
  materialType: string;
  mass: number;
  originCountry: string;
  inviteLink: string;
  token: string;
}

export interface SendInvitationResult {
  ok: boolean;
  error?: string;
  /** True when sandbox mode redirected delivery to the Resend account inbox */
  devRedirected?: boolean;
  /** Original exporter email when devRedirected is true */
  intendedRecipient?: string;
  /** Inbox that received the email when devRedirected is true */
  deliveredTo?: string;
}

function formatResendError(error: unknown): string {
  if (!error) return "Unknown error sending email";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown error sending email";
}

/** Resend sandbox errors include the account email in parentheses */
function extractSandboxInbox(errorMessage: string): string | null {
  const match = errorMessage.match(
    /only send testing emails to your own email address \(([^)]+)\)/i
  );
  return match?.[1]?.trim() ?? null;
}

function isSandboxFromAddress(from: string): boolean {
  return from.includes("@resend.dev");
}

function buildEmailBodies(params: {
  importerOrgName: string;
  materialType: string;
  mass: number;
  originCountry: string;
  inviteLink: string;
  devNotice?: string;
}) {
  const { importerOrgName, materialType, mass, originCountry, inviteLink, devNotice } =
    params;
  const subject = `CBAMVault: Emission data requested for ${materialType} shipment`;
  const devBanner = devNotice
    ? `<p style="margin:0 0 20px;padding:12px 16px;background:#422006;border:1px solid #92400e;border-radius:8px;font-size:13px;color:#fcd34d;line-height:1.5;">${devNotice}</p>`
    : "";
  const devTextNotice = devNotice ? `\n\n${devNotice}\n` : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0f0f10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f10;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1d;border-radius:12px;border:1px solid #2a2a2d;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #2a2a2d;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#7c6af5;">CBAMVault</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;color:#f5f5f6;line-height:1.3;">
                Emission data requested
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px;">
              ${devBanner}
              <p style="margin:0 0 20px;font-size:15px;color:#a0a0a8;line-height:1.6;">
                <strong style="color:#f5f5f6;">${importerOrgName}</strong> has invited you to submit embedded emission data for a CBAM-covered shipment via CBAMVault.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#111113;border-radius:8px;border:1px solid #2a2a2d;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#5a5a64;">Shipment Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#7c7c8a;width:40%;">Material</td>
                        <td style="padding:4px 0;font-size:13px;color:#f5f5f6;font-weight:500;">${materialType}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#7c7c8a;">Mass</td>
                        <td style="padding:4px 0;font-size:13px;color:#f5f5f6;font-weight:500;">${mass} tonnes</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#7c7c8a;">Origin</td>
                        <td style="padding:4px 0;font-size:13px;color:#f5f5f6;font-weight:500;">${originCountry}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" style="display:inline-block;padding:13px 32px;background:#7c6af5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
                      View &amp; Accept Invitation →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#5a5a64;text-align:center;line-height:1.6;">
                Or copy this link:<br />
                <a href="${inviteLink}" style="color:#7c6af5;word-break:break-all;">${inviteLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #2a2a2d;">
              <p style="margin:0;font-size:12px;color:#5a5a64;line-height:1.6;">
                This invitation expires in 14 days. If you did not expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  const text = `
CBAMVault — Emission data requested
${devTextNotice}
${importerOrgName} has invited you to submit embedded emission data for a CBAM-covered shipment.

Shipment details:
  Material: ${materialType}
  Mass: ${mass} tonnes
  Origin: ${originCountry}

Accept the invitation here:
${inviteLink}

This invitation expires in 14 days.
`.trim();

  return { subject, html, text };
}

export async function sendInvitationEmail(
  params: SendInvitationParams
): Promise<SendInvitationResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const resend = new Resend(apiKey);
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? "CBAMVault <onboarding@resend.dev>";
  const { to, importerOrgName, materialType, mass, originCountry, inviteLink } =
    params;

  const configuredDevInbox = process.env.RESEND_DEV_INBOX?.trim().toLowerCase();
  const usingSandboxFrom = isSandboxFromAddress(from);

  async function attemptSend(
    recipient: string,
    devNotice?: string
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const { subject, html, text } = buildEmailBodies({
      importerOrgName,
      materialType,
      mass,
      originCountry,
      inviteLink,
      devNotice,
    });

    const { data, error } = await resend.emails.send({
      from,
      to: recipient,
      subject,
      html,
      text,
    });

    if (error) {
      return { ok: false, error: formatResendError(error) };
    }

    if (!data?.id) {
      return { ok: false, error: "Resend did not return a message id." };
    }

    return { ok: true };
  }

  try {
    // Proactive dev redirect: sandbox sender can only reach one inbox
    if (
      usingSandboxFrom &&
      configuredDevInbox &&
      to.toLowerCase() !== configuredDevInbox
    ) {
      const devNotice = `[Dev mode] This invitation is for <strong>${to}</strong>. Resend sandbox only delivers to your account inbox.`;
      const redirected = await attemptSend(configuredDevInbox, devNotice);
      if (redirected.ok) {
        return {
          ok: true,
          devRedirected: true,
          intendedRecipient: to,
          deliveredTo: configuredDevInbox,
        };
      }
      return { ok: false, error: redirected.error };
    }

    const initial = await attemptSend(to);
    if (initial.ok) {
      return { ok: true };
    }

    // Auto-recover: parse Resend sandbox error and retry to allowed inbox
    const sandboxInbox = extractSandboxInbox(initial.error);
    if (sandboxInbox && to.toLowerCase() !== sandboxInbox.toLowerCase()) {
      const devNotice = `[Dev mode] This invitation is for <strong>${to}</strong>. Resend sandbox only delivers to your account inbox.`;
      const redirected = await attemptSend(sandboxInbox, devNotice);
      if (redirected.ok) {
        return {
          ok: true,
          devRedirected: true,
          intendedRecipient: to,
          deliveredTo: sandboxInbox,
        };
      }
      return { ok: false, error: redirected.error };
    }

    if (usingSandboxFrom) {
      return {
        ok: false,
        error: `${initial.error} Set RESEND_DEV_INBOX in .env.local to your Resend account email for local testing, or verify a custom domain for production.`,
      };
    }

    return { ok: false, error: initial.error };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error sending email",
    };
  }
}
