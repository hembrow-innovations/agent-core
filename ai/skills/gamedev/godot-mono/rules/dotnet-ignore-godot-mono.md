---
title: VCS: ignore .godot, keep project files
impact: MEDIUM
impactDescription: repo cleanliness
tags: [dotnet, vcs]
---

## VCS: ignore .godot, keep project files

Ignore `.godot/` (includes mono caches). Commit `.csproj`, `.sln`, and source. Don’t commit `bin/`/`obj/` if generated beside the project.

**Incorrect:** Committing `.godot/mono` build artifacts; ignoring `.csproj`.

**Correct:** `.gitignore` includes `.godot/` and typical .NET `bin/`/`obj/`; sources and project files tracked.

Notes: Document required Godot **mono** build + SDK version in README.

