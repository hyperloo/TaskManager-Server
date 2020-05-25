const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Item Model
const User = require("../../models/user");

//@route POST api/users
//@desc Register new User
//@access Public

router.post("/", async (req, res) => {
  const { name, email, password } = req.body;

  //simple validation
  if (!name || !email || !password) {
    // console.log(req);
    return res.status(400).send({ msg: "Please enter all fields" });
  }

  //Check for existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).send({ msg: "Already registered user with this email" });
  } else {
    const newUser = new User({
      name,
      email,
      password,
    });

    //Create Salt & hash
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser.save().then((user) => {
          jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: 3600 },
            (err, token) => {
              if (err) throw err;
              res.json({
                token,
                user,
              });
            }
          );
        });
      });
    });
  }
});

module.exports = router;
