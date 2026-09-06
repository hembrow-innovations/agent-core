# Required frontmatter fields

Every spec note includes these fields. Kind-specific fields follow on the kind template.

```yaml
id: "<filename stem>"
title: "<same string as the h1>"
kind: purpose | contract | test | spec
domain: "<subject domain. also the path segment under specs>"
area: "<area slug>"
tags: []
created_at: "<ISO-8601 or YYYY-MM-DD>"
updated_at: "<ISO-8601 or YYYY-MM-DD>"
```

`id` is stable after create. Do not change it when you rename the title.

## Optional fields

```yaml
description: "one sentence"
status: "see the kind template"
```
