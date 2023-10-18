const express = require('express')
const router = express.Router()
let bcrypt = require('bcrypt')
const log = require('debug')('routes:createAccount')

/**
    * GET create account page
    * Page with simple HTML form for creating an account
    * Form submits to below POST route
    */
router.get('/', function(req, res) {
    let userLoggedIn = false
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    res.render('pages/createAccount', { userLoggedIn: userLoggedIn });
});

/**
    * POST create account page
    * validates input and creates an account
    * redirects to home page on success
    * redirects to create account page on failure
    */
router.post('/', function(req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    let regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    const name = req.body.name;
    var email = req.body.email;
    var organisation = req.body.organisation;
    var occupation = req.body.occupation;

    if (regex.test(email)) {
        bcrypt.hash(req.body.password, 10, function(_err, hashedPassword) {
            req.knex('registered_users')
                .insert({
                    name: name,
                    email: email,
                    password: hashedPassword,
                    organisation: organisation,
                    occupation: occupation
                })
                .then(() => {
                    res.cookie('setCookie', req.body.email, {
                        httpOnly: true
                    });

                    req.session.userStatus = "loggedIn";
                    req.session.userEmail = req.body.email;

                    res.redirect('/');
                })
                .catch((err) => {
                    log(`Could not create account for ${email}.`);
                    log(err);
                    // render the page again with an error message
                    res.render('pages/createAccount', { userLoggedIn: userLoggedIn, error: "User already exists" });
                });
        });
    }
    else {
        res.render('pages/createAccount', { userLoggedIn: userLoggedIn, error: "Invalid Email" });
    }
});

module.exports = router;
