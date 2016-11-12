function authenticationMiddleware () {
    return function (req, res, next) {
        console.log("Auth Req: " + req.isAuthenticated())
        if (req.isAuthenticated()) {
          return next()
        }
        res.redirect('/')
    }
}

module.exports = authenticationMiddleware