/**
 * Created by ks on 09/01/17.
 */
var db = require('../../db');

function findUserByIp(ip) {
    var users = db.get().collection('Users');
    return users.findOne({ip: ip});
}

module.exports = {
    findUserByIp: findUserByIp
};
