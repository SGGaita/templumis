---
name: templum-i18n
description: >-
  Enforces TemplumIS translations: every user-visible string in new or edited
  frontend components, pages, and layouts must use useLanguage() and be added
  to all 15 locale files (en, sw, ar, fr, pt, es, id, ms, hi, zh, th, lo, my,
  ko, vi). Use when creating or editing React components, pages, UI copy,
  labels, buttons, placeholders, toasts, empty states, errors, or i18n/locale
  files.
---

# TemplumIS i18n

A component is not done until every user-visible string is keyed and present in **all 15** locale files.

Do not ship English-only UI. Do not copy English into other locales as a placeholder.

## Hard rule

When creating or editing any frontend UI (`frontend/src/app/**`, `frontend/src/components/**`):

1. Find every user-visible string (labels, headings, buttons, helper text, placeholders, tooltips, empty states, alerts, table headers, nav items, aria-labels shown as copy).
2. Reuse an existing `t.common.*` or portal key if it already exists.
3. Otherwise add a new nested key in the correct namespace.
4. Write the English string in `frontend/src/lib/i18n/en.js` first.
5. Add the **same key path** with a real translation in every other locale file listed below.
6. Render via `useLanguage()` — never a raw string in JSX/props.

The task is incomplete if any locale file is missing the new keys.

## Supported languages (required)

Source of truth: `frontend/src/lib/i18n/index.js` (`LANGUAGE_GROUPS`).

| Code | Language | File |
|------|----------|------|
| `en` | English | `frontend/src/lib/i18n/en.js` |
| `sw` | Swahili | `frontend/src/lib/i18n/sw.js` |
| `ar` | Arabic (RTL) | `frontend/src/lib/i18n/ar.js` |
| `fr` | French | `frontend/src/lib/i18n/fr.js` |
| `pt` | Portuguese | `frontend/src/lib/i18n/pt.js` |
| `es` | Spanish | `frontend/src/lib/i18n/es.js` |
| `id` | Indonesian | `frontend/src/lib/i18n/id.js` |
| `ms` | Malay | `frontend/src/lib/i18n/ms.js` |
| `hi` | Hindi | `frontend/src/lib/i18n/hi.js` |
| `zh` | Mandarin | `frontend/src/lib/i18n/zh.js` |
| `th` | Thai | `frontend/src/lib/i18n/th.js` |
| `lo` | Lao | `frontend/src/lib/i18n/lo.js` |
| `my` | Myanmar | `frontend/src/lib/i18n/my.js` |
| `ko` | Korean | `frontend/src/lib/i18n/ko.js` |
| `vi` | Vietnamese | `frontend/src/lib/i18n/vi.js` |

Arabic is RTL. `LanguageProvider` sets `dir` on `<html>` — do not hardcode left/right layout that breaks RTL unless the design requires it.

## Component pattern

Components that call `useLanguage` must be Client Components (`"use client"`).

```jsx
"use client";

import { useLanguage } from "@/lib/language-context";

export default function ExampleWidget() {
  const { t } = useLanguage();
  const L = t.staff.rankings; // optional alias for a screen

  return (
    <>
      <h1>{L.title}</h1>
      <button>{t.common.save}</button>
    </>
  );
}
```

**Do**

- `const { t } = useLanguage();` then `t.namespace.leaf`
- Alias a screen object: `const L = t.auth.login;`
- Keep dynamic values in code; keep static copy in locales (`{t.student.dashboard.welcomeBack} {name}`)

**Do not**

- Hardcode English (or any language) in JSX, `label=`, `placeholder=`, `title=`, `helperText=`, toasts, or table headers
- Use `next-intl` / `useTranslations` — this app uses the custom `LanguageProvider`
- Leave other locale files on English "for now"
- Translate brand `TemplumIS`, route paths, API field names, or developer-only logs

## Where to put keys

| Route / surface | Namespace |
|-----------------|-----------|
| Shared buttons, status, table words | `common` |
| Language picker | `language` |
| `/` landing | `home` |
| `/login`, `/signup`, email verify | `auth` |
| `/student/**` | `student` |
| `/staff/**` | `staff` |
| `/global-admin/**` | `globalAdmin` |
| `/institution/**` | `institutionAdmin` |
| Reviewer UI | `reviewer` |
| Reviewer invite / recommendation | `reviewerInvite` / `recommendationPortal` |

New screen → new nested object under that namespace (`staff.rankings.title`), not a flat dump into `common`.

Key names: camelCase. Mirror existing nesting (`nav`, `table`, `stats`, `errors`). Translate every element of string arrays.

Namespaces and reusable `common` keys: [namespaces.md](namespaces.md)

## Adding keys (all files)

1. Add keys to `en.js` in the right nested object, same style as neighbors.
2. Copy that exact nested structure into **every** other `frontend/src/lib/i18n/{code}.js` file.
3. Translate into that language. Natural UI phrasing, not word-for-word calques.
4. If a **new language** is added to the product: create `frontend/src/lib/i18n/{code}.js`, import it in `index.js`, add it to `LANGUAGE_GROUPS`, and translate the full tree (not only new keys).

## Workflow checklist

Copy and complete before finishing:

```
i18n:
- [ ] All user-visible strings go through t.* (or an L alias)
- [ ] Reused t.common.* / existing keys where possible
- [ ] New keys added to en.js
- [ ] Same keys translated in: sw ar fr pt es id ms hi zh th lo my ko vi
- [ ] No English leftovers in non-en files for those keys
- [ ] Ran key check script (or equivalent grep)
```

## Verify

From the repo root:

```bash
node .cursor/skills/templum-i18n/scripts/check-keys.mjs
```

Must exit 0. If it reports missing/extra keys, fix the locale files and re-run. Do not finish with a failing check.

Grep fallback: each new leaf key name must appear in all 15 locale files.
