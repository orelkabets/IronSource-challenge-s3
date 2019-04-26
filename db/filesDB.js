require('dotenv').config();
const crypto = require("crypto"); //Used for setting unique id for metadata documents   
const Loki = require('lokijs');

const COLLECTION_NAME = process.env.COLLECTION_NAME;
const UPLOAD_PATH = process.env.UPLOAD_PATH;
const DB_NAME = process.env.DB_NAME;

// using lokijs db with local json as presistant nosql storage for file's metadata
class DB {
    constructor() {
        this._db = new Loki(`${UPLOAD_PATH}/${DB_NAME}`, { persistenceMethod: 'fs' });
        this._db.loadDatabase({}, () => {
            this._collection = this._db.getCollection(COLLECTION_NAME) 
                                || this._db.addCollection(COLLECTION_NAME);
            // since $loki id is incremental, for each insert i'm attaching unique id.
            this._collection.on('insert', (input) => {
                input.id = crypto.randomBytes(12).toString('hex');
            });
        })
    }

    // returns array of documets
    async getMetadata(options){
        const metadata = await this._collection.find(options);
        if (metadata.length)
            return metadata;
        return null;
    }

    async insertMetadata(metadata){
        const doc = this._collection.insert(metadata);
        this._db.saveDatabase();
        return doc;
    }

    async updateMetadata(metadata){
       const doc =  this._collection.update(metadata);
       this._db.saveDatabase();
       return doc;
    }



}

module.exports = DB;