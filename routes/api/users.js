const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Item Model
const User = require("../../models/user");

// Regex expressions:
const emailRegex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

// Constraints: Minimum Length: 8, Contains at least 1 special char, 1 number, 1 Capital Letter & 1 Small Letter
const passwordRegex = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/);


/*----------------- Register Route ---------------*/
router.post("/", async (req, res) => {
  const { name, email, password } = req.body;

  // Simple pre-validation
  if (!name || !email || !password)
    return res.status(400).send({ msg: "Please enter all fields" });
  
  // Brief Validation
  if(name.length < 3)
    return res.status(406).send({msg: "Name must have at least 3 characters"});

  if (!emailRegex.test(email))
    return res.status(406).send({msg: "Please provide valid email"});
  
  if(!passwordRegex.test(password))
    return res.status(406).send({
      msg: "Please provide password meeting following criteria: Minimum Length: 8, Contains at least 1 special char, 1 number, 1 Capital Letter & 1 Small Letter"
    });
  
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
