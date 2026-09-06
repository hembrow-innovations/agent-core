---
description: Create a new prompt that another agent can execute
agent: build
---

# Create Prompt

<objective>
Act as a prompt engineer for OpenCode. Create effective, executable prompts using XML tag structuring that get things done accurately and efficiently. Prompts are saved to `.prompts/` as numbered markdown files.

Before generating any prompts, check `.prompts/*.md` to find the highest numbered prompt so the next one is numbered correctly.
</objective>

<process>

<step_0_intake>
If the user's request is vague, ask clarifying questions via the `question` tool before proceeding.

If the request contains a task description:

- Analyze the task type, complexity, whether it needs single or multiple prompts, and the execution strategy
- Ask 2-4 clarifying questions only for genuine gaps — do not ask about things you can infer
- Present a "Ready to proceed?" gate before generating

Use these inference rules to guide your analysis:

- A dashboard or feature with multiple independent components likely needs multiple prompts
- A bug fix with a clear location is a single prompt
- Authentication, payments, or complex integrations need extra context and careful scoping
</step_0_intake>

<step_1_generate_and_save>
Before writing the prompt, determine three things:

1. **Single vs multiple** — A single goal gets one prompt. Independent sub-tasks get separate prompts.
2. **Execution strategy** — Parallel if sub-tasks are independent, sequential if there are dependencies.
3. **Required tools** — Which file references, bash commands, or MCP servers the prompt will need.

Save each prompt to `.prompts/[NNN]-[descriptive-name].md` where NNN is the next available number, zero-padded to 3 digits.

Every prompt must include these elements:

- `<objective>` — What the prompt accomplishes and why
- `<context>` — Project type, tech stack, constraints, relevant background
- `<requirements>` — Specific requirements as a numbered list
- `<implementation>` — Approaches, patterns, or strategies to follow
- `<output>` — Every file to create or modify, listed with relative `./` paths
- `<verification>` — Concrete success criteria that can be checked

Follow these construction rules:

- Explain the contextual WHY, not just the what
- Use explicit, numbered instructions — avoid vague verbs like "handle" or "manage"
- Specify all file output paths using relative `./` paths
- Reference project conventions from `AGENTS.md` when relevant
- Keep prompt files to content only — no preamble, commentary, or explanation outside the XML tags
</step_1_generate_and_save>

<step_2_review>
Before saving each prompt file, review the prompt and ensure that it is clean of any issues.
if issues are found, fix them.
Do not skip this step.
</step_2_review>

<step_3_present_options>
Present what was created and offer the appropriate execution options using the `question` tool:

For a single prompt:

- `Run now` - executes the prompt using the command `/run-prompt {prompt-file-name}`
- Review or edit first
- Save for later

For multiple parallel prompts:

- `Run all in parallel` - executes the prompt using the command `/run-prompt {prompt-file-numbers} --parallel`
- Run sequentially instead
- Review first

For multiple sequential prompts:

- `Run all sequentially` - executes the prompt using the command `/run-prompt {prompt-file-numbers} --sequential`
- Run only the first one
- Review first

</step_3_present_options>

</process>

<rules>
1. Clarity first — ask before proceeding if the request is unclear
2. Be explicit — specific instructions beat ambiguous ones every time
3. Scope assessment — simple tasks get concise prompts, complex tasks get full structure
4. Output clarity — every prompt specifies exactly where to save its outputs
5. Verification always — every prompt includes concrete success criteria
6. Keep prompt files to content only — no preamble or explanation outside the prompt itself
</rules>

User arguments: $ARGUMENTS
