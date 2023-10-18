var express = require('express')
var router = express.Router()
const searchGenomes = require('../utils/searchGenomes');
const getGatherData = require('../utils/getGatherData');
const log = require('debug')('routes:searchResults');

// GET request for searching. If errors (wrong category etc.) then return to home page
router.get('/', async function(req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }
    const category = req.query.category;
    const query = req.query.query;
    log(`Searching for ${query} in ${category}`);
    let result = [];

    // if the search is a metadata search, just use db
    if (category === "isolation_host" || category === "isolation_location" || category === "isolation_source" || category === "time_of_sampling") {
        await req.knex.select(
            "sample_id",
            'isolation_host', 'isolation_location', 'isolation_source', 'time_of_sampling',
        ).from(
            req.knex.select("*").distinctOn('sample_id')
                .from('metadata')
                .orderBy('sample_id', 'asc')
                .orderBy('created', 'desc')
                .as('metadata')
        )
            .where(category, 'ILIKE', '%' + query + '%')
            .then((results) => {
                result = results;
            })
            .catch((err) => {
                log(err);
            });
        log(result);
    } else {
        // else, use searchGenomes util
        try {
            result = searchGenomes(query, category);
        } catch (err) {
            log(err);
        }
    }
    // at this stage, result is an array of sample_ids OR an array of objects with sample_ids and metadata already
    if (result.length === 0) {
        log("No results found");
    }else if (result[0]?.sample_id) {
        // objects, add gather data
        result = result.map((r) => {
            return { 
                ...r, 
            ...getGatherData(r.sample_id)
            }
        });
    }else{
        // just sample names, add metadata and gather data
        const metadata = await req.knex.select(
            "sample_id",
            'isolation_host', 'isolation_location', 'isolation_source', 'time_of_sampling',
        ).distinctOn('sample_id')
            .from('metadata')
            .whereIn('sample_id', result)
            .orderBy('sample_id', 'asc')
            .orderBy('created', 'desc');
        result = result.map((r) => {
            const sampleMetadata = metadata.find((m) => m.sample_id === r);
            return {
                sample_id: r,
                ...sampleMetadata,
                ...getGatherData(r),
            };
        });
    }
        log(result);


    // Get some metadata about the samples that have been returned. Limit to 50
    const samples = result.slice(0, 50);
    log(`Rendering with ${query}`);
    res.render('pages/searchResults', { samples, query, category, number: samples.length, userLoggedIn: userLoggedIn })

});

module.exports = router;
