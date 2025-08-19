#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/localization/en_US.inc"
OUTDIR="$ROOT/localization"

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/deepl_translate.sh fr_FR [de_DE ...]"
  exit 1
fi

if [[ -z "${DEEPL_AUTH_KEY:-}" ]]; then
  echo "ERROR: Set DEEPL_AUTH_KEY environment variable."
  exit 1
fi

declare -A MAP=(
  [de_DE]=DE [fr_FR]=FR [es_ES]=ES [it_IT]=IT [pt_BR]=PT-BR [ru_RU]=RU
  [ja_JP]=JA [zh_CN]=ZH [zh_TW]=ZH [ko_KR]=KO [nl_NL]=NL [pl_PL]=PL
  [tr_TR]=TR [sv_SE]=SV [da_DK]=DA [fi_FI]=FI [cs_CZ]=CS [el_GR]=EL
  [hu_HU]=HU [ro_RO]=RO [uk_UA]=UK
)

for LOC in "$@"; do
  CODE="${MAP[$LOC]:-}"
  if [[ -z "$CODE" ]]; then
    echo "Skip $LOC (no mapping)"
    continue
  fi
  OUT="$OUTDIR/$LOC.inc"
  echo "<?php" > "$OUT"
  echo "\$labels = array(" >> "$OUT"

  grep -oE "'[a-z0-9_]+'\s*=>\s*'[^']*'" "$SRC" | while read -r LINE; do
    KEY="$(echo "$LINE" | sed -E "s/^'([^']+)'.*$/\1/")"
    VAL="$(echo "$LINE" | sed -E "s/^'[^']+'\s*=>\s*'([^']*)'.*$/\1/")"
    if [[ -z "$VAL" ]]; then
      echo "  '$KEY' => ''," >> "$OUT"
    else
      RESP="$(curl -s https://api.deepl.com/v2/translate \
        -d auth_key="$DEEPL_AUTH_KEY" \
        --data-urlencode text="$VAL" \
        -d source_lang=EN -d target_lang="$CODE")"
      TR="$(echo "$RESP" | sed -E 's/.*"text":"([^"]*)".*/\1/; s/\\n/\n/g; s/\\"/"/g')"
      TR="${TR//\'/\\\'}"
      echo "  '$KEY' => '$TR'," >> "$OUT"
    fi
  done

  echo ");" >> "$OUT"
  echo "Wrote $OUT"
done
