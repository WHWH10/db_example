var express = require('express');
var dotenv = require('dotenv')
var path = require('path');
var mime = require('mime');

var multer = require('multer')
    //var upload = multer({ dest: './uploads' })

var AWS = require('aws-sdk')

var router = express.Router();
//https://brunch.co.kr/@daniellim/43 참고할것 
dotenv.config({
    path: path.resolve(
        process.cwd(),
        process.env.NODE_ENV == "production" ? ".env" : ".env.dev"
    )
})

const s3 = new AWS.S3({
    endpoint: new AWS.Endpoint(process.env.NAVER_CLOUD_ENDPOINT),
    region: 'kr-standard',
    credentials: {
        accessKeyId: process.env.NAVER_CLOUD_KEY_ID,
        secretAccessKey: process.env.NAVER_CLOUD_SECRET_KEY
    },
})
const ID = process.env.NAVER_CLOUD_KEY_ID
const SECRET = process.env.NAVER_CLOUD_SECRET_KEY
const storage = multer.memoryStorage({
    destination: function(req, file, callback) {
        callback(null, '')
    }
})
const upload = multer({ storage: storage }).single('userfile')

/* GET home page. */
//router.get('/', function(req, res, next) {
//  res.render('index', { title: 'Express' });
//});

router.get('/', (req, res) => {
    res.render('file_upload')
})

//router.post('/', upload.single('userfile'), (req, res) => {
//    console.log(res)
//    res.json({
//        resultCode: 200,
//        resultMessage: 'Upload Success' + req.file
//    })
//})


//https://stackoverflow.com/questions/34512559/how-should-i-batch-upload-to-s3-and-insert-to-mongodb-from-nodejs-webserver-with/34513997
router.post('/', upload, (req, res) => {
    let myFileName = req.file.originalname.split(".")
    const fileType = myFileName[myFileName.length - 1]

    console.log('myFileName: ' + myFileName)
    console.log('myFileType: ' + fileType)

    const params = {
        Bucket: process.env.NAVER_CLOUD_BUCKET_NAME,
        Key: myFileName[0] + fileType,
        Body: req.file.buffer,
    }

    // console.log('fileType:: ' + req.file.mimetype)
    // console.log(process.env.NAVER_CLOUD_BUCKET_NAME)

    if (req.file.mimetype.startsWith('image')) {
        uploadImageFile(params, req.file, res)
        console.log(req.file.mimetype)
    } else {
        console.log('not image : ' + req.file.mimetype)
    }
})

function uploadImageFile(params, res) {
    s3.upload(params, (err, data) => {
        if (err) {
            res.status(500).json({
                errorCode: 500,
                errorMessage: err
            })
        } else {
            res.json({
                resultCode: 200,
                resultMessage: data
            })
        }
    })
}

module.exports = router;