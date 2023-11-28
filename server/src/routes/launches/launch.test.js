const request = require("supertest");
const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");
const { loadPlanetsData } = require("../../models/planets.model");

describe("LAUNCHES API", () => {
  beforeAll(async () => {
    await mongoConnect();
    await loadPlanetsData();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });
  describe("Test GET /v1/launches", () => {
    test("It should return with 200 success", async () => {
      const response = await request(app)
        .get("/v1/launches")
        .expect(200)
        .expect("Content-Type", /json/);
    });
  });

  describe("Test POST /launch", () => {
    const completeLaunchData = {
      mission: "new mission",
      rocket: "NCC 17701-D",
      target: "Kepler-442 b",
      launchDate: "January 4, 2025",
    };

    const launchDataWithoutDate = {
      mission: "new mission",
      rocket: "NCC 17701-D",
      target: "Kepler-442 b",
    };

    const launchWithInvalidDate = {
      mission: "new mission",
      rocket: "NCC 17701-D",
      target: "Kepler-442 b",
      launchDate: "Hello World",
    };

    test("It should respond with 200 success", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completeLaunchData)
        .expect("Content-Type", /json/)
        .expect(201);

      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();

      expect(requestDate).toBe(responseDate);

      expect(response.body).toMatchObject(launchDataWithoutDate);
    });

    test("It should catch missing required properties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithoutDate)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Missing launch information ...",
      });
    });

    test("It should catch invalid date", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchWithInvalidDate)
        .expect(400)
        .expect("Content-Type", /json/);

      expect(response.body).toStrictEqual({
        error: "Invalid launch date...",
      });
    });
  });
});
