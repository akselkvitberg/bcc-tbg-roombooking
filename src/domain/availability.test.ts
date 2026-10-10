import { describe, it, expect } from 'vitest'
import {
  slotToTime,
  timeToSlot,
  slotStatus,
  daySlots,
  analyseWindow,
  classifyRoom,
  availabilityLabelNb,
  defaultEndForClick,
  addDays,
  isoWeekday,
  isoWeek,
  occurrences,
  evaluateOccurrences,
  bookingOutcome,
  type SlotItem,
  type SlotStatus,
} from './availability'

const allDay = { open: 0, close: 28 }

describe('tid', () => {
  it('konverterer mellom halvtimesindeks og klokkeslett', () => {
    expect(slotToTime(0)).toBe('08:00')
    expect(slotToTime(18)).toBe('17:00')
    expect(slotToTime(19)).toBe('17:30')
    expect(slotToTime(28)).toBe('22:00')
    expect(timeToSlot('19:30')).toBe(23)
  })
})

describe('slotStatus', () => {
  it('sterkeste status vinner', () => {
    const items: SlotItem[] = [
      { start: 0, end: 10, status: 'req' },
      { start: 4, end: 6, status: 'busy' },
    ]
    expect(slotStatus(allDay, items, 2)).toBe('req')
    expect(slotStatus(allDay, items, 5)).toBe('busy')
    expect(slotStatus(allDay, items, 12)).toBe('free')
  })
  it('utenfor åpningstid er stengt', () => {
    expect(slotStatus({ open: 16, close: 28 }, [], 10)).toBe('closed')
    expect(slotStatus({ open: 0, close: 24 }, [], 24)).toBe('closed')
  })
})

describe('analyseWindow og classifyRoom', () => {
  // Hovedsalen i prototypen: konferanse 08–17, forespurt 19–22
  const hovedsalen = daySlots(allDay, [
    { start: 0, end: 18, status: 'busy' },
    { start: 22, end: 28, status: 'req' },
  ])
  const kveld: [number, number] = [18, 28]

  it('finner lengste ledige vindu', () => {
    const a = analyseWindow(hovedsalen, ...kveld)
    expect(a.allFree).toBe(false)
    expect(a.bestStart).toBe(18)
    expect(a.bestLength).toBe(4)
    expect(availabilityLabelNb(classifyRoom(a, 500, 10))).toBe('Ledig 17:00–19:00')
  })

  it('gir «Opptatt til» når rommet blir ledig for sent', () => {
    const day = daySlots(allDay, [{ start: 18, end: 27, status: 'busy' }])
    const r = classifyRoom(analyseWindow(day, ...kveld), 50, 10)
    expect(availabilityLabelNb(r)).toBe('Opptatt til 21:30')
  })

  it('for lite rom vinner over alt annet', () => {
    const r = classifyRoom(analyseWindow(daySlots(allDay, []), ...kveld), 8, 10)
    expect(r.kind).toBe('too-small')
  })

  it('egen booking i vinduet', () => {
    const day = daySlots(allDay, [{ start: 22, end: 26, status: 'mine' }])
    expect(classifyRoom(analyseWindow(day, ...kveld), 80, 10).kind).toBe('own')
  })

  it('stengt hele vinduet', () => {
    const day = daySlots({ open: 4, close: 16 }, [])
    expect(availabilityLabelNb(classifyRoom(analyseWindow(day, ...kveld), 6, 2))).toBe('Stengt')
  })
})

describe('defaultEndForClick', () => {
  const day = daySlots(allDay, [{ start: 24, end: 26, status: 'busy' }])
  it('kveld: resten av kvelden, men stopper ved neste opptatte', () => {
    expect(defaultEndForClick(day, 18, allDay)).toBe(24)
    expect(defaultEndForClick(daySlots(allDay, []), 18, allDay)).toBe(28)
  })
  it('før kl. 16: to timer', () => {
    expect(defaultEndForClick(day, 2, allDay)).toBe(6)
  })
})

describe('datoer', () => {
  it('ukedag og ISO-uke', () => {
    expect(isoWeekday('2026-10-08')).toBe(4) // torsdag
    expect(isoWeek('2026-10-08')).toBe(41)
    expect(isoWeek('2027-01-01')).toBe(53)
    expect(addDays('2026-10-30', 7)).toBe('2026-11-06')
  })
})

describe('occurrences', () => {
  it('ukentlig med antall', () => {
    expect(occurrences('2026-10-09', 'weekly', { count: 4 })).toEqual([
      '2026-10-09',
      '2026-10-16',
      '2026-10-23',
      '2026-10-30',
    ])
  })
  it('annenhver uke til dato', () => {
    expect(occurrences('2026-10-10', 'biweekly', { until: '2026-11-21' })).toEqual([
      '2026-10-10',
      '2026-10-24',
      '2026-11-07',
      '2026-11-21',
    ])
  })
  it('månedlig hopper over måneder uten datoen', () => {
    expect(occurrences('2026-10-31', 'monthly', { count: 3 })).toEqual(['2026-10-31', '2026-12-31', '2027-01-31'])
  })
  it('maks 26 ganger', () => {
    expect(occurrences('2026-10-09', 'weekly', { count: 40 })).toHaveLength(26)
  })
  it('maks ett år frem', () => {
    const d = occurrences('2026-10-09', 'biweekly', { count: 26 })
    expect(d[d.length - 1] <= '2027-10-09').toBe(true)
  })
})

describe('evaluateOccurrences og bookingOutcome', () => {
  const dates = ['2026-10-09', '2026-10-16', '2026-10-23', '2026-10-30', '2026-11-06']
  const slots: Record<string, Record<string, SlotStatus[]>> = {
    akSalen: {
      '2026-10-23': daySlots(allDay, [{ start: 0, end: 22, status: 'busy' }]), // konferanse til 19:00
    },
    ungdomskafeen: {
      '2026-11-06': daySlots(allDay, [{ start: 0, end: 28, status: 'closed' }]), // AK-bygget stengt
    },
  }
  const slotsFor = (room: string, date: string) =>
    slots[room]?.[date] ?? daySlots(room === 'ungdomskafeen' ? { open: 16, close: 28 } : allDay, [])

  it('markerer konflikt, stengt og hoppet over', () => {
    const r = evaluateOccurrences(dates, ['akSalen', 'ungdomskafeen'], slotsFor, 18, 28, new Set(['2026-10-30']))
    expect(r.map((o) => o.status)).toEqual(['free', 'free', 'conflict', 'free', 'closed'])
    expect(r[2]).toMatchObject({ roomId: 'akSalen', from: 18 })
    expect(r.filter((o) => o.included).map((o) => o.date)).toEqual(['2026-10-09', '2026-10-16', '2026-10-23'])
  })

  it('utfall: manuelt rom + konflikt går til romansvarlig', () => {
    const occ = evaluateOccurrences(dates, ['akSalen'], slotsFor, 18, 28)
    expect(bookingOutcome({ rooms: [{ approval: 'manual' }], wholePart: false, occurrences: occ })).toEqual({
      kind: 'needs-approval',
      reasons: ['manual-room', 'conflict'],
      conflicts: 1,
    })
  })

  it('utfall: automatisk og ledig bekreftes', () => {
    const occ = evaluateOccurrences(['2026-10-09'], ['ungdomskafeen'], slotsFor, 18, 28)
    expect(bookingOutcome({ rooms: [{ approval: 'automatic' }], wholePart: false, occurrences: occ })).toEqual({
      kind: 'confirmed',
    })
  })

  it('utfall: hele bygget går alltid til godkjenning', () => {
    const occ = evaluateOccurrences(['2026-10-09'], ['ungdomskafeen'], slotsFor, 18, 28)
    expect(bookingOutcome({ rooms: [{ approval: 'automatic' }], wholePart: true, occurrences: occ }).kind).toBe(
      'needs-approval',
    )
  })

  it('utfall: ingenting å sende når alt er valgt bort', () => {
    const occ = evaluateOccurrences(['2026-10-09'], ['akSalen'], slotsFor, 18, 28, new Set(['2026-10-09']))
    expect(bookingOutcome({ rooms: [{ approval: 'manual' }], wholePart: false, occurrences: occ })).toEqual({
      kind: 'nothing-to-send',
    })
  })
})
