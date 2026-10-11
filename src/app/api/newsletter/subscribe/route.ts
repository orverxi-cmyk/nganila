import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, firstName, lastName, address, phone } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const apiKey = process.env.MAILCHIMP_API_KEY?.trim();
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID?.trim();
    const server = process.env.MAILCHIMP_API_SERVER?.trim() || (apiKey ? apiKey.split('-')[1] : '');

    if (!apiKey || !audienceId || !server) {
      return NextResponse.json(
        { error: 'Mailchimp is not configured on the server' },
        { status: 500 }
      );
    }

    const merge_fields: Record<string, any> = {};
    if (firstName && typeof firstName === 'string' && firstName.trim()) {
      merge_fields.FNAME = firstName.trim();
    }
    if (lastName && typeof lastName === 'string' && lastName.trim()) {
      merge_fields.LNAME = lastName.trim();
    }
    if (address && typeof address === 'string' && address.trim()) {
      const parts = address.split(',').map((s: string) => s.trim()).filter(Boolean);
      merge_fields.ADDRESS = {
        addr1: parts[0] || address.trim(),
        city: parts[1] || 'Kigali',
        state: parts[2] || 'N/A',
        zip: '00000',
        country: 'RW',
      };
    }
    if (phone && typeof phone === 'string' && phone.trim()) {
      merge_fields.PHONE = phone.trim();
    }

    const payload: Record<string, any> = {
      email_address: email.trim(),
      status: 'pending',
    };

    if (Object.keys(merge_fields).length > 0) {
      payload.merge_fields = merge_fields;
    }

    let response = await fetch(`https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members`, {
      method: 'POST',
      headers: {
        Authorization: `apikey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let data = await response.json();

    // Fallback: If Mailchimp rejected due to address formatting, retry without the address merge field
    if (!response.ok && payload.merge_fields?.ADDRESS && data.title === 'Invalid Resource') {
      const retryMergeFields = { ...merge_fields };
      delete retryMergeFields.ADDRESS;
      payload.merge_fields = retryMergeFields;

      response = await fetch(`https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members`, {
        method: 'POST',
        headers: {
          Authorization: `apikey ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      data = await response.json();
    }

    if (!response.ok) {
      if (data.title === 'Member Exists') {
        return NextResponse.json({ message: "You're already subscribed!" }, { status: 200 });
      }
      return NextResponse.json(
        { error: data.detail || 'Failed to subscribe to newsletter' },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Please check your email (including your spam folder) to confirm your subscription.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in newsletter subscribe route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
