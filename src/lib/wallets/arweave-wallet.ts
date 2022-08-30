// @ts-ignore
import * as fs from "fs";

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
const { ARWEAVE_WALLET_KEY_FILE, PROJECT_NUMBER } = process.env;

const fromHexString = hexString =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

let key;
const loadKey = async () => {
  let keyRaw: string;
  if (PROJECT_NUMBER) {
    const client = new SecretManagerServiceClient();
    keyRaw = (
      await client.accessSecretVersion({
        name: `projects/${PROJECT_NUMBER}/secrets/arweave-wallet-1/versions/latest`
      })
    )[0].payload.data.toString();
  } else {
    if (ARWEAVE_WALLET_KEY_FILE) {
      keyRaw = fs.readFileSync(ARWEAVE_WALLET_KEY_FILE, "utf-8");
    } else {
      console.error("WALLET_KEY_FILE is not set!");
    }
  }

  key = JSON.parse(keyRaw);
};

export const getWalletKey = async () => {
  if (!key) {
    await loadKey();
  }

  return key;
};

export default getWalletKey;
