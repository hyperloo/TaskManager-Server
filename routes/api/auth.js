const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../../middleware/auth");

const User = require("../../models/user");

/*------------------- Route for Login using credentials --------------------------------*/
router.post("/", async (req, res) => {
  const { name, email, password } = req.body;

  //simple validation
  if (!email || !password) {
    return res.status(400).send({ msg: "Please enter all fields" });
  }
  //Check for existing user
  const user = await User.findOne({ email });
  if (!user) return res.status(400).send({ msg: "User Does not Exist" });

  //Validate Password using bcrypt compare function
  bcrypt.compare(password, user.password).then((isMatch) => {
    if (!isMatch) return res.status(403).send({ msg: "Invalid Credentials" });

    //Sign the JWT with the given user id form from Database, Secret Key and add expiration time
    jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        return res.json({
          token,
          user,
        });
      }
    );
  });
});

/*--- Route to login automatically by the JWT Token present in local Storage of the client --------*/
router.get("/user", auth, (req, res) => {
  User.findById(req.user.id)
    .select("-password") //Select All Except password
    .then((user) => res.status(200).json(user));
});

module.exports = router;
