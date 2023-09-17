var express = require('express')
var router = express.Router()
const searchGenomes = require('../utils/searchGenomes');
const getGatherData = require('../utils/getGatherData');
const log = require('debug')('routes:advSearchResults');

router.get('/', async function(req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    //TODO clean this up
    const {
        sequence_type,
        annotations,
        species,
        isolation_host,
        isolation_location,
        isolation_source,
        time_of_sampling,
    } = req.query;

    let results = null;

    // First -> do a db query for the metadata fields that are not null (host, location, source, time)
    if(isolation_host || isolation_location || isolation_source || time_of_sampling) {
    results  = await req.knex.select("sample_id").distinctOn('sample_id')
        .from('metadata')
        .modify(function (queryBuilder) {
            if (isolation_host) queryBuilder.where('isolation_host', 'ILIKE', '%' + isolation_host + '%');
            if (isolation_location) queryBuilder.where('isolation_location', 'ILIKE', '%' + isolation_location + '%');
            if (isolation_source) queryBuilder.where('isolation_source', 'ILIKE', '%' + isolation_source + '%');
            if (time_of_sampling) queryBuilder.where('time_of_sampling', 'ILIKE', '%' + time_of_sampling + '%');
        })
        .orderBy('sample_id', 'asc')
        .orderBy('created', 'desc');
    results = results.map((r) => r.sample_id);
    }

    log(results);


    // NOTE: Maybe really slow but works for now
    // TODO: Make file interactions async and non-blocking  
    //
    // conduct three searches, then take the intersection of the results
    if (sequence_type) {
        const seq_results = searchGenomes(sequence_type, "sequence_type");
        results = results ? results.filter(value => seq_results.includes(value)) : seq_results;
    }
    if (annotations) {
        const an_results = searchGenomes(annotations, "annotations");
        results = results ? results.filter(value => an_results.includes(value)) : an_results;
    }
    if (species) {
        const sp_results = searchGenomes(species, "species");
        results = results ? results.filter(value => sp_results.includes(value)) : sp_results;
    }
    let number = results?.length;

    const samples = results.map((id) => {
        return getGatherData(id);
    });

    res.render('pages/advSearchResults', { samples, number: number, userLoggedIn: userLoggedIn });
});

module.exports = router
