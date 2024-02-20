<p align="center">
  <img src="./splash.png">
</p>

## Introduction

Photonic Wallet is a non-custodial wallet for minting and transferring Atomical tokens on Radiant. The code runs completely client side and only requires a connection to an ElectrumX server.

This is alpha software in active development. If you would like to test it, please be cautious and report any bugs.

## Features

- Mint and transfer digital objects (non-fungible tokens)
- Container and author tokens
- IPFS file uploading
- On-chain image thumbnail generation
- CLI for batch minting

## Built on Atomicals

Photonic Wallet follows the Atomicals protocol for encoding token data and operations. The protocol is adapted to Radiant to take advantage of Radiant's scripting capabilities:
- `OP_PUSHINPUTREFSINGLETON` used for tracking digital object transfers
- Verification of related tokens in script using `OP_REQUIREINPUTREF`
- Mutable token contract split into a separate UTXO, implementing the modify (`mod`) and seal (`sl`) operations, only usable by the token holder

## Roadmap

- ARC20 fungible tokens
- Modify and seal operations
- Transfer history
- SPV

## Getting Started

### Install

```bash
pnpm install
```

### Run development server

```bash
cd packages/app
pnpm turbo dev
```

### Build for web

```bash
pnpm turbo build
```

Build will be in `packages/app/dist`. This can be served as a static site.

### Build for Windows, Linux or macOS

```bash
pnpm -F app tauri build
```

Executables will be in `pacakges/app/src-tauri/target/release`.

Add `-d` for a debug build.

## Photonic Factory CLI

The CLI is used for batch minting tokens. See `packages/cli/README.md` for more information.

## License

MIT. See [LICENSE](LICENSE).
