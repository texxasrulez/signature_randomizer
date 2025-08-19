
# Install / Update

1. Copy to `roundcube/plugins/signature_randomizer/`
2. In `config/config.inc.php` ensure:
   ```php
   $config['plugins'][] = 'signature_randomizer';
   ```
3. Optionally enable logs: copy `config.inc.php.dist` → `config.inc.php` and keep `$config['sr_debug']=true;`
4. Hard refresh your browser

Where to find things:
- Toggle: **Preferences → Composing Messages → Signature Options** (bottom) → **Enable Signature Randomizer**
- Editor: **Settings → Identities** → “Signature Randomizer” block
