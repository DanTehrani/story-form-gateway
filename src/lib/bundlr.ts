import Bundlr from "@bundlr-network/client";
import { getWalletKey } from "./ethereum-wallet";

const { BUNDLR_NODE, BUNDLR_PROVIDER_URL } = process.env;

if (BUNDLR_NODE) {
  console.log("Using  Bundlr node:", BUNDLR_NODE);
}

let bundlr;
export const getBundlr = async () => {
  if (!bundlr) {
    const key = await getWalletKey();

    bundlr = new Bundlr(BUNDLR_NODE, "ethereum", key, {
      providerUrl: BUNDLR_PROVIDER_URL
    });

    const accountBalance = await bundlr.getLoadedBalance();
    console.log("Pay Bundlr node with address:", bundlr.address);
    console.log(
      "Account balance:",
      bundlr.utils.unitConverter(accountBalance, "wei", "ether").toNumber(),
      "ETH"
    );

    bundlr.getBalance;
  }

  return bundlr;
};
