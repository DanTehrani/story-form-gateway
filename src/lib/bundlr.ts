import Bundlr from "@bundlr-network/client";
import getArweaveWalletKey from "./wallets/arweave-wallet";
import ethereumWalletPrivKey from "./wallets/ethereum-wallet";

const { BUNDLR_NODE, PAYMENT_CURRENCY } = process.env;

if (!PAYMENT_CURRENCY) {
  console.error("Payment currency is not set!");
}

let bundlr;
export const getBundlr = async () => {
  let key: string | Uint8Array;
  if (!bundlr) {
    switch (PAYMENT_CURRENCY) {
      case "ethereum":
        key = ethereumWalletPrivKey;
      case "arweave":
        key = await getArweaveWalletKey();
    }

    bundlr = new Bundlr(BUNDLR_NODE, PAYMENT_CURRENCY, key);
  }

  return bundlr;
};
