var express = require("express");
var dotenv = require("dotenv");
var path = require("path");
var fs = require("fs").promises;
var multer = require("multer");
//var upload = multer({ dest: './uploads' })

var AWS = require("aws-sdk");
var _ = require("lodash");

var fs2 = require("fs");
var readline = require("readline");

var textS3Route = require("./text_s3");
var csvS3Route = require("./csv_s3");

var uploadController = require("../../controller/upload/uploadController");

var router = express.Router();
//https://brunch.co.kr/@daniellim/43 참고할것
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

const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});
const upload = multer({ storage: storage }).single("userfile");

// 파일 업로드 기본 페이지
router.get("/", (req, res) => {
  res.render("upload");
});

// 파일 업로드
//https://stackoverflow.com/questions/34512559/how-should-i-batch-upload-to-s3-and-insert-to-mongodb-from-nodejs-webserver-with/34513997
router.post("/", upload, (req, res) => {
  let myFileName = req.file.originalname.split(".");
  const fileType = myFileName[myFileName.length - 1];

  const params = {
    Bucket: process.env.NAVER_CLOUD_BUCKET_NAME,
    Key: myFileName[0] + "." + fileType,
    Body: req.file.buffer,
  };

  if (req.file.mimetype.startsWith("image")) {
    uploadImageFile(params, req.file, res);
  } else {
    uploadOtherFile(params, req.file, res, req);
  }
});

// 파일 목록 불러오기
router
  .get("/fileList", (req, res) => {
    const params = {
      Bucket: process.env.NAVER_CLOUD_BUCKET_NAME,
      // Prefix: 'text'
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
        //   res.json({
        //       resultCode: 200,
        //       resultMessage: data.Contents
        //   })
      }
    });
  })
  .use("/fileList/text", textS3Route)
  .use("/fileList/csv", csvS3Route);

// 다운로드 파일
router.get("/downloadFile", (req, res, next) => {
  var fileKey = req.query["fileKey"];

  var params = {
    Bucket: process.env.NAVER_CLOUD_BUCKET_NAME,
    Key: fileKey,
  };

  res.attachment(fileKey);
  var fileStream = s3.getObject(params).createReadStream();
  fileStream.pipe(res);
});

// 파일 읽어오기
router.get("/readFile", (req, res) => {
  var fileKey = req.query["fileName"];
  var params = {
    Bucket: process.env.NAVER_CLOUD_BUCKET_NAME,
    Key: fileKey,
    ResponseContentType: "application/json",
  };

  s3.getObject(params, (err, data) => {
    if (!err) {
      const body = Buffer.from(data.Body).toString("utf8");
      res.json({
        resultCode: 200,
        resultMessage: uploadController.uploadConvertJson(body),
        // resultMessage: uploadConvertJson(body)
      });
    }
  });
});

// text to JSON
function uploadConvertJson(body) {
  const content = [];
  body
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => {
      content.push(line);
    });

  console.log("Content:: " + content[0]);

  const header = content[0].split(",");

  return _.tail(content).map((row) => {
    return _.zipObject(header, row.split(","));
  });
}

function uploadImageFile(params, res) {
  s3.upload(params, (err, data) => {
    if (err) {
      console.log("error : " + err);
    } else {
      console.log("success : " + data);
    }
  });

  console.log("data::  " + data);
  res.json({
    resultCode: 200,
    resultMessage: data,
  });
}

function uploadOtherFile(params, file, res, req) {
  console.log("upload Success :: " + file.mimetype);
  let fileName = file.originalname.split(".");
  const fileType = fileName[fileName.length - 1];

  if (file.mimetype == "text/plain") {
    console.log("success text file :: " + fileName[0] + " :: " + fileType);
    var params = {
      Bucket: process.env.NAVER_CLOUD_BUCKET_NAME + "/text",
      Key: Date.now() + fileName[0] + "." + fileType,
      Body: file.buffer,
    };
  }

  s3.upload(params, function (err, data) {
    if (err) {
      throw err;
    }
    console.log(`File uploaded successfully. ${data.Location}`);
  });

  res.render("upload_success", { title: "upload" });
}

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
