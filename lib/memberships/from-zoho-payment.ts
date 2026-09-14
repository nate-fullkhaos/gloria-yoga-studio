export type MembershipType =
  | 'DROP_IN'
  | 'EIGHT_CLASS'
  | 'TWELVE_CLASS'
  | 'MONTHLY'
  | '3MONTH'

export type MembershipGrant = {
  type: MembershipType
  creditsRemaining: number
  durationMonths: number
}

const PAGE_RULES: Array<{
  needles: string[]
  grant: MembershipGrant
}> = [
  {
    needles: [
      'n10kfpui-qpbxptgtydyrc',
      '3641595000000071012',
      'drop-in-pass',
      'drop_in',
      'drop-in',
      'dropin',
    ],
    grant: { type: 'DROP_IN', creditsRemaining: 1, durationMonths: 1 },
  },
  {
    needles: [
      'h25d10on-ekoakdqdw3q5d',
      '8-class-membership',
      '8-class',
      'eight-class',
      'eight_class',
    ],
    grant: { type: 'EIGHT_CLASS', creditsRemaining: 8, durationMonths: 1 },
  },
  {
    needles: [
      '6jqm1uor-nfj8fsmspucag',
      '12-class-membership',
      '12-class',
      'twelve-class',
      'twelve_class',
    ],
    grant: { type: 'TWELVE_CLASS', creditsRemaining: 12, durationMonths: 1 },
  },
  {
    needles: [
      '9sl45oh8-9t65tjvj0b6gl',
      'founding-member-3-month',
      '3-month-membership',
      '3-month',
      '3month',
      'three-month',
    ],
    grant: { type: '3MONTH', creditsRemaining: 0, durationMonths: 3 },
  },
  {
    needles: [
      '3uzda190-yhurh9p9g2p3t',
      'monthly-membership',
      'monthly',
    ],
    grant: { type: 'MONTHLY', creditsRemaining: 0, durationMonths: 1 },
  },
]

const AMOUNT_RULES: Record<string, MembershipGrant> = {
  '350': { type: 'DROP_IN', creditsRemaining: 1, durationMonths: 1 },
  '2800': { type: 'EIGHT_CLASS', creditsRemaining: 8, durationMonths: 1 },
  '3500': { type: 'TWELVE_CLASS', creditsRemaining: 12, durationMonths: 1 },
  '3900': { type: 'MONTHLY', creditsRemaining: 0, durationMonths: 1 },
  '10500': { type: '3MONTH', creditsRemaining: 0, durationMonths: 3 },
}

export function normalizeAmount(amount: string | number | undefined): string {
  return String(amount ?? '')
    .replace(/[₹,\s]/g, '')
    .replace(/\.00$/, '')
}

export function resolveMembershipGrant(
  paymentPage: string | number | undefined,
  amount: string | number | undefined
): MembershipGrant | null {
  const page = String(paymentPage ?? '').trim().toLowerCase()

  if (page) {
    const matched = PAGE_RULES.find(({ needles }) =>
      needles.some((needle) => page.includes(needle))
    )
    if (matched) return matched.grant
  }

  const rupees = normalizeAmount(amount)
  return AMOUNT_RULES[rupees] ?? null
}

export function addCalendarMonths(startYmd: string, months: number): string {
  const [year, month, day] = startYmd.split('-').map(Number)
  const end = new Date(Date.UTC(year, month - 1 + months, day))
  const yyyy = end.getUTCFullYear()
  const mm = String(end.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(end.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function todayYmdInKolkata(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
