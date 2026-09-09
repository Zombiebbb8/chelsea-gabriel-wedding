import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FROM = 'Chelsea & Gabriel <rsvp@rsvphub.cc>';
const REPLY_TO = 'breezymail20@gmail.com'; // rsvp@rsvphub.cc cannot receive mail
const SITE = 'https://rsvphub.cc';
const HERO = `${SITE}/photos/email-hero.jpg`;

const WEDDING = new Date('2027-03-20T00:00:00.000Z');
const ORDER_DEADLINE = '30 November 2026';

const SUBJECT = 'Six Months to Go — Our Aso-Ebi Is Here';

function daysUntil(): number {
  return Math.ceil((WEDDING.getTime() - Date.now()) / 86400000);
}

function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

interface Guest { id: string; first_name: string | null; email: string; guest_token: string }

/* One fabric line: a colour chip, who it is for, and the name. Built from
   nested tables with bgcolor so it survives Outlook, which ignores most CSS. */
function fabricRow(swatches: string[], who: string, name: string, last = false): string {
  const border = `border-top:1px solid #ece7d9;${last ? 'border-bottom:1px solid #ece7d9;' : ''}`;
  const chips = swatches.map((c) =>
    `<td width="18" height="18" bgcolor="${c}" style="width:18px;height:18px;border-radius:3px;font-size:0;line-height:0">&nbsp;</td>`
  ).join('<td width="4" style="width:4px;font-size:0">&nbsp;</td>');

  return `
      <tr>
        <td valign="middle" style="padding:14px 12px 14px 0;${border}">
          <table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>${chips}</tr></table>
        </td>
        <td valign="middle" style="padding:14px 0;${border}font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:#9a9678">${who}</td>
        <td valign="middle" align="right" style="padding:14px 0;${border}font-family:Georgia,serif;font-size:17px;color:#3a3a2e">${name}</td>
      </tr>`;
}

function buildEmail(guest: Guest): string {
  const days = daysUntil();
  const name = esc(guest.first_name || 'friend');
  const portal = `${SITE}/?guest=${encodeURIComponent(guest.guest_token)}`;

  const eyebrow = (t: string) =>
    `<p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#a8a48c;margin:34px 0 10px">${t}</p>`;
  const para = (t: string) =>
    `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.75;color:#4a4838;margin:0 0 16px">${t}</p>`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:#efe9dc" bgcolor="#efe9dc">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0">
  ${days} days until Enugu &mdash; our aso-ebi is ready, and orders close ${ORDER_DEADLINE}.
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#efe9dc">
<tr><td align="center" style="padding:28px 12px">

  <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;max-width:600px;background:#ffffff">

    <tr>
      <td style="font-size:0;line-height:0">
        <img src="${HERO}" width="600" alt="Chelsea and Gabriel in traditional attire"
             style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none"/>
      </td>
    </tr>

    <tr>
      <td bgcolor="#6b7045" align="center" style="padding:30px 28px;background:#6b7045">
        <p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#dcd2a4;margin:0 0 12px">Chelsea &amp; Gabriel</p>
        <h1 style="font-family:Georgia,serif;font-size:30px;font-weight:normal;color:#ffffff;margin:0;line-height:1.25">Six Months to Go</h1>
        <p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:2px;color:#c3c69a;margin:14px 0 0">20 MARCH 2027 &middot; ENUGU, NIGERIA</p>
      </td>
    </tr>

    <tr>
      <td style="padding:36px 34px 30px;background:#ffffff">

        ${para(`Dear <strong style="color:#3a3a2e">${name}</strong>,`)}
        ${para('It has crept up on us too. We are now well inside six months, and there are a few things worth starting on early &mdash; so here is where everything stands.')}

        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:26px 0">
          <tr><td align="center" bgcolor="#f7f3e6" style="padding:26px 20px;background:#f7f3e6;border:1px solid #e9e1c8">
            <div style="font-family:Georgia,serif;font-size:52px;line-height:1;color:#6b7045">${days}</div>
            <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:3.5px;text-transform:uppercase;color:#9a9678;padding-top:8px">Days To Go</div>
          </td></tr>
        </table>

        ${eyebrow('Our Aso-Ebi Is Here')}
        ${para('We have chosen our fabrics, and they are ready to order:')}

        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:6px 0 20px">
          ${fabricRow(['#d8e3c9'], 'Groom&rsquo;s side &middot; Men', 'Pale Mint')}
          ${fabricRow(['#3f7d2c'], 'Groom&rsquo;s side &middot; Women', 'Emerald Green')}
          ${fabricRow(['#6b1f3a', '#c9a84c'], 'Bride&rsquo;s side', 'Burgundy &amp; Gold', true)}
        </table>

        ${para('You can see the cloth itself, and place your order, on your private page below.')}

        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:22px 0">
          <tr>
            <td width="4" bgcolor="#c9a84c" style="width:4px;background:#c9a84c;font-size:0">&nbsp;</td>
            <td bgcolor="#faf6ea" style="padding:18px 20px;background:#faf6ea">
              <p style="font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#4a4838;margin:0">
                <strong style="color:#3a3a2e">Please order by ${ORDER_DEADLINE}.</strong>
                The cloth has to be cut, shipped and sewn in time, so we cannot promise anything ordered after that date will reach you before the wedding.
              </p>
            </td>
          </tr>
        </table>

        ${eyebrow('Need a Tailor?')}
        ${para('If you would like your fabric sewn for you, we know a few very good designers and would be glad to introduce you. Just reply to this email and we will connect you.')}

        ${eyebrow('Visas &amp; Flights')}
        ${para('If you need a visa for Nigeria, now is the time to begin &mdash; applications can take a while, and most require your flight and accommodation details up front. Flights into Enugu are also kinder the earlier you book. There is a full travel guide, including hotels near the venue, on your page below.')}

        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:34px 0 10px">
          <tr><td align="center">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr><td bgcolor="#6b7045" style="background:#6b7045">
                <a href="${portal}" style="display:inline-block;padding:16px 38px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:#ffffff;text-decoration:none">Open My Private Page</a>
              </td></tr>
            </table>
          </td></tr>
        </table>

        <p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#a09c86;text-align:center;margin:0 0 6px">
          This link is yours alone &mdash; it opens your attire ordering, the travel guide and your details.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:30px 0 0">
          <tr><td style="border-top:1px solid #ece7d9;padding-top:24px">
            ${para('Any questions at all, just reply to this email &mdash; it comes straight to us.')}
            <p style="font-family:Georgia,serif;font-size:16px;line-height:1.75;color:#4a4838;margin:20px 0 0">
              With love,<br/><strong style="color:#3a3a2e">Chelsea &amp; Gabriel</strong>
            </p>
          </td></tr>
        </table>

      </td>
    </tr>

    <tr>
      <td bgcolor="#f4f0e4" align="center" style="padding:20px 28px;background:#f4f0e4">
        <p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.5px;color:#a8a48c;margin:0">
          CHELSEA &amp; GABRIEL &middot; 20 MARCH 2027 &middot; ENUGU, NIGERIA
        </p>
      </td>
    </tr>

  </table>

</td></tr>
</table>
</body>
</html>`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Gate on a secret only the service role can read — the anon key alone
    // must never be enough to email every guest.
    const { data: secretRow } = await supabase
      .from('admin_secrets').select('value').eq('key', 'guest_update_send').maybeSingle();
    if (!secretRow || body.secret !== secretRow.value) {
      return json({ ok: false, error: 'Not authorised.' }, 401);
    }

    const mode = body.mode === 'send' ? 'send' : body.mode === 'test' ? 'test' : null;
    if (!mode) return json({ ok: false, error: "mode must be 'test' or 'send'." }, 400);

    // A test renders a real guest's email but delivers it to one chosen
    // address, so the copy can be proofed without touching the guest list.
    if (mode === 'test') {
      const to = String(body.to || '').trim();
      if (!to) return json({ ok: false, error: 'test mode needs "to".' }, 400);

      const { data: sample } = await supabase
        .from('rsvps')
        .select('id, first_name, email, guest_token')
        .eq('attending', 'yes').not('guest_token', 'is', null)
        .limit(1).maybeSingle();
      if (!sample) return json({ ok: false, error: 'No confirmed guest to model the email on.' }, 404);

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM, to: [to], reply_to: [REPLY_TO],
          subject: `[TEST] ${SUBJECT}`,
          html: buildEmail(sample as Guest),
        }),
      });
      const detail = res.ok ? null : await res.text();
      return json({ ok: res.ok, mode, to, status: res.status, detail });
    }

    // Real send: confirmed guests only, skipping anyone already mailed.
    const { data: guests, error } = await supabase
      .from('rsvps')
      .select('id, first_name, email, guest_token')
      .eq('attending', 'yes')
      .not('email', 'is', null).neq('email', '')
      .not('guest_token', 'is', null)
      .is('fabric_update_sent_at', null);

    if (error) return json({ ok: false, error: error.message }, 500);
    if (!guests?.length) return json({ ok: true, mode, sent: 0, message: 'Everyone has already been emailed.' });

    const limit = Number.isFinite(Number(body.limit)) ? Number(body.limit) : guests.length;
    const batch = guests.slice(0, Math.max(0, limit));

    let sent = 0;
    const failures: { email: string; status: number; detail: string }[] = [];

    for (const guest of batch as Guest[]) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM, to: [guest.email], reply_to: [REPLY_TO],
          subject: SUBJECT, html: buildEmail(guest),
        }),
      });

      if (res.ok) {
        // Stamped per guest immediately, so an interrupted run resumes cleanly.
        await supabase.from('rsvps')
          .update({ fabric_update_sent_at: new Date().toISOString() })
          .eq('id', guest.id);
        sent++;
      } else {
        failures.push({ email: guest.email, status: res.status, detail: await res.text() });
      }
      // Stay well inside Resend's rate limit across 55 sends.
      await new Promise((r) => setTimeout(r, 600));
    }

    return json({ ok: true, mode, eligible: guests.length, attempted: batch.length, sent, failures });
  } catch (err) {
    console.error('send-guest-update failed:', String(err));
    return json({ ok: false, error: String(err) }, 500);
  }
});
