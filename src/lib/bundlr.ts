import Bundlr from "@bundlr-network/client";
import { getWalletKey } from "./arweave";

const { NODE_ENV } = process.env;

const PAYMENT_CURRENCY = process.env.PAYMENT_CURRENCY;

if (!PAYMENT_CURRENCY) {
  console.error("Payment currency is not set!");
}

const BUNDLR_NODE =
  NODE_ENV === "development"
    ? "https://devnet.bundlr.network"
    : "http://node1.bundlr.network";

let bundlr;
export const getBundlr = async () => {
  if (!bundlr) {
    const key = await getWalletKey();
    bundlr = new Bundlr(BUNDLR_NODE, PAYMENT_CURRENCY, key);
  }

  return bundlr;
};
