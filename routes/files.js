require('dotenv').config();
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/multerLocal");
const Filedb = require("../db/filesDB");
const db = new Filedb();
const FilesController = require("../controllers/files");
const filesController = new FilesController(db);

const UPLOAD_PATH = process.env.UPLOAD_PATH;


/* ROUTES */


//Public GET route for downloading file or file's metadata
router.get("/:username/:filename", async (req, res) => {
  const { username, filename } = req.params;
  const { metadata } = req.query;
  try {
    if (!username || !filename)
      return res.status(400).send(`Missing username or filename argumets`);
    // get file's metadata
    const metadataAndID = await filesController.getFileByName(filename, username);
    // check if file exists
    if (!metadataAndID) return res.status(404).send(`File not found`);

    const metadataFromDB = metadataAndID.metadata;

    // check file access type
    if (!metadataFromDB.isPublic) {
      return res.status(401).send(`This file has no public access!`);
    }

    // if client request only metadata
    if (metadata && metadata.toLowerCase() === "true") {
      // pick only relevant data from metadata db object
      const { id, ...data } = filesController.filterMetadata(metadataFromDB, ["user", "isPublic","filename"]);
      return res.send({ id, metadata: data });
    }

    // check if the file has been deleted.
    if (metadataFromDB.deletedAt)
      return res.status(404).send("File has been deleted");
    // download the file
    return res.download(`${UPLOAD_PATH}/${metadataFromDB.filename}`);
  } catch (err) {
    if (err.code == null) return res.status(500).send(err);
    return res.status(500).send(`${err}`);
  }
});

/*
  Private GET route for downloading a file (or metadata) 
  using file ID 
  JWT access_token query param is required
*/
router.get("/:id", async (req, res) => {
  const { metadata } = req.query;
  try {
    const metadataAndID = await filesController.getFileByID(
      req.params.id,
      req.query.access_token
    );
    // ?metadata=true
    if (metadata && metadata.toLowerCase() === "true") {
      const { id, ...data } = filesController.filterMetadata(metadataAndID, ["user", "isPublic"]);
      return res.send({id, metadata: data});
    }

    if (metadataAndID.deletedAt)
      return res.status(404).send("File not found!");

    // download the file
    return res.download(`${UPLOAD_PATH}/${metadataAndID.filename}`);
  } catch (err) {
    if (err.code == null) return res.status(500).send(err);

    return res.status(err.code).send(err.message);
  }
});

/* POST route for uploading files.
    authenticaion: x-auth-token header with a valid JWT is required and is being verified
    by the "auth" middleware.
    
    multer responsible for saving the file in localStorage 
*/
router.post("/", auth, upload.single("file"), async (req, res) => {
  if (req.file) {
    const metadata = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      isPublic: req.body.isPublic.toLowerCase() === "true",
      user: req.user
    };
    try {
      const metadataAndID = await filesController.setFileMetadata(metadata);
      res.send(metadataAndID);
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else {
    res.status(400).send("No file provided");
  }

});

/*  PUT route for updating file metadata ( set private/public access. only for file's owner)
    using the same authentication logic as GET (PRIVATE) with JWT
    metadata is retreived from Loki DB. 
    updates are pushed back to Loki DB.
*/
router.put("/:id", auth, async (req, res) => {
  try {
    // get the file metadata from loki, using the provided id and jwt
    const metadataAndID = await filesController.getFileByID(
      req.params.id,
      req.header("x-auth-token")
    );
    // update the database with updatedAt and isPublic (sending requested user id)
    const updatedMetadata = await filesController.updateMetadata(
      metadataAndID.id, req.body.isPublic);

    const { id, ...data } = updatedMetadata;
    res.send({ id, metadata: data });
  } catch (err) {
    if (err.code == null || err.code == undefined) return res.status(500).send(err.message);

    return res.status(err.code).send(err.message);
  }
});

/* DELETE route for deleting files by file ID
    using auth JWT middleware.
    metadata is retreived from Loki DB. 
    updates are pushed back to Loki DB.
*/
router.delete("/:id", auth, async (req, res) => {
  try {
    // get the file metadata from loki, using the provided id and jwt
    const metadataAndID = await filesController.getFileByID(
      req.params.id,
      req.header("x-auth-token")
    );

    if (metadataAndID.deletedAt)
      return res.status(404).send("File already deleted");

    // delete file from disk
    filesController.deleteFile(`${UPLOAD_PATH}`, metadataAndID.filename)

    // update file's metadata
    const updatedMetadata = await filesController.updateMetadata(
      req.params.id, metadataAndID.isPublic, true);
    const { id, ...data } = updatedMetadata;
    res.send({ id, metadata: data });
  } catch (err) {
    if (err.code == null || err.code == undefined) return res.status(500).send(err.message);

    return res.status(err.code).send(err.message);
  }
});


module.exports = router;
