const express = require("express");
const app = express();
const indexRouter = require("./routes/index");
const filesRouter = require("./routes/files");
const rateLimit = require("express-rate-limit");
require('dotenv').config();

/* Limit concurrent requests using a middleware
   in order to deny DOS attack */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100// limit each IP to 100 requests per windowMs
});
app.use(limiter);

//static middleware for serving default route index html
app.use(express.static(__dirname + '/public'));

app.use(express.json());

app.use("/", indexRouter);
app.use("/api/files", filesRouter);


app.listen(process.env.PORT, () =>
  console.log(`Listening on port ${process.env.PORT}`)
);
