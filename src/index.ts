import "dotenv/config";
import express from "express";
import * as form from "./lib/form";
import cors from "cors";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { CreateFormRequest, SubmitAnswerRequest } from "./types";

const { PORT } = process.env;

const app: express.Application = express();

Sentry.init({
  dsn: "https://1b3b81a1c60d4561ab1e968719db5f0a@o1348995.ingest.sentry.io/6758756",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app })
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0
});

const port: number = parseInt(PORT) || 4000;

app.use(express.json());
app.use(cors());

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

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

app.use(Sentry.Handlers.errorHandler());

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
