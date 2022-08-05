import { ethers } from "ethers";

export const provider = ethers.getDefaultProvider(
  "http://host.docker.internal:8545"
);

export const wallet = new ethers.Wallet(
  process.env.ETH_WALLET_PRIVATE_KEY,
  provider
);
