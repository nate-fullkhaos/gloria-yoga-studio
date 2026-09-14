import { NextResponse } from 'next/server'
import {
  addCalendarMonths,
  resolveMembershipGrant,
  todayYmdInKolkata,
} from '@/lib/memberships/from-zoho-payment'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

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

export async function POST(req: Request) {
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

  const paymentPageFromPayload = String(parsed.payment_page ?? '')
  const payment_page = rawText.includes(ZOHO_DROP_IN_PAGE_ID)
    ? `${paymentPageFromPayload} ${ZOHO_DROP_IN_PAGE_ID}`.trim()
    : paymentPageFromPayload

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

  const grant = resolveMembershipGrant(body.payment_page, body.amount)
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

  try {
    const supabase = createSupabaseAdminClient()

    const { data: practitioner, error: practitionerError } = await supabase
      .from('practitioners')
      .upsert(
        {
          email,
          full_name: name,
          phone,
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single()

    if (practitionerError || !practitioner) {
      console.error('[zoho webhook] practitioner upsert failed', practitionerError)
      return NextResponse.json(
        { success: false, error: 'Failed to upsert practitioner' },
        { status: 500 }
      )
    }

    const startDate = todayYmdInKolkata()
    const endDate = addCalendarMonths(startDate, grant.durationMonths)

    const { error: membershipError } = await supabase.from('memberships').insert({
      practitioner_id: practitioner.id,
      type: grant.type,
      credits_remaining: grant.creditsRemaining,
      start_date: startDate,
      end_date: endDate,
      status: 'ACTIVE',
    })

    if (membershipError) {
      console.error('[zoho webhook] membership insert failed', membershipError)
      return NextResponse.json(
        { success: false, error: 'Failed to grant membership' },
        { status: 500 }
      )
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
  } catch (error) {
    console.error('[zoho webhook] unexpected error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
