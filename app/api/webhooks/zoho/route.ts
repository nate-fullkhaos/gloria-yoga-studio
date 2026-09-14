import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  addCalendarMonths,
  resolveMembershipGrant,
  todayYmdInKolkata,
} from '@/lib/memberships/from-zoho-payment'

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

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'SUPABASE_SERVICE_ROLE_KEY is missing in Vercel environment variables',
        },
        { status: 200 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: existingPractitioner, error: lookupError } = await supabase
      .from('practitioners')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (lookupError) {
      throw new Error(lookupError.message || 'Failed to look up practitioner')
    }

    let practitionerId = existingPractitioner?.id

    if (practitionerId) {
      const { error: updateError } = await supabase
        .from('practitioners')
        .update({ name, phone })
        .eq('email', email)

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update practitioner')
      }
    } else {
      const { data: insertedPractitioner, error: insertError } = await supabase
        .from('practitioners')
        .insert({ email, name, phone })
        .select('id')
        .single()

      if (insertError || !insertedPractitioner) {
        throw new Error(insertError?.message || 'Failed to insert practitioner')
      }

      practitionerId = insertedPractitioner.id
    }

    const startDate = todayYmdInKolkata()
    const endDate = addCalendarMonths(startDate, grant.durationMonths)

    const { error: membershipError } = await supabase.from('memberships').insert({
      practitioner_id: practitionerId,
      type: grant.type,
      credits_remaining: grant.creditsRemaining,
      start_date: startDate,
      end_date: endDate,
      status: 'ACTIVE',
    })

    if (membershipError) {
      throw new Error(membershipError.message || 'Failed to grant membership')
    }

    console.log('[zoho webhook] membership granted', {
      email,
      transaction_id: body.transaction_id ?? null,
      type: grant.type,
      credits_remaining: grant.creditsRemaining,
      start_date: startDate,
      end_date: endDate,
    })

    return NextResponse.json({ success: true, data: body })
  } catch (err) {
    return failsafeErrorResponse(err)
  }
}
