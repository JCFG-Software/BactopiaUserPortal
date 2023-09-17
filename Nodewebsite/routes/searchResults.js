var express = require('express')
var router = express.Router()
const searchGenomes = require('../utils/searchGenomes');
const getGatherData = require('../utils/getGatherData');
const log = require('debug')('routes:searchResults');

// GET request for searching. If errors (wrong category etc.) then return to home page
// TODO: Add better error handling and communication
//
router.get('/', async function(req, res) {
    const category = req.query.category;
    const query = req.query.query;
    log(`Searching for ${query} in ${category}`);
    let result = [];

    // if the search is a metadata search, just use db
    if (category === "isolation_host" || category === "isolation_location" || category === "isolation_source" || category === "time_of_sampling") {
        // await req.knex.select("sample_id").distinctOn('sample_id')
        //     .from('metadata')
        //     .where(category, 'ILIKE', '%' + query + '%')
        //     .orderBy('sample_id', 'asc')
        //     .orderBy('created', 'desc')
        //     .then((results) => {
        //         result = results.map((r) => r.sample_id);
        //     })
        //     .catch((err) => {
        //         log(err);
        //     });
        // the above, but only the where clauses on the distinct sample_ids
        await req.knex.select("sample_id").from(
            req.knex.select("*").distinctOn('sample_id')
                .from('metadata')
                .orderBy('sample_id', 'asc')
                .orderBy('created', 'desc')
                .as('metadata')
        )
            .where(category, 'ILIKE', '%' + query + '%')
            .then((results) => {
                result = results.map((r) => r.sample_id);
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
    // Get some metadata about the samples that have been returned. Limit to 50
    const samples = result.slice(0, 50).map((sample) => {
        return getGatherData(sample);

    });
    log(`Rendering with ${query}`);
    res.render('pages/searchResults', { samples, query, category, number: samples.length, userLoggedIn: res.locals.userLoggedIn })

});

module.exports = router;
