# Roundcube Signature Randomizer

[![Packagist Downloads](https://img.shields.io/packagist/dt/texxasrulez/signature_randomizer?style=plastic&logo=packagist&logoColor=white&label=Downloads&labelColor=blue&color=gold)](https://packagist.org/packages/texxasrulez/signature_randomizer)
[![Packagist Version](https://img.shields.io/packagist/v/texxasrulez/signature_randomizer?style=plastic&logo=packagist&logoColor=white&label=Version&labelColor=blue&color=limegreen)](https://packagist.org/packages/texxasrulez/signature_randomizer)
[![Github License](https://img.shields.io/github/license/texxasrulez/signature_randomizer?style=plastic&logo=github&label=License&labelColor=blue&color=coral)](https://github.com/texxasrulez/signature_randomizer/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/texxasrulez/signature_randomizer?style=plastic&logo=github&label=Stars&labelColor=blue&color=deepskyblue)](https://github.com/texxasrulez/signature_randomizer/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/texxasrulez/signature_randomizer?style=plastic&logo=github&label=Issues&labelColor=blue&color=aqua)](https://github.com/texxasrulez/signature_randomizer/issues)
[![GitHub Contributors](https://img.shields.io/github/contributors/texxasrulez/signature_randomizer?style=plastic&logo=github&logoColor=white&label=Contributors&labelColor=blue&color=orchid)](https://github.com/texxasrulez/signature_randomizer/graphs/contributors)
[![GitHub Forks](https://img.shields.io/github/forks/texxasrulez/signature_randomizer?style=plastic&logo=github&logoColor=white&label=Forks&labelColor=blue&color=darkorange)](https://github.com/texxasrulez/signature_randomizer/forks)
[![Donate Paypal](https://img.shields.io/badge/Paypal-Money_Please!-blue.svg?style=plastic&labelColor=blue&color=forestgreen&logo=paypal)](https://www.paypal.me/texxasrulez)

**Signature Randomizer** is a Roundcube plugin that allows each identity to have multiple signatures.  
Each signature can be weighted, randomized, and managed through a built-in UI.

- 🎲 Randomly insert a signature when composing an email.
- ⚖️ Assign weights to control how often each variant is chosen.
- 🖊️ Manage variants per identity in Roundcube settings.
- 📤 Import / export signature sets as JSON.
- 🔀 Shuffle or preview directly from the toolbar.

---

## Features

- **Weighted signatures:** Increase or decrease the probability of each variant being chosen.
- **Per-identity management:** Each Roundcube identity can have its own set of variants.
- **UI integration:** Manages signatures directly in the Roundcube *Identities* settings.
- **AJAX actions:** Add, save, duplicate, delete, reorder variants seamlessly.
- **Composing integration:** Works in both compose and reply modes.
- **Import/Export:** JSON-based backup and restore of signatures.

---

## Installation

### 1. Via Composer (recommended)

From your Roundcube root directory:

```bash
composer require texxasrulez/signature_randomizer
```

This installs the plugin under `plugins/signature_randomizer/`.

### 2. Manual installation

1. Download the plugin archive.  
2. Extract it into the Roundcube `plugins/` directory:

```
roundcubemail/
└── plugins/
    └── signature_randomizer/
        ├── signature_randomizer.php
        ├── config.inc.php.dist
        ├── localization/
        ├── skins/
        └── ...
```

---

## Configuration

1. Copy the sample config to make it active:

```bash
cp plugins/signature_randomizer/config.inc.php.dist plugins/signature_randomizer/config.inc.php
```

2. Edit `config.inc.php` to adjust plugin options as needed.

---

## Enabling the Plugin

Edit `config/config.inc.php` and add `signature_randomizer` to the plugins array:

```php
$config['plugins'][] = 'signature_randomizer';
```

Clear Roundcube cache if necessary:

```bash
bin/cleancache.sh
```

---

## Usage

- Go to **Settings → Identities → Signature Randomizer** section.
- Add multiple signature variants for each identity.
- Assign weights (higher weight = higher probability).
- Use the toolbar buttons for:
  - Shuffle / Preview signatures
  - Import or Export JSON of all variants
- When composing an email, a random signature (based on weight) will be inserted automatically.

---

## Requirements

- PHP >= 7.4
- Roundcube Mail >= 1.4

---

## Uninstallation

If installed via Composer:

```bash
composer remove texxasrulez/signature_randomizer
```

If installed manually, remove the `plugins/signature_randomizer/` directory.

---

## License

GPL 3.0

---

## Credits

- Original Author(s): Gene Hawkins AKA texxasrulez
- Contributions welcome!
