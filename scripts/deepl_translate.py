#!/usr/bin/env python3
import os, sys, re, json, urllib.request, urllib.parse

PLUGIN_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOC_DIR = os.path.join(PLUGIN_ROOT, "localization")
SRC_FILE = os.path.join(LOC_DIR, "en_US.inc")

ROUND_TO_DEEPL = {
    "de_DE":"DE","fr_FR":"FR","es_ES":"ES","it_IT":"IT","pt_BR":"PT-BR","ru_RU":"RU",
    "ja_JP":"JA","zh_CN":"ZH","zh_TW":"ZH","ko_KR":"KO","nl_NL":"NL","pl_PL":"PL",
    "tr_TR":"TR","sv_SE":"SV","da_DK":"DA","fi_FI":"FI","cs_CZ":"CS","el_GR":"EL",
    "hu_HU":"HU","ro_RO":"RO","uk_UA":"UK"
}
ALL_TARGETS = list(ROUND_TO_DEEPL.keys())

def parse_php_labels(text):
    return re.findall(r"'([a-z0-9_]+)'\s*=>\s*'([^']*)'", text, flags=re.I)

def deepl_translate(text, target_lang, auth_key, free=False):
    endpoint = "https://api-free.deepl.com/v2/translate" if free else "https://api.deepl.com/v2/translate"
    data = {"auth_key": auth_key, "text": text, "source_lang": "EN", "target_lang": target_lang}
    body = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(endpoint, data=body, headers={"Content-Type":"application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        j = json.loads(resp.read().decode("utf-8"))
        return j["translations"][0]["text"]

def write_locale_file(locale, kvs):
    path = os.path.join(LOC_DIR, f"{locale}.inc")
    with open(path, "w", encoding="utf-8") as f:
        f.write("<?php\n$labels = array(\n")
        for k, v in kvs:
            v = v.replace("'", "\\'")
            f.write(f"  '{k}' => '{v}',\n")
        f.write(");\n")
    return path

def main():
    args = sys.argv[1:]
    free = "--free" in args
    dry = "--dry" in args
    if free: args.remove("--free")
    if dry: args.remove("--dry")
    if "--all" in args:
        targets = ALL_TARGETS
        args.remove("--all")
    else:
        targets = [a for a in args if not a.startswith("-")]

    if not targets:
        print("Usage: deepl_translate.py fr_FR de_DE ... [--free] [--dry] [--all]")
        return

    auth_key = os.environ.get("DEEPL_AUTH_KEY") or os.environ.get("DEEPL_API_KEY")
    if not auth_key:
        print("ERROR: Set DEEPL_AUTH_KEY environment variable.")
        sys.exit(1)

    with open(SRC_FILE, "r", encoding="utf-8") as f:
        src = f.read()
    pairs = parse_php_labels(src)

    for locale in targets:
        code = ROUND_TO_DEEPL.get(locale)
        if not code:
            print(f"Skip {locale}: no mapping")
            continue
        out = []
        print(f"Translating -> {locale} ({code})")
        for k, v in pairs:
            if not v:
                out.append((k, v))
            else:
                tr = v if dry else deepl_translate(v, code, auth_key, free)
                out.append((k, tr))
        if dry:
            print(f"DRY-RUN for {locale}")
        else:
            p = write_locale_file(locale, out)
            print(f"Wrote {p}")

if __name__ == "__main__":
    main()
