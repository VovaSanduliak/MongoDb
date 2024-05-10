const fs = require("fs");
const express = require("express");
const router = express.Router();
const UserModel = require("./models/User");
const ExperienceModel = require("./models/Experience");

//#region functions
const getAllUsers = async () => {
  const users = await UserModel.find();
  return users;
};

const getUsersFromFile = () => {
  const rawData = fs.readFileSync("developers.json");
  const usersData = JSON.parse(rawData);
  return usersData;
};

const createExperienceCollection = async () => {
  const users = await getAllUsers();
  const result = users.map((user) => {
    let skillLevel;
    if (user.experience < 2) {
      skillLevel = "junior";
    } else if (user.experience >= 2 && user.experience <= 4) {
      skillLevel = "middle";
    } else {
      skillLevel = "senior";
    }
    return {
      developerId: user._id,
      skillLevel: skillLevel,
    };
  });

  return result;
};
//#endregion

router.get("/users", (_, res) => {
  const users = getUsersFromFile();
  res.send(users);
});

router.post("/create", async (req, res) => {
  try {
    const users = await getUsersFromFile();

    const count = await UserModel.countDocuments();
    if (count > 0) {
      res.status(304);
    }

    const result = await UserModel.insertMany(users);
    res.send(result);
  } catch (err) {
    console.error(err);
  }
});

router.post("/create-experience-collection", async (req, res) => {
  try {
    const experienceCollection = await createExperienceCollection();
    const result = await ExperienceModel.insertMany(experienceCollection);
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
  }
});

router.get("/match", async (req, res) => {
  try {
    const usersWithExperience = await UserModel.aggregate([
      { $match: { experience: { $gte: 5 } } },
    ]);

    res.send(usersWithExperience);
  } catch (err) {
    console.error(err);
  }
});

router.get("/group", async (req, res) => {
  try {
    const averageAge = await UserModel.aggregate([
      {
        $group: {
          _id: null,
          averageAge: { $avg: "$age" },
        },
      },
    ]);

    res.send(averageAge);
  } catch (err) {
    console.error(err);
  }
});

router.get("/group-by-age", async (req, res) => {
  try {
    const averageAgeByGroup = await UserModel.aggregate([
      {
        $group: {
          _id: null, // "$age"
          averageAge: { $avg: "$age" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.send(averageAgeByGroup);
  } catch (err) {
    console.error(err);
  }
});

router.get("/group-by-skills", async (req, res) => {
  try {
    const groupedBySkills = await UserModel.aggregate([
      {
        $group: {
          _id: "$skills",
          count: { $sum: 1 },
        },
      },
    ]);
    res.send(groupedBySkills);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get("/project", async (req, res) => {
  try {
    const projectedResult = await UserModel.aggregate([
      {
        $project: {
          name: 1,
          age: 1,
          experience: 1,
        },
      },
    ]);
    res.send(projectedResult);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get("/project-full-salary", async (req, res) => {
  try {
    const usersWithFullSalary = await UserModel.aggregate([
      {
        $project: {
          name: 1,
          age: 1,
          experience: 1,
          salary: 1,
          fullSalary: { $multiply: ["$experience", "$salary"] },
        },
      },
    ]);
    res.send(usersWithFullSalary);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get("/sort-limit-skip", async (req, res) => {
  try {
    const topEarners = await UserModel.aggregate([
      { $sort: { salary: -1 } },
      { $skip: 0 },
      { $limit: 5 },
    ]);
    res.send(topEarners);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get("/unwind", async (req, res) => {
  try {
    const usersBySkill = await UserModel.aggregate([
      { $unwind: "$skills" },
      {
        $group: {
          _id: "$skills",
          count: { $sum: 1 },
        },
      },
    ]);
    res.send(usersBySkill);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get("/addfield", async (req, res) => {
  try {
    const usersWithActivityStatus = await UserModel.aggregate([
      {
        $addFields: {
          activityStatus: {
            $cond: {
              if: { $lt: ["$age", 30] },
              then: "Active",
              else: "Inactive",
            },
          },
        },
      },
    ]);
    res.send(usersWithActivityStatus);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get("/out", async (req, res) => {
  try {
    await UserModel.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ["$age", 30] }, then: "Under 30" },
                {
                  case: {
                    $and: [{ $gte: ["$age", 30] }, { $lt: ["$age", 40] }],
                  },
                  then: "30-39",
                },
                { case: { $gte: ["$age", 40] }, then: "40 and over" },
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      { $out: "usersByAgeRange" },
    ]);

    res.send("Results have been saved in collection usersByAgeRange");
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get("/facet", async (req, res) => {
  try {
    const usersStats = await UserModel.aggregate([
      {
        $facet: {
          ageRangeStats: [
            {
              $group: {
                _id: {
                  $switch: {
                    branches: [
                      { case: { $lt: ["$age", 30] }, then: "Under 30" },
                      {
                        case: {
                          $and: [{ $gte: ["$age", 30] }, { $lt: ["$age", 40] }],
                        },
                        then: "30-39",
                      },
                      { case: { $gte: ["$age", 40] }, then: "40 and over" },
                    ],
                  },
                },
                count: { $sum: 1 },
              },
            },
          ],
          experienceStats: [
            {
              $group: {
                _id: "$experience",
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    res.send(usersStats);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get("/sample", async (req, res) => {
  try {
    const randomUsers = await UserModel.aggregate([{ $sample: { size: 5 } }]);

    res.send(randomUsers);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get("/bucket", async (req, res) => {
  try {
    const ageBuckets = await UserModel.aggregate([
      {
        $bucket: {
          groupBy: "$age",
          boundaries: [20, 30, 35, 50],
          default: "Other",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    res.send(ageBuckets);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get("/lookup", async (req, res) => {
  try {
    const result = await UserModel.aggregate([
      {
        $lookup: {
          from: "experiences",
          localField: "_id",
          foreignField: "developerId",
          as: "experienceData",
        },
      },
      {
        $project: {
          name: 1,
          age: 1,
          skills: 1,
          experienceData: { $arrayElemAt: ["$experienceData", 0] },
        },
      },
      {
        $project: {
          name: 1,
          age: 1,
          skills: 1,
          skillLevel: "$experienceData.skillLevel",
        },
      },
    ]);

    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
