var express = require('express')
var router = express.Router()
const getGatherData = require('../utils/getGatherData')

/**
    * GET favourites page
    * view all favourited samples for a user
    */
router.get('/', async function(req, res) {
    let favorites = [];

    // if not logged in, can't have favourites
    if (!req.session.userStatus === "loggedIn") {
        // redirect to '/'
        res.redirect('/');
    }

    const userLoggedIn = true;
    let value = req.session.userEmail;
    let email = decodeURIComponent(value);
    let favouriteIds = [];

    // get sample IDs from DB
    let favs = await req.knex
        .select('*')
        .from('user_favorites')
        .where({ email: email });

    // flatten
    favs.forEach(fav => {
        favouriteIds.push(fav.sample_id);
    });

    // get metadata for each sample
    favorites = await Promise.all(favouriteIds.map(async (f) =>
        // get the metadata
        getGatherData(f)
    ));

    // Append metadata for each sample to favs
    for (const samples of favorites) {
        const metadatas = await req.knex.select('isolation_host', 'isolation_source', 'isolation_location', 'time_of_sampling', 'notes').from('metadata')
            .where({ sample_id: samples.sample }).orderBy('created', 'desc');
        if (metadatas.length == 0) {
            metadatas.push({ isolation_host: 'Unknown', isolation_source: 'Unknown', isolation_location: 'Unknown', time_of_sampling: 'Unknown', notes: 'None' })
        }
        samples.host = metadatas[0].isolation_host
        samples.source = metadatas[0].isolation_source
        samples.location = metadatas[0].isolation_location
        samples.time = metadatas[0].time_of_sampling
        samples.notes = metadatas[0].notes
    }

    res.render('pages/favourites', { userLoggedIn: userLoggedIn, favorites: favorites, haveFavs: true });
});


/**
    * POST favourites page
    * Remove a sample from favourites
    */
router.post('/', function(req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";

    let sampleID = req.body.favouritedSampleID;

    if (userLoggedIn) {
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);

        req.knex('user_favorites')
            .where({ email: email, sample_id: sampleID })
            .del()
            .then((_deleted) => {
                res.redirect('/favourites');
            })
    }

});

module.exports = router;
