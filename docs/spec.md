# Room Booking App – Feature Specification

Version: draft 3, 2026-10-10

A web app where people book rooms at **Jarlsberg**, and room managers approve, move and cancel bookings.
Jarlsberg is a conference centre in daily use; youth groups and other activities use it in the evenings and at
weekends, and the two often overlap. The app is delivered as a **WordPress plugin** on the church's existing WordPress
site. It replaces the earlier plugin and keeps every feature that plugin proved out (phases 0–9). It runs on its own
full-screen page on the site and does not depend on the site's theme. This document describes features only; how the
plugin is built is in `backend.md`.

## Changes since draft 2

- Delivered as a WordPress plugin on the existing site instead of a standalone app with its own hosting (intro, §11).
- Sign-in is the site's existing BCC Login; people are identified by their BCC person id (§11).

## Changes since draft 1

- Jarlsberg context: two parts (Nybygget and AK-bygget), two floors each, conference use by day (§1, §3).
- New role: conference coordinator (§2).
- Book a whole part of the building (§4.5).
- Map of the rooms (§4.6).
- Rooms that only selected people can book, chosen by an administrator from the member register (§9.2).
- Mobile is the main member flow, built around booking a period such as an evening, not half-hour slots (§4).
- Desktop is a power-user tool for leaders: several rooms at once, templates, skipping dates in a series (§5).
- Booking types (§7).
- Unified status vocabulary, and members see when a busy room becomes free (§3.3).
- *My bookings* gets an overview with filters, a calendar view, series management and templates (§6).
- "Room instructions" renamed *Practical info*.

## 1. Goals

Success for v1:

- A member can find a free room for this evening and book it from a phone in under a minute.
- Leaders (youth leaders, board chairs, work-party leaders) can set up and maintain recurring bookings for several
  rooms without contacting anyone, and skip dates they do not need.
- Members never see who booked other rooms or why; they only see free, busy, requested or closed, and when a busy
  room becomes free.
- Overlaps between conference use and evening activities are visible early and go to a room manager, who can resolve
  them without phoning anyone.
- Every decision that affects a member reaches them by SMS.
- The app works with keyboard and screen reader, in light and dark mode, from 360 px wide (WCAG 2.1 AA).

## 2. Users and roles

| Role | Who | Can do |
| --- | --- | --- |
| Member | Signed-in person with church membership | Find and book rooms, manage own bookings and series, use templates, answer proposals |
| Conference coordinator | Member given the conference role | Everything a member can; bookings are marked *Conference* and can cover whole days and whole parts |
| Room manager | Member given the manager role | Everything a member can, plus handle requests, see names and purposes, move and cancel any booking, set up rooms and closures, read the SMS log |
| Administrator | Given by the organisation | Everything a room manager can, plus give roles, choose who may book restricted rooms, manage booking types |
| Signed in, not a member | Has an account but no membership | Sees a message that they have no access, and who to contact |
| Not signed in | Anyone else | Sees a sign-in prompt; no availability is shown |

Membership comes from the sign-in provider. Roles are given by an administrator.

Typical use: members mostly book from a phone, a single evening or a short period. Leaders book from a computer,
often several rooms and recurring series.

## 3. The building and availability

### 3.1 Parts, floors and rooms

- Jarlsberg is divided into two **parts**: *Nybygget* and *AK-bygget*. Each part has two floors.
- Every room belongs to one part and one floor. Lists, grids and the map group rooms by part.
- Nybygget is mainly used by conferences in the daytime; AK-bygget is mainly used by youth in the evening. Both can be
  booked by anyone with access.

### 3.2 Opening hours and time steps

- Bookings are in half-hour steps between 08:00 and 22:00, inside each room's opening hours.
- Bookings can be made up to one year ahead.

### 3.3 Status vocabulary

The same words are used everywhere (lists, grid, map, SMS, my bookings):

| Status | Meaning |
| --- | --- |
| Free | Nobody has the time |
| Busy | Someone else has an approved booking (members also see *Busy until 17:00* when the room frees up later in the chosen period) |
| Requested | Someone else has a pending request |
| Closed | Outside opening hours, closed day or blocked time |
| Your booking | The member's own approved booking |
| Awaiting reply | The member's own pending request; *· conflict* is added when it overlaps another booking |

- When statuses overlap, the strongest wins: Closed, Your booking, Busy, Awaiting reply, Requested, Free.
- Status never relies on colour alone: every status also has an icon, text and, on timelines, a pattern.
- Members never see names or purposes of other people's bookings. Showing *Busy until 17:00* is allowed because it
  says nothing about who or what.

## 4. Booking on mobile (main member flow)

The phone flow is built around **a period**, not half-hour slots. Results show at once; the member refines only if
needed.

### 4.1 Find a room

- The first screen shows results immediately, with smart defaults: *this evening (17:00–22:00)* and the number of
  people the member used last time.
- A summary line at the top ("This evening · 17:00–22:00 · 10 people") opens a sheet to change day, time and number
  of people.
- Quick period choices in one row: **Evening 17–22**, **Afternoon 12–17**, **Morning 08–12**, **All day 08–22**,
  **Choose time**. *Choose time* sets start and end in half-hour steps, from 30 minutes up to the whole day.
- Results are grouped as:
  - **Free the whole time** first,
  - **Partly free** next, with the longest free window (e.g. *Free 19:00–22:00*),
  - **Not available** (busy, closed or too small) folded away, with the reason (*Busy until 19:00*, *Too small*).
- Each room card shows name, part and floor, capacity, whether it is confirmed at once or needs approval, and a small
  timeline of the chosen period.
- Rooms with restricted access that the member may book are marked *Restricted*.

### 4.2 Room and time

- Tapping a room opens it with the chosen period; tapping a *partly free* room opens it with **the free window**
  selected.
- The screen shows photo, description, part and floor, capacity, approval mode, a link to the map, and a timeline of
  the whole day with the selected time marked.
- Time is adjusted with − / + in half hours, or with quick choices.
- The app says at once whether the time is free, overlaps another booking (from what time), or is outside opening
  hours (the member cannot continue).

### 4.3 Details and sending

| Field | Rule |
| --- | --- |
| Type | Required, one of the booking types (§7) |
| Purpose | Required, max 200 characters |
| Number of people | Required, at most the room's (or rooms') capacity |
| Repeat | Once, weekly, every other week or monthly (same date; months without that date are skipped); ends on a date or after a number of times; max 26 occurrences and one year ahead |
| Dates in the series | Every date is listed as Free, Conflict or Closed; the member can untick dates to skip them. Closed dates are left out automatically |
| Mobile number | Only asked for when the sign-in provider has none; Norwegian mobile (8 digits, starts with 4 or 9), saved for next time |

Before sending, the app says which of these applies:

- **Confirmed at once:** the room is on automatic approval and every included date is free.
- **Goes to a room manager:** the room needs approval, a whole part is booked, or one or more dates overlap an
  approved booking or a pending request (sent as a conflicting request).

### 4.4 Receipt

A receipt shows rooms, time, type, purpose and status (*Confirmed* or *Awaiting reply*). Confirmed bookings show
*Practical info* for the room.

### 4.5 Book a whole part

- Any member can request **all rooms in Nybygget or AK-bygget** for a period, from mobile or desktop.
- The app lists every room in the part with its status for the period; rooms with restricted access are included.
- Whole-part requests **always go to a room manager**, even when every room is free.

### 4.6 Map

- A map of both parts and both floors shows where the rooms are, coloured by status for the chosen day and time
  (free the whole time, partly free, busy, your booking).
- Tapping a room opens it (§4.2). Non-bookable areas (foyer, corridor, gallery) are shown but cannot be selected.
- Restricted rooms the member cannot book are not shown by name; their area is drawn as non-bookable.
- v1 uses an example map; it will be replaced by a real floor plan. An administrator places each room on the map.

## 5. Booking on desktop (leaders and power users)

Desktop follows the same order as mobile – *when → which rooms → details* – but uses the space for more control.

### 5.1 Layout

- **Left: when and where** – month calendar with week numbers and dots for days the member already has bookings;
  period choices and from/to; number of people; filter by part; *only rooms free the whole time*. The panel can be
  folded into a short summary.
- **Middle: rooms** – grouped by part, each row with a timeline of the whole day and the chosen time marked, and a
  status label. A checkbox per room lets the member **select several rooms**. *Select whole Nybygget / AK-bygget*
  selects the whole part (§4.5).
- **Right: your booking** – stays visible while scrolling. Shows the selected rooms (rooms that are not free are
  flagged), type, purpose, number of people, repeat, the list of dates with skip checkboxes, the outcome (§4.3) and
  *Save as template*.
- View switch: **List** (above), **Grid** (the day view, §5.3) and **Map** (§4.6).

### 5.2 Templates and "continue where you left off"

- A booking can be saved as a **template** (rooms, time, type, purpose, number of people, repeat pattern).
- Templates are shown above the booking page and fill in everything with one click.
- When nothing is selected, the booking panel suggests the member's last booking with *Use again*.
- Templates are managed under *My bookings* (use, rename, delete).

### 5.3 Day view (grid)

- All rooms as rows, half-hour slots 08:00–22:00 as columns, grouped by part, with a date picker, *Today* and
  previous/next day.
- Clicking a free slot opens a booking with a sensible length: after 16:00 the rest of the evening, before 16:00 two
  hours, in both cases up to the next busy time.
- Busy and requested runs are labelled with their end time (*Busy until 19:00*).
- Each part has *Reserve whole …* (§4.5).
- **Week view:** one room at a time, the seven days as columns. Week numbers follow ISO 8601.

## 6. My bookings

### 6.1 Mobile

- **Needs your reply** at the top: proposals from a manager for another room or time, with the reply deadline and
  Accept / Decline.
  - Accept moves the booking to the proposed room/time and confirms it, if that time is still free.
  - Decline cancels the booking or request.
  - Unanswered proposals expire at the deadline; the member gets an SMS.
- **Upcoming:** each booking with type, status and *Practical info*; a menu offers *Skip this date* (series) or
  *Cancel*.

### 6.2 Desktop

- **Key figures** at the top, each also a filter: awaiting reply, upcoming, active series, needs your reply.
- **Filter by type.** **List view** grouped by week, or **calendar view** for the month with bookings coloured by type.
- Opening a booking shows a side panel with *Skip this date*, *Include again*, *Change time or room*, *Duplicate to
  a new date* and *Cancel this date*.
- **My series:** each series with its pattern and next dates; any date can be skipped or included again (e.g. "no
  work party this week"). *Change series*, *Extend* and *End* apply to the whole series.
- **My templates** (§5.2).
- **Recently declined or cancelled:** the last 30 days, with the manager's reason.

### 6.3 Rules for both

- A member can cancel or skip a date until the booking starts, without giving a reason. Skipping frees the room at
  once. The member gets an SMS receipt; managers are not notified.
- Members can also cancel from the grid by clicking their own booking.

## 7. Booking types

- Every booking has a **type**: Youth, Meeting, Rehearsal, Work party, Event, Other. *Conference* is reserved for the
  conference coordinator role.
- Types are shown as outlined pills with a coloured icon, deliberately different from status labels (filled), so a
  type is never mistaken for a status.
- Types are used for filters and overview (my bookings, requests, all bookings) and for statistics.
- In v1 the type does **not** affect approval or priority.
- Administrators manage the list (add, deactivate) and see the number and share of bookings per type over the last
  30 days.

## 8. Room manager

### 8.1 Requests

An inbox of everything that needs a decision, with conflicts at the top.

- Groups: **conflicts**, **whole parts**, **series**, and **plain requests**. Shows requests from today onward, oldest
  first within each group. Each request shows its type. Empty state: "No requests waiting".
- A conflict shows the request and the existing booking side by side, with names, purposes and number of people. A
  conference booking is marked as such, with its contact person.
- The app suggests free rooms with enough space at the same time, and rooms the existing booking could move to.
- Actions on a request:
  - **Approve**
  - **Decline** (reason required, sent by SMS)
  - **Propose another room/time** to the member, with a reply deadline (24 h, 48 h or 3 days; 48 h default). The
    time is not held until the member answers.
  - **Move the existing booking** and approve the request (only when it collides with exactly one booking).
  - **Approve and cancel the existing booking** (reason required).
- Whole-part actions: **approve the free rooms**, **move the colliding booking and approve all**, **propose another
  time**, **decline**.
- Approving one of two requests for the same time turns the other into a conflict.
- Series actions: **approve all free dates** and **decline the rest**. Decisions on single dates in a series are
  collected into one SMS once no dates are waiting.

### 8.2 All bookings

A day view like the grid, but with names and purposes, for managing confirmed bookings (previously "Overview").

- Grouped by part. Conference bookings have their own colour and icon; member bookings show the type icon.
- A banner warns about conflicts between conference use and evening activities in the current week, with a link to
  requests.
- Each booking shows the booker's name; the screen reader name also includes type, purpose and number of people.
- Opening a booking shows its details, with **Move…** and **Cancel…**.
- **Drag and drop** a booking to another room or time. A marker shows the new start time. Dropping opens the move
  dialog prefilled with the new room and start, keeping the length. Keyboard users use Move… instead.
- Moving and cancelling always require a reason, which is sent to the member by SMS. Cancelling can include a
  proposal for another room or time.
- In a series, only the one date is moved.

### 8.3 Navigation

Managers see two groups: their own (*Book*, *My bookings*) and **Administration** (*Requests*, *All bookings*,
*Rooms and access*, *SMS log*).

## 9. Room setup and access

### 9.1 Rooms

| Setting | Notes |
| --- | --- |
| Name, description | Shown to members |
| Part and floor | Nybygget or AK-bygget; 1st or 2nd floor |
| Map placement | Where the room is drawn on the map |
| Capacity | Max number of people; used for filters and suggestions |
| Photo | Shown with the room |
| Approval | Automatic (when free) or manual |
| Who can book | All members, or only selected people (§9.2) |
| Active | Inactive rooms cannot be booked; rooms are never deleted, since bookings point to them |
| Opening hours | One time span per weekday |
| Practical info | Shown on confirmed bookings and in the receipt; warns against putting door codes or passwords here |
| Order | Move rooms up and down within their part to set the order in lists and grid |

### 9.2 Restricted rooms

- An administrator can set a room to **only selected people**.
- People are found by searching the **member register** (existing member API) by name, e-mail or phone, and added or
  removed one by one.
- The room is **hidden** for everyone else, including on the map. Room managers always see it.
- People with access see the room marked *Restricted*.
- A whole-part request includes restricted rooms; the room manager decides.

### 9.3 Closures

- **Closed day:** the whole day is closed.
- **Blocked time:** a time span on a date is closed, with a reason.
- A closure applies to **one room, a whole part, or all of Jarlsberg**.
- Adding a closure does not change existing bookings, but the manager is told how many bookings it affects.

## 10. Notifications

- SMS goes to the member when: a request is approved, declined or proposed; a booking is moved or cancelled by a
  manager; a proposal expires; the member cancels or skips a date (receipt).
- Series and whole-part decisions are collected into one SMS.
- Managers see an **SMS log** of every message sent, with time, recipient, message type and text.

## 11. Sign-in and accounts

- Sign-in is the WordPress site's existing BCC Login; members never create a separate account or password for room
  booking.
- A person is identified by their BCC person id from the sign-in, not by a WordPress user account (members may share
  one WordPress account on the site).
- Membership is read from the sign-in. The mobile number is asked for once if the sign-in does not provide it.
- Room booking roles are separate from WordPress roles, so being a room manager gives no access to edit the website.
- The member register (member API) is used to find people for restricted rooms.
- The app is in Norwegian (bokmål), with the text ready to translate.

## 12. Accessibility

- The grid works fully with the keyboard: arrows, Home/End, Page Up/Down for previous/next day (week in week view),
  Enter/Space to book.
- Each slot has a spoken name, e.g. "Grupperom 1, 12:00–12:30, Free".
- Status never relies on colour alone (icon, text, pattern). Timelines use patterns for busy, requested and closed.
  Calendar markers differ in shape (filled dot for own bookings, ring for the series being created).
- Touch targets are at least 44 × 44 px on mobile.
- Dialogs, sheets and side panels trap focus, close on Esc and return focus to where they opened; form errors are
  listed at the top and next to each field.
- Result lists announce changes to screen readers.
- Light and dark mode; works from 360 px wide.

## 13. Out of scope for v1

- Payment or invoicing for room use.
- Booking by people outside the church.
- Calendar sync (Outlook/Google/iCal feed).
- Equipment or catering add-ons.
- Reminders before a booking.
- Wall displays outside rooms.
- Booking types affecting approval or priority.
- Sharing templates between members.

## 14. Open questions

1. Which SMS provider, and should automatic approvals also send an SMS?
2. Is 48 hours the right default reply deadline for proposals?
3. Can the mobile number be read from BCC's Core API for the signed-in person, or must the app always ask for it?
4. Should managers be able to manage only some rooms or only one part?
5. Should managers be notified when a member cancels or skips a date?
6. Should any of the out-of-scope items (calendar feed, reminders) move into v1?
7. Do conference coordinator bookings need approval, and should they take priority over evening activities?
8. When will a real floor plan be available for the map?
9. Which fields does the member API return, and can it be searched by phone number?
10. Is the list of booking types right, and should types later affect approval, priority or reporting?
11. Should a whole-part request be split into one request per room, so managers can approve rooms separately?
12. Which PHP and MySQL versions does the site's host run, and does it allow a real cron job?
