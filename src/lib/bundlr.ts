import Bundlr from "@bundlr-network/client";
import { getWalletKey } from "./arweave";

const { BUNDLR_NODE, PAYMENT_CURRENCY } = process.env;

if (!PAYMENT_CURRENCY) {
  console.error("Payment currency is not set!");
}

let bundlr;
export const getBundlr = async () => {
  if (!bundlr) {
    const key = await getWalletKey();
    bundlr = new Bundlr(BUNDLR_NODE, PAYMENT_CURRENCY, key);
  }

  return bundlr;
};
