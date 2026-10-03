const request = require("supertest");
const { createApp } = require("../src/app");

describe("quotes-api", () => {
  let app;
  beforeEach(() => {
    app = createApp();
  });

  test("GET /health -> 200 ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  test("GET /api/quotes -> 200 list", async () => {
    const res = await request(app).get("/api/quotes");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("GET /api/quotes/random -> 200 one quote", async () => {
    const res = await request(app).get("/api/quotes/random");
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
  });

  test("GET /api/quotes/:id -> 200 then 404", async () => {
    const ok = await request(app).get("/api/quotes/1");
    expect(ok.status).toBe(200);
    const missing = await request(app).get("/api/quotes/999");
    expect(missing.status).toBe(404);
  });
});
