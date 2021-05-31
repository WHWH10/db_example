var express = require('express');
var dotenv = require('dotenv')
var path = require('path');

var multer = require('multer')
var upload = multer({ dest: './uploads' })

var router = express.Router();
//https://brunch.co.kr/@daniellim/43 참고할것 
dotenv.config({
    path: path.resolve(
        process.cwd(),
        process.env.NODE_ENV == "production" ? ".env" : ".env.dev"
    )
})

/* GET home page. */
//router.get('/', function(req, res, next) {
//  res.render('index', { title: 'Express' });
//});

router.get('/', (req, res) => {
    res.render('file_upload')
})

router.post('/', upload.single('userfile'), (req, res) => {
    console.log(res)
    res.json({
        resultCode: 200,
        resultMessage: 'Upload Success' + req.file
    })
})

module.exports = router;