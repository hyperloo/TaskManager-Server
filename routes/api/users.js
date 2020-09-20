const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Item Model
const User = require("../../models/user");

/*----------------- Register Route ---------------*/
router.post("/", async (req, res) => {
  const { name, email, password } = req.body;

  //simple validation
  if (!name || !email || !password) {
    return res.status(400).send({ msg: "Please enter all fields" });
  }

  //Check for existing user
  const existingUser = await User.findOne({ email });

  //If present send status with message of Already Existing User
  if (existingUser) {
    res.status(400).send({ msg: "Already registered user with this email" });
  } else {
    //If not create a new User
    const newUser = new User({
      name,
      email,
      password,
    });

    //Create Salt & hash using bcrypt
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        //Save to DB
        newUser.save().then((user) => {
          //Sign the JWT with the generated user id form the DB form from Database, Secret Key and add expiration time
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
