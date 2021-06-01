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
router.get("/", (req, res) => {
  res.render("upload");
});

// 파일 업로드
//https://stackoverflow.com/questions/34512559/how-should-i-batch-upload-to-s3-and-insert-to-mongodb-from-nodejs-webserver-with/34513997
// router.post("/", (req, res) => {
//     uploadController.uploadFile(req, res)
// })

router.post("/", commonController.upload, (req, res) => {
  let myFileName = req.file.originalname.split(".");
  const fileType = myFileName[myFileName.length - 1];

  const params = {
    Bucket: process.env.NAVER_CLOUD_BUCKET_NAME,
    Key: myFileName[0] + "." + fileType,
    Body: req.file.buffer,
  };
  const params2 = {
      params,
      req,
      res,
  }

  uploadController.uploadFile(params2);


  if (req.file.mimetype.startsWith("image")) {
    uploadController
      .uploadImageFile(params)
      .then((result) => {
        res.json({
          resultCode: 200,
          resultFileName: result.key,
          resultMessage: 'Upload Success'
        });
      })
      .catch((err) => {
        console.log("RESULT ERROR :: " + err);
        res.json({
          resultCode: 400,
          resultMessage: err,
        });
      });
  } else {
    uploadController.uploadOtherFile(params, req.file, res, req);
  }
});

module.exports = router;
