---
name: onic-schema
description: Query an onic project graph. Use when writing onic sql, searching the graph, or reading source to answer a code question in a repo that has onic.
---

# Onic schema first

`.onic/graph.db` is a cache. Rebuild it. Do not treat it as source.

Before writing SQL or opening source to answer a graph question:

1. Run `onic schema`, `pnpm onic schema`, or `bun apps/onic/src/cli.ts schema` in the project root.
2. Read the printed kinds and the example queries.
3. For a named node, load `onic compact <name-or-id>` before `explain` or open-ended SQL. Do not `SELECT *`. Do not open `.onic/graph.db`.
4. Write targeted `onic sql` against those tables. Do not guess column names.

If the graph is missing, run `onic build .` and then `onic schema` again.

`explain` remains full-node inspect. `sql` remains for targeted queries.

Useful commands after schema:

```bash
onic search login
onic search symbol:src/auth.ts#login
onic compact login
onic explain login
onic neighbors symbol:src/auth.ts#login
onic path login SessionStore
onic sql "SELECT kind, count(*) AS n FROM nodes GROUP BY kind"
```
