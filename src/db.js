/**
 * Created by ks on 08/01/17.
 */
//db.js

//lets make a db connection for all files to share

import mongodb from 'mongodb';

const mongo = mongodb.MongoClient;

let state = {
    db: null
};

function connect(url,done){
    if(state.db)
        return done();
    mongo.connect(url, function (err,db) {
        if(err)
            return done(err);
        state.db = db;
        done();
    });
}

function get(){
    return state.db;
}

function close(done) {
     if(state.db){
         state.db.close(function (err) {
            state.db = null;
            done(err);
         });
     }
}

export default {
    connect,
    get,
    close
};