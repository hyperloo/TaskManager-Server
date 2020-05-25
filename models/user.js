const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    }, 
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    createdTasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    archivedTasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
