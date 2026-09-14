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
  payment_page?: string
  amount?: string | number
  transaction_id?: string
}

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

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized()
  }

  let payload: ZohoPaymentPayload
  try {
    payload = (await request.json()) as ZohoPaymentPayload
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  console.log('[zoho webhook] received payload', payload)

  const email = payload.email?.trim().toLowerCase()
  const name = payload.name?.trim()
  const phone = payload.phone?.trim() ?? null

  if (!email || !name) {
    return NextResponse.json(
      { success: false, error: 'email and name are required' },
      { status: 400 }
    )
  }

  const grant = resolveMembershipGrant(payload.payment_page, payload.amount)
  if (!grant) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unrecognized payment_page or amount',
        payment_page: payload.payment_page ?? null,
        amount: payload.amount ?? null,
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
      transaction_id: payload.transaction_id ?? null,
      type: grant.type,
      credits_remaining: grant.creditsRemaining,
      start_date: startDate,
      end_date: endDate,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[zoho webhook] unexpected error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
