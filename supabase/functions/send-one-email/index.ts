import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/* A single addressed email, for the one-to-one correspondence the bulk mailers
   cannot cover — visa invitation letters, tailor introductions, a reply to one
   guest. Secret-gated like the other senders, because the anon key is public. */

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FROM = 'Chelsea & Gabriel <rsvp@rsvphub.cc>';
const REPLY_TO = 'breezymail20@gmail.com';

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

    const to = String(body.to || '').trim();
    const subject = String(body.subject || '').trim();
    const html = String(body.html || '');
    if (!to || !subject || !html) {
      return json({ ok: false, error: 'to, subject and html are all required.' }, 400);
    }

    const payload: Record<string, unknown> = {
      from: FROM,
      to: [to],
      reply_to: [REPLY_TO],
      subject,
      html,
    };
    if (body.text) payload.text = String(body.text);
    // Optional attachments: [{ filename, content }] with content base64-encoded.
    if (Array.isArray(body.attachments) && body.attachments.length) {
      payload.attachments = body.attachments;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const detail = res.ok ? null : await res.text();
    return json({ ok: res.ok, to, subject, status: res.status, detail });
  } catch (err) {
    console.error('send-one-email failed:', String(err));
    return json({ ok: false, error: String(err) }, 500);
  }
});
