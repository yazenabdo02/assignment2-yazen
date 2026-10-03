const express = require("express");
const pkg = require("../package.json");
const { listQuotes, getQuote, randomQuote } = require("./quotes");

function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/version", (req, res) => {
    res.json({ name: pkg.name, version: pkg.version });
  });

  app.get("/api/quotes", (req, res) => {
    res.json(listQuotes());
  });

  app.get("/api/quotes/random", (req, res) => {
    res.json(randomQuote());
  });

  app.get("/api/quotes/:id", (req, res) => {
    const quote = getQuote(req.params.id);
    if (!quote) return res.status(404).json({ error: "quote not found" });
    res.json(quote);
  });

  return app;
}

module.exports = { createApp };
