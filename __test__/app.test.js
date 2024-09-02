const request = require("supertest");
const app = require("../app"); // Adjust the path to where your app is located

describe("App Test Suite", () => {
  it("should respond with a 200 status code and render the serverView for GET /", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/html/);
    // Further checks for the response body can be added if necessary
  });

  it("should return 404 for an unknown route", async () => {
    const response = await request(app).get("/unknown-route");
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(
      "Can't find /unknown-route on this server"
    );
  });
});
