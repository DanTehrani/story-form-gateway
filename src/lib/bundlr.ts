import Bundlr from "@bundlr-network/client";
import getArweaveWalletKey from "./wallets/arweave-wallet";
import ethereumWalletPrivKey from "./wallets/ethereum-wallet";

const { BUNDLR_NODE, BUNDLR_PROVIDER_URL, PAYMENT_CURRENCY } = process.env;

if (!PAYMENT_CURRENCY) {
  console.error("Payment currency is not set!");
}

if (BUNDLR_NODE) {
  console.log("Using  Bundlr node:", BUNDLR_NODE);
  console.log("Bundlr payment currency:", PAYMENT_CURRENCY);
}

let bundlr;
export const getBundlr = async () => {
  let key: string | Uint8Array;
  if (!bundlr) {
    switch (PAYMENT_CURRENCY) {
      case "ethereum":
        key = ethereumWalletPrivKey;
        break;
      case "arweave":
        key = await getArweaveWalletKey();
        break;
      default:
        console.error("Payment currency is not set!");
    }

    bundlr = new Bundlr(BUNDLR_NODE, PAYMENT_CURRENCY, key, {
      providerUrl: BUNDLR_PROVIDER_URL
    });
  }

  return bundlr;
};
