import "dotenv/config";
import express from "express";
import arweave, { getWalletKey } from "./lib/arweave";
import * as form from "./lib/form";
import axios from "axios";
import cors from "cors";
import { CreateFormRequest, SubmitAnswerRequest } from "./types";

const { PORT } = process.env;

const app: express.Application = express();

const port: number = parseInt(PORT) || 4000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Story gateway");
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

app.post("/forms", async (req: CreateFormRequest, res, next) => {
  try {
    const txId = await form.uploadForm(req.body);
    res.send(txId);
  } catch (err) {
    next(err);
  }
});

app.post("/answers", async (req: SubmitAnswerRequest, res, next) => {
  try {
    const txId = await form.uploadAnswer(req.body);
    res.send(txId);
  } catch (err) {
    next(err);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
