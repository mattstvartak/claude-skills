# Scene format

A scene is one `scene.json` at `reel/scenes/<id>/scene.json`. It is a timeline laid over a kit: state values for the kit's components, a cursor, callouts and a camera. The runtime renders any time `t` as a pure function of the file, so seeking to the same `t` twice gives the same pixels. Randomness is seeded.

The schema is `runtime/scene.schema.json` in this skill's folder. Unknown keys are errors. Validate with `node scripts/validate.mjs <scene.json>`, which also checks that every name resolves (targets, framings, copy ids), that keys ascend in time and that `@frame` is not redefined.

The examples below come from scenes on a toy notes kit. Copy their shapes. Times are seconds. Positions are world pixels unless a field says fractions.

## Order of a scene

Required: `id`, `kit`, `kitVersion`, `fit`, `duration`, `tracks`, `cameras`. Everything else is optional. Fields are explained in the order you meet them.

## id, kit, kitVersion

```json
{ "id": "toy-reorder", "kit": "toy", "kitVersion": 1 }
```

`kit` is the folder name under `reel/kits/`. `kitVersion` is the kit version the scene was written against. The element warns when it differs from `kit.js`'s `version`. After a kit change, re-check the scene and bump the number here.

## fit

```json
{ "fit": { "size": [960, 600], "minWidth": 320 } }
```

`size` is the largest size the scene is shown at, in CSS pixels. It sets the stage shape (the element reserves this aspect ratio before anything loads), and export renders at `size` times the device pixel ratio. `minWidth` is the narrowest width the scene must still read at. Pick `size` from the slot on the page, not from the app's window.

The 10 px rule: outside establishing shots, the kit's base UI text must never show below 10 CSS px at `minWidth`. For 12 px text that means a combined camera and display scale of about 0.83 or more. The fit check reports the framing that breaks it and the zoom that would pass. It is a judgement call, kept in one place.

## frame

```json
{ "frame": { "kind": "browser", "url": "notes.example" } }
```

`window`, `browser`, `phone` or `none`, as a string, or an object with `kind` and (for `browser`) a `url` shown in the bar. The frame sits at world `(0, 0)` at its natural size: the viewport plus the frame's chrome. `viewport` overrides the kit's own viewport for this scene:

```json
{ "viewport": [390, 780], "frame": "phone" }
```

## duration, loop, posterAt

```json
{ "duration": 9, "loop": true, "posterAt": 4.2 }
```

`duration` is seconds. `loop` defaults to true. A looping scene wraps `t` only outside `[0, duration]`, so `t = duration` (progress 1) shows the end frame, not the start. Make the end frame match the `t = 0` frame: same camera framing, same state, cursor hidden. Then the seam is invisible. `loop: false` clamps to `[0, duration]`.

`posterAt` is the time of the poster still, and what reduced-motion visitors see. Choose the moment that explains the feature, not `0`.

## targets and points

```json
{
  "targets": {
    "list": ".t-list",
    "first": ".t-list [data-id='n1']",
    "third": ".t-list [data-id='n3']",
    "editor": ".t-editor"
  }
}
```

A target is a name for a CSS selector inside the kit root. Cursor moves, callout anchors and camera framings all refer to targets by name. `@frame` is reserved for the whole frame rect and cannot be defined.

Targets are measured once, after fonts load, in the layout of the kit state at `t = 0`. They do not follow state changes. After a reorder, the row that was `third` is still where it started. Write positions after a state change as offsets from a target (`dy`, `dx`), or aim at a target that does not move.

A **point** is `{ at, x, y, dx, dy }`. `x` and `y` are fractions of the target's rect (default 0.5), `dx` and `dy` are world pixels added after.

```json
{ "at": "list", "x": 0, "y": 0, "dy": 29 }
```

That is the list's top-left corner, 29 px down. Points are used by cursor moves, callout anchors and focus boxes.

## State tracks and tweens

```json
{
  "tracks": {
    "state": {
      "notes.order": { "keys": [[0, ["n1", "n2", "n3", "n4", "n5"]], [3.4, ["n3", "n1", "n2", "n4", "n5"]]], "ease": "out", "over": 0.18 },
      "notes.selected": { "keys": [[0, "n2"], [2.16, "n3"]] },
      "notes.drag": { "keys": [[0, ""], [2.16, "n3"], [3.65, ""]] },
      "notes.dragY": { "keys": [[0, 0], [2.28, 0], [3.3, -136], [3.39, -136], [3.4, 0]], "ease": "drag" },
      "editor.typed": { "keys": [[0, 0], [4.6, 0], [6.2, 1]], "ease": "linear" }
    }
  }
}
```

A track is named `component.prop`: the kit component's name in `kit.js`, then the prop its `apply` reads. Keys are `[time, value]` and must ascend in time.

- Numbers and arrays of numbers interpolate between keys with the track's `ease`.
- Anything else (strings, id lists, booleans) steps at its key time.
- `over` is for stepped values. For `over` seconds after the key, the component also receives a tween `{ from, to, k }` for that prop (`notes.order` reaches the component as `tweens.order`), so it can animate the change, such as rows sliding to new places. The value itself has already changed.

Ease is a name (`linear`, `camera`, `move`, `drag`, `out`, `soft`) or a cubic-bezier `[x1, y1, x2, y2]`. `linear` for typing and progress, `out` for settling, `drag` while holding something, `move` for the cursor travelling.

A prop with a single key holds that value for the whole scene: `"notes.selected": { "keys": [[0, "n3"]] }`.

## cursor

```json
{
  "tracks": {
    "cursor": {
      "from": { "at": "editor", "x": 0.6, "y": 0.9 },
      "show": [0.9, 1.2],
      "hide": [7.0, 7.4],
      "drift": 1.5,
      "path": [
        { "to": { "at": "third", "x": 0.35 }, "at": [1.0, 2.1], "ease": "move", "bend": 0.12 },
        { "press": 2.16 },
        { "to": { "at": "first", "x": 0.35 }, "at": [2.28, 3.3], "ease": "drag", "bend": 0.04 },
        { "release": 3.4 },
        { "to": { "at": "editor", "x": 0.7, "y": 0.5 }, "at": [3.9, 4.8], "ease": "move", "bend": 0.1 }
      ]
    }
  }
}
```

- `from` is where the cursor rests before the first move.
- `show` and `hide` are `[start, end]` fades. Without `show` the cursor is visible from `t = 0`. For a loop, hide it before the end and show it after the start, so it is never on screen at the seam.
- A move is `{ to, at: [start, end], ease, bend }`. `bend` curves the path (a fraction of the distance); 0.04 to 0.12 looks like a hand. Keep moves in ascending time.
- `{ "press": t }` takes 0.08 s, `{ "release": t }` 0.12 s. Press and release the cursor where the state tracks change: the press at `2.16` matches `notes.drag` becoming `n3` at `2.16`.
- `drift` is idle wander in px while the cursor holds still. It is seeded, and wraps over the duration.
- Omit the `cursor` track for scenes with no pointer (`toy-none`).

The cursor is sized in display pixels, so it stays the same size on a phone.

## callouts and copy

```json
{
  "tracks": {
    "callouts": [
      { "copy": "drag", "anchor": { "at": "list", "x": 1, "y": 0.2, "dx": 8 }, "side": "right", "in": [2.4, 2.75], "out": [4.1, 4.4] }
    ]
  },
  "copy": { "drag": "Drag to reorder notes" }
}
```

Callout text lives in the `copy` map by id, so wording is edited in one place and the storyboard can show draft copy. `anchor` is a point. `side` (`left`, `right`, `top`, `bottom`) is which side of the anchor the pill sits on, with a lead line back to it. `in` and `out` are `[start, end]` spans: the pill rises in over `in` and sinks while fading over `out`.

Callouts are sized in display pixels, not stage pixels. A 15 px callout is 15 px on the page at any scale, so do not size anchors or offsets to the callout's text. Below the phone width (the `phone` camera's `below`, 600 by default) callouts leave their anchors and sit centred at the bottom of the stage, so write short copy that still makes sense without its lead line. A scene with no callouts can leave `"callouts": []` and `"copy": {}`, as `toy-none` does.

## cameras

```json
{
  "cameras": {
    "framings": {
      "wide": { "focus": ["@frame"], "pad": 46, "establishing": true },
      "list": { "focus": ["list"], "pad": 50 },
      "editor": { "focus": ["editor"], "pad": 40 }
    },
    "default": { "keys": [[0, "wide"], [0.9, "wide"], [2.2, "list"], [3.7, "list"], [4.6, "editor"], [6.4, "editor"], [8.0, "wide"]] }
  }
}
```

A **framing** is a named view: the union of its `focus` items plus `pad` world pixels, fitted to the stage. A focus item is a target name, or a box `{ at, x, y, dx, dy, w, h }`, which is a `w` by `h` rectangle centred on that point. Use the box to frame part of a target:

```json
{ "cameras": { "framings": { "editor": { "focus": [{ "at": "editor", "x": 0.5, "y": 1, "w": 620, "h": 368 }], "pad": 0 } }, "default": { "keys": [[0, "editor"]] } } }
```

The **camera track** (`default`) is a list of `[time, framing]` or `[time, framing, ease]` keys, ascending. A key's ease governs the segment leaving it; the default is `camera`, and zoom interpolates in log space. Repeat a framing at two times to hold it (`[0, "wide"], [0.9, "wide"]`). Start and end on the same framing for a loop.

Keep the camera still while something important happens, and move it between beats. A scene with one framing still needs a track, as in the example above.

### establishing

`"establishing": true` marks a framing that is seen whole rather than read: the wide shot, or a close look at the document with no UI text in view. The fit check skips establishing framings. They also anchor each track's depth range: depth is 0 at the loosest establishing framing and 1 at the loosest framing that isn't establishing, and stays 1 for tighter ones. Depth 0 is the full 4 degree tilt and depth 1 is flat, and the backdrop scales up slightly as depth rises. Mark `@frame` framings establishing.

### the phone track and the clamp

```json
{
  "cameras": {
    "framings": {
      "wide": { "focus": ["@frame"], "pad": 46, "establishing": true },
      "list": { "focus": ["list"], "pad": 50 },
      "editor": { "focus": ["editor"], "pad": 40 },
      "list-tight": { "focus": [{ "at": "list", "x": 0.5, "y": 0.3, "w": 380, "h": 204 }], "pad": 14 },
      "editor-tight": { "focus": [{ "at": "editor", "x": 0.43, "y": 0.83, "w": 520, "h": 150 }], "pad": 10 }
    },
    "default": { "keys": [[0, "wide"], [0.9, "wide"], [2.2, "list"], [3.7, "list"], [4.6, "editor"], [6.4, "editor"], [8.0, "wide"]] },
    "phone": { "below": 600, "keys": [[0, "wide"], [0.8, "wide"], [2.1, "list-tight"], [3.7, "list-tight"], [4.5, "editor-tight"], [6.4, "editor-tight"], [8.0, "wide"]] }
  }
}
```

`phone` uses the same framings with its own keys. It applies when the element is narrower than `below` (600 if omitted). On a narrow element the stage is small, so a framing that works at 960 px may leave text at 6 px. Give the phone track tighter framings or longer holds on the framings that matter. Here `list-tight` frames the first three rows instead of the whole list, which takes the text at 320 px from 5.9 px to 10.2 px. Callouts take the phone layout below that width whether or not a phone track exists. The fit check renders at `fit.minWidth`, at `fit.size` and either side of `below`.

Framing clamp: on an axis where a framing's view is smaller than the frame, the camera centre is clamped so the view stays inside `@frame`. A tight framing near an edge slides inward instead of showing the backdrop. A wide shot is bigger than the frame, so the clamp never moves it. If a framing seems to ignore its focus, the clamp moved it; widen `pad` or pick a target nearer the middle.

## seed

```json
{ "seed": 1 }
```

An integer for the cursor's drift and any other seeded randomness. Give each scene its own so two scenes on a page do not wander in step.

## media

```json
{ "media": [{ "id": "hero", "file": "media/hero.jpg" }] }
```

Images or video a kit component shows, by id and file. `file` is relative to the scene folder, and `media.mjs add --scene <id>` copies it there. Each file needs an entry in `<dir>/media/licences.json`; see `media.md`. The toy scenes use none.

## alt

```json
{ "alt": "A notes app: the third note is dragged to the top of the list" }
```

What the scene shows, in one sentence, for people who can't see it. Export puts it in the poster's `alt` in both snippets and flags a scene without one.

## storyboard

```json
{
  "storyboard": {
    "times": [0.5, 2.8, 4.2, 7.5],
    "beats": [
      { "title": "Rest", "caption": "The list before anything moves", "ref": { "light": "reel/references/notes/list-light.png", "dark": "reel/references/notes/list-dark.png" } },
      { "title": "Grab", "caption": "The cursor picks up the second note", "ref": "reel/references/notes/list-light.png" },
      { "title": "Drop", "caption": "It lands at the top", "ref": "reel/references/notes/list-light.png" },
      { "title": "Settle", "caption": "The editor shows the moved note", "ref": "reel/references/notes/editor-light.png" }
    ],
    "approvedAt": "2026-10-13"
  }
}
```

`times` are the 3 to 5 moments rendered as keyframe stills for review, each beside its reference shot. `beats` is optional and has one entry per time (validate.mjs checks the count): a title, a one-line caption, and `ref` (required), the reference shot for that moment as a path from the site root, either one file or one per theme. The preview's storyboard and side-by-side sections read them; export never copies them or the shots. `approvedAt` is set when the author approves; for an app's first scene, that approval also locks the kit (see `kits.md`). Later scenes skip the storyboard.

## A whole scene

`toy-browser`, complete and valid:

```json
{
  "id": "toy-browser",
  "kit": "toy",
  "kitVersion": 1,
  "fit": { "size": [960, 660], "minWidth": 320 },
  "frame": { "kind": "browser", "url": "notes.example" },
  "duration": 7,
  "loop": true,
  "posterAt": 4.4,
  "seed": 2,
  "targets": {
    "list": ".t-list",
    "fourth": ".t-list [data-id='n4']",
    "editor": ".t-editor"
  },
  "tracks": {
    "state": {
      "notes.selected": { "keys": [[0, "n2"], [1.5, "n4"]] },
      "editor.typed": { "keys": [[0, 0], [2.3, 0], [4.6, 1]], "ease": "linear" }
    },
    "cursor": {
      "from": { "at": "editor", "x": 0.8, "y": 0.9 },
      "show": [0.3, 0.6],
      "hide": [5.6, 6.0],
      "drift": 1.2,
      "path": [
        { "to": { "at": "fourth", "x": 0.3 }, "at": [0.5, 1.4], "ease": "move", "bend": 0.12 },
        { "press": 1.5 },
        { "release": 1.62 },
        { "to": { "at": "editor", "x": 0.9, "y": 0.8 }, "at": [2.0, 2.9], "ease": "move", "bend": 0.1 }
      ]
    },
    "callouts": [
      { "copy": "saves", "anchor": { "at": "editor", "x": 0.45, "y": 0.25 }, "side": "right", "in": [3.6, 3.95], "out": [6.0, 6.3] }
    ]
  },
  "cameras": {
    "framings": {
      "wide": { "focus": ["@frame"], "pad": 40, "establishing": true },
      "editor": { "focus": ["editor"], "pad": 150 },
      "editor-tight": { "focus": [{ "at": "editor", "x": 0.43, "y": 0.83, "w": 520, "h": 150 }], "pad": 10 }
    },
    "default": { "keys": [[0, "wide"], [2.2, "wide"], [3.0, "editor"], [5.8, "editor"], [6.7, "wide"]] },
    "phone": { "below": 600, "keys": [[0, "wide"], [2.2, "wide"], [3.0, "editor-tight"], [5.8, "editor-tight"], [6.7, "wide"]] }
  },
  "copy": { "saves": "Saved as you type" }
}
```

## Mistakes that bite

- Aiming at a row after a reorder. Targets are fixed at `t = 0`; use offsets.
- Keys out of order. The validator rejects them.
- A looping scene whose end frame differs from `t = 0`. The seam jumps.
- Sizing callout offsets in stage pixels. They are display pixels.
- A tight phone framing with base text under 10 px at `minWidth`.
- A press with no matching state change, so the click does nothing visible.
- Editing a locked kit component to suit one scene. Bump the kit version instead (`kits.md`).
