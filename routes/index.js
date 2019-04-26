const express = require("express");
const router = express.Router();

router.get("/", async(req, res) => {
    res.render(index, {title: "IronSourceS3"});
})

module.exports = router;