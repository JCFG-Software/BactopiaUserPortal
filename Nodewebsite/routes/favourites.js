var express = require('express')
var router = express.Router()
const getGatherData = require('../utils/getGatherData')

router.get('/', async function(req, res) {
    // Initial values
    let userLoggedIn = false;
    let favorites = [];
    let hasFavs = false;

    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);

        /*req.knex
            .select('*')
            .from('user_favorites')
            .where({email: email})
            .then((sampleInfos) => {
                for (sampleInfo of sampleInfos) {
                    sampleInfo.country = "Australia";
                    sampleInfo.strain = "Covid";
                    sampleInfo.host = "Humans";
                    sampleInfo.isolation_source = "Nasal swab";
                }
            res.render('pages/favourites', { userLoggedIn: userLoggedIn, favorites: sampleInfos, haveFavs: true });
            */

        let favouriteIds = [];

        let favs = await req.knex
            .select('*')
            .from('user_favorites')
            .where({ email: email });

        favs.forEach(fav => {
            favouriteIds.push(fav.sample_id);
        });
        favorites = await Promise.all(favouriteIds.map(async (f) =>
            // get the metadata
            getGatherData(f)
        ));
        // Append metadata for each sample to favs
        for (const samples of favorites) {
            const metadatas = await req.knex.select('isolation_host', 'isolation_source', 'isolation_location', 'time_of_sampling', 'notes').from('metadata')
            .where({sample_id: samples.sample}).orderBy('created', 'desc');
            if (metadatas.length == 0) {
                metadatas.push({isolation_host: 'Unknown', isolation_source: 'Unknown', isolation_location: 'Unknown', time_of_sampling: 'Unknown', notes: 'None'})
            }
            samples.host = metadatas[0].isolation_host
            samples.source = metadatas[0].isolation_source
            samples.location = metadatas[0].isolation_location
            samples.time = metadatas[0].time_of_sampling
            samples.notes = metadatas[0].notes
        }

        res.render('pages/favourites', { userLoggedIn: userLoggedIn, favorites: favorites, haveFavs: true });
    }
    else {
        // redirect to '/'
        res.redirect('/');
    }
});

router.post('/', function(req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";

    let sampleID = req.body.favouritedSampleID;

    if (userLoggedIn) {
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);

        req.knex('user_favorites')
            .where({ email: email, sample_id: sampleID })
            .del()
            .then((deleted) => {
                res.redirect('/favourites');
            })
    }

});

module.exports = router;
