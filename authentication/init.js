const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const authenticationMiddleware = require('./middleware')
const bcrypt = require('bcrypt');

var mysql      = require('mysql');
var con = mysql.createConnection({
  host     : '172.30.101.38',
  user     : 'user7KP',
  password : '4yjqIOWhUtUmwiU6',
  database : 'sampledb'
})
con.connect();

const user = {
  username: 'sara',
  password: 'password',
  id: 1
}

function findUser (username, callback) {
    con.query(
        'SELECT * FROM users where username = ?',
        [username],
        function(err, rows, fields) {
            if (err) {
                console.log('Error while performing Query.');
                callback(null)
            } else {
                callback(null, rows[0])
            }
        } 
    )
}

passport.serializeUser(function (user, cb) {
    cb(null, user.username)
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