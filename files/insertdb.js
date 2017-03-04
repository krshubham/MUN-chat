var country_list = require('./country_list.json');

var db = require('../db');
var connString = 'mongodb://localhost:27017/agenda';

//db connection
const url = 'mongodb://localhost:27017/fun';
db.connect(url, function (err) {
    if (err) {
        console.log(err);
    }
    //unsc, disec, unhrc, tll, osce, iaea
    /*
     * @param { country: 'Afghanistan',
     * council_code: 'unsc',
     * allot: '1',
     * id: '1' }
     **/

    var unsc = db.get().collection('unsc');
    var disec = db.get().collection('disec');
    var unhrc = db.get().collection('unhrc');
    var tll = db.get().collection('tll');
    var osce = db.get().collection('osce');
    var iaea = db.get().collection('iaea');

    country_list.forEach(function (country) {
        if (country.council_code === 'unsc') {
            unsc.insertOne(country).then(function (cb) {
                console.log('imported the following successfully');
                console.log(cb.ops[0]);
            })
                .catch(function (err) {
                    console.log(err);
                });
        }
        else if (country.council_code === 'disec') {
            disec.insertOne(country).then(function (cb) {
                console.log('imported the following successfully');
                console.log(cb.ops[0]);
            })
                .catch(function (err) {
                    console.log(err);
                });
        }
        else if (country.council_code === 'unhrc') {
            unhrc.insertOne(country).then(function (cb) {
                console.log('imported the following successfully');
                console.log(cb.ops[0]);
            })
                .catch(function (err) {
                    console.log(err);
                });
        }
        else if (country.council_code === 'tll') {
            tll.insertOne(country).then(function (cb) {
                console.log('imported the following successfully');
                console.log(cb.ops[0]);
            })
                .catch(function (err) {
                    console.log(err);
                });
        }
        else if (country.council_code === 'osce') {
            osce.insertOne(country).then(function (cb) {
                console.log('imported the following successfully');
                console.log(cb.ops[0]);
            })
                .catch(function (err) {
                    console.log(err);
                });
        }
        else if (country.council_code === 'iaea') {
            iaea.insertOne(country).then(function (cb) {
                console.log('imported the following successfully');
                console.log(cb.ops[0]);
            })
                .catch(function (err) {
                    console.log(err);
                });
        }
    });
});

