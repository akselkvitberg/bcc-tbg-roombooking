# Komponentkart: prototype → kode

Prototypen etterligner BCC-biblioteket med egen CSS (`docs/design/prototype-theme.css`, klasser som `.btn`, `.tag`).
I koden byttes alt dette ut med ekte komponenter fra `@bcc-code/component-library-vue`. Sjekk alltid props i
Storybook (https://components.bcc.no) – navnene under er bibliotekets komponenter, men varianter/props må verifiseres.

## BCC-komponenter

| Prototype (klasse / mønster) | BCC-komponent | Merknad |
| --- | --- | --- |
| `.btn-primary`, `.btn-secondary`, `.btn-text`, `.btn-danger(-outline)`, `.btn-sm`, `.btn-icon` | `BccButton` | Ikonknapper trenger `aria-label` |
| `.tag` (status) | `BccTag` | Kontekst: success = Ledig/Bekreftet, warning = Venter/Konflikt/Delvis ledig, neutral = Opptatt/Stengt, brand = Din booking |
| `.badge` (tall i meny) | `BccBadge` | |
| `.msg-info / -success / -warn / -danger` | `BccMessage` | Brukes for «Bekreftes med en gang» / «Går til romansvarlig» |
| `.seg` (segmentert valg) | `BccSelectButton` | Visning, gjentakelse, svarfrist, slutt (antall/dato) |
| `.chip` (mobil, 44 px) | `BccSelectButton` / `BccToggleButton` | Perioder, hurtigvalg for tid, gjentakelse |
| `.tabs` | `BccTabs` | Romoppsett: Rom og tilgang / Stengte tider / SMS-logg / Typer |
| `.dialog` + `.mask` | `BccDialog` | Flytt, avbestill, avslå, foreslå |
| Bekreft avbestilling | `BccConfirmDialog` | |
| `.sheet` (mobil, bunnark) | `BccDrawer` (posisjon bunn) | Filter-ark, handlingsark. Bruk PrimeVue Drawer via biblioteket hvis BCC-wrapper mangler |
| `.drawer` (desktop, sideskuff) | `BccDrawer` (posisjon høyre) | Booking-detaljer i Mine bookinger |
| `.field input` | `BccInput` | |
| `select` | `BccSelect` | Fra/til, rom, til-og-med-dato |
| Månedskalender (desktop Book) | `BccDatePicker` (inline) | Ukenummer på; markér dager med egne bookinger |
| Dato-felt | `BccDatePicker` | |
| Avkrysning (datoer i serie, rom i liste) | `BccCheckbox` | |
| Radio (godkjenning, tilgang) | `BccRadioButton` | |
| `.toggle` | `BccToggle` | Aktiv rom, aktiv type |
| `.tbl` | `BccDataTable` | Mine bookinger (liste), SMS-logg, stengte tider, typer |
| `.topnav` | `BccTopNavigation` | Admin-gruppe for romansvarlig (spec §8.3) |
| `.appnav` (mobil) | `BccAppNavigation` | Book / Mine bookinger / Kart |
| `.avatar` | `BccAvatar` | |
| `.toast` | `BccToast` | |
| Rombilde | `BccImage` | |
| Kapasitet (valgfritt) | `BccCapacityIndicator` | Kan brukes på romkort |

## Egne komponenter (finnes ikke i biblioteket)

| Komponent | Brukes i | Ansvar |
| --- | --- | --- |
| `TimelineBar` | Romkort, romliste, romside, kart-panel | Viser statuser for et tidsrom (28 halvtimer eller et utsnitt). Mønster per status (se under), markering av valgt tid, `aria-label` med oppsummering |
| `RoomCard` | Mobil finn rom | Navn, bygg/etasje, kapasitet, godkjenningsmåte, statusmerke, `TimelineBar` |
| `TypeTag` | Overalt | Kontur-pille med farget ikon. Som valg: `role="radio"` / `aria-pressed` |
| `WhenSummary` | Mobil | «I kveld · 17:00–22:00 · 10 personer» – åpner filter-ark |
| `PeriodPicker` | Mobil + desktop | Kveld / Ettermiddag / Formiddag / Hele dagen / Velg tid selv |
| `TimeStepper` | Mobil romside, filter | Fra/til med − / + i halvtimer (44 px knapper) |
| `NumberStepper` | Antall personer, antall ganger | Kan bygges på `BccInputNumber` hvis den finnes |
| `OccurrenceList` | Detaljer (mobil), bookingpanel (desktop) | Datoer i serie med status og avkrysning for å hoppe over |
| `BookingPanel` | Desktop Book | Sticky panel: valgte rom, type, formål, gjentakelse, utfall, send |
| `AvailabilityGrid` | Dagsoversikt | Rom × halvtimer, tastaturnavigasjon (spec §12) |
| `ManagerTimeline` | Alle bookinger | Blokker med navn, dra og slipp, flytt-markør |
| `FloorMap` | Kart (mobil + desktop) | Bygg, etasjer, rom som knapper farget etter status. Plassering fra admin |
| `MemberSearch` | Admin – begrensede rom | Søk i medlems-API, legg til/fjern |

## Mønstre for status på tidslinjer

| Status | Prototype-klasse | Utseende |
| --- | --- | --- |
| Ledig | `.b-free` | Lys grønn flate |
| Opptatt | `.b-busy` | Grå med diagonale striper |
| Forespurt | `.b-req` | Lys gul med prikker |
| Stengt | `.b-closed` | Lys grå med motsatte striper |
| Din booking | `.b-mine` | Brand-farge, fylt |
| Venter på svar | `.b-myreq` | Lys brand med kantlinje |

## Type-farger (egne tokens)

| Type | Ikon (Material Symbols) | Lys | Mørk |
| --- | --- | --- | --- |
| Ungdom | `groups` | `#446ADD` | `#8DB0F8` |
| Møte | `forum` | `#1D7F78` | `#6FB5AD` |
| Øvelse | `music_note` | `#7E5BC9` | `#B9A3EE` |
| Dugnad | `construction` | `#B4541A` | `#F0A06E` |
| Arrangement | `celebration` | `#B8336A` | `#F08BB5` |
| Annet | `label` | `#6B6E76` | `#A9ABAF` |
| Konferanse (kun konferanserolle) | `business_center` | `#61479C` | `#B9A3EE` |

## Fargetokens brukt i prototypen

Prototypen bruker verdier fra bibliotekets `semantic.css` (`--color-default-*`). I koden: bruk bibliotekets
semantiske variabler direkte – ikke kopier hex-verdiene.
