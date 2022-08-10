import { ethers } from "ethers";

export const provider = ethers.getDefaultProvider(
  process.env.NODE_ENV === "development"
    ? "http://host.docker.internal:8545"
    : {
        name: "goerli",
        chainId: 5
      },
  {
    alchemy: process.env.ALCHEMY_API_KEY
  }
);

export const wallet = new ethers.Wallet(
  process.env.ETH_WALLET_PRIVATE_KEY,
  provider
);
