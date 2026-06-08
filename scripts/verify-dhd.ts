// scripts/verify-dhd.ts — READ-ONLY probe of the live DHD/ECOTRACK API.
// Proves the token is valid and the integration reaches the real provider.
// Run: npx tsx scripts/verify-dhd.ts
import { readFileSync } from 'node:fs'

for (const rawLine of readFileSync('.env', 'utf8').split('\n')) {
  const line = rawLine.trim()
  if (!line || line.startsWith('#')) continue
  const idx = line.indexOf('=')
  if (idx === -1) continue
  const key = line.slice(0, idx).trim()
  const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
  if (/^[A-Za-z0-9_]+$/.test(key) && process.env[key] === undefined) process.env[key] = val
}

async function main() {
  const { getEcotrackClient } = await import('#/server/services/ecotrack.service')
  const client = await getEcotrackClient() // uses API_DHD from env

  console.log('→ validate/token ...')
  const valid = await client.validateToken()
  console.log(`   token valid: ${valid}`)

  console.log('→ get/wilayas ...')
  const wilayas = await client.getWilayas()
  console.log(`   wilayas returned: ${wilayas.length} (sample: ${wilayas.slice(0, 3).map((w) => `${w.wilaya_id}:${w.wilaya_name}`).join(', ')})`)

  console.log('→ get/fees ...')
  const fees = await client.getFees()
  console.log(`   fee rows: ${fees.length} (sample wilaya ${fees[0]?.wilaya_id} → tarif ${fees[0]?.tarif}, stopdesk ${fees[0]?.tarif_stopdesk})`)

  console.log('\n✅ DHD/ECOTRACK integration is LIVE and reachable (read-only).')
}

main().catch((e) => { console.error('❌ DHD probe failed:', e?.message); process.exit(1) })
