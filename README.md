<p align="center">
  <img src="./splash.png">
</p>

## Introduction

Photonic Wallet is a non-custodial wallet built for minting and transferring tokens on Radiant, implementing the REP-21 token standard. The code runs completely client side and only requires a connection to an ElectrumX server.

This is alpha software in active development. If you would like to test it, please be cautious and report any bugs.

## Features

- Mint and transfer non-fungible tokens
- Container and author tokens
- IPFS file uploading
- On-chain image thumbnail generation

## Roadmap

- Fungible tokens
- Mutable tokens
- Transfer history
- CLI for batch minting

## Getting Started

### Install

```bash
pnpm install
```

### Run development server

```bash
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

## License

MIT. See [LICENSE](LICENSE).
