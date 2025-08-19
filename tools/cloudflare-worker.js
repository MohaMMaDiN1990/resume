export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    let data = {};
    try {
      data = await request.json();
    } catch (_) {}

    const ts = new Date().toISOString();
    const text = [
      `New visit at ${ts}`,
      `Path: ${data.path || ''}`,
      `Referrer: ${data.referrer || ''}`,
      `User-Agent: ${data.userAgent || ''}`,
    ].join('\n');

    // Send email via SendGrid (recommended). Set SENDGRID_API_KEY and TO_EMAIL in Worker vars.
    if (!env.SENDGRID_API_KEY || !env.TO_EMAIL) {
      return new Response('Missing mail config', { status: 200 });
    }
    const mail = {
      personalizations: [{ to: [{ email: env.TO_EMAIL }] }],
      from: { email: env.FROM_EMAIL || env.TO_EMAIL },
      subject: 'Resume site visit notification',
      content: [{ type: 'text/plain', value: text }],
    };

    const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mail),
    });

    return new Response(resp.ok ? 'ok' : 'mail error', { status: resp.ok ? 200 : 500 });
  }
};
