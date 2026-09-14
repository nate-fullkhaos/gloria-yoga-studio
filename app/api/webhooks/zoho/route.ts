import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { resolveMembershipGrant } from '@/lib/memberships/from-zoho-payment'

export const runtime = 'nodejs'

type ZohoPaymentPayload = {
  email?: string
  name?: string
  phone?: string
  payment_page?: string | number
  amount?: string | number
  transaction_id?: string
}

const ZOHO_DROP_IN_PAGE_ID = '3641595000000071012'

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.ZOHO_WEBHOOK_SECRET
  if (!secret) return true

  const headerSecret =
    request.headers.get('x-zoho-webhook-secret') ??
    request.headers.get('x-webhook-secret')
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  return headerSecret === secret || bearer === secret
}

function parseWebhookBody(rawText: string, contentType: string): ZohoPaymentPayload {
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(rawText)) as ZohoPaymentPayload
  }

  return JSON.parse(rawText) as ZohoPaymentPayload
}

function failsafeErrorResponse(err: unknown) {
  console.error("Zoho Webhook Error:", err)
  const error = err instanceof Error ? err : new Error(String(err))
  return NextResponse.json(
    { success: false, error: error.message, stack: error.stack },
    { status: 200 }
  )
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return unauthorized()
    }

    const rawText = await req.text()
    const contentType = req.headers.get('content-type') ?? ''

    let parsed: ZohoPaymentPayload
    try {
      parsed = parseWebhookBody(rawText, contentType)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const payment_page = rawText.includes(ZOHO_DROP_IN_PAGE_ID)
      ? String(ZOHO_DROP_IN_PAGE_ID)
      : String(parsed.payment_page ?? '')

    const body: ZohoPaymentPayload = {
      email: parsed.email,
      name: parsed.name,
      phone: parsed.phone,
      payment_page,
      amount: parsed.amount,
      transaction_id: parsed.transaction_id,
    }

    console.log('[zoho webhook] received payload', body)

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : null

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'email and name are required', received: body },
        { status: 400 }
      )
    }

    const grant = resolveMembershipGrant(String(payment_page), body.amount)
    if (!grant) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unrecognized payment_page or amount',
          payment_page: body.payment_page ?? null,
          amount: body.amount ?? null,
        },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: existingPractitioner, error: lookupError } = await supabase
      .from('practitioners')
      .select('id, credits')
      .eq('email', email)
      .maybeSingle()

    if (lookupError) {
      throw new Error(lookupError.message || 'Failed to look up practitioner')
    }

    const creditsToAdd = grant.creditsRemaining

    if (existingPractitioner?.id) {
      const currentCredits = Number(existingPractitioner.credits ?? 0)
      const { error: updateError } = await supabase
        .from('practitioners')
        .update({
          name,
          phone,
          credits: currentCredits + creditsToAdd,
        })
        .eq('email', email)

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update practitioner')
      }
    } else {
      const { error: insertError } = await supabase.from('practitioners').insert({
        email,
        name,
        phone,
        credits: creditsToAdd,
      })

      if (insertError) {
        throw new Error(insertError.message || 'Failed to insert practitioner')
      }
    }

    console.log('[zoho webhook] credits granted', {
      email,
      transaction_id: body.transaction_id ?? null,
      type: grant.type,
      credits_added: creditsToAdd,
    })

    return NextResponse.json({ success: true, data: body })
  } catch (err) {
    return failsafeErrorResponse(err)
  }
}
