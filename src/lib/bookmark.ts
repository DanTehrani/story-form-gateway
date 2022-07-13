import arweave, { getWalletKey } from "./arweave";

export const saveUrl = async (userId, url) => {
  const key = await getWalletKey();
  const transaction = await arweave.createTransaction(
    {
      data: JSON.stringify(
        {
          url
        },
        null,
        0
      )
    },
    key
  );

  transaction.addTag("Content-Type", "text/plain");
  transaction.addTag("user", userId);

  await arweave.transactions.sign(transaction, key);
  await arweave.transactions.post(transaction);

  return transaction.id;
};

export const getBookmarks = async arweave => {};
