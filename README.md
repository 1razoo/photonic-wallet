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

Photonic Wallet is built upon the Atomicals protocol, a powerful and flexible protocol for minting, transferring and updating tokens. The protocol has been adapted to Radiant to capitalize on Radiant's scripting capabilities:
- **Layer One Security:** Token transfers and updates are secured by miners on layer one, eliminating the need for layer two token indexing.
- **SPV Compatibility:** Layer one validation allows for simplified payment verification (SPV) of tokens, ensuring scalability for widespread adoption while keeping transaction fees and network operation costs low.
- **Efficient Contract Structure:** Token ownership and data modifications are separated into distinct contracts. This allows for streamlined client-side tracking of token updates, without needing to process all transfers. This contract composition pattern also allows for custom contracts to extend the protocol, while maintaining compatibility with wallets.
- **Cross-Chain Interoperability:** Atomicals on Radiant lays the foundation for cross-chain interoperability, with Atomicals on BTC and other blockchain networks.
- **P2P Compatibility:** Layer one contracts and SPV enables the potential adoption of a fully peer-to-peer architecture, a pathway for further decentralization and network efficiency.

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
