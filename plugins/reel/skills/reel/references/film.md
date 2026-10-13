# Film direction

How to direct a scene so it reads like an Apple or Linear product film and not a screen recording. Read this before the storyboard, and again before motion review. Field names are in `scene-format.md`. The numbers below come from the approved prototype of Photo's "Reorder layers" scene (10.6 s). Start from them and change one only when the scene needs it.

The test for every choice: does the eye land where the action is within half a second of each camera move, and is anything moving that doesn't need to?

## Story

- One idea per scene. If the callout needs "and", it is two scenes.
- 6 to 12 s. The prototype is 10.6 s with two drags. A single action fits in 6 to 8 s (`toy-phone` is 8 s, `toy-reorder` 9 s).
- Beat sheet, with the prototype's times:

| Beat | What happens | Prototype |
|---|---|---|
| Establish | whole app at rest, cursor not yet visible | 0 to 1.0 s |
| Approach | camera pushes in, cursor arrives at the target | 1.0 to 2.4 s |
| Act | press, drag, release, the app's own quick feedback | 2.36 to 3.74 s |
| Result | camera holds on what changed, callout leaves | 3.9 to 5.0 s |
| Settle | cursor drifts away and fades, camera pulls back to wide | 8.15 to 9.6 s |

- The poster frame (`posterAt`) is the act or just after it: cursor on the thing, callout up, result visible or about to be. The prototype's `POSTER_AT` is 3.4 s, mid-drag. Never the establishing shot. That is the frame people see before they have learned anything.
- Loops close cleanly. The end state must equal the start state. The prototype does a second drag that puts Sun back (5.5 to 7.64 s), so no dissolve or jump is needed, and the final wide matches the opening wide. A scene that can't undo its action reverses it with a second beat, or ends on a state that is also its first frame. Check the seam in the export report.

## Camera

- Never cut. Every change of view is an eased move between framings. No zero-length segments.
- Open on an establishing framing: `focus: ["@frame"]`, `pad: 46`, `establishing: true`. End on it too.
- Frame the action plus its result in one shot where you can. The prototype's `panel` is the Layers panel unioned with a 10 by 300 px slice of the canvas at the sun, so the drag and the change share a frame. Use a point focus item `{ at, x, y, w, h }` for the sliver, not the whole canvas.
- Pad 34 to 50 world px on working framings, 46 on wide, up to 70 for a small target on a phone.
- Holds and moves on the desktop track (seconds):
  - wide hold to 1.0, then a 1.4 move into `panel` (1.0 to 2.4)
  - hold on the action 1.5 (2.4 to 3.9)
  - 1.1 move to the result framing (3.9 to 5.0), hold 0.45, 1.05 move back (5.45 to 6.5)
  - final hold 1.5, 1.6 pull-back to wide (8.0 to 9.6)
- Moves run 1.0 to 1.6 s on the `camera` ease. Under about 0.8 s a move reads as a jolt. Keep every hold on the action itself at 1 s or more. The camera is still while the cursor presses and drags, and moves before the cursor starts or after it releases.
- Start the push before the cursor arrives, so the view is waiting for it.
- Depth: tilt and backdrop parallax come from zoom (`camera.depth`), not keys. The prototype tilts 0 to 4 degrees, flat from the main working framing inward, and shifts the backdrop 6% against the camera. You only choose which framing is establishing.
- Frame clamp: on an axis where a framing is smaller than the frame, its centre is clamped so the view stays inside `@frame`. A target near an edge gives a shot against the edge, not empty backdrop. A wide shot is bigger than the frame, so it never moves.
- Phone track (`cameras.phone`, applies below `phone.below`, 600 px unless set): same beats, tighter framings. The prototype uses `list` (the rows alone) where desktop uses `panel`, and keys land 0.1 s earlier (0.9 and 2.3 against 1.0 and 2.4). Callouts take the phone layout whether or not there is a phone track.
- The 10 px fit rule: base UI text must be at least 10 CSS px at every width down to `fit.minWidth`, outside establishing framings. Establishing shots are exempt because they are a gestalt, not something to read. A close look at the document or media with no UI text in view can be marked establishing too (Photo's `sun` framing). If a working framing fails, zoom in (less pad, smaller focus). Don't enlarge the kit. The fit check names the framing, the width and the zoom that would pass.

## Cursor

- Enters late. Hidden at 0, fades in over `show: [1.0, 1.3]`, after the establishing beat has landed.
- Starts near the target but off it (the prototype: 70 px left and 120 px below the sun), never from a corner.
- Every move is an arc, set by `bend`. Values that read naturally:
  - 0.12 for an approach (`move` ease, 1.2 s)
  - 0.04 for a drag, nearly straight, because a hand holding something goes straight
  - 0.1 for a short sideways peek
  - 0.2 for the exit drift
  - Flip the sign between consecutive moves so the cursor doesn't spiral one way (the prototype alternates -0.1 and 0.1). Zero looks like a ruler. Above about 0.25 it wanders.
- Press takes 0.08 s, release 0.12 s (runtime constants). The press scales the cursor to 0.86 alongside the app's own pressed state. The cursor lands and stops before it presses: it arrives at 2.3 and presses at 2.36, then waits 0.12 s before the drag at 2.48. Release comes a beat after the drag ends (drag ends 3.66, drop 3.74).
- Drag speed: about 1.2 s for a one or two row drag (`drag` ease, 2.48 to 3.66). Slower than a real hand on purpose, so the viewer sees what was grabbed. Under about 0.8 s it blurs.
- Never idles dead. Set `drift` (px) on any hold longer than about 0.5 s. It adds seeded wander and wraps over the duration, so the loop seam doesn't jump. The demo scenes use 1.2 to 1.5.
- After the action it goes away, not off screen: drift 70 px right and 46 px down over 0.75 s on `soft`, fading from 0.25 s in (8.15 to 8.9), before the pull-back starts. If the next beat needs it, send it to the next target first, as the prototype does with the canvas peek (3.9 to 4.9) before the return for the second drag.
- Cursor and callouts are sized in display pixels so they stay readable at phone width. Never size them in the kit.

## Callouts

- One or two per scene. Two only when two distinct things happen. None is fine for a scene that explains itself (`toy-phone` has none).
- Four to six words, verb first, plain and specific: "Drag to reorder layers". Not "Easily manage your layers", not "Powerful layer control". Name the thing the user touches. No full stop. Same type as the app, so the film adds no second voice.
- Timing, relative to the action: in just after the press (`in: [2.62, 2.95]`, press at 2.36), so the viewer is already looking at the spot. Out after the result has been seen (`out: [4.55, 4.85]`, about 0.8 s after the drop). Up for roughly 2 s. In is 0.33 s on `out`, out is 0.3 s on `soft`.
- Desktop layout: `side` is left or right of the anchor with a lead line. Anchor to the thing acted on, at its edge with `dx` of 8, on the side facing open space, so it never covers the action or the result.
- Phone layout (below `phone.below`): centred at the bottom of the stage, no lead line. Keep the lower 15% of every phone framing free of anything important.
- Copy lives in the scene's `copy` map and a callout names a key (`"copy": "drag"`). Never put text in the callout object. A wording change is then a one-line edit and a re-export.

## Eases by job

| Ease | Curve | Use |
|---|---|---|
| `camera` | 0.55, 0, 0.12, 1 | camera moves. Long ease-out, confident landing |
| `move` | 0.42, 0, 0.2, 1 | cursor travel between targets |
| `drag` | 0.5, 0, 0.25, 1 | cursor while holding something, a touch more weight |
| `out` | 0.2, 0.8, 0.2, 1 | things arriving: rows sliding into place (0.18 s), callout rise |
| `soft` | 0.4, 0, 0.6, 1 | things leaving: callout fade, cursor exit drift |
| `linear` | | typed text and progress values only |

This follows craft's motion rule: enters ease out, exits are quicker and softer. Feedback inside the app is fast (0.18 s). The camera is slow (1 to 1.6 s). The mismatch is the point.

## Storyboard

First scene of an app only. Later scenes skip it unless they add a component, which gets its own side by side.

- 3 to 5 keyframes. The prototype has four: 0 s "Opening shot", 2.3 s "Grab the Sun layer", 3.4 s "Drag it below Ridge" (callout up), 4.95 s "The sun sets".
- Pick them at beats, not at equal spacing: establish, end of approach, act, result. Add a fifth for the settle only if it differs from the opening.
- Each keyframe has a title and a one-line caption (`storyboard.beats`, see `scene-format.md`) and, where a callout is up, its draft copy. Each sits beside the matching reference shot from `survey.md`, same state and same theme. If they don't match, the kit is wrong, and the storyboard is where that shows.
- Show both themes.
- What the author approves: the look (kit against reference), the draft callout copy, and the framing of each keyframe. Approval sets the kit's lock flag and version. Timing is not approved here. That is motion review.
- Changing a locked component later bumps the kit version.

## Checklist before review

- One idea. Callout is 4 to 6 words.
- Duration 6 to 12 s. `posterAt` is the act, not the establishing shot.
- Establishing framing at the start and the end.
- No cuts. Every move 1 s or longer. Camera still during press and drag.
- Cursor enters after the first beat, arcs on every move, presses after arriving, never holds dead, leaves before the pull-back.
- Callouts in after the press, out after the result. Copy in the `copy` map. Phone layout checked.
- Phone track with tighter framings. Fit check passes at `fit.minWidth`, `fit.size` and either side of `phone.below`.
- End frame equals first frame. Loop check passes.
- Both themes read at the poster frame.
- Reduced motion shows the poster, and the poster stands on its own.
