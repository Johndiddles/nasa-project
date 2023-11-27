const axios = require("axios");
const launchesDb = require("./launches.mongo");
const planets = require("./planets.mongo");

let DEFAULT_LAUNCH_NUMBER = 100;

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function populateLaunches() {
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("An error occured loading launches from space X");
    throw new Error("Could not load launches from spaceX");
  }

  // console.log({ response: response.data.docs });

  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });
    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers,
    };

    console.log({ launch });

    await saveLaunch(launch);
  }
}
async function loadLaunchesData() {
  const firstLaunch = await launchesDb.findOne({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  if (firstLaunch) {
    console.log("Launch already exist in db");
  } else {
    populateLaunches();
  }
}

async function saveLaunch(launch) {
  try {
    console.log({ launch });
    await launchesDb.findOneAndUpdate(
      {
        flightNumber: launch.flightNumber,
      },
      launch,
      { upsert: true }
    );
  } catch (error) {
    console.error(`Can't save launch: ${error}`);
  }
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({ keplerName: launch.target });

  console.log({ planet, target: launch.target });
  if (!planet) {
    throw new Error("No matching planet found");
  }

  const newFlightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ["Zero To Mastery", "NASA"],
    flightNumber: newFlightNumber,
  });

  await saveLaunch(newLaunch);
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDb.findOne().sort("-flightNumber");

  if (!latestLaunch) {
    return DEFAULT_LAUNCH_NUMBER;
  }

  return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
  const launches = await launchesDb
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
  // console.log({ launches });
  return launches;
}

async function doesLaunchExist(launchId) {
  return await launchesDb.findOne({ flightNumber: launchId });
}

async function deleteLaunch(launchId) {
  const abortedLaunch = await launchesDb.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );

  return abortedLaunch.modifiedCount === 1;
  // launchToDelete.upcoming = false;
  // launchToDelete.success = false;

  // return launchToDelete;
}

module.exports = {
  loadLaunchesData,
  getAllLaunches,
  scheduleNewLaunch,
  // getLaunchById,
  doesLaunchExist,
  deleteLaunch,
};
