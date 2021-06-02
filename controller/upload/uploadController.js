const { reject } = require("lodash");
var _ = require("lodash");

var commonController = require("../common/commonController");

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

// Naver Cloud Object Storage에 있는 전체 파일 목록 불러오기
// async function getAllFileList(res) {
//   var params = {
//     Bucket: process.env.NAVER_CLOUD_BUCKET_NAME,
//     MaxKeys: 300,
//   };

//   // List All Objects
//   console.log("List All In The Bucket");
//   console.log("==========================");

//   params.Delimiter = '/';
//   while (true) {
//     let response = await commonController.s3.listObjectsV2(params).promise();

//     for(let content of response.Contents) {
//         console.log(`    Name = ${content.Key}, Size = ${content.Size}, Owner = ${content.Owner.ID}`);
//     }

//     if(response.IsTruncated) {
//         params.Marker = response.NextMarker;
//     } else {
//         break;
//     }
//   }
// }

// async function getAllFileList(res) {
//   var params = {
//     Bucket: process.env.NAVER_CLOUD_BUCKET_NAME,
//     MaxKeys: 300,
//   };

//   var folderList = [];
//   var contentList = [];

// //   params.Delimiter = '/';

//   let response = await commonController.s3
//     .listObjectsV2(params)
//     .promise()
//     .then((result) => {
//         for(let contents in result.Contents) {
//             contentList.push(contents)
//         }
//         return contentList;
//     })
//     .catch((err) => {
//         return err;
//     });

//     return response;

// }

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

  const listObjects = params => {
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
}


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
  uploadImageFile,
  uploadOtherFile,
  //   getAllFileList,
  getFileList,
  downloadFile,
  readFile,
  listAllKeys,
  listObjects,
  uploadConvertJson: uploadConvertJson,
};
