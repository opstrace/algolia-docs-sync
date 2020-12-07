# Algolia-Docs-Sync

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

      - uses: ./ # Uses an action in the root directory
        with:
          algoliaId: 'QTVPN6XDU8'
          algoliaKey: ${{ secrets.ALGOLIA_KEY }}
          algoliaIndex: 'opstrace-test'

```
