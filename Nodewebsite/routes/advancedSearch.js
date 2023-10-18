var express = require('express')
var router = express.Router()

/**
    * GET advanced search page
    * Page with simple HTML form for advanced search
    * Redirects to routes/advSearchResults.js
*/
router.get('/', function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    res.render('pages/advancedSearch', { userLoggedIn: userLoggedIn });
});

module.exports = router;
