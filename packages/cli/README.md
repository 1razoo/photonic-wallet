## Introduction

Photonic Factory is a CLI for batch minting tokens on the Radiant Blockchain.

## Getting Started

### Install

```bash
pnpm install
```

### Run development CLI

```bash
cd packages/cli
pnpm dev
```

### Build

```bash
pnpm build
```

Build will be in `packages/cli/dist/cli.js`.

### Installing

The `photonic-factory` script can be installed.

```bash
pnpm install
```

## Minting Tokens

Tokens are minted in two steps, with a "commit" and a "reveal" transaction. The commit will prepare an output containing the hash of the token payload. The reveal transaction will reveal the payload and token contents on the blockchain.

### Bundle Files

Tokens are minted from `bundle.json` files. Create a new empty directory and a `bundle.json` file. For example:

```json
{
  "commit": {
    "batchSize": 3
  },
  "reveal": {
    "method": "direct",
    "batchSize": 3
  },
  "template": {
    "reveal": {
      "address": "mpkzbPL4JLYFuuS9jZ1LbLBHqLzkQoScdW"
    },
    "containerRefs": [
      "e6c9043547811099b2d87f0de332800ba92044fe6c8ad0a8e72b2b29bc7ea0a200000000"
    ],
    "authorRefs": [
      "ec259f6571f842c4ad3b33ac48bbbb6683189606ebba5d34c1b8942819067cd300000000"
    ],
    "author": "Bob",
    "license": "CC",
    "desc": "A legendary token"
  },
  "tokens": [
    {
      "name": "Test token one",
      "files": {
        "main.jpg": "one.jpg"
      },
      "attrs": {
        "rarity": 1
      }
    },
    {
      "name": "Test token two",
      "files": {
        "main.jpg": "two.jpg"
      },
      "attrs": {
        "rarity": 2
      }
    },
    {
      "name": "Test token three",
      "files": {
        "main.jpg": {
          "src": "https://example.com/remote-file.jpg",
          "hash": true,
          "stamp": true
        }
      },
      "attrs": {
        "rarity": 3
      }
    }
  ]
}
```

### Preparing

The bundle must be prepared with the `bundle:prepare` command. This validates the file, applies any template object to the tokens and generates HashStamp images if required.

The above bundle file contains a template object that will apply fields to all objects in the `tokens` array. If a field is used in both the template and token objects the token field will be used.

There are two ways of including files in the payload.

#### URL

This can be an HTTP or IPFS URL. This URL will be written to the payload

```json
"files": {
  "main.jpg": {
    "src": "https://example.com/remote-file.jpg",
    "hash": true,
    "stamp": true
  }
}
```

If `hash` is true, the prepare command will download the file and a hash included in the payload. If `stamp` is true a HashStamp image will be generated.

The resulting prepared file and images will be stored in the `cache` subdirectory within the bundle directory.

#### Local file

A file stored on the local filesystem can be added to the payload. The filenames are relative to the bundle directory. No `hash` or `stamp` properties are permitted for these files.

```json
"files": {
  "main.jpg": "one.jpg"
}
```

### Committing

The bundle is committed to the blockchain with the `bundle:commit` command. Transactions can be optionally broadcast or done later by executing the same command.

The `commit.batchSize` property determines how many tokens will be included in each commit transaction. This should be selected appropriately so transactions are not too large. So if a bundle includes 1000 tokens and a batch size of 50, 20 transactions containing 50 tokens each will be created.

The commit command creates a `reveal.json` file, allowing the user to further configure how the tokens are to be revealed. This file is generated using the `reveal` object from the bundle file.

### Reveal Method

There are two reveal methods:

- `direct`: Uses `SIGHASH_ALL` and sends tokens directly to an address.
- `psbt`: Used to create partially signed transactions using `SIGHASH_SINGLE|ANYONECANPAY` which can be used by token marketplaces.

Once the `reveal.json` file is ready, the reveal transactions are generated using the `bundle:reveal` command.

For the `direct` method, `reveal.batchSize` may be configured to batch multiple token reveals into each transaction. To reveal each token in a separate transaction set `batchSize` to 1.

### Related Tokens

Related tokens must exist before minting a bundle. Containers and user tokens need to be mited with Photonic Wallet, then the refs added to the `containerRefs` and `authorRefs` arrays.

### Further help

Run the `help` command to see available commands and arguments.

## License

MIT. See [LICENSE](LICENSE).
