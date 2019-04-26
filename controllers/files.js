require('dotenv').config();
const jwt = require("jsonwebtoken");
const fs = require("fs-extra");



// Helper class using lokijs for saving/updaing files metadata
class FilesController {
  constructor(filesDB) {
    this._db = filesDB;
  }

  async insertMetadata(metadata) {
    try {
      metadata.createdAt = Date.now().toString();
      const doc = await this._db.insertMetadata(metadata);
      // return only relevant info from db
      let { $loki, meta, id, user, ...data } = doc;
      return { id, metadata: data };
    } catch (err) {
      return null;
    }
  }

  // used for updating existing metadata with isUpdatad or isDeleted timestamps
  async updateMetadata(id, isPublic = false, isDeleted = null) {
    try {
      let fileMetaData = await this._db.getMetadata({ id });
      if (fileMetaData.length) {
        fileMetaData = fileMetaData[0];
        fileMetaData.isPublic = isPublic;
        if (isDeleted)
          fileMetaData.deletedAt = Date.now().toString();
        else {
          delete fileMetaData.deletedAt;
          fileMetaData.updatedAt = Date.now().toString();
        }
        fileMetaData = await this._db.updateMetadata(fileMetaData);
        let { $loki, meta, id, user, ...data } = fileMetaData;
        return { id, metadata: data };
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  /*
  returns a file metadata and ID (if exists) by original file name and user name 
  ( the user that uploaded the file )
  this is used by the public GET routes 
  (and by post to determine if the same file for the same user has been uploaded already)
*/
  getFileByName(filename, username) {
    return new Promise(async (resolve) => {
      const filesMetaData = await this._db.getMetadata(
        {
          "user.name": username,
          'originalname': filename
        });

      // check if files data exists
      if (!filesMetaData) {
        return resolve(null);
      }

      // get the latest document inserted
      // return only relevant info from fileMetaData
      let { $loki, meta, id, originalname, ...data } = filesMetaData[filesMetaData.length - 1];
      resolve({ metadata: data, id });
    });
  }

  /*
  returns a file metadata and ID (if exists) by document ID.
  validating JWT access token.

  returns 
  401 => unauthorized access 
  404 => for file not found 
*/
  getFileByID(fileId, accessToken) {
    return new Promise(async (resolve, reject) => {
      if (!accessToken) {
        reject({
          code: 401,
          message: "Access token not provided!"
        });
      }

      // verify access token and get user
      let userObj = {};
      try {
        const decoded = jwt.verify(accessToken, process.env.SECRET_KEY);
        userObj = decoded;
      } catch (ex) {
        reject({
          code: 401,
          message: "Invalid access token!"
        });
      }

      // look for metadata in db
      const filesMetaData = await this._db.getMetadata({ id: fileId });

      if (!filesMetaData) {
        reject({
          code: 404,
          message: "file not found!"
        });
      } else {
        let fileMetaData = filesMetaData[0];
        // verify user
        if (fileMetaData.user.id !== userObj.id) {
          reject({
            code: 401,
            message: "you are not allowed to perform this action"
          });
        }
        let { $loki, meta, id, user, ...data } = fileMetaData;
        resolve({ id, metadata: data });
      }
    });
  }

  /*
   * this function inserting or updating files metadata
   * insert - file's metadata document not found or if file's metadata found with deletedAt.
   * update - file was not deleted before , then update existing document.
   */
  async setFileMetadata(metadata) {
    try {
      let metadataAndID = await this.getFileByName(
        metadata.originalname,
        metadata.user.name
      );
      if (metadataAndID) {
        let fileDocMeta;
        if (metadataAndID.metadata.deletedAt) {
          fileDocMeta = await this.insertMetadata(metadata);
        } else
          fileDocMeta = await this.updateMetadata(metadataAndID.id, metadata.isPublic);
        return { id: fileDocMeta.id, metadata: fileDocMeta.metadata };
      } else {
        const newMetadataAndId = await this.insertMetadata(metadata);
        return { id: newMetadataAndId.id, metadata: newMetadataAndId.metadata };
      }
    } catch (err) {
      return new Error("Error setting file metadata")
    }
  }


  deleteFile(dir, filename) {
    fs.unlink(`${dir}/${filename}`, (err) => {
      if (err)
        throw err
    });

  }
}

module.exports = FilesController;