# Kickboxing Trainer — Project Guide

## Overview

A mobile-first training app for kickboxers. Voice-guided combo drills are the core feature: the TTS engine announces moves and rep counts in real time. All data is stored locally (no backend). The app runs on Android, iOS, and web (GitHub Pages).

---

## Tech Stack

- **React Native** 0.81.5 / **React** 19.1.0
- **Expo** ~54.0.33 with **Expo Router** ~6.0.23 (file-based routing)
- **React Native Paper** 5.15.0 (Material Design 3 UI)
- **TypeScript** ~5.9.2
- **expo-speech**: TTS engine for voice callouts
- **expo-secure-store**: Encrypted storage (native); falls back to `localStorage` on web
- **expo-av**: Audio session configuration
- **expo-document-picker** / **expo-sharing**: File import/export
- **expo-file-system**: Native file read/write for backup files
- **react-native-draggable-flatlist**: Drag-and-drop list UI
- **@react-native-community/slider**: Speed/volume sliders
- **uuid**: ID generation
- **number-to-words**: Converts rep counts to spoken words (e.g. 3 → "three")
- **workbox-cli** / **gh-pages**: PWA service worker + GitHub Pages deployment

---

## Commands

```bash
npm start           # Expo dev server (interactive platform choice)
npm run android     # Build & run on Android device/emulator
npm run ios         # Build & run on iOS simulator
npm run web         # Web dev server
npm test            # Jest test runner
npm run build       # Export static web build (dist/)
npm run deploy      # Generate PWA service worker + deploy to GitHub Pages
```

---

## Project Structure

```
app/
  (tabs)/
    _layout.tsx       # Tab bar: Trainer, History, Settings
    index.tsx         # Trainer screen — main training interface (542 lines)
    history.tsx       # History screen — session log + 30-day heatmap
    settings.tsx      # Settings screen — full exercise library editor (780 lines)
  _layout.tsx         # Root layout: PaperProvider, ThemeProvider, GestureHandler, audio setup
  modal.tsx           # Modal template
  +not-found.tsx      # 404 fallback
  +html.tsx           # Web HTML root
  __tests__/
    history.test.tsx

components/
  useColorScheme.ts / .web.ts   # Light/dark theme detection
  useClientOnlyValue.ts / .web.ts
  Themed.tsx                    # Theme-aware Text/View wrappers
  StyledText.tsx
  ExternalLink.tsx
  __tests__/

utils/
  types.ts            # Core data types: Move, Exercise, ExerciseGroup, WorkoutSession
  trainer.ts          # TTS trainer engine (state machine, timing, speech cues)
  settings.ts         # Storage abstraction (SecureStore / localStorage)
  stats.ts            # Workout session persistence
  backup.ts           # KBX1 encode/decode + file I/O
  defaults.ts         # DEFAULT_MOVE_POOL (25 moves) + DEFAULT_GROUPS (3 groups)
  __tests__/
    trainer.test.ts
    stats.test.ts

constants/
  Colors.ts           # Light/dark color palette

assets/
  images/             # App icons, splash, favicon
  fonts/              # SpaceMono

public/               # Static web assets
dist/                 # Built web output
android/ / ios/       # Native project files
```

---

## Data Model

```typescript
interface Move {
  id: string;
  movement: string;        // e.g. "jab", "cross", "hook"
  side: "left" | "right";
  type: string;            // e.g. "punch", "kick", "defense"
}

interface Exercise {
  id: string;
  moves: string[][];       // moves[0] = base combo; moves[1+] = add-ons
  repDelay?: number;       // ms between reps
  enabled?: boolean;
}

interface ExerciseGroup {
  id: string;
  name: string;
  exercises: Exercise[];
  enabled?: boolean;
}

interface WorkoutSession {
  date: string;            // ISO timestamp
  duration: number;        // seconds
  rounds: number;
  group: string;           // group name at time of session
}
```

### Add-ons
Each `Exercise` can have multiple `moves` arrays. `moves[0]` is the base combo. `moves[1+]` are layered variations ("add-ons") that the trainer announces after completing the base combo reps. The settings UI shows them collapsed under one exercise entry.

---

## Persistence

All data is stored locally — no server.

| Key | Contents | Storage |
|---|---|---|
| `"groups"` | `ExerciseGroup[]` | SecureStore (native) / localStorage (web) |
| `"movePool"` | `Move[]` | SecureStore / localStorage |
| `"enabledMoves"` | `Move[]` | SecureStore / localStorage |
| `"selectedVoice"` | voice identifier string | SecureStore / localStorage |
| `"workout_stats"` | `WorkoutSession[]` (max 100) | SecureStore / localStorage |

`utils/settings.ts` provides `getValueFor(key, callback)` and `save(key, value)` that handle the platform-conditional storage.

---

## Screens

### Trainer (`app/(tabs)/index.tsx`)
- Timer with configurable rounds, work duration, rest duration
- Exercise group selector; shuffles exercise order per session
- Configurable reps per combo, speed/intensity slider
- Repeat combo toggle (announces combo again before counting)
- Pause / Resume / Stop / Skip / Rewind controls
- Wake lock active during training to prevent screen sleep
- Saves completed workouts to stats via `saveWorkout()`
- Handles KBX1 deep link imports (URL scheme `kickboxingtrainer://`)

### Settings (`app/(tabs)/settings.tsx`)
- **Voice selection**: lists system TTS voices; test button previews the chosen voice
- **Combo Generator**: randomly builds 5–10 combos (2–4 moves each) from the enabled move pool; creates a "Generated Flow" group
- **Manual Combo Builder**: tap-to-add interface for custom combos
- **Exercise Library**: full CRUD on exercises and groups
  - Edit moves, rep delay, add-on combos per exercise
  - Drag-and-drop reordering of exercises within a group
- **Move Pool Editor**: add/remove moves from the available pool
- **Sharing (KBX1)**: copy a single group to clipboard in KBX1 format
- **Backup/Import**:
  - Export full library as `.kbx` file (JSON inside)
  - Import `.kbx` file via document picker
  - Import KBX1 string via paste (handles legacy JSON format too)

### History (`app/(tabs)/history.tsx`)
- Session list (most recent first, max 100)
- Aggregate stats: total training time, total rounds
- 30-day activity heatmap (color intensity = daily duration; 5 buckets from 0 to 1200+ seconds)
- Clear history button

---

## Core Utility: Trainer Engine (`utils/trainer.ts`)

The TTS trainer is a functional state machine. Calling `trainer(config)` returns a controls object:

```typescript
{ pause, resume, stop, skip, rewind, updateSpeed, start, restart }
```

**How it works:**
1. Iterates through enabled exercises in the selected group
2. For each exercise, announces the combo (moves joined with commas)
3. Waits `repDelay` ms, then announces rep count ("one", "two", ...)
4. If the exercise has add-ons, announces "add on" then cycles through them
5. After all exercises, loops from the beginning (until rounds are exhausted or stopped)

**Key subtleties:**
- Uses `Speech.onDone` callback to track when each phrase ends before scheduling next
- Android: `Speech.pause()` is broken — engine manages timing manually instead
- `repeatCombo`: adds an extra combo announcement before counting reps
- Speed factor is a multiplier applied to `repDelay` (lower = faster training)
- `activeMoves()` returns the current add-on array or falls back to base combo

---

## Sharing Format: KBX1

KBX1 is a compact text format for sharing exercise groups.

**Format:** `KBX1|GroupName|Ex1;Ex2;...`

Each exercise: `combo1+combo2:repDelay` where combo is moves separated by `/` using abbreviations (e.g. `j` = jab, `c` = cross, `h` = hook).

- Single group sharing: copies KBX1 string to clipboard
- Full library backup: `.kbx` file with a JSON payload (groups + movePool + enabledMoves)
- Legacy JSON format is still supported on import

The `.kbx` file type is registered in `app.json` with iOS UTType declarations and Android Intent filters so the OS can open these files directly into the app.

---

## Platform Differences

| Concern | Native (iOS/Android) | Web |
|---|---|---|
| Storage | expo-secure-store (encrypted) | localStorage |
| Backup export | Write to filesystem + expo-sharing | Blob download |
| TTS pause | No pause on Android (use timing) | expo-speech pause works |
| File import | expo-document-picker | expo-document-picker (web fallback) |
| Audio | expo-av session config | N/A |

**Android-specific config (`app.json` / trainer):**
- `shouldDuckAndroid: true` (lowers other app volumes during TTS)
- `playThroughEarpieceAndroid: false` (use speaker)
- `predictiveBackGestureEnabled: false`
- New Architecture: `newArchEnabled: true`

**Web deployment:**
- Base URL: `/kickboxing-trainer` (GitHub Pages subdirectory)
- SPA 404 fallback: `dist/404.html` = copy of `dist/index.html`
- PWA service worker generated by workbox

---

## Testing

```bash
npm test            # Run all Jest tests
```

Test files:
- `utils/__tests__/trainer.test.ts` — TTS engine unit tests (mocked expo-speech, fake timers)
- `utils/__tests__/stats.test.ts` — Stats persistence tests
- `app/__tests__/history.test.tsx` — History screen snapshot tests
- `components/__tests__/` — Component snapshot tests

Jest preset: `jest-expo`. Transforms include react-native-paper and other packages that ship untranspiled ESM.

---

## Navigation

Expo Router file-based routing with typed routes enabled (`"experiments": { "typedRoutes": true }`).

```
/           → app/(tabs)/index.tsx   (Trainer tab)
/history    → app/(tabs)/history.tsx
/settings   → app/(tabs)/settings.tsx
/modal      → app/modal.tsx
```

TypeScript path alias: `@/*` resolves to the project root.

---

## Defaults

`utils/defaults.ts` contains:
- **DEFAULT_MOVE_POOL**: 25 moves (jab, cross, hook, uppercut, body hook, sidekick, roundhouse, teep, recoil low kick, etc.) with left/right variants
- **DEFAULT_GROUPS**: 3 groups (Beginner, Advanced, Kicks) with pre-built exercises

These are used on first launch and as the baseline when importing groups (missing moves are auto-added to the move pool).
