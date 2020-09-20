const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const tasks = require("./routes/api/tasks");
const users = require("./routes/api/users");
const auth = require("./routes/api/auth");

const app = express();

/* ------------- Middleware ----------------*/
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

/*---------- A simple CORS implementation ---------------------*/
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS,DELETE");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-auth-token");
//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   }
//   next();
// });
//for server Deployment, user process.env.respective_variable

/*------------------------Connect DB ------------------------*/
mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-jwfcs.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    }
  )
  .then(() => console.log("MongoDb connected....."))
  .catch((err) => console.log("Cannot connect to db due to " + err));

app.use("/api/tasks", tasks);
app.use("/api/register", users);
app.use("/api/login", auth);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server Started on port ${port}`));
