---
title: Visual dev
when: "Production UI that has to look right: a new screen, a redesign, or polish until the running app matches a Stitch mockup and a visual quality bar. Distinct from Prototype (throwaway), React app (stack and behavior), Visual parity (pixel-exact image-diff), and Hillclimb (one numeric metric)."
---

### Visual dev

**You own the pixels. A fresh capture is the test. The Stitch pull is the baseline.** For "make this screen look great", "implement this mockup", "polish the UI", "front-end design", or iterating a running interface until it is distinctive and correct. Unit green is not the screen. Code inspection is not a look.

The loop is **see → critique → patch → recapture**. Perception for new work; **Visual parity** when the ask is pixel-exact image-diff.

1. Discover the stack and the **surface** before any mockup or JSX. Done when you can name framework, UI kit, the three files you will copy, and the driver.
   - Web or React Native Web → **playwright-cli**. Native device, emulator, or simulator → **maestro**. The named platform wins. A product that ships both gets both; skip stays as `skip: <surface> not in dest`.
   - Load **stitch**, **frontend-design**, and **typography** when faces or swap are in scope. React web also loads **vercel-react-best-practices**. TanStack Start loads **tanstack-ui**. Every `.ts` / `.tsx` file loads **typescript-best-practices**.
   - Copy the neighboring route, component, and token file. Do not invent a kit, palette, or font stack.

2. Lock the **baseline**. Open look → Stitch first. Existing DESIGN.md plus a named mockup → implement that pull. Skip Stitch only as `skip: baseline is <path>`.
   - Load **stitch**. `doctor` before generate. Enhance the brief (vibe, layout, components, device, constraints). Device is DESKTOP unless DESIGN.md or the user named mobile.
   - `ensure` the project. `generate` then `--pull`. Layout right and details wrong → `edit`, one change per call. After screen one, write `.stitch/DESIGN.md` from the stitch template.
   - The pulled `screen.png` is the spec. Do not paste Stitch HTML into product source. Implement in the discovered kit so the running app matches the pull.

3. Implement the smallest route that can render. Tokens and CVA from **frontend-design**. Match the baseline; do not restyle the mockup to flatter the code.

4. **Capture** on the matching surface. Done when a fresh artifact set exists for this tree, every named viewport, and every state this change owns (default, empty, loading, error; open overlay or focus when the change has one).
   - Playwright: snapshot to act, screenshot to prove. Maestro: drive the flow, then a device screenshot. Paths under the project's gitignored scratch (`.tmp/` if none).
   - Record numeric signals with the PNGs: horizontal overflow (`scrollWidth > clientWidth` on web), console errors, failed font or asset requests. A number beats a squint for that class of bug.
   - A capture from an earlier edit is stale. Recapture after every patch.

5. **Critique** the current PNGs against the baseline and the quality bar. Done when every question below has an answer that cites a PNG path, or `cannot tell from <path>`.
   - Broken (must be no): clipped or overlapping text; control outside the viewport; horizontal overflow; console errors; missing font; collapsed unstyled mobile; a state this change owns that was not captured.
   - Quality (cite the pixel): composition and spacing rhythm; type hierarchy; contrast and token use; visual identity versus generic AI chrome; polish (alignment, density, states). Flag Inter/Roboto defaults, purple-on-white gradients, and uniform card grids only when DESIGN.md did not name them.
   - Compare implementation PNG to `.stitch/designs/<slug>/screen.png` when that file exists. Name the delta (spacing, type, chrome, color), not "close enough".

6. **Hillclimb** one named defect per iteration. Patch, recapture, keep or revert from the new PNGs. Log one row (id, defect, change, before path, after path, verdict). Three failed attempts on the same defect → write the leftover and move on. Three iterations with no visible improvement → stop and surface the plateau. Do not stack untested visual changes.

7. Stop when the capture is fresh, Broken is clean, every Quality leftover is named or closed, and you have looked at least once after implement. Do not declare victory from the first unseen implementation. Pixel-exact image-diff is **Visual parity**. A throwaway to decide layout is **Prototype**.

**Reply:** surface and driver, Stitch project and screen ids (or the skip), baseline path, capture paths, Broken answers, Quality leftovers, iterations kept vs reverted, the next defect you would take.
