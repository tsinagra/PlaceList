var express = require('express');
var router = express.Router();
var pg = require('pg');
var connString = 'postgres://tsinagra@localhost/placelist';

/* GET list page */
router.get('/', function(req, res, next){
    allPlaces(function(err, results) {
        res.render('list', {title: 'List', places: results });
    });
});

/* GET new list page */
router.get('/new', function(req, res, next) {
    res.render('newplace', {title: 'New Place', action: 'create'})
});

router.post('/save', function(req, res, next) {
    insertPlace(req, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/list');
        }
    });
});

router.post('/save/:id', function(req, res, next) {
    savePlace(req.params.id, req.body, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/list');
        }
    });
});

router.get('/edit/:id', function(req, res, next) {
    getPlaceById(req.params.id, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            res.render('newplace', {title: 'Edit Place', place: result, action: 'update'});
        }
    });
});

router.get('/delete/:id', function(req, res, next) {
    getPlaceById(req.params.id, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            res.render('newplace', {title: 'Delete Place', place: result, action: 'delete'});
        }
    });
});

router.post('/delete/:id', function(req, res, next) {
    deletePlaceById(req.params.id, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/list');
        }
    });
});

function allPlaces(callback) {
    var results =[];

    pg.connect(connString, function(err, client, done) {
        if (err) {
            done();
            console.log(err);
            callback(err, null)
        }

        client.query('SELECT * FROM places ORDER BY id ASC', function(err, results) {
            done();
            if (err) {
                console.log(err);
                callback(err, null);
            }
            callback(null, results.rows);
        });
    });
};

function insertPlace(req, callback) {
    pg.connect(connString, function(err, client, done) {
        if (err) {
            done();
            callback(err, null);
        }

        var query = 'INSERT INTO places (name, rank1, rank2) VALUES($1, $2, $3)';
        var params = [req.body.name, req.body.rank1, req.body.rank2]
        client.query(query, params, function(err, result) {
            if (err) {
                callback(err, null);
            }
            callback(null, result);
        });
    });
}

function savePlace(id, body, callback) {
    pg.connect(connString, function(err, client, done) {
        if (err) {
            done();
            callback(err, null);
        }

        var query = 'UPDATE places set name=$1, rank1=$2, rank2=$3, date_updated=$4 WHERE id=$5';
        var params =  [body.name, body.rank1, body.rank2, new Date(), id]
        client.query(query, params, function(err, result) {
            if (err) {
                done();
                callback(err, null)
            }
            callback(null, true);

        });
    });
}

function deletePlaceById(id, callback) {
    pg.connect(connString, function(err, client, done) {
        if (err) {
            done();
            callback(err, null);
        }

        var query = 'DELETE FROM places WHERE id=$1';
        client.query(query, [id], function(err, result) {
            if (err) {
                done();
                callback(err, null);
            }
            callback(null, true);
        })
    });
}

function getPlaceById(id, callback) {
    pg.connect(connString, function(err, client, done) {
        if (err) {
            done();
            callback(err, null);
        }
        
        var query = 'SELECT * FROM places where id = $1';
        client.query(query, [id], function(err, result) {
            if (err) {
                callback(err, null);
            }
            callback(null, result.rows);
        });
    });
}

module.exports = router;