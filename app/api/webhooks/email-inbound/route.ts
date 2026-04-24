import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Resend Inbound webhook — receives replies from clients
// Called when someone replies to an email sent by the CRM.
// The Reply-To header is set to reply+{conversationId}@inbound.futurosanuncios.com
// so we can match the reply to the correct conversation.
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Resend inbound payload fields
    const from: string = payload.from || '';
    const to: string[] = payload.to || [];
    const subject: string = payload.subject || '';
    const text: string = payload.text || '';
    const html: string = payload.html || '';
    const messageId: string = payload.headers?.['message-id'] || payload.message_id || '';
    const inReplyTo: string = payload.headers?.['in-reply-to'] || '';

    // Extract conversationId from the To address: reply+{convId}@inbound.futurosanuncios.com
    const convIdMatch = to.join(',').match(/reply\+([a-f0-9-]{36})@/);
    let conversationId: string | null = convIdMatch ? convIdMatch[1] : null;

    // Fallback: find conversation by In-Reply-To (external message id)
    if (!conversationId && inReplyTo) {
      const { data: msg } = await supabase
        .from('messaging_messages')
        .select('conversation_id')
        .eq('external_id', inReplyTo.replace(/[<>]/g, ''))
        .single();
      conversationId = msg?.conversation_id || null;
    }

    // Fallback: find conversation by sender email
    if (!conversationId) {
      const senderEmail = from.match(/<(.+)>/)?.[1] || from;
      const { data: conv } = await supabase
        .from('messaging_conversations')
        .select('id')
        .eq('external_contact_id', senderEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      conversationId = conv?.id || null;
    }

    if (!conversationId) {
      console.warn('[email-inbound] Could not match conversation for:', from);
      return NextResponse.json({ ok: true, matched: false });
    }

    // Insert inbound message
    const { error } = await supabase.from('messaging_messages').insert({
      conversation_id: conversationId,
      direction: 'inbound',
      content_type: 'text',
      content: { type: 'text', subject, text, html },
      external_id: messageId || null,
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[email-inbound] Insert error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Update conversation: increment unread, update last message
    await supabase
      .from('messaging_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: text?.slice(0, 120) || subject,
        unread_count: supabase.rpc('get_messaging_unread_count'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return NextResponse.json({ ok: true, conversationId });
  } catch (err) {
    console.error('[email-inbound] Error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
