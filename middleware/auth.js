const jwt = require("jsonwebtoken");

/*------- Authentication Middleware for Authentication on Every Request --------------*/
module.exports = async (req, res, next) => {
  const token = req.header("x-auth-token");

  //Check for token if sent with the request
  if (!token)
    return res
      .status(401)
      .send({ msg: "Authorization denied, Login / SignUp again" });
  try {
    //Verify token
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    //Add user from payload as a property of request
    req.user = decoded;
    next();
  } catch (e) {
    //If either the Token Expires or the Token is invalid
    return res.status(401).send({ msg: "Timeout!, Login / SignUp again" });
  }
};
