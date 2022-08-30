// @ts-ignore
import * as Arweave from "arweave";
import * as fs from "fs";

// Used in story-gateway
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
const { WALLET_KEY_FILE, PROJECT_NUMBER } = process.env;

const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https"
});

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
    if (WALLET_KEY_FILE) {
      keyRaw = fs.readFileSync(WALLET_KEY_FILE, "utf-8");
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

export default arweave;
