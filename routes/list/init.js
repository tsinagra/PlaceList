const passport = require('passport')
var validator = require('validator');

var monk = require('monk');

var mongoURL = process.env.MONGODB_DB_URL || process.env.MONGO_URL
if (mongoURL == null) {
  var mongoURL = 'mongodb://localhost:27017/ourplaces'
}
console.log('List MongoURL: ' + mongoURL)
var db = monk(mongoURL)

function initUser (app) {
    app.get('/', renderLogin)
    app.get('/login', renderLogin)
        
    app.post('/login', passport.authenticate('local', {
        successRedirect: '/list',
        failureRedirect: '/'
    }))

    app.get('/logout', logoutUser)
    app.get('/list', passport.authenticationMiddleware(), renderList)
    app.get('/list/new', passport.authenticationMiddleware(), renderNew)
    app.post('/list/save', passport.authenticationMiddleware(), createPlace)
    app.post('/list/save/:id', passport.authenticationMiddleware(), savePlace)   
    app.get('/list/edit/:id', passport.authenticationMiddleware(), renderPlace)    
    app.get('/list/delete/:id', passport.authenticationMiddleware(), renderDelete)
    app.post('/list/delete/:id', passport.authenticationMiddleware(), deletePlace)
}

function renderLogin (req, res) {
    console.log('renderLogin');
    res.render('index');
}

function logoutUser(req, res) {
    req.logout();
    res.redirect('/');
}

function renderList(req, res) {
    var username = req.user.userName.charAt(0).toUpperCase() + req.user.userName.slice(1).toLowerCase();
    allPlaces(function(err, results) {
        res.render('list', {title: 'List', places: results, username: username });
    });
}

function renderNew(req, res, next) {
    var place = { name: req.body.name, rank1: req.body.rank1, rank2: req.body.rank2 }
    res.render('newplace', { title: 'New Place', action: 'create', place: place });
}

function renderNewWithMessages(req, res, messages) {
    var place = { name: req.body.name, rank1: req.body.rank1, rank2: req.body.rank2 }
    res.render('newplace', { title: 'New Place', action: 'create', place: place, messages: messages });
}

function renderPlace(req, res, next) {
    getPlaceById(req.params.id, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            res.render('newplace', { title: 'Edit Place', place: result, action: 'update' });
        }
    });
}

function renderPlaceWithMessages(req, res, messages) {
    getPlaceById(req.params.id, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            res.render('newplace', { title: 'Edit Place', place: result, messages: messages, action: 'update' });
        }
    });
}

function renderDelete(req, res) {
    getPlaceById(req.params.id, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            res.render('newplace', { title: 'Delete Place', place: result, action: 'delete' });
        }
    });
}

function allPlaces(callback) {
    var collection = db.get('places');
    collection.find( { isDeleted: false }, function(err, places) {
        if (err) {
            console.log('error fetching allPlaces');
            callback(err, null)
        } else {
            callback(null, places)
        }
    });
}

function createPlace(req, res, next) {
    messages =[]
    if (validator.isEmpty(req.body.name)) {
        messages.push('Name cannot be blank')
    }
    if (!validator.isInt(req.body.saraRating, { min: 0, max: 10 }) || !validator.isInt(req.body.toddRating, { min: 0, max: 10 })) {
        messages.push('\nRank must be between 0 and 10')    
    }
    if (messages.length > 0) {
        renderNewWithMessages(req, res, next, messages);
        return
    }

    var collection = db.get('places');
        collection.insert({
            createdDate: new Date(),
            createdBy: req.user.userName,
            name: req.body.name,
            saraRating: req.body.saraRating,
            toddRating: req.body.toddRating,
            isDeleted: false
        }, function(err, equipment) {
            if(err) throw err;
            res.redirect('/list')
    })
}

function savePlace(req, res, next) {
    messages = []
    if (validator.isEmpty(req.body.name)) {
        messages.push('Name cannot be blank')
    }
    if (!validator.isInt(req.body.saraRating, { min: 0, max: 10 }) || !validator.isInt(req.body.toddRating, { min: 0, max: 10 })) {
        messages.push('\nRank must be between 0 and 10')    
    }
    if (messages.length > 0) {
        renderPlace(req, res, next, messages);
        return
    }

    var collection = db.get('places');
    collection.update({ _id: req.params.id }, 
    { $set:
        {
            updatedDate: new Date(),
            updatedBy: req.user.userName,
            name: req.body.name,
            saraRating: req.body.saraRating,
            toddRating: req.body.toddRating,        
        }
    }, function(err, equipment) {
        if (err) throw err;
        res.redirect('/list')
    });
} 

function deletePlace(req, res) {
    var collection = db.get('places');
    collection.update({ _id: req.params.id }, 
    { $set:
        {
            updatedDate: new Date(),
            deletedBy: req.user.userName,
            isDeleted: true            
        }
    }, function(err, equipment) {
        if (err) throw err;
        res.redirect('/list')
    })
}

function getPlaceById(id, callback) {
    var collection = db.get('places');
    collection.findOne({ _id: id }, function(err, place) {
        if (err) {
            console.log('Error while performing Query.');
            callback(null)
        } else {
            callback(null, place)
        }
    });
}

function getUserById(id, callback) {
    var collection = db.get('users');
    collection.findOne({ _id: id }, function(err, user) {
        if (err) {
            console.log('error getting user by id.');
            callback(null)
        } else {
            callback(null, user)
        }
    });
}

module.exports = initUser