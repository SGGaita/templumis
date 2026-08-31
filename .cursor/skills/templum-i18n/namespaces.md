# TemplumIS i18n namespaces

Read this when placing new keys or reusing shared copy.

## Locale files

All trees must share the same nested key shape as `frontend/src/lib/i18n/en.js`.

Registered in `frontend/src/lib/i18n/index.js`:

`en`, `sw`, `ar`, `hi`, `fr`, `es`, `pt`, `id`, `ms`, `ko`, `vi`, `zh`, `th`, `lo`, `my`

## Top-level namespaces

| Key | Use for |
|-----|---------|
| `language` | Language picker chrome |
| `common` | App-wide actions, status, table words |
| `home` | Marketing / landing page |
| `auth` | Login, signup, verify email |
| `student` | Student portal |
| `staff` | Staff / financial-aid portal |
| `globalAdmin` | Global admin portal |
| `institutionAdmin` | Institution admin portal |
| `reviewer` | Reviewer portal |
| `reviewerInvite` | Reviewer invitation screen |
| `recommendationPortal` | Recommendation letter screen |

## Reuse `t.common` first

Do not duplicate these as screen-specific keys unless the wording must differ:

`save`, `cancel`, `delete`, `edit`, `close`, `confirm`, `back`, `next`, `submit`, `create`, `update`, `search`, `filter`, `export`, `import`, `loading`, `loadingPortal`, `error`, `noData`, `viewAll`, `actions`, `status`, `name`, `email`, `role`, `date`, `amount`, `type`, `description`, `department`, `profile`, `logout`, `notifications`, `account`, `copyright`, `privacyPolicy`, `termsOfService`, `contact`, `documentation`, `required`, `optional`, `yes`, `no`, `active`, `inactive`, `pending`, `approved`, `rejected`, `draft`, `completed`, `enrolled`, `open`, `closed`, `new`, `all`

## Naming

```js
// ✅ nested by screen then section
staff: {
  rankings: {
    title: "Rankings",
    empty: "No ranking data available",
    table: { institution: "Institution", score: "Score" },
  },
}

// ❌ new top-level dump or duplicated common words
rankingsTitle: "Rankings"
staff: { save: "Save" }  // use t.common.save
```

## Component consumption

```jsx
const { t } = useLanguage();
t.common.save
t.home.hero.tagline
t.auth.login.title
t.student.nav.items.dashboard
t.staff.dashboard.title
```

Existing screens often alias: `const L = t.auth.login;` then `{L.title}`.

## Do not translate

- Brand: `TemplumIS`
- Codes, IDs, emails, URLs, route paths
- Backend/API error codes unless displayed as user copy (then add a mapped message key)
