const QUOTES = [
  { id: 1, text: "Automate the boring stuff.", author: "DevOps" },
  { id: 2, text: "Ship small, ship often.", author: "CD" },
  { id: 3, text: "You build it, you run it.", author: "Werner Vogels" }
];

function listQuotes() {
  return QUOTES;
}

function getQuote(id) {
  return QUOTES.find((q) => q.id === Number(id));
}

function randomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

module.exports = { listQuotes, getQuote, randomQuote };
