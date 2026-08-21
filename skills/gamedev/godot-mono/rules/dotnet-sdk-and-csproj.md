---
title: SDK, csproj, and solution hygiene
impact: MEDIUM
impactDescription: build breaks
tags: [dotnet]
---

## SDK, csproj, and solution hygiene

Install a compatible .NET SDK (Godot 4.x docs: recent .NET 8+; follow your 4.7.2 release notes). Commit `.csproj` and `.sln`. Let Godot generate the first C# script’s project files.

**Incorrect:** Hand-rolling a random SDK-style project that bypasses `Godot.NET.Sdk`.

**Correct:** Keep `Godot.NET.Sdk` in the `.csproj`; adjust `TargetFramework` only as required by Godot version docs.

Notes: Delete `.godot/mono` to regenerate caches when tooling is corrupted—not the `.csproj`.

