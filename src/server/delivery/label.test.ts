import { describe, it, expect, beforeAll } from 'vitest'
import {
  issueLabelToken,
  verifyLabelToken,
  generateInternalShipmentId,
  decideShipClaim,
  STALE_SHIP_CLAIM_MS,
  LABEL_TOKEN_TTL_MS,
} from './label'

beforeAll(() => {
  process.env.LABEL_HMAC_SECRET = 'test-secret-test-secret-test-secret-123' // ≥32 chars
})

const NOW = 1_700_000_000_000

describe('label token (HMAC-SHA256)', () => {
  it('verifies a freshly issued token', () => {
    const id = 'SHP-ABCD1234'
    const v = verifyLabelToken(issueLabelToken(id, NOW), NOW)
    expect(v.ok).toBe(true)
    if (v.ok) {
      expect(v.internalShipmentId).toBe(id)
      expect(v.issuedAt).toBe(NOW)
    }
  })

  it('rejects a tampered signature', () => {
    const token = issueLabelToken('SHP-ABCD1234', NOW)
    const tampered = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A')
    const v = verifyLabelToken(tampered, NOW)
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe('invalid_signature')
  })

  it('rejects a tampered payload (id swapped, old sig kept)', () => {
    const parts = issueLabelToken('SHP-ABCD1234', NOW).split('.')
    parts[1] = 'SHP-EVIL0000'
    const v = verifyLabelToken(parts.join('.'), NOW)
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe('invalid_signature')
  })

  it('rejects an expired token (>72h)', () => {
    const token = issueLabelToken('SHP-ABCD1234', NOW)
    const v = verifyLabelToken(token, NOW + LABEL_TOKEN_TTL_MS + 1)
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe('expired')
  })

  it('accepts a token just inside the expiry window', () => {
    const token = issueLabelToken('SHP-ABCD1234', NOW)
    expect(verifyLabelToken(token, NOW + LABEL_TOKEN_TTL_MS).ok).toBe(true)
  })

  it('rejects malformed input', () => {
    expect(verifyLabelToken('garbage', NOW).ok).toBe(false)
    expect(verifyLabelToken('v1.only.three', NOW).ok).toBe(false)
    expect(verifyLabelToken('v2.SHP-X.123.sig', NOW).ok).toBe(false) // wrong version
  })

  it('generates unique SHP- ids', () => {
    const a = generateInternalShipmentId()
    const b = generateInternalShipmentId()
    expect(a).toMatch(/^SHP-[0-9A-F]{8}$/)
    expect(a).not.toBe(b)
  })
})

describe('decideShipClaim (H1 — crash-safe ship claim)', () => {
  const base = { status: 'confirmed', trackingNumber: null, internalShipmentId: null, qrToken: null, nowMs: NOW }

  it('already shipped → idempotent, returns existing tracking', () => {
    const d = decideShipClaim({ ...base, trackingNumber: 'DHDQBLI123' })
    expect(d).toEqual({ action: 'already', tracking: 'DHDQBLI123' })
  })

  it('non-confirmed status → bad_status', () => {
    expect(decideShipClaim({ ...base, status: 'pending' }).action).toBe('bad_status')
    expect(decideShipClaim({ ...base, status: 'shipped' }).action).toBe('bad_status')
  })

  it('no prior claim → fresh', () => {
    expect(decideShipClaim(base).action).toBe('fresh')
  })

  it('recent claim, no tracking → in_flight (concurrent call blocked)', () => {
    const id = 'SHP-AAAA1111'
    const token = issueLabelToken(id, NOW - 1000) // 1s old
    const d = decideShipClaim({ ...base, internalShipmentId: id, qrToken: token, nowMs: NOW })
    expect(d.action).toBe('in_flight')
  })

  it('stale claim (crash window), no tracking → resume', () => {
    const id = 'SHP-BBBB2222'
    const token = issueLabelToken(id, NOW - STALE_SHIP_CLAIM_MS - 1) // older than threshold
    const d = decideShipClaim({ ...base, internalShipmentId: id, qrToken: token, nowMs: NOW })
    expect(d.action).toBe('resume')
  })

  it('claim with missing/invalid token → resume (recoverable, never stuck)', () => {
    const d = decideShipClaim({ ...base, internalShipmentId: 'SHP-CCCC3333', qrToken: null, nowMs: NOW })
    expect(d.action).toBe('resume')
  })
})
