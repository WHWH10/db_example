var express = require('express');
var router = express.Router();

var heartRate = require('./data/heart_rate')
var bloodPressure = require('./data/blood_pressure')
var tempearture = require('./data/tempearture')

var dataApiUrl = 'http://localhost:3000/api/data/'
var surveyDataApiUrl = 'http://localhost:3000/api/surveyData'

router.get('/', (err, res) => {
    res.json({
        resultCode: 200,
        resultMeesage: {
            'data': dataApiUrl,
            'survey': surveyDataApiUrl
        }
    })
})

router.get('/data', (req, res) => {
        res.json({
            resultCode: 200,
            resultMessage: 'This is DATA API'
        })
    })
    .use('/data/heartRate', heartRate)
    .use('/data/bloodPressure', bloodPressure)
    .use('/data/temperature', tempearture)

module.exports = router;