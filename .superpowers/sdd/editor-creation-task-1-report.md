# Editor Creation Task 1 Report

## Status

DONE

## Scope Executed

- Implemented only `packages/miaoma-editor-interaction/**`
- Did not modify `packages/miaoma-editor-core/**`, `apps/desktop/**`, docs, or unrelated files

## What Was Added

Created package scaffolding and implementation files:

- `packages/miaoma-editor-interaction/package.json`
- `packages/miaoma-editor-interaction/tsconfig.json`
- `packages/miaoma-editor-interaction/tsdown.config.ts`
- `packages/miaoma-editor-interaction/vitest.config.ts`
- `packages/miaoma-editor-interaction/src/types.ts`
- `packages/miaoma-editor-interaction/src/reducer.ts`
- `packages/miaoma-editor-interaction/src/createEditorInteraction.ts`
- `packages/miaoma-editor-interaction/src/index.ts`
- `packages/miaoma-editor-interaction/tests/creation.test.ts`

## Behavior Implemented

- Pure TypeScript interaction protocol with no DOM or React dependency
- Supported tools limited to `pointer`, `frame`, `rectangle`, `ellipse`, `text`, plus protocol-level `hand`
- Shape creation drag threshold uses `4px` in screen space
- Text creation happens on click and emits `startTextEditAfterCreate: true`
- Parent resolution targets the innermost hit `frame`; falls back to root when no frame exists
- Parent layout is mapped into emitted commands as:
  - `none -> absolute`
  - `horizontal -> horizontal`
  - `vertical -> vertical`
- Successful shape/text creation switches active tool to `pointer`
- Failed shape creation below threshold keeps the selected creation tool unchanged
- Public API exported through `src/index.ts`

## Tests

### Red phase

Ran:

`pnpm --dir "/Users/heyi/MiaoMa/Projects/poc-demo/miaoma-design-ai/packages/miaoma-editor-interaction" test:run -- tests/creation.test.ts`

Observed expected failure before implementation:

- `Failed to load url ../src`

### Green phase

Added reducer tests covering:

- Below-threshold drag does not create and keeps current tool
- Rectangle creation after threshold
- Text creation on click with inline edit start
- Innermost frame targeting with horizontal layout propagation
- Root creation fallback when no frame exists

### Package verification

Ran:

- `pnpm --dir "/Users/heyi/MiaoMa/Projects/poc-demo/miaoma-design-ai/packages/miaoma-editor-interaction" test:run -- tests/creation.test.ts`
- `pnpm --dir "/Users/heyi/MiaoMa/Projects/poc-demo/miaoma-design-ai/packages/miaoma-editor-interaction" test:run`

Result:

- `1` test file passed
- `5` tests passed

## Design Notes

- KISS: reducer keeps a single small state machine with `idle` and `creatingShape`
- YAGNI: no integration adapters, no DOM abstractions, no command execution layer, no extra shape types
- DRY: one parent-resolution helper and one reducer path for all drag-created shapes
- SOLID:
  - Single responsibility: protocol types, pure reducer, and stateful wrapper are split cleanly
  - Open/closed enough for later event/command expansion without changing the wrapper contract

## Commits

- Created one conventional commit via `pnpm commit`: `feat(editor-interaction): ✨  add interaction creation reducer package`

## Concerns

- None

## Review Fixes

### Applied fixes

- Extended the interaction command protocol with:
  - `removeNode`
  - `selectNode`
- Added reducer state for tracking a brand-new text node through its inline-edit lifecycle
- Implemented cleanup behavior so a brand-new text node is removed on:
  - `textEditCancel`
  - `textEditCommit` with trimmed empty content
- Implemented selection fallback after brand-new text cleanup:
  - reselect parent frame when present
  - clear selection at root
- Tightened shape creation threshold handling so creation requires drag distance to be strictly greater than `4px`

### Added regression coverage

- `distance === 4` does not create a shape and leaves the active creation tool unchanged
- Brand-new text cancel removes the node and reselects the parent frame
- Brand-new text empty commit removes the node and clears selection when parent is root

### Verification evidence

Ran after the fixes:

- `pnpm --dir "/Users/heyi/MiaoMa/Projects/poc-demo/miaoma-design-ai/packages/miaoma-editor-interaction" test:run -- tests/creation.test.ts`
  - Result: `8` tests passed
- `pnpm --dir "/Users/heyi/MiaoMa/Projects/poc-demo/miaoma-design-ai/packages/miaoma-editor-interaction" test:run`
  - Result: package tests passed
