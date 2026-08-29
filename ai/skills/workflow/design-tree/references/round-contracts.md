# Round contracts

Parent and **round-orchestrator** only. Do not inject this file into panelists.

## Paths

Session: `.heio/planning/arena/<arena-name>/`

Round: `.heio/planning/arena/<arena-name>/rounds/round-<N>/`

- Questions: `round-<N>-questions.md`
- Answer: `round-<N>-questions-<panel_member_name>.md`

Never rewrite an earlier round.

## Questions file

```markdown
## Questions

### Question <N> - title
question and any related context.
```

One file per round. `N` in the heading is the question number in that round, starting at 1. Omit the parent's recommended answer.

After the judge runs, each question also has:

```markdown
#### Selected
- **winner**: <panel_member_name>
- **answer**: <text>
- **reasoning**: <text>
- **reason**: <why this winner>
```

## Answer file

```markdown
## Questions

### Question <N> - title
original question text

#### Answer
Answer to the question.

#### Reasoning
reasoning to the answer.
```

Copy every question from the questions file. Answer all of them. Write only this file.

## Launch

Stable keys: `round-orchestrator`, `answer-architect`, `answer-product`, `answer-coder`, `judge`. Phase labels: `Round <N> orchestrate`, `Round <N> answer`, `Round <N> judge`. `context: "fresh"` on every child.

Panel is one async `workflowScript` with `runs.all`. No peer answers. Include the questions file path, settled selected answers from earlier rounds, and evidence.

Judge waits until every answer file exists. Append `#### Selected` under each question on the questions file. Leave question text and answer files untouched.

Round-orchestrator needs write and `subagent`. Panel and judge need write. Write only the named files under that round directory.

Fallback `oracle` uses `context: "fresh"` and the persona name in the task. `oracle` does not write files. When a seat cannot write, the caller writes that file from the child's returned text and notes `skip: no write runtime` on the round.

If spawn is missing, the parent writes the questions file, three answer files, and the selected blocks, and marks `skip: no spawn runtime` on the round.

## Return

Round-orchestrator returns the questions file path and each question's winner, answer, and reason.
