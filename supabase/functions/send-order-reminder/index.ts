import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FROM = 'Chelsea & Gabriel <rsvp@rsvphub.cc>';
const REPLY_TO = 'breezymail20@gmail.com';
const SITE = 'https://rsvphub.cc';

const WEDDING = new Date('2027-03-20T00:00:00.000Z');
const ORDER_DEADLINE_AT = new Date('2026-11-30T23:59:59.000Z');
const ORDER_DEADLINE = '30 November 2026';

/* Cadence. The job runs every few hours; a guest is only emailed once the
   interval has elapsed since their last reminder, and never more than
   MAX_REMINDERS times in total — a sequence that cannot end is indistinguishable
   from spam, and these are the couple's friends and family. */
const REMINDER_INTERVAL_HOURS = 48;
const MAX_REMINDERS = 4;

function daysUntil(): number {
  return Math.ceil((WEDDING.getTime() - Date.now()) / 86400000);
}

function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

interface Candidate {
  id: string;
  first_name: string | null;
  email: string;
  guest_token: string;
  order_reminder_count: number;
}

/* The first note is the gentlest and mentions that the page had trouble,
   because everyone who opened it before this was fixed met a broken form.
   Later notes lean on the deadline instead of repeating the apology. */
function opening(count: number, days: number): string {
  if (count === 0) {
    return 'You opened your page to look at the aso-ebi, but we do not have an order from you yet — and for a while the ordering page was not working properly, so it may well have been us rather than you. That is fixed now, and it only takes a minute.';
  }
  if (count === 1) {
    return 'Just a gentle nudge — we still do not have your aso-ebi order, and we did not want you to miss it while there is plenty of time.';
  }
  return `We are down to ${days} days, and orders close on ${ORDER_DEADLINE}. We would hate for you to be the only one without your cloth on the day.`;
}

function buildEmail(guest: Candidate): string {
  const days = daysUntil();
  const name = esc(guest.first_name || 'friend');
  const portal = `${SITE}/attire?guest=${encodeURIComponent(guest.guest_token)}`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#efe9dc" bgcolor="#efe9dc">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0">
  Your aso-ebi is still waiting &mdash; orders close ${ORDER_DEADLINE}.
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#efe9dc">
<tr><td align="center" style="padding:28px 12px">
  <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;max-width:600px;background:#ffffff">

    <tr><td bgcolor="#6b7045" align="center" style="padding:28px;background:#6b7045">
      <p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#dcd2a4;margin:0 0 10px">Chelsea &amp; Gabriel</p>
      <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:normal;color:#ffffff;margin:0">Your Aso-Ebi Is Waiting</h1>
    </td></tr>

    <tr><td style="padding:34px 34px 28px;background:#ffffff">
      <p style="font-family:Georgia,serif;font-size:16px;line-height:1.75;color:#4a4838;margin:0 0 16px">Dear <strong style="color:#3a3a2e">${name}</strong>,</p>
      <p style="font-family:Georgia,serif;font-size:16px;line-height:1.75;color:#4a4838;margin:0 0 16px">${opening(guest.order_reminder_count, days)}</p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:22px 0">
        <tr>
          <td width="4" bgcolor="#c9a84c" style="width:4px;background:#c9a84c;font-size:0">&nbsp;</td>
          <td bgcolor="#faf6ea" style="padding:16px 20px;background:#faf6ea">
            <p style="font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#4a4838;margin:0">
              <strong style="color:#3a3a2e">Orders close ${ORDER_DEADLINE}</strong> &mdash; the cloth still has to be cut, shipped and sewn before the day.
            </p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:28px 0 12px">
        <tr><td align="center">
          <table cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr><td bgcolor="#6b7045" style="background:#6b7045">
              <a href="${portal}" style="display:inline-block;padding:16px 38px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:#ffffff;text-decoration:none">Place My Order</a>
            </td></tr>
          </table>
        </td></tr>
      </table>

      <p style="font-family:Georgia,serif;font-size:16px;line-height:1.75;color:#4a4838;margin:22px 0 0">
        If anything is unclear &mdash; which side to choose, how much fabric you need, how to pay, or if you would like us to introduce you to a tailor &mdash; just reply to this email. We are happy to help, and we read every one.
      </p>

      <p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:#a09c86;margin:26px 0 0;border-top:1px solid #ece7d9;padding-top:18px">
        Not planning to order aso-ebi? That is completely fine &mdash; simply reply and we will stop sending these.
      </p>

      <p style="font-family:Georgia,serif;font-size:16px;line-height:1.75;color:#4a4838;margin:22px 0 0">
        With love,<br/><strong style="color:#3a3a2e">Chelsea &amp; Gabriel</strong>
      </p>
    </td></tr>

    <tr><td bgcolor="#f4f0e4" align="center" style="padding:18px;background:#f4f0e4">
      <p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.5px;color:#a8a48c;margin:0">
        CHELSEA &amp; GABRIEL &middot; 20 MARCH 2027 &middot; ENUGU, NIGERIA
      </p>
    </td></tr>

  </table>
</td></tr>
</table>
</body></html>`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: secretRow } = await supabase
      .from('admin_secrets').select('value').eq('key', 'guest_update_send').maybeSingle();
    if (!secretRow || body.secret !== secretRow.value) {
      return json({ ok: false, error: 'Not authorised.' }, 401);
    }

    // Nothing to chase once ordering has closed.
    if (Date.now() > ORDER_DEADLINE_AT.getTime()) {
      return json({ ok: true, skipped: 'past the order deadline', sent: 0 });
    }

    const { data: candidates, error } = await supabase
      .from('order_reminder_candidates')
      .select('id, first_name, email, guest_token, order_reminder_count, order_reminder_last_at');

    if (error) return json({ ok: false, error: error.message }, 500);

    const cutoff = Date.now() - REMINDER_INTERVAL_HOURS * 3600 * 1000;
    const due = (candidates ?? []).filter((c) => {
      if (c.order_reminder_count >= MAX_REMINDERS) return false;
      if (!c.order_reminder_last_at) return true;              // never reminded
      return new Date(c.order_reminder_last_at).getTime() <= cutoff;
    });

    // A dry run reports exactly who would be emailed, and sends nothing.
    if (body.dryRun) {
      return json({
        ok: true, dryRun: true,
        candidates: (candidates ?? []).length,
        due: due.length,
        intervalHours: REMINDER_INTERVAL_HOURS,
        maxReminders: MAX_REMINDERS,
        preview: due.map((c) => ({ name: c.first_name, remindersSoFar: c.order_reminder_count })),
      });
    }

    // Renders a real candidate's reminder but delivers it to one chosen
    // address, so the wording can be proofed without emailing the guest list.
    if (body.testTo) {
      const sample = (candidates ?? [])[0];
      if (!sample) return json({ ok: false, error: 'No candidate to model the email on.' }, 404);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM, to: [String(body.testTo)], reply_to: [REPLY_TO],
          subject: '[TEST] Did something get in the way of your aso-ebi order?',
          html: buildEmail(sample as Candidate),
        }),
      });
      return json({ ok: res.ok, testTo: body.testTo, status: res.status });
    }

    let sent = 0;
    const failures: { email: string; status: number }[] = [];

    for (const guest of due as Candidate[]) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM, to: [guest.email], reply_to: [REPLY_TO],
          subject: guest.order_reminder_count === 0
            ? 'Did something get in the way of your aso-ebi order?'
            : `Your aso-ebi order — orders close ${ORDER_DEADLINE}`,
          html: buildEmail(guest),
        }),
      });

      if (res.ok) {
        await supabase.from('rsvps').update({
          order_reminder_count: guest.order_reminder_count + 1,
          order_reminder_last_at: new Date().toISOString(),
        }).eq('id', guest.id);
        sent++;
      } else {
        failures.push({ email: guest.email, status: res.status });
      }
      await new Promise((r) => setTimeout(r, 600));
    }

    return json({ ok: true, candidates: (candidates ?? []).length, due: due.length, sent, failures });
  } catch (err) {
    console.error('send-order-reminder failed:', String(err));
    return json({ ok: false, error: String(err) }, 500);
  }
});
