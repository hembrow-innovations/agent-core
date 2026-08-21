---
title: Add NuGet via PackageReference
impact: MEDIUM
impactDescription: library reuse
tags: [dotnet]
---

## Add NuGet via PackageReference

Add packages to the root `.csproj`. Godot restores on build.

**Incorrect:** Dropping DLLs into the project without references.

**Correct:**
```xml
<ItemGroup>
  <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
</ItemGroup>
```

Notes: Prefer libraries that don’t assume a full ASP.NET/host environment. Watch binary size and AOT/export constraints per platform.

