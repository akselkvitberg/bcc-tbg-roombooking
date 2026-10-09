/**
 * Domenelogikk for tilgjengelighet – portert fra prototypen (docs/design/*.dc.html).
 * Ren TypeScript uten avhengigheter. Flyttes til src/domain/availability.ts.
 *
 * Tid: halvtimesindeks 0–28, der 0 = 08:00 og 28 = 22:00 (spec §3.2).
 * Datoer: 'YYYY-MM-DD' (lokal dato, Europe/Oslo).
 */

export const SLOTS_PER_DAY = 28
export const DAY_START_MINUTES = 8 * 60

/** Status for én halvtime sett fra innlogget bruker (spec §3.3). */
export type SlotStatus = 'free' | 'req' | 'myreq' | 'busy' | 'mine' | 'closed'

/** Sterkest vinner: Stengt > Din booking > Opptatt > Venter på svar > Forespurt > Ledig. */
export const STATUS_PRIORITY: Record<SlotStatus, number> = { free: 1, req: 2, myreq: 3, busy: 4, mine: 5, closed: 6 }

export const STATUS_LABEL_NB: Record<SlotStatus, string> = {
  free: 'Ledig', busy: 'Opptatt', req: 'Forespurt', closed: 'Stengt', mine: 'Din booking', myreq: 'Venter på svar',
}

/** En opptatt/forespurt/stengt periode i et rom, allerede oversatt til brukerens perspektiv. */
export interface SlotItem { start: number; end: number; status: Exclude<SlotStatus, 'free'> }

export interface RoomHours { open: number; close: number } // halvtimesindeks, f.eks. { open: 0, close: 28 }

export function slotToTime(i: number): string {
  const m = DAY_START_MINUTES + i * 30
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`
}

export function timeToSlot(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return Math.round((h * 60 + m - DAY_START_MINUTES) / 30)
}

/** Status for én halvtime. */
export function slotStatus(hours: RoomHours, items: SlotItem[], i: number): SlotStatus {
  if (i < hours.open || i >= hours.close) return 'closed'
  let best: SlotStatus = 'free'
  for (const it of items) if (i >= it.start && i < it.end && STATUS_PRIORITY[it.status] > STATUS_PRIORITY[best]) best = it.status
  return best
}

/** Alle 28 halvtimer for et rom en dag. */
export function daySlots(hours: RoomHours, items: SlotItem[]): SlotStatus[] {
  return Array.from({ length: SLOTS_PER_DAY }, (_, i) => slotStatus(hours, items, i))
}

export interface WindowAnalysis {
  slots: SlotStatus[]
  allFree: boolean
  hasOwn: boolean
  anyClosed: boolean
  allClosed: boolean
  /** Lengste sammenhengende ledige vindu (absolutt indeks og lengde i halvtimer). */
  bestStart: number
  bestLength: number
  /** Første ledige halvtime i vinduet, eller -1. Brukes til «Opptatt til HH:MM». */
  firstFree: number
  /** Første ikke-ledige halvtime i vinduet, eller -1. Brukes til «Opptatt fra HH:MM». */
  firstBlocked: number
}

/** Analyser et tidsrom [start, end) i en dags statuser. */
export function analyseWindow(day: SlotStatus[], start: number, end: number): WindowAnalysis {
  const slots = day.slice(start, end)
  let best = 0, bestAt = 0, run = 0, runAt = 0, firstFree = -1, firstBlocked = -1
  slots.forEach((s, k) => {
    if (s === 'free') {
      if (firstFree < 0) firstFree = k
      if (!run) runAt = k
      run++
      if (run > best) { best = run; bestAt = runAt }
    } else {
      run = 0
      if (firstBlocked < 0) firstBlocked = k
    }
  })
  return {
    slots,
    allFree: firstBlocked < 0,
    hasOwn: slots.some(s => s === 'mine' || s === 'myreq'),
    anyClosed: slots.some(s => s === 'closed'),
    allClosed: slots.length > 0 && slots.every(s => s === 'closed'),
    bestStart: start + bestAt,
    bestLength: best,
    firstFree: firstFree < 0 ? -1 : start + firstFree,
    firstBlocked: firstBlocked < 0 ? -1 : start + firstBlocked,
  }
}

export type RoomAvailability =
  | { kind: 'too-small' }
  | { kind: 'free' }
  | { kind: 'own' }
  | { kind: 'partial'; start: number; end: number }
  | { kind: 'unavailable'; reason: 'closed' | 'busy-until' | 'busy-all'; until?: number }

/**
 * Klassifiser et rom for resultatlisten (spec §4.1).
 * Delvis ledig krever minst `minPartialSlots` sammenhengende ledige halvtimer (standard 1 time).
 */
export function classifyRoom(a: WindowAnalysis, capacity: number, people: number, minPartialSlots = 2): RoomAvailability {
  if (capacity < people) return { kind: 'too-small' }
  if (a.allFree) return { kind: 'free' }
  if (a.hasOwn) return { kind: 'own' }
  if (a.bestLength >= minPartialSlots) return { kind: 'partial', start: a.bestStart, end: a.bestStart + a.bestLength }
  if (a.allClosed) return { kind: 'unavailable', reason: 'closed' }
  return a.firstFree >= 0 ? { kind: 'unavailable', reason: 'busy-until', until: a.firstFree } : { kind: 'unavailable', reason: 'busy-all' }
}

export function availabilityLabelNb(r: RoomAvailability): string {
  switch (r.kind) {
    case 'too-small': return 'For lite'
    case 'free': return 'Ledig hele tiden'
    case 'own': return 'Din booking'
    case 'partial': return `Ledig ${slotToTime(r.start)}–${slotToTime(r.end)}`
    case 'unavailable':
      return r.reason === 'closed' ? 'Stengt' : r.reason === 'busy-until' ? `Opptatt til ${slotToTime(r.until!)}` : 'Opptatt hele tiden'
  }
}

/**
 * Standard sluttid når man klikker en ledig halvtime i rutenettet (spec §5.3):
 * fra kl. 16 resten av kvelden, ellers 2 timer – i begge tilfeller frem til neste ikke-ledige halvtime.
 */
export function defaultEndForClick(day: SlotStatus[], start: number, hours: RoomHours): number {
  let end = start >= 16 ? hours.close : Math.min(start + 4, hours.close)
  for (let k = start + 1; k < end; k++) if (day[k] !== 'free') { end = k; break }
  return end
}

// ---------------------------------------------------------------- Datoer og gjentakelser

export type RepeatPattern = 'none' | 'weekly' | 'biweekly' | 'monthly'

function parse(iso: string): Date { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) }
function fmt(d: Date): string { return d.toISOString().slice(0, 10) }

export function addDays(iso: string, n: number): string { const d = parse(iso); d.setUTCDate(d.getUTCDate() + n); return fmt(d) }

/** 1 = mandag … 7 = søndag. */
export function isoWeekday(iso: string): number { const w = parse(iso).getUTCDay(); return w === 0 ? 7 : w }

/** ISO 8601-ukenummer. */
export function isoWeek(iso: string): number {
  const d = parse(iso)
  d.setUTCDate(d.getUTCDate() + 4 - isoWeekday(iso))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export const MAX_OCCURRENCES = 26

/**
 * Datoene i en serie (spec §4.3). Månedlig = samme dato; måneder uten den datoen hoppes over.
 * Begrenses til `MAX_OCCURRENCES` og ett år frem fra første dato.
 */
export function occurrences(firstDate: string, pattern: RepeatPattern, end: { count: number } | { until: string }): string[] {
  if (pattern === 'none') return [firstDate]
  const limit = addDays(firstDate, 365)
  const until = 'until' in end ? (end.until < limit ? end.until : limit) : limit
  const max = Math.min('count' in end ? end.count : MAX_OCCURRENCES, MAX_OCCURRENCES)
  const out: string[] = []
  if (pattern === 'monthly') {
    const f = parse(firstDate), day = f.getUTCDate()
    for (let k = 0; out.length < max && k < 13; k++) {
      const d = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + k, day))
      if (d.getUTCDate() !== day) continue // måneden mangler datoen
      const iso = fmt(d)
      if (iso > until) break
      out.push(iso)
    }
    return out
  }
  const step = pattern === 'weekly' ? 7 : 14
  for (let iso = firstDate; out.length < max && iso <= until; iso = addDays(iso, step)) out.push(iso)
  return out
}

export type OccurrenceStatus = 'free' | 'conflict' | 'closed'

export interface OccurrenceResult {
  date: string
  status: OccurrenceStatus
  skipped: boolean
  /** Sendes med: ikke hoppet over og ikke stengt. */
  included: boolean
  /** Rommet som avgjorde statusen, og fra når (for meldinger som «Sal B er opptatt fra 19:00»). */
  roomId?: string
  from?: number
}

/**
 * Status per dato for valgte rom og tidsrom (spec §4.3, §5.1).
 * Stengt (også delvis) i ett rom gjør datoen stengt og utelatt; ellers gjør opptatt/forespurt den til konflikt.
 */
export function evaluateOccurrences(
  dates: string[],
  roomIds: string[],
  slotsFor: (roomId: string, date: string) => SlotStatus[],
  start: number,
  end: number,
  skipped: ReadonlySet<string> = new Set(),
): OccurrenceResult[] {
  return dates.map(date => {
    let status: OccurrenceStatus = 'free'
    let roomId: string | undefined, from: number | undefined
    for (const id of roomIds) {
      const a = analyseWindow(slotsFor(id, date), start, end)
      if (a.anyClosed) { status = 'closed'; roomId = id; from = undefined; break }
      if (!a.allFree && status === 'free') { status = 'conflict'; roomId = id; from = a.firstBlocked }
    }
    const isSkipped = skipped.has(date)
    return { date, status, skipped: isSkipped, included: !isSkipped && status !== 'closed', roomId, from }
  })
}

export type Outcome =
  | { kind: 'nothing-to-send' }
  | { kind: 'confirmed' }
  | { kind: 'needs-approval'; reasons: Array<'manual-room' | 'whole-part' | 'conflict'>; conflicts: number }

/** Hva skjer når brukeren sender (spec §4.3, §4.5). */
export function bookingOutcome(opts: { rooms: Array<{ approval: 'automatic' | 'manual' }>; wholePart: boolean; occurrences: OccurrenceResult[] }): Outcome {
  const included = opts.occurrences.filter(o => o.included)
  if (included.length === 0 || opts.rooms.length === 0) return { kind: 'nothing-to-send' }
  const conflicts = included.filter(o => o.status === 'conflict').length
  const reasons: Array<'manual-room' | 'whole-part' | 'conflict'> = []
  if (opts.wholePart) reasons.push('whole-part')
  else if (opts.rooms.some(r => r.approval === 'manual')) reasons.push('manual-room')
  if (conflicts) reasons.push('conflict')
  return reasons.length ? { kind: 'needs-approval', reasons, conflicts } : { kind: 'confirmed' }
}
