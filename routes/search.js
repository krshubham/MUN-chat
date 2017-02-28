/**
 * Created by ks on 28/02/17.
 */
var express  = require('express');
var router = express.Router();


function get(){
    console.log('get received');
}

module.exports = {
    get: get
};