var _ = require("lodash");

var commonController = require("../common/commonController");

// 이미지 파일 업로드 했을 경우
function uploadFile(params) {
    console.log(params.params)
}

function uploadImageFile(params) {
    return new Promise((resolve, reject) => {
        commonController.s3.upload(params, (err, data) => {
            if(err) {
                reject(err);
            } else {
                resolve(data)
            }
        })
    })
}

// 이미지 파일 외 등록했을 경우
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

  commonController.s3.upload(params, function (err, data) {
    if (err) {
      throw err;
    }
    console.log(`File uploaded successfully. ${data.Location}`);
  });

  res.render("upload_success", { title: "upload" });
}

// upload text 파일을 Json으로 변환
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

module.exports = {
    uploadFile,
  uploadImageFile: uploadImageFile,
  uploadOtherFile: uploadOtherFile,
  uploadConvertJson: uploadConvertJson,
};
