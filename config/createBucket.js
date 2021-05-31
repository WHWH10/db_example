const AWS = require('aws-sdk')
var dotenv = require('dotenv')
var path = require('path');

dotenv.config({
    path: path.resolve(
        process.cwd(),
        process.env.NODE_ENV == "production" ? ".env" : ".env.dev"
    )
})

const ID = process.env.NAVER_CLOUD_KEY_ID
const SECRET = process.env.NAVER_CLOUD_SECRET_KEY
const BucketName = process.env.NAVER_CLOUD_BUCKET_NAME

const s3 = new AWS.S3({
    endPoint: AWS.Endpoint('kr.object.ncloudstorage.com'),
    region: 'kr-standard',
    credential: {
        accessKeyId: ID,
        secretAccessKey: SECRET,
    }
})