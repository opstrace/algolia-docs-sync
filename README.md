# Algolia-Docs-Sync

![Semantic Release](https://github.com/opstrace/algolia-docs-sync/workflows/Semantic%20Release/badge.svg)

## Inputs

### `algoliaId`

**Required** Algolia Application ID

### `algoliaKey`

**Required** Algolia Admin Key (not readonly)

### `algoliaIndex`

**Required** Algolia Index to write to

## Example usage

```
name: Sync Algolia

on:
  push:
    branches:
      - 'main'

jobs:
  algolia:
    runs-on: ubuntu-latest
    name: Algolia Sync
    steps:
      - uses: actions/checkout@v2

      - uses: opstrace/algolia-docs-sync@v1.0.2
        with:
          algoliaId: 'QTVPN6XDU8'
          algoliaKey: ${{ secrets.ALGOLIA_KEY }}
          algoliaIndex: 'opstrace-test'

```
