var express = require("express");
var dotenv = require("dotenv");
var path = require("path");

var textS3Route = require("./text_s3");
var csvS3Route = require("./csv_s3");

var uploadController = require("../../controller/upload/uploadController");
var commonController = require("../../controller/common/commonController");

var router = express.Router();

dotenv.config({
  path: path.resolve(
    process.cwd(),
    process.env.NODE_ENV == "production" ? ".env" : ".env.dev"
  ),
});

// 파일 업로드 기본 페이지
//https://stackoverflow.com/questions/34512559/how-should-i-batch-upload-to-s3-and-insert-to-mongodb-from-nodejs-webserver-with/34513997
router.get("/", (req, res) => {
  res.render("upload");
});

// 파일 업로드 :: POST
router.post("/", commonController.upload, (req, res) => {
  uploadController.uploadFile(req, res);
});

// 파일 목록 불러오기 :: 전체
router.get("/getAllFileList", (req, res) => {
//   uploadController.getAllFileList(res);
  var params = {
    Bucket: process.env.NAVER_CLOUD_BUCKET_NAME,
    MaxKeys: 300,
  };

  uploadController.listAllKeys(params)
  .then((result) => {
      res.json({
          resultcode: 200,
          resultMessage: result,
      })
  })
  .catch((err) => {
      res.json({
          errorCode: 400,
          errorMessage: err
      })
  })
//   .then((result) => {
//       console.log('re:: ' + result)
//     //   console.log('reKey:: ' + result[0].Key)
//       res.json({
//           resultCode: 200,
//           resultMessage: result
//       })
//   })
//   .catch((err) => {
//       console.log('er:: ' + err)
//       res.json({
//           errorCode: 400,
//           errorMessage: err
//       })
//   })
});

// 파일 다운로드
router.get("/downloadFile", (req, res) => {
  uploadController.downloadFile(req, res);
});

// 파일 읽어오기 : Naver Cloud Object Storage에 있는 파일 중에 Json으로 출력
router.get("/readFile", (req, res) => {
  uploadController.readFile(req, res);
});

module.exports = router;
