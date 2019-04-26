const jwt = require("jsonwebtoken");
require('dotenv').config();
/*
Express middleware model for authentication using Json Web Tokens
*/
module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (ex) {
    return res.status(400).send("Invalid token.");
  }
};
