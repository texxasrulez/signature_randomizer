
# Using Signature Randomizer (v0.9.5)

## Enable
Preferences → Composing Messages → Signature Options → **Enable Signature Randomizer** (directly under *Force standard separator in signatures*).

## Manage Variants
Settings → Identities → **Signature Randomizer**:
- **Add** → seed from your current identity signature.
- Set **Name**, **Weight**, tick **Include**.
- Edit the **Signature HTML** in the full-width editor under each row.
- **Save / Preview / Duplicate / Delete / ↑ / ↓**.

## Export / Import
- **Export** opens a modal containing a JSON array. Copy/save it.
- **Import** opens a modal. Paste a JSON array and click **Import now**.
Expected JSON format:
```json
[
  {"name":"Formal","include":true,"weight":2,"html":"<p>Regards,<br>Gene</p>"},
  {"name":"Casual","include":true,"weight":1,"html":"<p>– G</p>"}
]
```
`vid` is optional; it will be generated.

## Compose
When enabled, a random variant is inserted on open and when you change identity. Use toolbar **Shuffle signature** to re-roll.

## Avoid Double Signatures
If Roundcube’s **Automatically add signature** is set to always insert, you can end up with two signatures. Either disable that or uncheck this plugin’s toggle.
