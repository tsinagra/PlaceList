const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const authenticationMiddleware = require('./middleware')
const bcrypt = require('bcrypt');

var monk = require('monk');
var db = monk('user3IT:WEeVVlVVo3CRqInr@10.1.48.4:27017/sampledb')

function findUser (username, callback) {
    var collection = db.get('users');
    collection.findOne({ userName: username }, function(err, user) {
        if (err) {
            console.log('Error while performing Query.');
            callback(null)
        } else {
            callback(null, user)
        }
    });
}

passport.serializeUser(function (user, cb) {
    cb(null, user.userName)
})

passport.deserializeUser(function (username, cb) {
    findUser(username, cb)
})

function initPassport () {
    passport.use(new LocalStrategy(
        function(username, password, done) {
          findUser(username, function (err, user) {
            if (err) {
              return done(err)
            }
            if (!user) {
              return done(null, false)
            }
            bcrypt.compare(password, user.password, function(err, res) {
                // res == true
                if (res) {
                    return done(null, user)
                } else {
                    return done(null, false)
                }
            })
        })
    }
))

  passport.authenticationMiddleware = authenticationMiddleware
}

module.exports = initPassport