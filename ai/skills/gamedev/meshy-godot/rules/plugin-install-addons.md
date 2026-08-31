---
title: Install the official plugin under addons/
impact: HIGH
impactDescription: DCC Bridge will not appear otherwise
tags: [plugin, editor]
---

## Install the official plugin under addons/

The official plugin is the one-click webapp → Godot path. It is not on AssetLib by default; download it from Meshy.

**Incorrect:** Drop a zip at the project root, or enable a similarly named community addon and expect Bridge.

**Correct:** Download from <https://www.meshy.ai/integrations/godot>. Create `addons/` if missing. Unzip the plugin folder into `addons/`. Project Settings → Plugins → enable Meshy.

Notes: Treat `addons/<plugin>/` as vendor code. Do not edit it; wrap it if you need extra import steps.
