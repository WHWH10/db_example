var express = require('express');
var router = express.Router();

/* GET hear-rate page. */
router.get('/', (req, res) => {
    res.json({ resultCode: 200, resultMessage: 'Heart Rate Sample API' })
    console.log('heart-rate api')
})

module.exports = router;