var express = require('express')
var router = express.Router()
const getAllSampleNames = require('../utils/getAllSampleNames')
// advanced search page
router.get('/', async function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
        userEmail = req.session.userEmail;
    }
    const sampleNames = getAllSampleNames();
    res.render('pages/uploadSample', { userLoggedIn: userLoggedIn, samples: sampleNames});
});

// route for getting json data about sample (not rendering page)
router.get('/json', async function (req, res) {
    const sampleName = req.query.sampleName;
    const metadatas = await req.knex.select('isolation_host', 'isolation_source', 'isolation_location', 'time_of_sampling', 'notes').from('metadata')
    .where({sample_id: sampleName}).orderBy('created', 'desc');;
    if (metadatas.length == 0) {
        metadatas.push({isolation_host: '', isolation_source: '', isolation_location: '', time_of_sampling: '', notes: ''})
    }
    res.json(metadatas[0]);
});

router.post('/', function (req, res) {
    if(req.body.sample_id == undefined){
        res.redirect('/addMetadata');
        return;
    }
    let sampleID = req.body.sample_id;
    let sampleHost = req.body.host
    let sampleSource = req.body.source;
    let sampleLocation = req.body.location;
    let sampleTime = req.body.time;
    let sampleNotes = req.body.notes;

    req.knex('metadata')
    .insert({
        sample_id: sampleID,
        isolation_host: sampleHost,
        isolation_source : sampleSource,
        isolation_location: sampleLocation,
        time_of_sampling: sampleTime,
        notes: sampleNotes,
        created: new Date(),
        email: userEmail
    })
    .then(() => {
        console.log("Metadata updated");
    }).catch((err) => {
        console.log(err);
    });
    sample = encodeURIComponent(sampleID);
    res.redirect('/result?sampleSelection=' + sample);
});

module.exports = router;
