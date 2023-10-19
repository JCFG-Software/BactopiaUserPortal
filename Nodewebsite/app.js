// Require modules
const dotenv = require('dotenv');

// Check environment and use correct env file
dotenv.config({ path: '.env' });

const express = require('express');
const app = express();
const cors = require('cors');
const session = require('express-session');

const options = {
    client: 'pg',
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DB,
        user: process.env.DB_USER,
        password: process.env.DB_PASS
    }
}

const knex = require('knex')(options);

// check connection
async function checkConnection(retries = 3, timeout = 5000) {
    if (retries > 0) {
        knex.raw('SELECT 1').then(() => {
            console.log('Database connection successful');
            start();
        })
            .catch((err) => {
                console.log('Database connection failed');
                console.log('Config:');
                console.log(options);
                console.log(err);
                retries -= 1;
                console.log(`retries left: ${retries}`);
                // wait timeout ms
                new Promise(res => setTimeout(res, timeout)).then(() => {
                    console.log('retrying...');
                    checkConnection(retries--, timeout);
                });
            });
    } else {
        console.log("Could not connect to database");
        process.exit(1);
    }
}

function start() {
    // Change secret to unique value
    app.use(session({
        secret: process.env.SECRET,
        resave: true,
        saveUninitialized: false
    }));
    app.use(cors());

    //postgreSQL
    //const { Client } = require('pg');

    //const client = new Client(options.connection); //Client object is our sql database
    //client.connect();

    //BodyParser
    const bodyParser = require("body-parser");
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());

    //Cytoscape.js
    app.use('/cytoscape_scripts', express.static(__dirname + '/node_modules/cytoscape/dist/'));
    app.use('/webcola', express.static(__dirname + '/node_modules/webcola/'));
    app.use('/cola_scripts', express.static(__dirname + '/node_modules/cytoscape-cola/'));
    app.use('/popupS_scripts', express.static(__dirname + '/node_modules/popups/'));
    app.use('/typehead_scripts', express.static(__dirname + '/node_modules/typehead/'));
    app.use('/filesaver_scripts', express.static(__dirname + '/node_modules/file-saver/'));

    //directories
    app.use(express.static(__dirname + '/views/'));

    // set the view engine to ejs
    app.set('view engine', 'ejs');

    // Middleware
    let authenticateUserView = require('./middleware/authenticationViewGroup.js');
    let authenticateUserEdit = require('./middleware/authenticationEditGroup.js');

    /*
    ROUTERS
     */
    const indexRouter = require("./routes/index");
    const resultRouter = require("./routes/result");
    const advancedSearchRouter = require("./routes/advancedSearch");
    const createAccountRouter = require("./routes/createAccount");
    const searchResultRouter = require("./routes/searchResults");
    const advSearchResultRouter = require("./routes/advSearchResults");
    const loginRouter = require("./routes/login");
    const favouriteRouter = require("./routes/favourites");
    const groupsRouter = require("./routes/groups");
    const viewGroupRouter = require("./routes/viewGroup");
    const createGroupRouter = require("./routes/createGroup");
    const shareGroupRouter = require("./routes/addUserToGroup");
    const addGroupSampleRouter = require("./routes/addGroupSample");
    const removeGroupRouter = require("./routes/removeGroup");
    const removeGroupSampleRouter = require("./routes/removeGroupSample");
    const removeUserGroupAccessRouter = require("./routes/removeUserFromGroup");
    const addMetadataRouter = require("./routes/addMetadata");
    const getCloseSampleRouter = require("./routes/getCloseSamples");
    const accountRouter = require("./routes/account");


    /* --------------------------------------------------------------------------------
     *
     * GET routes
     *
     */

    // No path set, so every request uses these routes
    app.use((req, _res, next) => {
        req.knex = knex
        next()
    })

    app.use("/", indexRouter);

    app.use("/result", resultRouter);
    app.use("/advancedSearch", advancedSearchRouter);
    app.use("/createAccount", createAccountRouter);
    app.use("/searchResults", searchResultRouter);
    app.use("/advSearchResults", advSearchResultRouter);
    app.use("/login", loginRouter);
    app.use("/favourites", favouriteRouter);
    app.use("/groups", groupsRouter);
    app.use("/viewGroup", authenticateUserView, viewGroupRouter);
    app.use("/removeGroupSample", authenticateUserEdit, removeGroupSampleRouter)
    app.use("/addGroupSample", authenticateUserEdit, addGroupSampleRouter)
    app.use("/createGroup", createGroupRouter);
    app.use("/addUserToGroup", authenticateUserEdit, shareGroupRouter);
    app.use("/removeUserFromGroup", authenticateUserEdit, removeUserGroupAccessRouter);
    app.use("/addMetadata", addMetadataRouter);
    app.use("/removeGroup", removeGroupRouter);
    app.use("/getCloseSamples", getCloseSampleRouter);
    app.use("/account", accountRouter);

    /* ---------------------------------------------------------------------------*/
    app.get('/logout', function(req, res) {
        req.session.userStatus = "loggedOut";
        res.clearCookie("setCookie");
        console.log("logout user");
        res.redirect('/');
    });

    app.get('/tutorials', function(req, res) {
        userLoggedIn = req.session.userStatus === "loggedIn";
        res.render('pages/tutorials', { userLoggedIn: userLoggedIn });
    });

    // error page if route doesn't exist
    app.use(function(req, res, _next) {
        const attemptedPage = req.originalUrl;
        const errormessage = `${attemptedPage}`
        res.status(404).render('pages/error', { description: errormessage, query: '', id: '', endpoint: '', userLoggedIn: req.session.userStatus === "loggedIn" });
    });


    app.listen(process.env.PORT, function (){
    // write the port in green to the terminal
    console.log('\x1b[32m%s\x1b[0m', 'Server listening on port ', this.address().port);
    });

    
}

checkConnection();
