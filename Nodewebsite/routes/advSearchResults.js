var express = require('express')
var router = express.Router()
const searchGenomes = require('../utils/searchGenomes');
const getGatherData = require('../utils/getGatherData');
const log = require('debug')('routes:advSearchResults');

/**
    * GET advanced search results page
    * Searching with multiple different fields at once
    */
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
    let metadata_results = null;

    // First -> do a db query for the metadata fields that are not null (host, location, source, time)
    if (isolation_host || isolation_location || isolation_source || time_of_sampling) {
        metadata_results = await req.knex.select(
            "sample_id", 'isolation_host', 'isolation_location', 'isolation_source', 'time_of_sampling',
        ).from(
            req.knex.select("*").distinctOn('sample_id')
                .from('metadata')
                .orderBy('sample_id', 'asc')
                .orderBy('created', 'desc')
                .as('metadata')
        )
            .modify(function(queryBuilder) {
                if (isolation_host) queryBuilder.where('isolation_host', 'ILIKE', '%' + isolation_host + '%');
                if (isolation_location) queryBuilder.where('isolation_location', 'ILIKE', '%' + isolation_location + '%');
                if (isolation_source) queryBuilder.where('isolation_source', 'ILIKE', '%' + isolation_source + '%');
                if (time_of_sampling) queryBuilder.where('time_of_sampling', 'ILIKE', '%' + time_of_sampling + '%');
            })
            .orderBy('sample_id', 'asc')
            .orderBy('created', 'desc');
    }



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

    // add gather data to all results, and metadata to the search results
    const metadata_samples = metadata_results?.map((r) => {
        return {
            ...r,
            ...getGatherData(r.sample_id)
        }
    });

    const samples = results?.map((id) => {
        const has_metadata = metadata_samples?.find((r) => r.sample_id === id);
        if (has_metadata) {
            return {
                sample_id: id,
                ...has_metadata,
                ...getGatherData(id)
            }
        }
        const metadata = req.knex.select(
            "sample_id",
            'isolation_host', 'isolation_location', 'isolation_source', 'time_of_sampling',
        ).distinctOn('sample_id')
            .from('metadata')
            .where('sample_id', id)
            .orderBy('sample_id', 'asc')
            .orderBy('created', 'desc');
        return {
            sample_id: id,
            ...metadata,
            ...getGatherData(id)
        }
    });

    // all samples is the intersection of the metadata and search results
    let all_samples = null;
    if (metadata_samples && samples) {
        all_samples = metadata_samples.filter((r) => samples.find((s) => s.sample_id === r.sample_id));
    } else if (metadata_samples) {
        all_samples = metadata_samples;
    } else if (samples) {
        all_samples = samples;
    }


    const number = all_samples?.length || 0;

    if (number === 0) {
        log("No results found for:");
        log(req.query);
        log("Metadata (db) results:");
        log(metadata_results);
        log("Search results:");
        log(results);
    }

    res.render('pages/advSearchResults', { samples: all_samples ?? [], number: number, userLoggedIn: userLoggedIn });
});

module.exports = router
