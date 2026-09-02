# Vault layout

Obsidian vault. Numeric prefixes control sort. Notes use YAML front matter and `[[WikiLinks]]`.

## Layers

- **00 Meta**: templates, tags, vault config. Not world content.
- **10 Core**: cosmology, factions, history, technology. Textbook voice.
- **20 Atlas**: locations, maps.
- **30 Characters**: biographies.
- **40 Production**: ideas, YouTube scripts, prompts, audits.
- **50 Book**: outline, chapters, critique, voice, ledger.

## New lore notes

Pick the folder from the type:

- Cosmology → `10 Core/11 Cosmology/`
- Faction → `10 Core/12 Factions/`
- History → `10 Core/13 History/`
- Technology → `10 Core/15 Technology/`
- Location → `20 Atlas/22 Locations/`
- Character → `30 Characters/`
- Chapter → `50 Book/52 Chapters/`

Copy the matching file from `00 Meta/01 Templates/`. Set `status: draft` and `created` as `YYYY-MM-DD`.

## Front matter

Lore notes carry `type`, `status`, `created`. Optional: `related_faction`, `tech_level`, `era`.

Chapter notes carry `type: chapter`, `status`, `pov`, `act`, `pass`, `linked_lore`.

Dataview dashboards read `type` and `status`. Keep them honest.

## Linking

Every reference to another topic is a `[[WikiLink]]`. Do not restate a lore note inside a chapter's research dump. Point, then let the POV use one object.

## Templates

`00 Meta/01 Templates/` holds Character, Cosmology, Faction, History, Idea, Location, Prompt, Script, Species, Technology, Chapter.

If no template fits a new lore type, create one there first, then the note.
