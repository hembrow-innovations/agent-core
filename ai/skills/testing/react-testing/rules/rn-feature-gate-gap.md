---
title: Run the package you edited
impact: HIGH
impactDescription: umbrella scripts often skip feature packages
tags: [rn, gates]
---

## Run the package you edited

Umbrella scripts (`test:mobile`, `just test-mobile`, CI jobs) often run the app and the UI kit only. Feature-native packages may be on-demand. Read the script before claiming the gate is green.

**Incorrect:** "Native tasks are covered because I ran the mobile test script."

**Correct:** After editing a package, run that package's `test` script (workspace filter or local `npm test`). Confirm the umbrella's package list if you need the merge bar.

Notes: Discover `package.json` scripts, `justfile`, and CI. Do not assume one command runs every native suite.
