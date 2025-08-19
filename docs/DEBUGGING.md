
# Debug & Compatibility

- Browser console shows `[SR]` entries for every action.
- Server log (if `$config['sr_debug']=true`): `logs/signature_randomizer`.
- If you see unrelated warnings like `Undefined array key "size"` in compose or `utf8_decode()` deprecations, those are from other plugins modifying compose/attachments. Test by disabling them one-by-one.
