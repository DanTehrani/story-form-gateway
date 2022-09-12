import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
const { PROJECT_NUMBER, ETHEREUM_WALLET_PRIVATE_KEY } = process.env;

const fromHexString = (hexString: string): Uint8Array =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

let key;
const loadKey = async () => {
  if (PROJECT_NUMBER) {
    // Assume that if PROJECT_NUMBER is set, we're running on GCP
    const client = new SecretManagerServiceClient();
    key = (
      await client.accessSecretVersion({
        name: `projects/${PROJECT_NUMBER}/secrets/ethereum-wallet-1/versions/latest`
      })
    )[0].payload.data.toString();
  } else {
    key =
      ETHEREUM_WALLET_PRIVATE_KEY &&
      fromHexString(ETHEREUM_WALLET_PRIVATE_KEY.replace("0x", ""));
  }
};

export const getWalletKey = async () => {
  if (!key) {
    await loadKey();
  }

  return key;
};

export default getWalletKey;
