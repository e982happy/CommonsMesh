# Transport adapter

This directory is intentionally separate from the protocol engine.

The current scaffold includes a placeholder adapter so the repository can be read, tested, and extended without forcing a specific libp2p version into the core logic.

When you wire this to a real app package, use the current js-libp2p documentation for ESM configuration and DHT/identify setup.
