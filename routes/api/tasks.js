const express = require("express");
const router = express.Router();

const Task = require("../../models/task");
const User = require("../../models/user");

const auth = require("../../middleware/auth");

/********** get All Tasks of any User *************/
router.get("/", auth, (req, res) => {
  User.findById(req.user.id)
    .populate("createdTasks") //Populate CreatedTask field in DB
    .populate("archivedTasks") //Populate ArchivedTask field in DB
    .exec() //Execute next after populating
    .then(async (user, err) => {
      if (err) {
        console.log(err);
      } else {
        for (let i = 0; i < user.createdTasks.length; ) {
          //check if the deadline for the task is passed
          if (
            user.createdTasks[i].dueDate.toISOString() <
            new Date().toISOString()
          ) {
            //push task into archive section
            await user.archivedTasks.push(user.createdTasks[i]);
            //delete task from active section
            await user.createdTasks.splice(i, 1);
          } else {
            i++;
          }
        }

        //Save the user
        user.save().then((user, err) => {
          if (err) {
            console.log(err);
          } else {
            //return response to client
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

  //Initials Checks
  if (!name || !description || !status || !label || !dueDate) {
    res.status(400).send({ msg: "Please Enter All Fields" });
    return;
  }

  //Checking for bad User
  const userId = req.query.ui;
  if (userId !== req.user.id) {
    res.status(403).send({ msg: "Unauthorized User" });
  }
  try {
    //Creating ew task
    const newTask = new Task({
      name: name,
      creator: req.user.id,
      dueDate: dueDate,
      label: label,
      status: status,
      description: description,
    });
    //Saving to Tasks DB
    const savedTask = await newTask.save();
    const user = await User.findById(savedTask.creator);

    //Save ID of task to the createdTasks Field of the user
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
  //Checking for bad User
  if (userId !== req.user.id) {
    res.status(403).send({ msg: "Unauthorized User" });
  }
  try {
    const user = await User.findById(req.user.id);
    for (let i = 0; i < user.createdTasks.length; i++) {
      if (user.createdTasks[i].toString() === req.params.id) {
        //Deleting task from created section of the user
        user.createdTasks.splice(i, 1);
        break;
      }
    }

    //Get the task from the Tasks DB to change its status and archived on Details
    const archivedTask = await Task.findById(req.params.id);
    archivedTask.archivedOn = new Date().toISOString(); //Update Archived Date
    archivedTask.status = "Completed"; //Update Status
    await archivedTask.save(); //Save updated task
    await user.archivedTasks.push(req.params.id); //push the new task to the archived Tasks of the user
    await user.save(); //Save the user
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

  //Checking for Bad User
  if (userId !== req.user.id) {
    res.status(403).send({ msg: "Unauthorized User" });
  }
  try {
    const user = await User.findById(req.user.id);

    //Check if the task to be deleted is of created Tasks section or Archived Task section
    if (t === "created") {
      for (let i = 0; i < user.createdTasks.length; i++) {
        //Delete given task from created task section os user
        if (user.createdTasks[i].toString() === req.params.id) {
          user.createdTasks.splice(i, 1);
          break;
        }
      }
    } else {
      for (let i = 0; i < user.archivedTasks.length; i++) {
        //Delete Given task from archived Task section of user
        if (user.archivedTasks[i].toString() === req.params.id) {
          user.archivedTasks.splice(i, 1);
          break;
        }
      }
    }

    //Delete Given task from Task DB
    const task = await Task.findById(req.params.id);
    await task.remove();
    user.save();
    //Save User
    res.status(200).json({ msg: `Event Deleted Successfully` });
  } catch (err) {
    console.log(err);
  }
});

/************ Update Task **************/
router.patch("/:id", auth, async (req, res) => {
  const userId = req.query.ui,
    id = req.params.id;

  //Checking Bd User
  if (userId !== req.user.id) {
    res.status(403).send({ msg: "Unauthorized User" });
  }
  try {
    const body = {
      label: req.body.label,
      status: req.body.status,
    };

    //Update the given Task with given Id
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

// const dueDate = req.query.dueDate;
// const label = req.query.label;
// const status = req.query.status;

//Add a query only if it is not null otherwise, mongoose do not find as expected
// //Finding query
// const findParams = {
//   ...(label && { label: label }),
//   ...(status && { status: status }),
// };

// //Sorting Query
// const sortParams = {
//   createdAt: -1,
//   ...(dueDate && { dueDate: 1 }),
// };
