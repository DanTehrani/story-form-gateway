const fromHexString = (hexString: string): Uint8Array =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

const { ETHEREUM_WALLET_PRIVATE_KEY } = process.env;
const key =
  ETHEREUM_WALLET_PRIVATE_KEY &&
  fromHexString(ETHEREUM_WALLET_PRIVATE_KEY.replace("0x", ""));

export default key;
