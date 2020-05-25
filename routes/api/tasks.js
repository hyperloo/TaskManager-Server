const express = require("express");
const router = express.Router();

const Task = require("../../models/task");
const User = require("../../models/user");

const auth = require("../../middleware/auth");

/********** get All Tasks of any User *************/
router.get("/", auth, (req, res) => {
  const dueDate = req.query.dueDate;
  const label = req.query.label;
  const status = req.query.status;

  //Add a query only if it is not null otherwise, mongoose do not find as expected
  //Finding query
  const findParams = {
    ...(label && { label: label }),
    ...(status && { status: status }),
  };

  //Sorting Query
  const sortParams = {
    createdAt: -1,
    ...(dueDate && { dueDate: 1 }),
  };

  User.findById(req.user.id)
    .populate("createdTasks")
    .populate("archivedTasks")
    .exec()
    .then(async (user, err) => {
      if (err) {
        console.log(err);
      } else {
        for (let i = 0; i < user.createdTasks.length; ) {
          if (
            user.createdTasks[i].dueDate.toISOString() <
            new Date().toISOString()
          ) {
            await user.archivedTasks.push(user.createdTasks[i]);
            await user.createdTasks.splice(i, 1);
          } else {
            i++;
          }
        }
        user.save().then((user, err) => {
          if (err) {
            console.log(err);
          } else {
            res.status(200).json({
              createdTasks: user.createdTasks,
              archivedTasks: user.archivedTasks,
            });
          }
        });
      }
    })
    .catch((err) => console.log(err));
});

/********* Create Task **************/
router.post("/", auth, async (req, res) => {
  const { name, creator, dueDate, label, status, description } = req.body;
  if (!name || !description || !status || !label || !dueDate) {
    res.status(400).send({ msg: "Please Enter All Fields" });
    return;
  }
  const userId = req.query.ui;
  if (userId !== req.user.id) {
    res.status(403).send({ msg: "Unauthorized User" });
  }
  try {
    const newTask = new Task({
      name: name,
      creator: req.user.id,
      dueDate: dueDate,
      label: label,
      status: status,
      description: description,
    });
    const savedTask = await newTask.save();
    const user = await User.findById(savedTask.creator);

    await user.createdTasks.push(savedTask._id);
    await user.save();
    res
      .status(200)
      .json({ msg: `${savedTask.name} created successfully`, task: savedTask });
  } catch (err) {
    console.log(err);
  }
});

/************ Archive Task ***************/
router.patch("/archive/:id", auth, async (req, res) => {
  const userId = req.query.ui;
  if (userId !== req.user.id) {
    res.status(403).send({ msg: "Unauthorized User" });
  }
  try {
    const user = await User.findById(req.user.id);
    for (let i = 0; i < user.createdTasks.length; i++) {
      if (user.createdTasks[i].toString() === req.params.id) {
        user.createdTasks.splice(i, 1);
        break;
      }
    }
    const archivedTask = await Task.findById(req.params.id);
    archivedTask.archivedOn = new Date().toISOString();
    archivedTask.status = "Completed";
    await archivedTask.save();
    await user.archivedTasks.push(req.params.id);
    await user.save();
    res
      .status(200)
      .json({ msg: `${archivedTask.name} Archived`, task: archivedTask });
  } catch (err) {
    console.log(err);
  }
});

/************ Delete a Task ************/
router.delete("/:id", auth, async (req, res) => {
  const userId = req.query.ui,
    t = req.query.t;
  if (userId !== req.user.id) {
    res.status(403).send({ msg: "Unauthorized User" });
  }
  try {
    const user = await User.findById(req.user.id);
    if (t === "created") {
      for (let i = 0; i < user.createdTasks.length; i++) {
        if (user.createdTasks[i].toString() === req.params.id) {
          user.createdTasks.splice(i, 1);
          break;
        }
      }
    } else {
      for (let i = 0; i < user.archivedTasks.length; i++) {
        if (user.archivedTasks[i].toString() === req.params.id) {
          user.archivedTasks.splice(i, 1);
          break;
        }
      }
    }
    const task = await Task.findById(req.params.id);
    await task.remove();
    user.save();
    res.status(200).json({ msg: `Event Deleted Successfully` });
  } catch (err) {
    console.log(err);
  }
});

/************ Update Task **************/
router.patch("/:id", auth, async (req, res) => {
  const userId = req.query.ui,
    id = req.params.id;
  if (userId !== req.user.id) {
    res.status(403).send({ msg: "Unauthorized User" });
  }
  try {
    const body = {
      label: req.body.label,
      status: req.body.status,
    };

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id },
      { $set: body },
      { new: true, useFindAndModify: false }
    );
    res.status(200).json({
      msg: `${updatedTask.name} updated Successfully`,
      task: updatedTask,
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
