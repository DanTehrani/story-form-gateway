import "dotenv/config";
import express from "express";
import * as form from "./lib/form";
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

/**
 * Create a form
 */
app.post("/forms", async (req: CreateFormRequest, res, next) => {
  try {
    const txId = await form.uploadForm(req.body);
    res.send(txId);
  } catch (err) {
    next(err);
  }
});

/**
 * Submit an answer
 */
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
