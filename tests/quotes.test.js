const { listQuotes, getQuote, randomQuote } = require("../src/quotes");

describe("quotes", () => {
  test("listQuotes returns all quotes", () => {
    const all = listQuotes();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
  });

  test("getQuote returns a match or undefined", () => {
    expect(getQuote(1)).toMatchObject({ id: 1 });
    expect(getQuote(999)).toBeUndefined();
  });

  test("randomQuote returns one of the quotes", () => {
    const q = randomQuote();
    expect(listQuotes().map((x) => x.id)).toContain(q.id);
  });
});
