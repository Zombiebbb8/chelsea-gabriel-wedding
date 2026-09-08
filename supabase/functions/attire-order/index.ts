import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FROM = 'Chelsea & Gabriel <rsvp@rsvphub.cc>';
const REPLY_TO = 'breezymail20@gmail.com';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/* The authoritative catalogue. The client sends only ids; every display name
   written to the database comes from here, so a tampered client cannot invent
   a fabric, mislabel one, or attach an accessory that does not belong to its
   family/gender combination. */
interface Variant {
  fabricId: string;
  fabricName: string;
  accessoryId: string | null;
  accessoryName: string | null;
  accessoryType: 'cap' | 'gele' | null;
}

const CATALOG: Record<string, Record<string, Variant>> = {
  groom: {
    male: {
      fabricId: 'groom-male',
      fabricName: 'Emerald Green',
      accessoryId: 'groom-cap',
      accessoryName: 'Emerald Green Cap',
      accessoryType: 'cap',
    },
    female: {
      fabricId: 'groom-female',
      fabricName: 'Emerald Green',
      accessoryId: 'groom-gele',
      accessoryName: 'Emerald Green Gele',
      accessoryType: 'gele',
    },
  },
  bride: {
    female: {
      fabricId: 'bride-female',
      fabricName: 'Burgundy & Gold',
      accessoryId: null,
      accessoryName: null,
      accessoryType: null,
    },
  },
};

const FAMILY_LABEL: Record<string, string> = {
  groom: "Groom's Family / Friends",
  bride: "Bride's Family / Friends",
};

const PAYMENT_LABEL: Record<string, string> = {
  paypal: 'PayPal',
  zelle: 'Zelle',
  wema: 'Wema Bank Transfer',
};

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

interface Guest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

function readGuest(raw: Record<string, unknown>): { guest?: Guest; error?: string } {
  const guest: Guest = {
    firstName: str(raw.firstName, 80),
    lastName: str(raw.lastName, 80),
    email: str(raw.email, 160),
    phone: str(raw.phone, 40),
    shippingAddress: str(raw.shippingAddress, 300),
    city: str(raw.city, 80),
    state: str(raw.state, 80),
    postalCode: str(raw.postalCode, 24),
    country: str(raw.country, 80),
  };

  const required: [keyof Guest, string][] = [
    ['firstName', 'First name'],
    ['lastName', 'Last name'],
    ['email', 'Email address'],
    ['phone', 'Phone number'],
    ['shippingAddress', 'Shipping address'],
    ['city', 'City'],
    ['country', 'Country'],
  ];
  for (const [key, label] of required) {
    if (!guest[key]) return { error: `${label} is required.` };
  }
  if (!isEmail(guest.email)) return { error: 'Please enter a valid email address.' };

  return { guest };
}

function orderEmailHtml(o: {
  orderNumber: string;
  firstName: string;
  family: string;
  gender: string;
  variant: Variant;
  paymentMethod: string;
  proofSubmitted: boolean;
  guest: Guest;
}): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:9px 0;font-size:13px;color:#8a8a72;width:44%">${label}</td>
      <td style="padding:9px 0;font-size:14px;color:#3a3a2e;font-weight:bold">${value}</td>
    </tr>`;

  const accessoryRow = o.variant.accessoryName
    ? row(o.variant.accessoryType === 'cap' ? 'Matching Cap' : 'Matching Gele', o.variant.accessoryName)
    : '';

  const address = [
    o.guest.shippingAddress,
    [o.guest.city, o.guest.state, o.guest.postalCode].filter(Boolean).join(', '),
    o.guest.country,
  ].filter(Boolean).join('<br>');

  return `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#3a3a2e">
    <div style="background:#6b7045;padding:32px 24px;text-align:center">
      <p style="color:#e8d5a3;letter-spacing:3px;font-size:11px;margin:0 0 8px">CHELSEA &amp; GABRIEL</p>
      <h1 style="color:#fff;font-size:26px;margin:0;font-weight:normal">Aso-Ebi Order Confirmation</h1>
      <p style="color:#e8d5a3;font-size:13px;margin:10px 0 0">Order ${o.orderNumber}</p>
    </div>
    <div style="padding:32px 24px;background:#fafaf7;border:1px solid #e8e4d8">
      <p style="font-size:16px;line-height:1.7">Dear ${o.firstName},</p>
      <p style="font-size:15px;line-height:1.7">Thank you &mdash; your Aso-Ebi order has been received. Here is what we have on file for you.</p>

      <table style="width:100%;border-collapse:collapse;margin:22px 0;border-top:1px solid #e8e4d8">
        ${row('Order Number', o.orderNumber)}
        ${row('Family', o.family)}
        ${row('Attire', o.gender === 'male' ? 'Male' : 'Female')}
        ${row('Fabric', o.variant.fabricName)}
        ${accessoryRow}
        ${row('Payment Method', o.paymentMethod)}
        ${row('Payment Proof', o.proofSubmitted ? 'Submitted' : 'Not yet submitted')}
        ${row('Order Status', 'Order Placed')}
      </table>

      <p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#8a8a72;margin:0 0 6px">Shipping To</p>
      <p style="font-size:14px;line-height:1.7;margin:0 0 22px">${o.guest.firstName} ${o.guest.lastName}<br>${address}</p>

      <div style="background:#f6f2e4;border-left:3px solid #c9a84c;padding:16px 18px;margin:22px 0">
        <p style="font-size:14px;line-height:1.7;margin:0"><strong>Important:</strong> your order has been placed, but your payment must be verified before it can be processed for shipping. If you have not already sent us a screenshot or receipt of your completed payment, please reply to this email with it.</p>
      </div>

      <p style="font-size:15px;line-height:1.7">We will be in touch as soon as your payment is confirmed.</p>
      <p style="font-size:15px;line-height:1.7;margin-top:24px">With love,<br><strong>Chelsea &amp; Gabriel</strong></p>
    </div>
    <div style="padding:16px 24px;text-align:center;background:#f0ece0">
      <p style="font-size:12px;color:#999;margin:0">Chelsea &amp; Gabriel &middot; March 20, 2027 &middot; Enugu, Nigeria</p>
    </div>
  </div>`;
}

function fail(error: string, status = 400): Response {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const body = await req.json();

    // 1. The guest must hold a valid portal token and be attending.
    const token = str(body.token, 100);
    if (!token) return fail('Missing guest token.', 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: rsvp } = await supabase
      .from('rsvps')
      .select('id, email, attending')
      .eq('guest_token', token)
      .maybeSingle();

    if (!rsvp) return fail('We could not verify your invitation link.', 401);
    if (rsvp.attending !== 'yes') return fail('Aso-ebi ordering is open to confirmed guests.', 403);

    // 2. The family/gender combination must exist in the catalogue.
    const family = str(body.family, 20);
    const gender = str(body.gender, 20);
    const variant = CATALOG[family]?.[gender];
    if (!variant) return fail('That attire combination is not available.');

    // 3. Guest details.
    const { guest, error: guestError } = readGuest(body.guest ?? {});
    if (!guest) return fail(guestError!);

    // 4. Payment.
    const paymentMethod = str(body.paymentMethod, 20);
    if (!PAYMENT_LABEL[paymentMethod]) return fail('Please choose a payment method.');

    // Only accept a proof path we can attribute to our own private bucket.
    const proofPath = str(body.paymentProofPath, 300);
    if (proofPath && !/^proofs\/[A-Za-z0-9._-]+$/.test(proofPath)) {
      return fail('That payment proof could not be read. Please upload it again.');
    }
    if (!proofPath) return fail('Please upload a screenshot or receipt of your payment.');

    // 5. Persist. order_number is assigned by a database sequence.
    const { data: order, error: insertError } = await supabase
      .from('attire_orders')
      .insert({
        rsvp_id: rsvp.id,
        first_name: guest.firstName,
        last_name: guest.lastName,
        email: guest.email,
        phone: guest.phone,
        shipping_address: guest.shippingAddress,
        city: guest.city,
        state: guest.state || null,
        postal_code: guest.postalCode || null,
        country: guest.country,
        family_side: family,
        gender,
        fabric_id: variant.fabricId,
        fabric_name: variant.fabricName,
        accessory_id: variant.accessoryId,
        accessory_name: variant.accessoryName,
        accessory_type: variant.accessoryType,
        payment_method: paymentMethod,
        payment_proof_path: proofPath || null,
        payment_status: 'pending',
        order_status: 'placed',
      })
      .select('order_number')
      .single();

    if (insertError || !order) {
      console.error('Order insert failed:', insertError?.message);
      return fail('We could not save your order. Please try again.', 500);
    }

    // 6. Confirmation email. A delivery failure must not lose a saved order,
    //    so this is reported but never fatal.
    let emailSent = false;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: [guest.email],
          reply_to: [REPLY_TO],
          subject: `Aso-Ebi Order Confirmation — Order ${order.order_number}`,
          html: orderEmailHtml({
            orderNumber: order.order_number,
            firstName: guest.firstName,
            family: FAMILY_LABEL[family],
            gender,
            variant,
            paymentMethod: PAYMENT_LABEL[paymentMethod],
            proofSubmitted: Boolean(proofPath),
            guest,
          }),
        }),
      });
      emailSent = res.ok;
      if (!res.ok) console.error('Resend error:', res.status, await res.text());
    } catch (err) {
      console.error('Confirmation email failed:', String(err));
    }

    return new Response(
      JSON.stringify({
        ok: true,
        orderNumber: order.order_number,
        emailSent,
        fabricName: variant.fabricName,
        accessoryName: variant.accessoryName,
        accessoryType: variant.accessoryType,
        familyLabel: FAMILY_LABEL[family],
        paymentLabel: PAYMENT_LABEL[paymentMethod],
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Unhandled error:', String(err));
    return fail('Something went wrong. Please try again.', 500);
  }
});
