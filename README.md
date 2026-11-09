# Family tree

A static Tamil family-tree explorer using [D3 7.9.0](https://github.com/d3/d3) (ISC license). No paid library, framework, or build step is required. D3 is loaded from a version-pinned jsDelivr URL, so an internet connection is required.

Serve this directory through a local HTTP server or a static-site host and open `index.html`. Opening the HTML directly with `file://` is not supported because browsers restrict loading `family.json`.

## Navigation

- Drag the canvas to pan; use the mouse wheel, pinch gesture, or zoom buttons to change scale.
- The initial view and Reset show the root at readable size. Fit shows the complete tree, which can make names smaller.
- Search highlights matching names. Select a result to center that record at readable size; generation and parent context distinguish duplicate names. Clear or Escape in the search field removes the search.
- Focus the canvas and use arrow keys to pan, `+` / `-` to zoom, `Home` to reset, or `0` to fit.
- On resize, the current center is preserved within the new zoom limits; a fitted view is fitted again.

`family.json` contains a root record and an optional `children` array of records with the same structure. The application does not infer or edit relationships. Loading failures appear on the page with a retry action and technical details in the browser console.

## Record display

Edit the explicit fields in `family.json`; do not embed spouses or dates in `Name`. Keep `children` lowercase and preserve its order. Every main person and spouse uses the same required fields; a spouse has `Spouse: null` and no `children`.

```json
{
  "Id": "person-001",
  "Name": "Example person",
  "Aliases": [],
  "Gender": null,
  "Birth": {
    "Date": "1864",
    "IsApproximate": null,
    "Place": null
  },
  "Death": {
    "Date": "1930-05-12",
    "IsApproximate": false,
    "Place": null
  },
  "Spouse": null,
  "Burial": {
    "CemeteryName": null,
    "Location": null,
    "GraveFound": null
  },
  "Notes": "Example annotation",
  "Sources": [],
  "children": []
}
```

| Field | Accepted value |
| --- | --- |
| `Id` | Globally unique string using letters, digits, underscores or hyphens; never change it when correcting a name or moving a record |
| `Name` | Nonempty string, including existing unknown-name placeholders |
| `Aliases` | Array of alternate-name strings, or `[]` |
| `Gender` | `"Male"`, `"Female"`, `"Other"`, or `null` |
| `Birth`, `Death` | Objects with `Date`, `IsApproximate`, and `Place` |
| `Birth.Date`, `Death.Date` | `"YYYY"`, a valid calendar date `"YYYY-MM-DD"`, or `null` |
| `IsApproximate` | `true` (approximate), `false` (confirmed exact), or `null` (not established); must be `null` when `Date` is unknown |
| `Place` | Nonempty place-name string or `null` |
| `Spouse` | Person object using this schema, with a unique `Id`, `Spouse: null`, and no `children`; or `null` |
| `Burial.CemeteryName`, `Burial.Location` | Nonempty strings or `null` |
| `Burial.GraveFound` | `true` (confirmed found), `false` (confirmed not found), or `null` (unknown) |
| `Notes` | Nonempty string or `null` |
| `Sources` | Array of short source-description/reference strings, or `[]`; rendered as text, not automatically opened |

Use `null` for unknown facts, not empty strings or guessed values. Dates retain their precision: a known year does not imply a day or month. A missing death date does not imply someone is alive. Migrated dates keep `IsApproximate: null` because their accuracy was not established.

To add a spouse, copy the example record into `Spouse`, give it a new unused `Id`, and remove its `children` field. Do not infer its gender or dates from the main person. Only one embedded spouse per family record is currently supported; multiple marriages and shared ancestry require a separate relationship model.

Cards, search results, and accessible descriptions read these fields directly and show known details with Tamil labels. Spouses use the gender-neutral label `வாழ்க்கைத் துணை`. Unknown details are hidden. Search includes main/spouse names and aliases and centers the containing family record. Spouses do not create separate tree nodes.

The migration preserved all existing names, dates, gender values, notes, grave statuses, and child order. IDs were assigned once and are stored in JSON, not regenerated during rendering. Existing annotations remain in `Notes`; move confirmed alternate names to `Aliases` manually rather than guessing from notes.

The footer includes the creator credit and a user-initiated WhatsApp link for corrections or additions. No message is sent automatically.

## Validation

Run `node --test tests\family-schema.test.cjs` to check the current data, unique IDs, nested field types, calendar dates, and display/search helpers. No test dependencies are required.
