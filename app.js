var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport')  
var session = require('express-session')  
var RedisStore = require('connect-redis')(session)
const MongoStore = require('connect-mongo')(session);

var bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 'ilovesara';
bcrypt.genSalt(saltRounds, function(err, salt) {
    bcrypt.hash(myPlaintextPassword, salt, function(err, hash) {
        // Store hash in your password DB.
        console.log(hash);
    });
});

// var config = require('./config')

var app = express();
app.locals.moment = require('moment');

require('./authentication').init(app)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use(session({
//     store: new RedisStore(),
//     secret: 'keyboard cat',
//     resave: true,
//     saveUninitialized: true
// }));

// var mongoUrl = 'mongodb://localhost:27017/ourplaces'
var mongoUrl = 'mongodb://user3IT:WEeVVlVVo3CRqInr@10.1.48.4:27017/sampledb'

app.use(session({
  secret: 'secrettexthere',
  saveUninitialized: true,
  resave: true,
  // using store session on MongoDB using express-session + connect
  store: new MongoStore({
    url: mongoUrl,
    collection: 'sessions'
  })
}));

app.use(passport.initialize())  
app.use(passport.session())  

require('./routes/list').init(app)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
