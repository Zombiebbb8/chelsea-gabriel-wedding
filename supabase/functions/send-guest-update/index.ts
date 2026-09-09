import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FROM = 'Chelsea & Gabriel <rsvp@rsvphub.cc>';
const REPLY_TO = 'breezymail20@gmail.com'; // rsvp@rsvphub.cc cannot receive mail
const SITE = 'https://rsvphub.cc';

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

function buildEmail(guest: Guest): string {
  const days = daysUntil();
  const name = esc(guest.first_name || 'friend');
  const portal = `${SITE}/?guest=${encodeURIComponent(guest.guest_token)}`;

  const fabricRow = (label: string, value: string, last = false) => `
      <tr>
        <td style="padding:12px 0;border-top:1px solid #e8e4d8;${last ? 'border-bottom:1px solid #e8e4d8;' : ''}font-size:14px;color:#8a8a72;width:46%">${label}</td>
        <td style="padding:12px 0;border-top:1px solid #e8e4d8;${last ? 'border-bottom:1px solid #e8e4d8;' : ''}font-size:15px;font-weight:bold">${value}</td>
      </tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8">
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#3a3a2e">
  <div style="background:#6b7045;padding:32px 24px;text-align:center">
    <p style="color:#e8d5a3;letter-spacing:3px;font-size:11px;margin:0 0 8px;font-family:sans-serif">CHELSEA &amp; GABRIEL</p>
    <h1 style="color:#fff;font-size:26px;margin:0;font-weight:normal">Six Months to Go</h1>
    <p style="color:#e8d5a3;font-size:13px;margin:10px 0 0;font-family:sans-serif">March 20, 2027 &middot; Enugu, Nigeria</p>
  </div>

  <div style="padding:32px 24px;background:#fafaf7;border:1px solid #e8e4d8">
    <p style="font-size:16px;line-height:1.7">Dear <strong>${name}</strong>,</p>
    <p style="font-size:15px;line-height:1.7">We are <strong>${days} days</strong> away &mdash; just over six months. It has crept up on us too, so here is everything you need to start getting ready.</p>

    <div style="text-align:center;background:#f6f2e4;border:1px solid #e4dcc0;padding:22px;margin:26px 0">
      <div style="font-family:Georgia,serif;font-size:44px;color:#6b7045;line-height:1">${days}</div>
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8a8a72;margin-top:4px;font-family:sans-serif">days to go</div>
    </div>

    <p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#8a8a72;margin:28px 0 8px;font-family:sans-serif">Our Aso-Ebi Is Here</p>
    <p style="font-size:15px;line-height:1.7">We have chosen our fabrics, and they are ready to order:</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      ${fabricRow('Groom&rsquo;s side &middot; Men', 'Pale Mint')}
      ${fabricRow('Groom&rsquo;s side &middot; Women', 'Emerald Green')}
      ${fabricRow('Bride&rsquo;s side', 'Burgundy &amp; Gold', true)}
    </table>

    <p style="font-size:15px;line-height:1.7">Fabric is <strong>$9 per yard</strong> (most guests order 5 yards) with a matching cap or gele for <strong>$5</strong>. You can pay in dollars or naira, and see the cloth itself, on your private page below.</p>

    <div style="background:#f6f2e4;border-left:3px solid #c9a84c;padding:16px 18px;margin:22px 0">
      <p style="font-size:14px;line-height:1.7;margin:0"><strong>Please order by ${ORDER_DEADLINE}.</strong> The cloth has to be cut, shipped and sewn in time, so we cannot promise anything ordered after that date will reach you before the wedding.</p>
    </div>

    <p style="font-size:15px;line-height:1.7">And if aso-ebi is not something you would like to take on, please do not give it a second thought &mdash; simply wear anything in our colours and you will match us perfectly. What matters to us is that you are there.</p>

    <p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#8a8a72;margin:28px 0 8px;font-family:sans-serif">Need a Tailor?</p>
    <p style="font-size:15px;line-height:1.7">If you would like your fabric sewn for you, we know a few very good designers and would be glad to introduce you. Just reply to this email and we will connect you.</p>

    <p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#8a8a72;margin:28px 0 8px;font-family:sans-serif">Visas &amp; Flights</p>
    <p style="font-size:15px;line-height:1.7">If you need a visa for Nigeria, now is the time to begin &mdash; applications can take a while, and most require your flight and accommodation details up front. Flights into Enugu are also kinder the earlier you book. There is a full travel guide, including hotels near the venue, on your page below.</p>

    <div style="text-align:center;margin:32px 0 8px">
      <a href="${portal}" style="display:inline-block;background:#6b7045;color:#fff;text-decoration:none;padding:15px 34px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase">Open My Private Page</a>
    </div>
    <p style="font-size:12px;line-height:1.6;color:#8a8a72;text-align:center;margin:0 0 8px;font-family:sans-serif">This link is yours alone &mdash; it opens your attire ordering, travel guide and details.</p>

    <p style="font-size:15px;line-height:1.7;margin-top:28px">Any questions at all, just reply to this email &mdash; it comes straight to us.</p>
    <p style="font-size:15px;line-height:1.7;margin-top:24px">With love,<br><strong>Chelsea &amp; Gabriel</strong></p>
  </div>

  <div style="padding:16px 24px;text-align:center;background:#f0ece0">
    <p style="font-size:12px;color:#999;margin:0;font-family:sans-serif">Chelsea &amp; Gabriel &middot; March 20, 2027 &middot; Enugu, Nigeria</p>
  </div>
</div>
</body></html>`;
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
    }

    return json({ ok: true, mode, eligible: guests.length, attempted: batch.length, sent, failures });
  } catch (err) {
    console.error('send-guest-update failed:', String(err));
    return json({ ok: false, error: String(err) }, 500);
  }
});
