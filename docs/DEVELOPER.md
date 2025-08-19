# Developer Notes

## Data Model
User prefs key: `sr_variants`
```json
{
  "IDENTITY_ID": [
    {"vid":"v123","name":"Formal","html":"...","include":true,"weight":1.5,"created":"...","updated":"..."}
  ]
}
```

Prefs: `sr_enabled` (bool).

## Actions
- `plugin.sr_get_variants` (GET _id)
- `plugin.sr_save_variant` (POST _id, _variant JSON)
- `plugin.sr_delete_variant` (POST _id, _vid)
- `plugin.sr_duplicate_variant` (POST _id, _vid)
- `plugin.sr_reorder_variants` (POST _id, _order JSON [vid,...])
- `plugin.sr_preview_variant` (GET _id, _vid)
- `plugin.sr_export` (GET _id)
- `plugin.sr_import` (POST _id, _json JSON)

## Hooks
- `identity_form` — injects manager under TinyMCE
- `render_page` (compose) — sets env, adds toolbar button

## JS Entry
- `js/sr_identities.js`
- `js/sr_compose.js`
