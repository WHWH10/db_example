var express = require('express');
var dotenv = require('dotenv')
var path = require('path');

var multer = require('multer')
var upload = multer({ dest: './uploads' })

var AWS = require('aws-sdk')
var createBucket = require('../../config/createBucket')

var router = express.Router();
//https://brunch.co.kr/@daniellim/43 참고할것 
dotenv.config({
    path: path.resolve(
        process.cwd(),
        process.env.NODE_ENV == "production" ? ".env" : ".env.dev"
    )
})


const ID = process.env.NAVER_CLOUD_KEY_ID
const SECRET = process.env.NAVER_CLOUD_SECRET_KEY

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

router.post('/', upload.single('userfile'), (req, res) => {
    let myFileName = req.file.originalname.split(".")
    const fileType = myFileName[myFileName.length - 1]

    console.log('myFileName: ' + myFileName)
    console.log('myFileType: ' + fileType)

    const params = {
        Bucket: process.env.NAVER_CLOUD_BUCKET_NAME,
        Key: myFileName[0] + fileType,
        Body: req.file.buffer,
    }

    console.log(process.env.NAVER_CLOUD_BUCKET_NAME)
})

module.exports = router;