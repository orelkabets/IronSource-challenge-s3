require('dotenv').config();
const multer = require("multer");
const fs = require("fs-extra");
const UPLOAD_PATH = process.env.UPLOAD_PATH;

/**
 * Multer middleware for the actual file saving into local disk
 * saved file path: uploads/<unique userid + original filename>.
 */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.ensureDirSync(UPLOAD_PATH);
        cb(null, UPLOAD_PATH)
    }, // file names are concatanation of unique userId and original filename
    filename: (req, file, cb) => {
        cb(null, req.user.id + '-' + file.originalname);
    }
});
const upload = multer(
    {
        storage: storage,
        fieldNameSize: 100,
        limits: { fields: 1 }  // allow only one additional field (in addition to "file") in form-data
    });

module.exports = upload;