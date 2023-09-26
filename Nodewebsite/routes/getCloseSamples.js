var express = require('express')
var router = express.Router()
let url = require('url')
const getMashDistances = require('../utils/getMashDistances')
const getGatherData = require('../utils/getGatherData')
const getMLST = require('../utils/getMLST')
const getAllSampleNames = require('../utils/getAllSampleNames')
const getANI = require('../utils/getANI')

// Returns close samples and their metadata for use in the funcional network view
router.get('/', async function(req, res) {
    const sampleId = req.query.sampleId;
    const allSamples = getAllSampleNames();
    // get the mash distances
    const distances = await getMashDistances(sampleId);
    // get the ani distances
    const ani = await getANI(sampleId);


    // get metadata where sampleId in others using knex
    const metadata = await req.knex.select(
        "sample_id",
        'isolation_host', 'isolation_location', 'isolation_source', 'time_of_sampling', 
    ).distinctOn('sample_id')
        .from('metadata')
        .whereIn('sample_id', allSamples)
        .orderBy('sample_id', 'asc')
        .orderBy('created', 'desc');
    const sequence_types = allSamples.map((s) => {
        const mlst = getMLST(s);
        return { sample_id: s, sequence_type: mlst?.sequence_type };
    });
    const species = allSamples.map((s) => {
        const gather = getGatherData(s);
        return { sample_id: s, species: gather?.species };
    });
    // merge all the stuff
    const closeSamples = allSamples.map((s) => {
        const sampleMetadata = metadata.find((m) => m.sample_id === s);
        const sampleSequenceType = sequence_types.find((m) => m.sample_id === s);
        const sampleSpecies = species.find((m) => m.sample_id === s);
        return {
            sample_id: s,
            mash_distance: distances[s],
            ani: ani?.[s],
            sequence_type: sampleSequenceType?.sequence_type,
            species: sampleSpecies?.species,
            ...sampleMetadata,
        };
    });
    // NOTE: With thousands of samples, this may be slow. Consider filtering
    // here before sending to client.
    res.json(closeSamples);
})

module.exports = router;
