# Progressive Level Spec (MVP)

## Core Principles
- Progressive disclosure: users open profile information step-by-step.
- Reciprocity: a user can view only up to the lesser of their level and the partner's open level.
- Separation of concerns: keep domain logic testable and UI-independent.

## Vocabulary
- `Level`: enum-like stage controlling which profile fields are visible.
- `Unlock`: transition that raises `current_level` for a profile.
- `Reciprocal Level`: `min(my_level, their_level)` that governs visibility per field.
- `Boost`: time-bound modifier that accelerates progress or unlocks cosmetic features.

## Use Cases
1. **Unlock Level**
   - Input: `profile_id`, `target_level`, optional `context` (mission completion, purchase id).
   - Rules: sequential only (L1 -> L2 -> L3 -> L4), validate requirements, record audit trail.
   - Output: new `current_level`, unlocked timestamp, pending actions if requirements unmet.
2. **View Profile Snapshot**
   - Input: `viewer_id`, `target_profile_id`.
   - Logic: compute reciprocal level, fetch only fields up to that level, apply masking for locked data.
   - Output: normalized payload `{ level, fields: { basic, vibe, trust, intent }, locked: Level[] }`.
3. **Track Level Progress**
   - Input: `profile_id`.
   - Logic: aggregate XP/mission completion, compute percentage toward next level, surface blockers.
   - Output: `{ current_level, next_level, progress_percent, required_actions[] }`.
4. **Record Profile View**
   - Triggered when viewer inspects a target profile.
   - Stores `viewer_id`, `target_id`, `level_exposed`, `viewed_at` to fuel insights & reciprocity features.
5. **Apply Boost**
   - Input: `profile_id`, `boost_type`, `duration`.
   - Logic: validate entitlement (subscription, purchase), set expiry, adjust progression multipliers.

## Data Contracts (API Layer)
- `GET /api/profile/:id` -> `ProfileSnapshotDTO`
  ```json
  {
    "profileId": "uuid",
    "reciprocalLevel": "L2",
    "fields": {
      "basic": { "nickname": "string", "age": 25, "mbti": "ENFP", "region": "Seoul" },
      "vibe": { "status": "취향 탐색 중", "tagIds": ["coffee", "gallery"] },
      "trust": null,
      "intent": null
    },
    "lockedLevels": ["L3", "L4"],
    "progress": { "current": "L2", "next": "L3", "percent": 45 }
  }
  ```
- `POST /api/profile/:id/unlock` -> `UnlockResponseDTO`
  ```json
  {
    "profileId": "uuid",
    "unlockedLevel": "L3",
    "unlockedAt": "2025-09-29T09:45:00Z",
    "requirementsPending": []
  }
  ```
- `GET /api/levels/progress` -> list of `LevelProgressDTO` for mission widgets.

## Presentation vs Business
- **Business layer (`lib/levels`)**
  - Pure functions for eligibility checks (`canUnlockLevel`), reciprocity (`resolveViewLevel`), XP math (`calculateProgress`).
  - Interfaces decoupled from Supabase SDK; use repository pattern.
- **Presentation layer (`components/levels`)**
  - Consumes DTOs from business layer.
  - Handles loading, error, and view state (locked, unlocked, boost-active) using shadcn UI primitives.

## Open Questions
- Exact XP formula per action (comment, heart, mission) – placeholder until analytics arrive.
- Cooling-off rules between unlocks (time-based vs action-based).
- Localization for level names once branding finalizes.
- Whether L3 media (photo/audio) needs separate storage buckets by level.
