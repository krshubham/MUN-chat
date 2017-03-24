import country_list from './country_list';

import db from '../db';

//db connection
const url = 'mongodb://localhost:27017/fun';
db.connect(url, (err) => {
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

     country_list.forEach((country) => {
        if (country.council_code === 'unsc') {
            unsc.insertOne(country).then((cb) => {
                console.log('imported the following successfully');
                console.log(cb.ops[0]);
            })
            .catch(function (err) {
                console.log(err);
            });
        }
    });
});

