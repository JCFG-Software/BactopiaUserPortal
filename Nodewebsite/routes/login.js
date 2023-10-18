var express = require('express')
var router = express.Router()
let bcrypt = require('bcrypt');
const log = require('debug')('routes:login')

/**
    * GET login page
    * Page with simple HTML form for logging in
    * Form submits to below POST route
    */
router.get('/', function(req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }
    res.render('pages/login', { userLoggedIn: userLoggedIn, creationSuccess: false, userNotRegistered: false });
});

/**
    * POST login page
    * validates input and logs in
    * redirects to home page on success
    */
router.post('/', function(req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;

    }
    let email = decodeURIComponent(req.body.email);
    req.knex.select("*").from("registered_users").where({ email: email }).then((result_registered_users, err) => {
        if (result_registered_users.length !== 1) {
            var userNotRegistered = true;
            res.render('pages/login', { userLoggedIn: userLoggedIn, creationSuccess: false, userNotRegistered: userNotRegistered });
        } else {
            bcrypt.compare(req.body.password, result_registered_users[0].password, function(err, result) {
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
                    });
                }
            });
        }
    }).catch((err) => {
        log(`Could not login for ${email}.`);
        log(err);
    });

});

module.exports = router;
