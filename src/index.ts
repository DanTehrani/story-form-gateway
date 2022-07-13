import "dotenv/config";
import * as express from "express";
import arweave, { getWalletKey } from "./lib/arweave";
import * as bookmark from "./lib/bookmark";
import axios from "axios";
import * as cors from "cors";

const { PORT } = process.env;

const app: express.Application = express();

const port: number = parseInt(PORT) || 4000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Story gateway");
});

app.post("/users/:userId/bookmarks", async (req, res) => {
  const { url } = req.body;
  const { userId } = req.params;

  const transactionId = await bookmark.saveUrl(userId, url);

  res.send(transactionId);
});

app.get("/cross-origin", async (req, res) => {
  // @ts-ignore
  const { url } = req.query;

  // @ts-ignore
  const data = await axios.get(decodeURIComponent(url));

  res.send(data.data);
});

app.get("/admin-account", async (req, res) => {
  const key = await getWalletKey();
  const address = await arweave.wallets.jwkToAddress(key);

  res.send(address);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
