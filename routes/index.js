var express = require('express');
var dotenv = require('dotenv')
var path = require('path');
var router = express.Router();

dotenv.config({
    path: path.resolve(
        process.cwd(),
        process.env.NODE_ENV == "production" ? ".env" : ".env.dev"
    )
})

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

// router.get('/', (req, res) => {
//     res.json({
//         'userId': process.env.id,
//         'password': process.env.password
//     })
// })

module.exports = router;