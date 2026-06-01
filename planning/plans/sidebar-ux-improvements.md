# FE Plan: Sidebar UX — Remove Cover + Collapse Quiz Checkpoint

- **Source**: free-text feedback (2 items) + screenshots
- **Type**: UI refinement
- **Created**: 2026-06-01
- **Status**: Draft

---

## Restated Request

Two sidebar UX improvements for the lecture player:

1. **Remove "Cover" from the "IN THIS LECTURE" list** — the cover is the lecture intro screen, not a content unit; listing it as item 1 adds noise and repeats the lecture number badge uselessly.
2. **Collapse all quiz units into a single "Checkpoint" sidebar entry** — the sidebar currently lists every individual quiz question (items 22–29 in the screenshot), making the list far too long. The checkpoint group should appear as one entry that jumps to the first quiz step when clicked.

---

## Scope

**In v1:**
- Remove the hardcoded "Cover" `<li>` from the sidebar unit list ✅ (done)
- Introduce a new `checkpoint` unit type in the content model — wraps `QuizUnit[]` into a single player step
- Replace all trailing `quiz` units in every lecture content file with one `checkpoint` unit
- `CheckpointRenderer` — interactive Client Component rendering all questions on one scrollable screen with per-question answer reveal
- Sidebar: simplify — `checkpoint` is a first-class type; render it as the "Checkpoint (N questions)" entry directly, replacing the old quiz-grouping logic
- Footer step counter automatically reflects the reduced total (e.g. 30 → 23 for oauth-authn)

**Out of scope:**
- Global scoring / leaderboard integration (full quiz engine is a separate epic)
- Answer persistence across step navigation (state is in-memory, resets on leave)
- Expanding checkpoint sidebar entry to show sub-question titles

---

## Actors & Permissions

- Primary user: learners navigating lecture content
- No auth/permission changes

---

## Screens & Flow

Single route affected: `/lecture/[slug]` — the sidebar drawer only.

```
Before (sidebar unit list):
  1. Cover          ← REMOVE
  1. AuthN vs AuthZ
  2. Stateless vs Stateful
  ...
  22. Where Should You Store a JWT...  ⎤
  23. What Happens When a JWT...       |
  24. What Should You Never Put...     |  ← COLLAPSE into one "Checkpoint" entry
  25. AuthN vs AuthZ                   |
  26. Mobile App and client_secret     |
  27. client_id vs client_secret       |
  28. JWT Revocation Strategies        |
  29. Authorization Code + PKCE...     ⎦

After (sidebar unit list):
  1. AuthN vs AuthZ
  2. Stateless vs Stateful
  ...
  21. Decision Tracer
  ✓  Checkpoint  (8 questions)         ← single entry, jumps to step 22
```

---

## Design Source

- Screenshots provided: yes (2 images — sidebar top showing Cover item, sidebar bottom showing 8 quiz entries)
- No Figma — design inferred from existing sidebar patterns
- Design tokens: existing `.side-item`, `.si-dot`, `.side-list` CSS classes reused

### Image Read-back

**Screenshot 1 (sidebar top):**
- "IN THIS LECTURE" label
- Item 1 is active, labeled "Cover" with the lecture number badge (purple pill, number 1)
- Item below: number "1" badge, label "AuthN vs AuthZ" — notably ALSO shows number 1, which is a pre-existing numbering quirk (the cover shows lecture index+1, units show step index)

**Screenshot 2 (sidebar bottom):**
- Items 22–29 are all individual quiz question titles
- Item 22 ("Where Should You Store a JWT Access Token in a SPA?") is currently active (purple)
- Items 23–29 are future/unvisited quiz steps

---

## Component Tree (sketch)

Only `LectureSidebar.tsx` changes. No new components needed.

```
LectureSidebar (Client)
  └── "IN THIS LECTURE" section
        ├── [removed] Cover <li>
        └── sidebarItems[] — derived array replacing the raw lecture.units map
              ├── SingleItem { step, unit } — prose / diagram / demo / code / media
              └── CheckpointGroup { firstStep, lastStep, count } — all consecutive quiz units
```

### Grouping algorithm (sidebar only, no effect on player)

```
Build sidebarItems from lecture.units:

  i = 0
  while i < units.length:
    if units[i].type === 'quiz':
      collect consecutive quiz units starting at i → group
      push CheckpointGroup { firstStep: i+1, lastStep: i+group.length, count: group.length }
      i += group.length
    else:
      push SingleItem { step: i+1, unit: units[i] }
      i++
```

This naturally handles any arrangement — non-consecutive quiz units each produce their own group (or their own single entry if isolated). In practice every current lecture has all quizzes at the end, producing one group.

---

## State & Data Flow

No new state. The grouping is a pure derivation from `lecture.units` at render time (no `useMemo` needed — `units` is a static array, never mutated).

Existing props passed to `LectureSidebar` are unchanged:
- `lecture` — provides the unit array
- `stepIndex` — used to compute `isActive` and `isPast` for both single items and the checkpoint group
- `onJump(step)` — called with the first quiz step when the checkpoint entry is clicked

---

## Change 1 — Remove Cover

**Current code (LectureSidebar.tsx ~lines 129–141):**
```
{/* Cover */}
<li>
  <button className={`side-item${stepIndex === 0 ? " active" : ""}`} onClick={() => onJump(0)} ...>
    <span className="si-dot"><span>{currentLectureIndex + 1}</span></span>
    <span className="si-txt">Cover</span>
  </button>
</li>
```

**Change:** Delete this entire `<li>` block.

The cover remains navigable via:
- Step dots in `PlayerControls` (the bottom progress dots; step 0 is the leftmost dot)
- Keyboard ArrowLeft from step 1
- Direct URL `?step=0`

The sidebar "Back to course" link is still present. The cover's absence from the sidebar list does not impair navigation — it's just denoised.

---

## Change 2 — Checkpoint Group Entry

### Derived data structure (computed inside the render, no new types needed)

```typescript
type SidebarItem =
  | { kind: 'unit'; step: number; unit: Unit }
  | { kind: 'checkpoint'; firstStep: number; lastStep: number; count: number };
```

This is a local type inside `LectureSidebar.tsx` — no export, no change to `types.ts`.

### Visual spec for the Checkpoint entry

| Property | Value |
|---|---|
| Label | "Checkpoint" |
| Sub-label | "(N questions)" in `text-faint` font-mono size |
| Icon in `si-dot` | A flag or checkmark SVG — NOT a step number (it spans many steps) |
| Active state | `.active` class when `stepIndex >= firstStep && stepIndex <= lastStep` |
| Done state | `.done` class when `stepIndex > lastStep` |
| Click | `onJump(firstStep)` — jumps to the first quiz step |
| `aria-current` | `"step"` when active |

### Icon for si-dot (checkpoint)

Use a small flag/bookmark SVG consistent with the existing SVG style in the sidebar (stroke, no fill, 14×14). Alternatively re-use the existing `CheckIcon` for the done state and a `FlagIcon` for active/upcoming. Keep it simple — a filled square or a quiz-mark (?) is also acceptable. Pick whichever reads best at 26×26px dot size.

### Step number display for non-quiz items (after removing Cover)

The step numbers shown in `si-dot` come from the loop index `i + 1`. Since Cover was step 0 and units start at step 1, removing Cover from the list does NOT change the step numbers shown — `step = i + 1` for each unit remains correct. ✓

---

## Accessibility

- The removed Cover item was a `<button>` with `aria-current="step"` when active. When on the cover (step 0) with Cover removed from the sidebar list, no item will have `aria-current="step"` — this is acceptable. The step 0 state is still communicated by the `PlayerTopBar` title and the progress dots.
- The Checkpoint `<button>` gets `aria-label="Checkpoint, 8 quiz questions"` (interpolated count) for screen readers that can't see the visual sub-label.
- Done state uses the existing `done` CSS class (`.si-dot` gets `CheckIcon`), consistent with the rest of the list.

---

## Responsive Behavior

No change — the sidebar drawer is already responsive (slides in on mobile, scrim on desktop). The shorter list improves the mobile experience directly.

---

## Performance Considerations

The grouping derivation is O(n) over `lecture.units` at render time. `units` is a static compile-time array (never fetched, never mutated). No memoisation needed.

---

## Testing Strategy

No test suite is configured for this project. Manual verification:
1. Open any lecture → confirm Cover is NOT in the sidebar unit list
2. Navigate to step 0 (cover) → confirm no sidebar item is highlighted as active (expected — cover is not in the list)
3. Scroll sidebar to bottom → confirm all quiz questions appear as a single "Checkpoint (N questions)" entry
4. Click Checkpoint entry → confirm player jumps to the first quiz step
5. Navigate through all quiz steps via arrow keys → confirm Checkpoint stays active for all of them
6. Navigate past last quiz step (if applicable) → confirm Checkpoint shows done state (check icon in dot)
7. Test with a lecture that has NO quiz units → confirm sidebar renders normally (no checkpoint entry)
8. Test with a lecture that has quizzes interspersed (future-proof) — each consecutive run of quizzes becomes its own group

---

## Risks & Trade-offs

| Risk | Mitigation |
|---|---|
| Removing Cover from sidebar means step 0 has no active highlight in the sidebar | Acceptable UX — the cover is the entry point, not a lesson; the top bar title still shows the lecture name |
| "Checkpoint" label may be unfamiliar to some learners | The sub-label "(N questions)" makes the intent clear; can be adjusted to "Quiz" in a follow-up without plan changes |
| Non-consecutive quiz units (e.g., an inline quiz in the middle of a lecture) would each create their own checkpoint group | Documented and acceptable in v1 — no current lecture has this pattern |

---

## Open Questions

None — scope is fully defined. Both changes are isolated to `LectureSidebar.tsx`.

---

## Recommended Next Step

Hand off to `fe-micro-task` agent — both changes are in a single file with no type, API, or test surface. The full diff is:
1. Delete ~12 lines (Cover `<li>`)
2. Replace the `lecture.units.map(...)` render with a derived `sidebarItems` array + updated render

---

## Revision History

- 2026-06-01: Initial draft
