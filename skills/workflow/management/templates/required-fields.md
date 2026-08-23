# Required frontmatter fields

Every managed note includes these fields. Kind-specific fields follow on the kind template.

```yaml
id: "<filename stem>"
title: "<same string as the h1>"
kind: issue | plan | task | report | journal | note
tags: []
created_at: "<ISO-8601>"
updated_at: "<ISO-8601>"
```

`id` matches the filename without `.md`. Journal `id` is `journal-YYYY-MM-DD` even though the file is `YYYY-MM-DD.md`.

Inbox dumps may omit frontmatter. If they have any, `kind` is `note`.

## Optional fields

Add only the ones the kind uses. Do not invent new keys.

```yaml
description: "one sentence"
status: "see note-standards"
labels: feature
priority: low | medium | high | urgent
severity: critical | high | medium | low
references: ["path-or-id"]
tasks: ["task-N-slug"]
plan: "plan-N-slug"
blocked_by: ["task-N-slug"]
date: "YYYY-MM-DD"
```
