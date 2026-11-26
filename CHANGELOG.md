# Changelog

## 0.1.2

- Download integrity: the default model is verified against its exact byte size after download; a short file that already carries the final name is moved back to `.part` for resume instead of being started as a complete model.
- History limits: `history.json` is trimmed by a byte budget (8 MiB, newest first). A single oversized record is still kept, so saving a long translation never loses it.
- Glossary candidates: the listed terms are now translated in one batched request; when the model does not return exactly one line per term, the flow falls back to one request per term.
- Cleanup: removed unused exports (`CREDENTIAL_KEY`, `buildExtractionPrompt`, `parseTermLines`, `csvEscape`) and `ModelManager.openModelDirHint`.
- Client: dropped the compatibility patch that deleted live-translation history records on older hosts; the host already honors `saveHistory: false`.
- Release: added `.github/workflows/publish.yml` (tag-triggered npm Trusted Publishing plus GitHub release) and `repository`/`homepage`/`bugs` metadata required by provenance.
- Docs: language count is consistently 38; documented the history byte cap and the download check.

## 0.1.1

- Declare `engines.dsh`: `>=0.2.2-rc.5 <0.3.0`; document DSH compatibility in README.
- Update install/version references to `v0.1.1`. No runtime behavior changes.

## 0.1.0 — baseline

First public baseline of `dsh-localllmtranslate`.

- Left-sidebar **翻译** entry and a main translation workspace.
- Live translation in **side-by-side (default: source left, translation right)** or **stacked (translation above, source below)** layout.
- Paragraph-level bidirectional highlighting with a frosted source echo that does not reflow the translation.
- Collapsible internal sidebar, default on the right, switchable to the left in Settings.
- Glossary with manual CRUD, CSV/JSON import/export, per-pair or global scope, and automatic pending candidates.
- Translation history with an expandable secondary menu, search, load, delete, and clear.
- CLI-style toast broadcaster in the bottom right: typing/backspace animation, click to pin, close button, and a Settings toggle.
- Settings split into **Model / Interface / Diagnostics**, with a back button and **Restore defaults**.
- Double-click the model status card to load or stop the model (toggleable in Settings).
- Default model is **Hy-MT2-1.8B F16**; the model is not shipped in this repository. Missing models can be downloaded automatically or manually, then auto-started.
- First-time setup wizard for machines without llama.cpp: one-click WinGet (Windows) or Homebrew (macOS), copyable commands and Releases link elsewhere, rescan, model download and start in one linear flow.
- Gitee/Git mirror installation path for users without an npm account (`docs/PUBLISHING.md`).
- Agent tool `translate_text`.
