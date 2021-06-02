var _ = require("lodash");

var commonController = require("../common/commonController");
var HeartRate = require("../../models/heart_rate");

// 이미지 파일 업로드 했을 경우
function uploadFile(req, res) {
  let fileName = req.file.originalname.split(".");
  const fileType = fileName[fileName.length - 1];
  const fileMimeType = req.file.mimetype;

  if (fileMimeType.startsWith("image")) {
    const params = {
      Bucket: process.env.NAVER_CLOUD_BUCKET_NAME + "/image",
      Key: fileName[0] + "." + fileType,
      Body: req.file.buffer,
    };

    uploadImageFile(params)
      .then((result) => {
        res.json({
          resultCode: 200,
          resultFileName: result.key,
          resultMessage: "Upload Success",
        });
      })
      .catch((err) => {
        res.json({
          resultCode: 400,
          resultMessage: err,
        });
      });
  } else {
    const params = {
      Bucket: process.env.NAVER_CLOUD_BUCKET_NAME + "/" + fileMimeType,
      Key: fileName[0] + "." + fileType,
      Body: req.file.buffer,
    };
    uploadOtherFile(params)
      .then((result) => {
        res.json({
          resultCode: 200,
          resultFileName: result.key,
          resultMessage: "Upload Success",
        });
      })
      .catch((err) => {
        res.json({
          resultCode: 400,
          resultMessage: err,
        });
      });
  }
}

// 이미지 파일 등록 했을 경우
function uploadImageFile(params) {
  return new Promise((resolve, reject) => {
    commonController.s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// 이미지 파일 외 등록했을 경우
function uploadOtherFile(params) {
  return new Promise((resolve, reject) => {
    commonController.s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

const listAllKeys = (params, out = []) =>
  new Promise((resolve, reject) => {
    commonController.s3
      .listObjectsV2(params)
      .promise()
      .then(({ Contents, IsTruncated, NextContinuationToken }) => {
        out.push(...Contents);
        !IsTruncated
          ? resolve(out)
          : resolve(
              listAllKeys(
                Object.assign(params, {
                  ContinuationToken: NextContinuationToken,
                }),
                out
              )
            );
      })
      .catch(reject);
  });

const listObjects = (params) => {
  commonController.s3.listObjectsV2(params, function (err, data) {
    if (err) {
      console.log(err);
      throw err;
    } else {
      if (data != null && data != undefined) {
        let fileList = data.Contents;
        if (fileList != null && fileList.length > 0) {
          fileList.forEach((fileInfo, idx) => {
            console.log(fileInfo);
          });
        }
      } else {
        console.log(params.Prefix, "is not exists.");
      }
    }
  });
};

const fileList = (params) =>
  new Promise((resolve, reject) => {
    commonController.s3
      .listObjectsV2(params)
      .promise()
      .then((result) => {
        for (let i = 0; i < result.length; i++) {
          console.log(result[i].Key);
        }
        resolve(result);
      })
      .catch(reject);
  });

// 파일 목록 불러 온 후 성공했을 때 Key값만 출력
function getFileList(result, res) {
  var keyList = [];

  for (let i = 0; i < result.Contents.length; i++) {
    keyList.push(result.Contents[i].Key);
  }

  res.json({
    resultCode: 200,
    resultMessage: {
      resultFileName: keyList,
    },
  });
}

// 원하는 파일 다운로드
function downloadFile(req, res) {
  var fileKey = req.query["fileName"];

  const params = {
    Bucket: process.env.NAVER_CLOUD_BUCKET_NAME,
    Key: fileKey,
  };

  res.attachment(fileKey);
  var fileStream = commonController.s3.getObject(params).createReadStream();
  fileStream.pipe(res);
}

// 원하는 파일 Json으로 출력
function readFile(req, res) {
  var fileKey = req.query["fileName"];
  var params = {
    Bucket: process.env.NAVER_CLOUD_BUCKET_NAME,
    Key: fileKey,
    ResponseContentType: "application/json",
  };

  const findKey = (term) => {
    if (fileKey.includes(term)) {
      return fileKey;
    }
  };

  switch (fileKey) {
    case findKey("text/plain"):
      readTextFile(params, res);
      break;
    case findKey("text/csv"):
      readCsvFile(params, res);
      break;
    case findKey("image"):
      readImageFile(params, res);
      break;
    default:
      readDefaultFile(params, res);
      console.log("DEFAULT");
  }
}

function readTextFile(params, res) {
  return new Promise((resolve, reject) => {
    commonController.s3.getObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  })
    .then((result) => {
      const body = Buffer.from(result.Body).toString("utf8");

      // Json Mongodb 저장
      saveToMongo(uploadConvertJson(body));

      res.json({
        resultCode: 200,
        resultMessage: uploadConvertJson(body),
      });
    })
    .catch((err) => {
      res.json({
        errorCode: 400,
        errorMessage: err,
      });
    });
}

function readCsvFile(params, res) {
  return new Promise((resolve, reject) => {
    commonController.s3.getObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  })
    .then((result) => {
      res.json({
        resultCode: 200,
        resultMessage: "READ CSV FILE",
      });
    })
    .catch((err) => {
      res.json({
        errorCode: 400,
        errorMessage: err,
      });
    });
}

function readImageFile(params, res) {
  return new Promise((resolve, reject) => {
    commonController.s3.getObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  })
    .then((result) => {
      res.json({
        resultCode: 200,
        resultMessage: "http://hyd-sample.cdn.ntruss.com/" + params.Key,
      });
    })
    .catch((err) => {
      res.json({
        errorCode: 400,
        errorMessage: err,
      });
    });
}

function readDefaultFile(params, res) {
  return new Promise((resolve, reject) => {
    commonController.s3.getObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  })
    .then((result) => {
      res.json({
        resultCode: 200,
        resultMessage: result,
      });
    })
    .catch((err) => {
      console.log("readFile Error :: " + err);
      var errorCode = err.statusCode;
      var errorMessage = err.message;
      res.json({
        errorCode: errorCode,
        errorMessage: errorMessage,
      });
    });
  return res.json({
    resultCode: 200,
    resultMessage: params,
  });
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

  const header = content[0].split(",");

  return _.tail(content).map((row) => {
    return _.zipObject(header, row.split(","));
  });
}

const saveToMongo = (jsonData) =>
  new Promise((resolve, reject) => {
    if (jsonData.length != 0) {
      // var heartRate ;
      // var heartRateModel = jsonData.forEach(item => {
      //     var heartRate = new HeartRate({
      //         data_category: item.data_category,
      //         userID: item.userID,
      //         dateTimeYear: item.dateTimeYear,
      //         dateTimeHour: item.dateTimeHour,
      //         heart_rate_measurement_location: item.heart_rate_measurement_location,
      //         status_id: item.status_id,
      //         heart_rate: item.heart_rate,
      //         accuracy: item.accuracy
      //     })
      //     console.log('kkkk :: ' + `${heartRate}`)
      // })

      jsonData.forEach((item) => {
        var heartRate = new HeartRate({
          data_category: item.data_category,
          userID: item.userID,
          dateTimeYear: item.dateTimeYear,
          dateTimeHour: item.dateTimeHour,
          heart_rate_measurement_location: item.heart_rate_measurement_location,
          status_id: item.status_id,
          heart_rate: item.heart_rate,
          accuracy: item.accuracy,
        });
        console.log('heartRate :: ' + `${heartRate}`)

        heartRate.save((err) => {
            if(err) {
                console.log('SAVE MONGO ERROR :: ' + `${err}`)
            }
            else {
                console.log('save DATA mongo');
            }
        })
      });

      console.log("momo :: " + `${jsonData}`);
      console.log("save mongo :: " + `${jsonData.length}`);
      resolve(jsonData);
    } else {
      reject("err");
    }
  });

module.exports = {
  uploadFile,
  uploadImageFile,
  uploadOtherFile,
  //   getAllFileList,
  getFileList,
  downloadFile,
  readFile,
  listAllKeys,
  listObjects,
  fileList,
  uploadConvertJson: uploadConvertJson,
};
