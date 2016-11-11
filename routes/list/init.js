const passport = require('passport')
var validator = require('validator');

var mysql      = require('mysql');
var con = mysql.createConnection({
  host     : '172.30.101.38',
  user     : 'user7KP',
  password : '4yjqIOWhUtUmwiU6',
  database : 'sampledb'
})
con.connect();

function initUser (app) {
    app.get('/', renderLogin)
    app.get('/list', passport.authenticationMiddleware(), renderList)
        
    app.post('/login', passport.authenticate('local', {
        successRedirect: '/list',
        failureRedirect: '/'
    }))

    app.get('/logout', logoutUser)
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
    var username = req.user.username.charAt(0).toUpperCase() + req.user.username.slice(1).toLowerCase();
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
    var sql = 'SELECT p.*, u.username as created_by_username, u1.username as updated_by_username '
                + 'FROM places p ' 
                + 'JOIN users u ON u.id = p.created_by '
                + 'LEFT JOIN users u1 on u1.id = p.updated_by ' 
                + 'WHERE is_deleted = false '
                + 'ORDER BY p.id ASC'
    con.query(sql, function(err, rows, fields) {
        if (err) {
            console.log('Error while performing Query.');
            callback(err, null)
        } else {
            callback(null, rows)
        } 
    })
}

function createPlace(req, res, next) {
    messages =[]
    if (validator.isEmpty(req.body.name)) {
        messages.push('Name cannot be blank')
    }
    if (!validator.isInt(req.body.rank1, { min: 0, max: 10 }) || !validator.isInt(req.body.rank2, { min: 0, max: 10 })) {
        messages.push('\nRank must be between 0 and 10')    
    }
    if (messages.length > 0) {
        renderNewWithMessages(req, res, next, messages);
        return
    }

    var place = { name: req.body.name, rank1: req.body.rank1, rank2: req.body.rank2, created_by: req.user.id };
    con.query('INSERT INTO places SET ?', place, function(err,result){
        if(err) throw err;
        res.redirect('/list');
    });
}

function savePlace(req, res, next) {
    messages = []
    if (validator.isEmpty(req.body.name)) {
        messages.push('Name cannot be blank')
    }
    if (!validator.isInt(req.body.rank1, { min: 0, max: 10 }) || !validator.isInt(req.body.rank2, { min: 0, max: 10 })) {
        messages.push('\nRank must be between 0 and 10')    
    }
    if (messages.length > 0) {
        renderPlace(req, res, next, messages);
        return
    }

    con.query(
        'UPDATE places set name=?, rank1=?, rank2=?, date_updated=?, updated_by=? WHERE id=?',
        [req.body.name, req.body.rank1, req.body.rank2, new Date(), req.user.id, req.params.id],
        function (err, result) {
            if (err) throw err;
            console.log('Changed ' + result.changedRows + ' rows');
            res.redirect('/list')
        }
    );
} 

function deletePlace(req, res) {
    con.query(
        'UPDATE places SET is_deleted=true, deleted_by=? WHERE id=?',
        [req.user.id, req.params.id],
        function (err, result) {
            if (err) throw err;
            res.redirect('/list')
        }
    );
}

function getPlaceById(id, callback) {
    con.query(
        'SELECT * FROM places where id = ?',
        [id],
        function(err, rows, fields) {
            if (err) {
                console.log('Error while performing Query.');
                callback(err, null)
            } else {
                callback(null, rows[0])
            }
        } 
    )
}

module.exports = initUser