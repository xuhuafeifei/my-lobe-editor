---
nav: Plugins
group: Plugins
title: Diff Hunk
description: Inline DiffOp hunks inside the same Editor — update / delete / insert_after with Accept & Reject.
atomId: ReactDiffPlugin
---

## Introduction

Pending edits are materialized as `diff-hunk` nodes in the **same** live Editor (no editor swap). Each hunk carries an `opId`; Accept / Reject removes the op and folds the tree.

Agent-facing helpers (md in → DiffHunk): `updateSlot` / `insertAfterSlot` / `removeSlot` / `overwriteAll` (block LCS). Publish gate: `assertCanPublish` / `hasPendingDiff`. Canonical export without mutating: `getCanonicalEditorState`.

## Demo

<code src="./demos/index.tsx"></code>
