var express = require('express')
var router = express.Router()
let bcrypt = require('bcrypt');

router.get('/', function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }
    res.render('pages/login', { userLoggedIn: userLoggedIn, creationSuccess: false, userNotRegistered: false });
});

router.post('/', function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;

    }
    let favorites = [];
    let suggested = [];
    let haveFavs = false;
    let haveSugs = false;
    let email = decodeURIComponent(req.body.email);

    req.knex.select("*").from("registered_users").where({ email: email }).then((result_registered_users, err) => {
        if (result_registered_users.length !== 1) {
            console.log('user not registered');
            var userNotRegistered = true;
            res.render('pages/login', { userLoggedIn: userLoggedIn, creationSuccess: false, userNotRegistered: userNotRegistered });
        } else {
            bcrypt.compare(req.body.password, result_registered_users[0].password, function (err, result) {
                //if password matched DB password
                if (result) {
                    //setting the 'set-cookie' header
                    res.cookie('setCookie', req.body.email, {
                        httpOnly: true
                    });

                    req.session.userStatus = "loggedIn";
                    req.session.userEmail = req.body.email;

                    res.redirect('/');
                } else {
                    res.render('pages/login', {
                        userLoggedIn: userLoggedIn, creationSuccess: false, userNotRegistered: true,
                        favorites: favorites.rows, suggested: suggested.rows, haveFavs: haveFavs, haveSugs: haveSugs
                    });
                }
            });
        }
    });
});

module.exports = router;
