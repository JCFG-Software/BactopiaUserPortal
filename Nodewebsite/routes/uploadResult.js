var express = require('express')
var router = express.Router()
let url = require('url')

router.get('/', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let sampleID = req.query.sampleSelection;
    req.session.prevSample = sampleID;
    req.session.favourited = false; // Assume that sample is not favorited before check

    if (userLoggedIn){
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        req.knex.select('*').from('user_favorites').where({email: email, sample_id: sampleID}).then((fav_results) => {
            //console.log(`Results are: ${JSON.stringify(fav_results)}`);
            if (fav_results.length > 0) {
                req.session.favourited = true;

            }
        });
    }

    // Setup error page config
    errorPageConfig = { description: 'sample', query: 'sampleSelection', id: sampleID, endpoint: '/result', userLoggedIn: userLoggedIn };

    let name = "";
    let sequence_type = 0;
    let location = "";
    let host = "";
    let iso = "";

    if (req.query.name){
        name = req.query.name;
    }
    else name = 'New sample'
    if (req.query.st) {
        sequence_type = req.query.st;
    }
    if (req.query.location) {
        location = "%"+req.query.location+"%";
    }
    if (req.query.host) {
        host = "%"+req.query.host+"%";
    }
    if (req.query.isolation_source) {
        iso = "%"+req.query.isolation_source+"%";
    }

    let same_sequence_samples = req.knex.select('sample_id').from('sample_metadata').where({st: sequence_type});
    let getSameSequenceSampleInfo = req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
        name: 'sample_sample.name', id: 'sample_sample.id'}) 
        .from('mlst_mlst')
        .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
        .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
        .where('mlst_mlst.sample_id', 'in', same_sequence_samples)
        .limit(20);

    let same_location_samples = req.knex.select('sample_id').from('sample_metadata').whereRaw('metadata->>? ILIKE ?', ['country', location]);
    let getSameLocationSampleInfo = req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
        name: 'sample_sample.name', id: 'sample_sample.id'})
        .from('mlst_mlst')
        .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
        .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
        .where('mlst_mlst.sample_id', 'in', same_location_samples)
        .limit(20);

    let same_host_samples = req.knex.select('sample_id').from('sample_metadata').whereRaw('metadata->>? ILIKE ?', ['host', host]);
    let getSameHostSampleInfo = req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
        name: 'sample_sample.name', id: 'sample_sample.id'})
        .from('mlst_mlst')
        .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
        .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
        .where('mlst_mlst.sample_id', 'in', same_host_samples)
        .limit(20);

    let same_iso_samples = req.knex.select('sample_id').from('sample_metadata').whereRaw('metadata->>? ILIKE ?', ['isolation_source', iso]);
    let getSameIsoSourceSampleInfo = req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
        name: 'sample_sample.name', id: 'sample_sample.id'})
        .from('mlst_mlst')
        .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
        .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
        .where('mlst_mlst.sample_id', 'in', same_iso_samples)
        .limit(20);

    Promise
        .all([getSameSequenceSampleInfo, getSameLocationSampleInfo, getSameHostSampleInfo, getSameIsoSourceSampleInfo])
        .then(function([same_sequence, same_location, same_host, same_isolation, ]) {
            for (same of same_sequence) {
                same.country = same.metadata.country;
                same.strain = same.metadata.strain;
                same.host = same.metadata.host;
                same.isolation_source = same.metadata.isolation_source;
            }

            for (same of same_location) {
                same.country = same.metadata.country;
                same.strain = same.metadata.strain;
                same.host = same.metadata.host;
                same.isolation_source = same.metadata.isolation_source;
            }

            for (same of same_host) {
                same.country = same.metadata.country;
                same.strain = same.metadata.strain;
                same.host = same.metadata.host;
                same.isolation_source = same.metadata.isolation_source;
            }

            for (same of same_isolation) {
                same.country = same.metadata.country;
                same.strain = same.metadata.strain;
                same.host = same.metadata.host;
                same.isolation_source = same.metadata.isolation_source;
            }

            res.render('pages/uploadResult', {
                uploaded: {
                    name: name,
                    st: req.query.st,
                    country: req.query.location,
                    host: req.query.host,
                    isolation_source: req.query.isolation_source,
                },
                userLoggedIn: userLoggedIn,
                same_hosts: same_host,
                same_locations: same_location,
                same_sequences: same_sequence,
                same_isolations: same_isolation,
            });
        })
        .catch(function(err) {
            console.log(err);
            res.render('pages/error', errorPageConfig);
        });
});

module.exports = router;
