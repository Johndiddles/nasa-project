const {
  getAllLaunches,
  scheduleNewLaunch,
  doesLaunchExist,
  // getLaunchById,
  deleteLaunch,
} = require("../../models/launches.model");

const { getPagination } = require("../../services/query");

async function httpGetAllLaunches(req, res) {
  const { limit, skip } = getPagination(req.query);
  return res.status(200).json(await getAllLaunches(skip, limit));
}

async function httpAddNewLaunch(req, res) {
  const launch = req.body;
  console.log({ launch });
  if (
    !launch.launchDate ||
    !launch.mission ||
    !launch.rocket ||
    !launch.target
  ) {
    return res.status(400).json({ error: "Missing launch information ..." });
  }

  launch.launchDate = new Date(launch.launchDate);

  if (isNaN(launch.launchDate)) {
    return res.status(400).json({ error: "Invalid launch date..." });
  }

  try {
    await scheduleNewLaunch(launch);
    return res.status(201).json(launch);
  } catch (error) {
    res.status(500).json({ error });
  }
}

async function httpAbortLaunch(req, res) {
  const { launchId } = req.params;
  console.log({ launchId });

  if (await doesLaunchExist(launchId)) {
    const deletedLaunch = await deleteLaunch(launchId);

    if (deletedLaunch) {
      res.status(200).json({ ok: true });
    } else {
      res.status(400).json({ error: "Launch not aborted" });
    }
  } else {
    res.status(404).json({ error: "Launch does not exist." });
  }
}

module.exports = { httpGetAllLaunches, httpAddNewLaunch, httpAbortLaunch };
