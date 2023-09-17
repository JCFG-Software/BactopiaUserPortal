/*
    * @api {get} /result Result
    *
*/


const express = require('express');
const getGatherData = require('../utils/getGatherData');
const getAssemblerData = require('../utils/getAssemblerData');
const getAnnotations = require('../utils/getAnnotations');
const getQualityControlData = require('../utils/getQualityControlData');
const getMLSTData = require('../utils/getMLST');
const getAllSamples = require('../utils/getAllSampleNames');


const { exec } = require('child_process');
const fs = require('fs');
const router = express.Router()
let url = require('url')
const log = require('debug')('routes:result')

// Result page endpoint 
router.get('/', async function(req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let sampleName = req.query.sampleSelection;
    log(`Sample Name: ${sampleName}`);
    req.session.prevSample = sampleName;
    req.session.favourited = false; // Assume that sample is not favorited before check

    if (userLoggedIn) {
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        let fav_results = await req.knex.select('*').from('user_favorites').where({ email: email, sample_id: sampleName })

        if (fav_results.length > 0) {
            req.session.favourited = true;
        }
    }
    let getGroups = req.knex.select('group_id', 'name').from('groups').where({ email: '' });
    let sampleGroups;
    let alreadyInGroups = [];

    if (userLoggedIn) {
        alreadyInGroups = Array.from(req.knex.select('group_id').from('group_samples').where({ sample_id: sampleName }));
        log(`Already in groups: ${alreadyInGroups}`);
        getGroups = req.knex.select('group_id', 'name')
            .from('groups')
            .where({ email: decodeURIComponent(req.session.userEmail) })

        sampleGroups =
            req.knex.select('groups.group_id', 'name')
                .from('group_samples')
                .innerJoin('groups', 'groups.group_id', 'group_samples.group_id')
                .where({ sample_id: sampleName, email: decodeURIComponent(req.session.userEmail) })
    }

    /*
        * Error page, if URL is incorrect or not found
    */
    errorPageConfig = {
        description: 'sample',
        query: 'sampleSelection',
        id: sampleName,
        endpoint: '/result',
        userLoggedIn: userLoggedIn,
    };

    /*
        * Intended Flow:
        * 1. Check sample exists by checking gather data exists
        * 2. Collate any other data available for the sample
        * 3. Render the page 
    */

    // Check if the sample exists
    const gather = getGatherData(sampleName);
    if (!gather) {
        res.render('pages/error', errorPageConfig);
        return;
    }
    // get dropdown summary content

    const assembly = getAssemblerData(sampleName);
    const qc = getQualityControlData(sampleName);
    const annotations = getAnnotations(sampleName);

    const metadatas = await req.knex.select('isolation_host', 'isolation_source', 'isolation_location', 'time_of_sampling', 'notes', 'email', 'created').from('metadata')
    .where({sample_id: sampleName}).orderBy('created', 'desc');
    if (metadatas.length == 0) {
        metadatas.push({isolation_host: 'Unknown', isolation_source: 'Unknown', isolation_location: 'Unknown', time_of_sampling: 'Unknown', notes: 'None'})
    }
    console.log(metadatas)
    // Tools - May or may not exist
    const mlst = getMLSTData(sampleName);

    Promise
        .all([getGroups, sampleGroups])
        .then(function([groupsInfo, sampleGroups]) {

            res.render('pages/result', {
                summary: gather,
                userMeta: metadatas,
                userLoggedIn: userLoggedIn,
                sample_ID: sampleName,
                isFavourited: req.session.favourited,
                metadata: gather,
                result_assembly_summary: assembly,
                sequence_summary: qc,
                mlst: mlst,
                annotations: annotations,
                avail_groups: groupsInfo,
                in_groups: alreadyInGroups,
                sample_groups: sampleGroups,
            });
        })
        .catch(function(err) {
            console.log(err);
            res.render('pages/error', errorPageConfig);
        });



    return;
});

// Favorites endpoint
router.post('/', function(req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let isFavourite = req.session.favourited;
    let email = "NA";
    let sampleID = req.session.prevSample;

    let errorPageConfig = {
        description: '',
        query: 'Favoriting a sample',
        id: sampleID,
        endpoint: '/result',
        userLoggedIn: userLoggedIn
    };

    if (userLoggedIn) {
        if (isFavourite) {
            let value = req.session.userEmail;
            let email = decodeURIComponent(value);
            // Delete from database, if record exists
            req.knex('user_favorites')
                .where({ email: email, sample_id: sampleID })
                .del()
                .then((result) => {
                    console.log(`User favorites record ${email}-${sampleID} has been deleted successfully`);
                    res.redirect(url.format({
                        pathname: "/result",
                        query: {
                            sampleSelection: sampleID
                        }
                    }));
                })
                .catch((error) => {
                    console.log(`User favourites record ${email}-${sampleID} does not exist and cannot be deleted`);
                    errorPageConfig.description = `User favourites record ${email}-${sampleID} does not exist and cannot be deleted`;
                    res.render('pages/error', errorPageConfig);
                })
        }
        else {
            let value = req.session.userEmail;
            let email = decodeURIComponent(value);
            console.log(email);
            // Unique constraint applied in postgres database
            req.knex('user_favorites')
                .insert({ email: email, sample_id: sampleID })
                .then((result) => {
                    console.log(`${sampleID} added to ${email}'s' favourites`);
                    res.redirect(url.format({
                        pathname: "/result",
                        query: {
                            sampleSelection: sampleID
                        }
                    }));
                })
                .catch((error) => {
                    console.log("Already added to favourites");
                    errorPageConfig.description = "Sample already in favorites";
                    res.render('pages/error', errorPageConfig);
                })
        }
    }
    else {
        res.redirect(url.format({
            pathname: "/result",
            query: {
                sampleSelection: sampleID
            }
        }));
    }

});

module.exports = router;
