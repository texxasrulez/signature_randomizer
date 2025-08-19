
# DeepL Translation — Complete Guide
Run commands from the plugin root: `roundcube/plugins/signature_randomizer`.
Set your key:
- Linux/macOS: `export DEEPL_AUTH_KEY='your-key'`
- Windows PowerShell: `setx DEEPL_AUTH_KEY "your-key"; $env:DEEPL_AUTH_KEY="your-key"`

Quick test:
```bash
curl https://api.deepl.com/v2/translate   -d auth_key="$DEEPL_AUTH_KEY"   --data-urlencode text="Signature Randomizer"   -d source_lang=EN -d target_lang=FR
```

Batch translate en_US.inc → multiple locales (recommended):
```bash
python3 scripts/deepl_translate.py --all
# or
python3 scripts/deepl_translate.py fr_FR de_DE es_ES it_IT pt_BR ru_RU
```

Curl-only batch (Unix shells):
```bash
bash scripts/deepl_translate.sh fr_FR de_DE
```
