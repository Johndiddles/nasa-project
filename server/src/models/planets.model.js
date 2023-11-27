const { parse } = require("csv-parse");
const path = require("path");
const fs = require("fs");

const planets = require("./planets.mongo");

const habitablePlanets = [];

function isHabitablePlanet(planet) {
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
}

function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "..", "..", "data", "kepler_data.csv")
    )
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", async (data) => {
        if (isHabitablePlanet(data)) {
          // TODO: Create planet in DB
          await savePlanet(data);
        }
      })
      .on("error", (err) => {
        console.log(err);
        reject(err);
      })
      .on("end", async () => {
        // console.log(
        //   habitablePlanets.map((planet) => {
        //     return planet["keplerName"];
        //   })
        // );
        const planetsCount = (await getAllPlanets()).length;
        // console.log(`${planetsCount} habitable planets found!`);
        resolve();
      });
  });
}

async function getAllPlanets() {
  return await planets.find({});
}

async function savePlanet(planet) {
  try {
    await planets.updateOne(
      {
        keplerName: planet.keplerName,
      },
      { keplerName: planet.keplerName },
      {
        upsert: true,
      }
    );
  } catch (error) {
    console.error(`Can't save planet: ${error}`);
  }
}

module.exports = {
  loadPlanetsData,
  planets: habitablePlanets,
  getAllPlanets,
};