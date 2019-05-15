const express = require("express");
const app = express();
const filesRouter = require("./routes/files");
require('dotenv').config();


//static middleware for serving default route index html
app.use(express.static(__dirname + '/public'));

app.use(express.json());

app.use("/api/files", filesRouter);


app.listen(process.env.PORT, () =>
  console.log(`Listening on port ${process.env.PORT}`)
);
