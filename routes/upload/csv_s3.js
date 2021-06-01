var express = require("express");
var dotenv = require("dotenv");
var path = require("path");
var fs = require("fs").promises;
var multer = require("multer");

var AWS = require("aws-sdk");
var router = express.Router();

dotenv.config({
  path: path.resolve(
    process.cwd(),
    process.env.NODE_ENV == "production" ? ".env" : ".env.dev"
  ),
});

const s3 = new AWS.S3({
  endpoint: new AWS.Endpoint(process.env.NAVER_CLOUD_ENDPOINT),
  region: "kr-standard",
  credentials: {
    accessKeyId: process.env.NAVER_CLOUD_KEY_ID,
    secretAccessKey: process.env.NAVER_CLOUD_SECRET_KEY,
  },
});

router.get("/", (req, res) => {
  const params = {
    Bucket: process.env.NAVER_CLOUD_BUCKET_NAME,
    Prefix: "csv",
  };
  s3.listObjects(params, function (err, data) {
    if (err) {
      console.log("Error", err);
      res.json({
        errorCode: 400,
        errorMessage: err,
      });
    } else {
      getFileList(data, res);
    }
  });
});

function getFileList(data, res) {
  var keyList = [];

  for (let i = 0; i < data.Contents.length; i++) {
    keyList.push(data.Contents[i].Key);
  }

  // res.render('read_file2', { 'files': keyList })
  res.json({
    resultCode: 200,
    resultMessage: keyList,
  });
}

module.exports = router;
