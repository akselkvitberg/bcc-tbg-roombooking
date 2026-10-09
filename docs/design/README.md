# Designfiler (prototype)

Dette er kildefilene til den klikkbare prototypen. Den visuelle versjonen ligger på lerretet i Claude:
https://claude.ai/code/artifact/0541851b-c759-4125-9d19-1fd924cbf70d (privat – eieren må dele den).

## Hvordan lese en `.dc.html`-fil

- Markup står inne i `<x-dc> … </x-dc>`. `{{navn}}` er verdier fra skriptet; `<sc-for>` er løkker, `<sc-if>` er vilkår.
- Logikken står i `<script type="text/x-dc">`: data øverst (f.eks. `ROOMS`), hjelpefunksjoner, og `renderVals()` som
  regner ut alt skjermen viser. Hendelser er funksjoner som `onClick="{{send}}"`.
- Klassene (`.btn`, `.tag`, `.msg`, `.b-busy` …) kommer fra `prototype-theme.css`, som etterligner BCC-biblioteket.
  **Ikke kopier denne CSS-en inn i appen** – bruk BCC-komponentene (se `../komponentkart.md`).
- `support.js` og `/_blob/...`-lenker hører til prototypeverktøyet og finnes ikke her.

## Skjermer

| Fil | Skjerm | Spec |
| --- | --- | --- |
| `Mobil.dc.html` | Hele mobilflyten i én komponent (`startAt`: find, filters, room, part, details, done, mine, map) | §4, §6.1 |
| `MobilFilter`, `MobilRom`, `MobilDetaljer`, `MobilKvittering`, `MobilMine`, `MobilKart`, `MobilHeltBygg` | Tynne innpakninger som viser `Mobil` fra et bestemt steg | §4 |
| `Main.dc.html` | Desktop Book (filtre, romliste, bookingpanel, maler) | §5.1–5.2 |
| `Dagsoversikt.dc.html` | Rutenett for én dag, alle rom | §5.3 |
| `MineBookinger.dc.html` | Mine bookinger, desktop | §6.2 |
| `Kart.dc.html` | Kart, desktop | §4.6 |
| `Foresporsler.dc.html` | Romansvarlig: forespørsler | §8.1 |
| `Oversikt.dc.html` | Romansvarlig: alle bookinger, dra og slipp | §8.2 |
| `Rom.dc.html` | Admin: rom og tilgang, stengte tider, SMS-logg, typer | §9, §10, §7 |
| `canvas.json` | Oppsett av lerretet (posisjoner og titler) | – |

## Nyttig å gjenbruke

- **Testdata:** `ROOMS` i `Main.dc.html` / `Mobil.dc.html` (14 rom med bygg, etasje, kapasitet, åpningstider og
  bookinger for i dag). `itemsAt()` lager plausible data for andre datoer.
- **Logikk:** `stAt`, `analyse`, `addD`, `wdOf` og utregningen av `occ` (datoer i serie). Dette er portert og testet
  i `../../reference/availability.ts` – bruk den versjonen.
- **Tekster:** alle norske tekster i markupen kan flyttes til `nb.json`.

## Kjente forenklinger i prototypen

- Data er oppdiktet og lever bare i minnet; ingenting lagres.
- «Endre tid», «Dupliser», «Gi nytt navn», «Velg annen dato» og noen knapper i admin er bare tegnet inn.
- Fokusfelle og retur av fokus i dialoger er ikke laget (Esc fungerer).
- Kartet er et eksempel.
