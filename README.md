# IronSource-challenge-s3.

### INSTALL & RUN
1. clone.
2. npm i
3. node.js index.js

#### Helper Packages
1. lokijs - in-memory nosql presistant db for saving files metadata.
#### middleware packages
2. multer with fs-extra - for actual file saving, deleting , upload folder creation in local disk.
3. jsonwebtoken - JWT for handling user authentication. 

### Routes
1. **Get api/files/:username/:filename**- public get route for downloading a file by username (the user which uploaded the file) and file original name.
adding query parameter "metadata=true" will return json containing file's metadata.

2. **Get api/files/:id** - for accessing private files (isPublic = false). access_token query parameters is required.
query parameter "metadata=true" also return json with file's metadata. 
3. **Post api/files**- for uploading files. x-auth-token header with a user's json web token is required.
user can add only one additional field to this form-data : "isPublic" Boolean which responsible for file access mode. 

4. **Put api/files/:id**- for updating file access mode (isPublic property). x-auth-token with user's JWT is required.
the file's metadata property: updatedAt timestamp updated. 

5. **Delete api/files/:id**- for deleting a file.
x-auth-token with user's JWT is required.
The file is deleted but the metadata remains at lokijs db with a deletedAT timestamp

### POSTMAN_COLLECTION
Under postman_collection folder there is a postman collection file with a basic flow using two predefined users: 

|id|name|jwt(access_token)|
|-|-|-|
|qAzef32F|user1|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InFBemVmMzJGIiwibmFtZSI6InVzZXIxIn0.MCnE0A9zSIvXRjeaApxMzuMPr_cjQp1UDtQK0UuCDTw|
|hT9Lmdx|user2|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImhUOUxtZHgiLCJuYW1lIjoidXNlcjIifQ.Inq84KA7qi3i_RIq73AErlEcR9NOnMWeEqFHSnFNoH0|
