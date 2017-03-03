/**
 * Created by ks on 03/03/17.
 */
var express = require('express');
var router  = express.Router();

router.get('/', function (req,res) {
    res.render('press_login',{
        title: 'Internation Press | VITC MUN'
    });
});

module.exports = router;