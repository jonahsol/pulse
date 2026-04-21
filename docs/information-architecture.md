# Information Architecture

## Scope

This document describes the information architecture of the system as it is currently implemented in the repository.

The current product is a single-purpose web application for timed mock interviews with:

- sequential interview prompts
- webcam and microphone recording
- in-session playback of recorded takes
- bookmark-based saving of selected takes to local browser storage
- optional transcript generation through a server endpoint

It is not yet a multi-area product with authentication, persistence, dashboards, or a content management layer.

## System Summary

### Primary user goal

Help a user practice interview answers under time pressure, then review each response and generate transcripts for reflection.

### Product shape

The implemented system is centered on one primary experience:

1. Start an interview.
2. Move through prompts one at a time.
3. Record each answer with a fixed time limit.
4. Review all recorded takes.
5. Bookmark selected takes for later.
6. Optionally retake a question or request a transcript.

### Architecture style

- Frontend-first single-route experience
- Client-managed session state with local browser persistence for bookmarked takes
- One server endpoint for transcription
- No database-backed domain model
- No user accounts or stored sessions

## IA Map

### Routes and entry points

| Route | Source | Purpose |
| --- | --- | --- |
| `/` | `app/page.tsx` -> `app/interview-trainer.tsx` | Main and only product experience |
| `/api/transcript` | `app/api/transcript/route.ts` | Accepts uploaded recording files and returns transcript text |
| `/api/hello` | `pages/api/hello.ts` | Template-style legacy API route; not part of the product flow |

### Top-level shells

| Layer | Source | Role |
| --- | --- | --- |
| Root layout | `app/layout.tsx` | Global HTML shell and metadata for the App Router |
| Main product container | `app/interview-trainer.tsx` | Controls state, transitions, media handling, and conditional screen rendering |

### Major UI areas

| UI area | Primary component | Role |
| --- | --- | --- |
| Product header | `InterviewHeader` | Shows question progress and interview controls during active flow |
| Active interview screen | `InterviewPhase` | Start, countdown, recording, live preview, and guidance |
| Review screen | `ReviewPhase` | Session recap and list of question review cards |
| Question review card | `ReviewQuestionCard` | Replay takes, request transcript, and add a retake |
| Saved takes panel | `SavedTakesPanel` | Shows bookmarked takes restored from local browser storage |

## Screen and State Model

The system behaves more like a guided workflow than a multi-page site. The core information architecture is driven by application state rather than navigation depth.

### Application states

| State | Meaning | Primary user focus |
| --- | --- | --- |
| `idle` | Interview has not started | Understand the experience and begin |
| `countdown` | Camera is ready and recording is about to start | Prepare for the answer |
| `recording` | Active timed response capture | Deliver the answer |
| `review` | User has completed or exited the flow, or opened saved takes | Replay, compare, bookmark, retake, and transcribe |

### State transitions

```text
idle
  -> countdown
  -> recording
  -> review

review
  -> countdown (retake a question)
  -> review (after retake finishes)
  -> idle/countdown restart path (restart interview)
```

### Page composition by state

#### `idle`

- Product title and value proposition
- Start CTA
- Empty camera preview panel with guidance
- Countdown and answer-time summary cards

#### `countdown`

- Current prompt displayed prominently
- Live camera preview enabled
- Countdown timer
- Pause control
- End early control when not retaking

#### `recording`

- Same prompt context remains visible
- Active recording timer
- Done action
- Pause/resume control
- End early control when not retaking

#### `review`

- Review introduction and restart action
- Saved takes panel for bookmarked answers restored from local storage
- One review card per question
- Each card contains:
  - question prompt
  - recorded takes
  - bookmark action
  - playback controls
  - transcript action and transcript output state
  - retake action

## Content Hierarchy

### Primary content objects

| Object | Description | Persistence |
| --- | --- | --- |
| Interview | A single session spanning all prompts | In memory only |
| Question | A fixed prompt in the interview sequence | Hard-coded in the client |
| Recording | A captured answer attempt for one question | Browser blob URL only |
| Saved Take | A bookmarked recording persisted in the browser | `localStorage` |
| Transcript | Generated text for a recording | In memory only |

### Object relationships

```text
Interview
  -> many Questions
Question
  -> many Recordings
Recording
  -> can become a Saved Take
Saved Take
  -> zero or one Transcript state at a time
```

### Current source of truth

| Data | Source of truth |
| --- | --- |
| Question list | `QUESTIONS` constant in `app/interview-trainer.tsx` |
| Interview phase | React state in `app/interview-trainer.tsx` |
| Recording collections | React state in `app/interview-trainer.tsx` |
| Saved takes | `localStorage` plus React state hydration in `app/interview-trainer.tsx` |
| Transcript request/result state | React state in `app/interview-trainer.tsx` |
| Transcript text | Response from `POST /api/transcript` |

## User Flow Architecture

### Primary flow

1. User lands on `/`.
2. User starts the interview.
3. Browser requests camera and microphone access.
4. User sees question-by-question countdown and recording flow.
5. Each finished answer becomes a new recording under its question.
6. After all questions, or after ending early, the app moves to review.
7. User replays answers, bookmarks selected takes, generates transcripts, or retakes individual questions.

### Bookmark flow

1. User opens review.
2. User selects `Bookmark` on a take.
3. Client reads the recording blob and converts it to a persistent data URL.
4. Client stores the saved take in `localStorage`.
5. On later visits, the app hydrates bookmarked takes from `localStorage`.
6. User can open `Review saved takes` from the idle screen or view them inside review.

### Retake flow

1. User opens review.
2. User selects `Add Take` for a question.
3. App re-enters the timed interview flow for that question only.
4. New recording is appended to the question's existing takes.
5. App returns to review.

### Transcript flow

1. User selects `Transcript` on a recorded take.
2. Client fetches the blob behind the recording URL.
3. Client uploads the file to `POST /api/transcript`.
4. Server writes a temp file, invokes Whisper, and returns transcript text.
5. Client stores transcript state by recording ID and renders the result inline.

## Navigation Model

The app currently has almost no conventional site navigation.

- There is no sidebar, tab bar, or multi-page hierarchy.
- The top header is contextual, not global navigation.
- Movement through the product happens through workflow controls:
  - start interview
  - review saved takes
  - pause/resume
  - done
  - end early
  - restart interview
  - bookmark
  - add take
  - transcript

This means the IA is primarily a task-flow architecture rather than a sitemap-style architecture.

## Component Responsibility Map

### `app/interview-trainer.tsx`

Acts as the orchestration layer:

- owns the interview state machine
- manages media stream lifecycle
- creates and stores recordings
- hydrates and persists bookmarked takes in local storage
- handles pause/resume and early exit
- requests transcripts
- switches between active interview and review UI

### `app/components/interview-trainer/interview-phase.tsx`

Owns the active-session presentation:

- prompt display
- start/countdown/recording UI
- live preview area
- timing summary and helper copy
- entry point to review saved takes from the idle state

### `app/components/interview-trainer/review-phase.tsx`

Owns the review-level summary:

- review intro
- saved takes summary and persistence messaging
- restart action
- rendering of per-question review cards

### `app/components/interview-trainer/review-question-card.tsx`

Owns question-level review detail:

- take list
- bookmark action
- playback
- transcript action states
- retake entry point
- unanswered state after early exit

### `app/components/interview-trainer/saved-takes-panel.tsx`

Owns persistent saved-take review:

- restored saved take list
- playback of bookmarked answers
- remove-bookmark action
- transcript entry point for saved takes

## Integration Architecture

### Browser APIs

| API | Role |
| --- | --- |
| `navigator.mediaDevices.getUserMedia` | Requests video and audio capture |
| `MediaRecorder` | Captures interview responses |
| `URL.createObjectURL` | Creates local playback URLs for recordings |
| `URL.revokeObjectURL` | Cleans up local recording URLs |
| `localStorage` | Persists bookmarked takes between visits on the same device |

### Server-side integration

| Integration | Role |
| --- | --- |
| OpenAI Whisper via LangChain loader | Converts uploaded recordings to transcript text |

### Runtime constraints

- Transcript generation requires `OPENAI_API_KEY`.
- The transcript endpoint runs in the Node.js runtime.
- Recording upload size is limited to 25 MB.

## Persistence and Boundaries

### What persists

- Source code
- hard-coded prompts
- app metadata and styling
- bookmarked takes stored in `localStorage`

### What does not persist

- interviews
- non-bookmarked recordings
- transcripts
- question progress
- retake history across reloads

Only bookmarked takes persist across visits. Other user-generated state disappears on refresh or restart.

## Known Structural Boundaries

### Current product boundary

The implemented product boundary is narrow and well defined:

- one task domain: interview practice
- one primary route
- one backend feature: transcription

### Template or legacy boundary

The repository still includes some Pages Router scaffolding:

- `pages/_app.tsx`
- `pages/_document.tsx`
- `pages/api/hello.ts`
- `styles/globals.css`

These files create a secondary structural layer in the repo, but they do not represent the main product IA. They should be treated as framework residue unless the team intends to keep a dual-router setup.

## IA Observations

### Strengths

- Very clear single-user journey
- Low cognitive load because the product is centered on one task
- Review architecture supports comparison across original and retake attempts
- Bookmarked takes now create a lightweight persistent review layer without requiring accounts
- State names and UI boundaries are aligned with the actual workflow

### Current limitations

- No separation between domain logic and container logic in the main page component
- No route-level segmentation for future areas such as history, settings, or prompt management
- Hard-coded questions limit extensibility
- Persistence is local-only and device-specific
- IA is still workflow-centric rather than account- or library-centric

## Recommended Future IA Expansion

If the product grows beyond the current prototype, the next likely IA layers would be:

1. `Interview Sessions`
2. `Question Sets`
3. `Review History`
4. `Transcript Library`
5. `Settings / Device Checks`
6. `Authentication and user workspace`

Those areas do not exist in the implemented system today, but they are the most natural extensions of the current structure.
