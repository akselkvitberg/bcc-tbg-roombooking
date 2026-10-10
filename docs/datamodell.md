# Datamodell (forslag)

Forslag i TypeScript; dette er kontrakten frontend og mock-API bygger på. Backend (WordPress-plugin med egne tabeller i
MySQL, se `backend.md`) speiler typene, og REST-rutene validerer mot dem. `memberId` er personens `personUid` fra BCC Login (ikke WordPress-brukerens id).
Tidspunkt lagres som ISO 8601 i Europe/Oslo. I UI-logikken brukes halvtimesindeks 0–28 (08:00–22:00), se
`reference/availability.ts`.

```ts
type Id = string

// --- Bygg og rom (spec §3, §9) ---
type PartId = 'nybygget' | 'ak-bygget'

interface Part { id: PartId; name: string; floors: number[] }

interface Room {
  id: Id
  name: string
  description: string
  partId: PartId
  floor: number
  capacity: number
  photoUrl?: string
  approval: 'automatic' | 'manual'
  access: 'all-members' | 'selected'     // §9.2
  active: boolean                        // aldri slett rom
  openingHours: Record<Weekday, { from: string; to: string } | null>   // "08:00"
  practicalInfo?: string                 // «Praktisk info» (ikke dørkoder)
  order: number                          // rekkefølge innen bygget
  mapPlacement?: { floor: number; x: number; y: number; w: number; h: number }  // prosent av plantegning
}
type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

interface RoomAccessGrant { roomId: Id; memberId: Id; grantedBy: Id; grantedAt: string }

// --- Personer og roller (spec §2) ---
type Role = 'member' | 'conference' | 'manager' | 'admin'
interface Member { id: Id; name: string; phone?: string; email?: string; roles: Role[]; isMember: boolean }

// --- Typer (spec §7) ---
interface BookingType { id: string; name: string; icon: string; color: string; active: boolean; restrictedToRole?: Role }

// --- Booking ---
type BookingStatus = 'confirmed' | 'pending' | 'declined' | 'cancelled' | 'skipped' | 'proposed' | 'expired'

interface Booking {                       // én dato i ett rom
  id: Id
  roomId: Id
  memberId: Id
  start: string                          // ISO
  end: string
  typeId: string
  purpose: string                        // maks 200
  people: number
  status: BookingStatus
  conflict: boolean                      // overlapper godkjent booking eller ventende forespørsel
  groupId?: Id                           // samme innsending (flere rom / hele bygget)
  seriesId?: Id
  isConference: boolean
  createdAt: string
}

interface BookingGroup {                  // én innsending: ett eller flere rom, én eller flere datoer
  id: Id
  memberId: Id
  wholePart?: PartId                     // §4.5 – alltid manuell godkjenning
  roomIds: Id[]
}

interface Series {                        // §4.3
  id: Id
  groupId: Id
  pattern: 'weekly' | 'biweekly' | 'monthly'
  firstDate: string                      // YYYY-MM-DD
  end: { kind: 'count'; count: number } | { kind: 'date'; date: string }   // maks 26 / ett år
  skippedDates: string[]                 // valgt bort ved oppretting eller senere
}

interface Proposal {                      // §6.1, §8.1
  id: Id
  bookingId: Id
  roomId: Id
  start: string
  end: string
  message?: string
  deadline: string                       // 24 t / 48 t / 3 dager
  proposedBy: Id
  answer?: 'accepted' | 'declined' | 'expired'
}

interface Decision {                      // logg over romansvarliges valg
  id: Id
  bookingId: Id
  action: 'approve' | 'decline' | 'propose' | 'move' | 'cancel' | 'approve-and-cancel-existing' | 'move-existing-and-approve'
  reason?: string                        // påkrevd for avslå/flytt/avbestill
  by: Id
  at: string
}

// --- Maler (spec §5.2) ---
interface Template {
  id: Id; memberId: Id; name: string
  roomIds: Id[]; wholePart?: PartId
  startTime: string; endTime: string     // "17:00"
  typeId: string; purpose: string; people: number
  repeat?: Series['pattern']; count?: number
}

// --- Stengte tider (spec §9.3) ---
interface Closure {
  id: Id
  scope: { kind: 'room'; roomId: Id } | { kind: 'part'; partId: PartId } | { kind: 'all' }
  date: string
  from?: string; to?: string             // tom = hele dagen
  reason: string
}

// --- SMS (spec §10) ---
interface SmsLogEntry {
  id: Id; sentAt: string; memberId: Id; phone: string
  kind: 'confirmed' | 'declined' | 'proposal' | 'moved' | 'cancelled' | 'expired' | 'receipt'
  text: string
}
```

## Avledede verdier (beregnes, lagres ikke)

- **Status for et rom i et tidsrom** for en gitt bruker: `free | busy | req | closed | mine | myreq`, med prioritet
  Stengt > Din booking > Opptatt > Venter på svar > Forespurt > Ledig (spec §3.3). Se `slotStatus` i
  `reference/availability.ts`.
- **Lengste ledige vindu** og **«Opptatt til»** for et tidsrom: `analyseWindow`.
- **Utfall før sending** (bekreftes / går til romansvarlig / konflikt): `bookingOutcome`.
- **Datoer i en serie** med status per dato: `occurrences`.

## API-grensesnitt (frontend)

Definer som TypeScript-grensesnitt i `src/api/` med en mock-implementasjon. Eksempler:

```ts
interface AvailabilityApi {
  dayStatus(date: string, opts: { forMemberId: Id }): Promise<Record<Id, SlotStatus[]>>   // per rom, 28 halvtimer
}
interface BookingApi {
  submit(req: SubmitBookingRequest): Promise<{ groupId: Id; outcome: 'confirmed' | 'pending' }>
  cancel(bookingId: Id): Promise<void>
  skip(seriesId: Id, date: string): Promise<void>
  unskip(seriesId: Id, date: string): Promise<void>
  answerProposal(proposalId: Id, answer: 'accepted' | 'declined'): Promise<void>
  mine(): Promise<Booking[]>
}
interface MemberDirectoryApi {             // eksisterende medlems-API (spec §9.2)
  search(q: string): Promise<Pick<Member, 'id' | 'name' | 'phone' | 'email'>[]>
}
```

Medlems-API-ets faktiske felter er et åpent spørsmål (spec §14).
