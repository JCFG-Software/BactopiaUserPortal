/* Route for the home page
If User Is Logged In:
    - Render the index page with random, suggested, and favorite samples
If User Is Not Logged In:
    - Render the index page with random samples
*/

const log = require('debug')('routes:index')
const express = require('express')

const router = express.Router()
const getAllSampleNames = require('../utils/getAllSampleNames') 
const getGatherData = require('../utils/getGatherData')
const {exec} = require('child_process');
const fs = require('fs');

router.get('/', async function (req, res) {
    const userLoggedIn = req.session.userStatus === "loggedIn";

    let suggested = [];
    let favorites = [];
    const allSamples = getAllSampleNames();

    //log(`Number of samples: ${allSamples.length}`)

    // random is 3 random samples from allSamples
    const randomIds = [];
    const randomNames = [];
    while (randomIds.length < 3 && randomIds.length < allSamples.length) {
        const randomId = Math.floor(Math.random() * allSamples.length);
        if (!randomIds.includes(randomId)) {
            randomIds.push(randomId);
            randomNames.push(allSamples[randomId]);
        }
    }
    const random = await Promise.all(randomNames.map(async (r) =>
        // get the metadata
        getGatherData(r) 
    ));
    
    // Append metadata for each sample to random
    for (const samples of random) {
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

    // Find Favourites and Recommended samples if logged in
    if(userLoggedIn){
        // Gets all favourited samples
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        let favouriteIds = [];
        let favs = await req.knex
                .select('*')
                .from('user_favorites')
                .where({email: email});

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

        // Recommended is 3 random samples from the favourites
        const recommendedIds = [];
        const recommendedNames = [];
        while (recommendedIds.length < 3 && recommendedIds.length < favouriteIds.length) {
            const recommendedId = Math.floor(Math.random() * favouriteIds.length);
            if (!recommendedIds.includes(recommendedId)) {
                recommendedIds.push(recommendedId);
                recommendedNames.push(favouriteIds[recommendedId]);
            }
        }
        suggested = await Promise.all(recommendedNames.map(async (r) =>
            // get the metadata
            getGatherData(r) 
        ));
        // Append metadata for each sample of suggested
        for (const samples of suggested) {
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
    }

    if (userLoggedIn){
        log("User is logged in");
    } else {
        log("User is not logged in");
    }


    return res.render("pages/index", {
        userLoggedIn: userLoggedIn,
        randomSamples: random,
        suggested: suggested,
        favorites: favorites
    });




    if (userLoggedIn) {
        userLoggedIn = true;
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        userNotRegistered = false;

        req.knex
            .select('*')
            .from('user_favorites')
            .where({email: email})
            .limit(4)
            .then(favs => {
                if(favs.length > 0){
                    haveSugs = true;
                    haveFavs = true;

                    req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                        name: 'sample_sample.name', id: 'sample_sample.id'}) //TODO: refactor so id is removed
                        .from('mlst_mlst')
                        .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                        .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                        .modify(function (queryBuilder) {
                            queryBuilder.where('mlst_mlst.sample_id', favs[0].sample_id || 0);
                            for (i = 1; i < favs.length; i++) {
                                queryBuilder.orWhere('mlst_mlst.sample_id', favs[i].sample_id);
                            }
                        })
                        .then((favoriteSamples) => {
                            //console.log(sampleInfos);
                            for (sampleInfo of favoriteSamples) {
                                sampleInfo.country = sampleInfo.metadata.country;
                                sampleInfo.strain = sampleInfo.metadata.strain;
                                sampleInfo.host = sampleInfo.metadata.host;
                                sampleInfo.isolation_source = sampleInfo.metadata.isolation_source;
                            }

                            knex.select('name')
                                .from('sample_sample')
                                .where({id: favoriteSamples[0].sample_id})
                                .then(result => {
                                    let sampleName = result[0].name;

                                    knex.select('*')
                                        .from('weighted_distance')
                                        .where({selected_sample: sampleName})
                                        .orderBy('distance', 'asc')
                                        .limit(5)
                                        .then(close => {
                                            req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                                                name: 'sample_sample.name', id: 'sample_sample.id'}) //TODO: refactor so id is removed
                                                .from('mlst_mlst')
                                                .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                                                .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                                                .modify(function (queryBuilder) {
                                                    queryBuilder.where('sample_sample.name', close[0].comparison_sample || 0);
                                                    for (let i = 1; i < close.length; i++) {
                                                        queryBuilder.orWhere('sample_sample.name', close[i].comparison_sample);
                                                    }
                                                })
                                                .then((suggestedSamples) => {
                                                    //console.log(sampleInfos);
                                                    for (sampleInfo of suggestedSamples) {
                                                        sampleInfo.country = sampleInfo.metadata.country;
                                                        sampleInfo.strain = sampleInfo.metadata.strain;
                                                        sampleInfo.host = sampleInfo.metadata.host;
                                                        sampleInfo.isolation_source = sampleInfo.metadata.isolation_source;
                                                    }

                                                    req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                                                        name: 'sample_sample.name', id: 'sample_sample.id'})
                                                        .from('mlst_mlst')
                                                        .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                                                        .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                                                        .orderByRaw('random()')
                                                        .limit(4)
                                                        .then((random) => {
                                                            for (const same of random) {
                                                                same.country = same.metadata.country;
                                                                same.strain = same.metadata.strain;
                                                                same.host = same.metadata.host;
                                                                same.isolation_source = same.metadata.isolation_source;
                                                            }
                                                            res.render('pages/index', {
                                                                userLoggedIn: userLoggedIn,
                                                                randomSamples: random,
                                                                favorites: favoriteSamples,
                                                                suggested: suggestedSamples,
                                                                haveFavs: haveFavs,
                                                                haveSugs: haveSugs
                                                            });
                                                        });
                                                })
                                        })
                                })
                        });
                }
                else{
                    req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                        name: 'sample_sample.name', id: 'sample_sample.id'})
                        .from('mlst_mlst')
                        .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                        .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                        .orderByRaw('random()')
                        .limit(4)
                        .then((random) => {
                            for (const same of random) {
                                same.country = same.metadata.country;
                                same.strain = same.metadata.strain;
                                same.host = same.metadata.host;
                                same.isolation_source = same.metadata.isolation_source;
                            }
                            res.render("pages/index", {
                                userLoggedIn: userLoggedIn,
                                randomSamples: random,
                                haveFavs: false,
                                haveSugs: false,
                            });
                        });
                }
            });

    }
    else {
        req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
            name: 'sample_sample.name', id: 'sample_sample.id'})
            .from('mlst_mlst')
            .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
            .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
            .orderByRaw('random()')
            .limit(4)
            .then((random) => {
                for (const same of random) {
                    same.country = same.metadata.country;
                    same.strain = same.metadata.strain;
                    same.host = same.metadata.host;
                    same.isolation_source = same.metadata.isolation_source;
                }
                res.render("pages/index", {
                    userLoggedIn: userLoggedIn,
                    randomSamples: random,
                    haveFavs: false,
                    haveSugs: false,
                });
            });
    }
});

module.exports = router;
