---
name: typography
description: Product font face load and swap across web, desktop, and mobile. Use when changing or bundling the UI sans, expo-font or splash gate, NativeWind fontFamily, web @fontsource, swapping typeface, or when mobile and web text faces diverge.
---

# Typography (product face)

Face load and swap only. Scales and tokens live in **docs**. Layout and CVA live in **frontend-design**.

## Discover first

1. Find the font package. Search workspace names and imports such as a shared `fonts` package, `@fontsource/*`, `expo-font`, or `next/font`. Do not assume one scoped name.
2. Find the durable type notes under `docs/`. Load **docs**. Typical titles are typography, design-tokens, page-type-scale.
3. Open the package exports. Note web CSS, native font maps, and root class names the app already uses.

If `AGENTS.md` or `WORKSPACE.md` already names a tracker (`.scratch/`, `docs/planning/`, GitHub Issues), that file wins. Working notes go through **management**. Do not put issues in `docs/`.

## Rules (always)

- One product sans. Web is the visual standard. Desktop matches the web SPA when they share it.
- Weights 400 / 500 / 600 / 700 unless the discovered package documents a different set. Map `font-semibold` to the real bold face the package ships (often 700, not 600).
- Features go through tokens and `font-sans` plus native weight family pairs. No ad-hoc `fontFamily` strings in features.
- Icon fonts are out of scope.

## Change or add a face

1. Read the discovered docs note and the font package exports. Done when paths match the package as-built.
2. Edit only the shared font package. Keep web CSS, native maps, and any CJS or CSS mirrors in lockstep. Done when the shipped weights and family maps agree.
3. Wire stays at the single load site per platform. Web root class plus CSS import. Mobile `useFonts` (or the project's loader) plus splash hold until ready plus NativeWind theme family. Native CVA uses the package weight classes. Done when no feature hard-codes a family.
4. Verify. Web body is the product face. Mobile has no system-font flash. Medium, semibold, and bold are real faces. Desktop matches the SPA. Done when those hold.

## Diagnose cross-platform drift

1. Confirm both sides consume the shared font package, not a local Inter copy in a feature.
2. Mobile. Splash gate plus the package native font map. Weight class paired with the `font-sans-*` family.
3. Web. Package CSS imported. Root uses the package root class.
4. Fix at the shared package or the single load site. Never a one-off face in a feature.
