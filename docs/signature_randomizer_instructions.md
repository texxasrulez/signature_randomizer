
# Signature Randomizer Plugin - v0.9.6+ Patch Notes and Usage

## Overview
The Signature Randomizer plugin allows you to manage multiple HTML signature variants per identity and randomly insert one into the Roundcube compose editor when composing an email.

This patch fixes:
1. Shuffle button not working correctly.
2. Shuffle icon size matching other toolbar icons.
3. Signature insertion working correctly for multiple compose sessions in one login (AJAX SPA flow).

---

## Installation
1. Extract the `signature_randomizer_shuffle_working_icon_size_patch.zip` into your Roundcube `plugins/signature_randomizer/` directory.
2. Overwrite all existing files when prompted.
3. Clear browser cache or perform a **hard refresh** to load new JS/CSS.

---

## Usage
1. **Enabling**:
   - Go to `Settings → Preferences → Composing Messages → Signature Options`.
   - Check **Enable Signature Randomizer** (under 'Force standard separator in signatures').

2. **Adding Signatures**:
   - Go to `Settings → Identities → (select an identity)`.
   - In the **Signature Randomizer** section:
     - Click **Add** to create a new variant.
     - Enter HTML content in the editor.
     - Adjust **Weight** if desired (higher = more frequent selection).
     - Click **Save** to store the variant.

3. **Shuffling Signatures**:
   - In compose mode, click the **Shuffle** icon in the toolbar.
   - This forces a new random signature immediately.

4. **Importing Signatures**:
   - Click **Import**.
   - Paste valid JSON in the textarea (example provided in placeholder).
   - Click **Import Now**.

5. **Exporting Signatures**:
   - Click **Export**.
   - This will show a modal with your signature variants in JSON format for backup/sharing.

---

## Notes
- Signatures are inserted automatically when composing a new message, replying, or forwarding (if enabled).
- A hard refresh may still be required if browser caching prevents updated scripts from loading.
- Avoid enabling **system-wide "Always attach signature"** in Roundcube to prevent double signatures.

---

## Debugging
- All operations log to the browser dev console with `[SR]` prefix.
- Watch for lines like:
  ```
  [SR] get_variants id=1 count=3
  [SR] insert_variant: v12345abc...
  ```
- If a signature fails to insert, check console logs and Roundcube error logs for PHP errors.

---

## DeepL Localization
1. Navigate to `plugins/signature_randomizer/localization`.
2. Run curl command to translate `en_US.inc` to another language:
   ```bash
   curl -X POST "https://api-free.deepl.com/v2/translate"      -H "Content-Type: application/x-www-form-urlencoded"      -d "auth_key=YOUR_API_KEY"      -d "text=$(< en_US.inc)"      -d "target_lang=DE"      -o de_DE.inc
   ```
3. Replace `YOUR_API_KEY` with your DeepL API key and `DE` with desired language code.
4. Add the new `.inc` file to the `localization/` folder.

---

## Version
**0.9.6+** — Patch applied for shuffle fix, icon sizing, and improved insertion reliability.

