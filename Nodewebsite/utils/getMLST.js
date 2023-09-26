const fs = require('fs')
const path = require('path')
const log = require('debug')('utils:getMLST')


function getMLST(runName){
    if (!runName || !process.env.SAMPLES_DIR) {
        log(`runName or SAMPLES_DIR not set`);
        return null;
    }

    const mlstFile = path.join(
        process.env.SAMPLES_DIR,
        runName,
        'tools',
        'mlst',
        runName + '.tsv',
    );

    // read the file into an object
    if (!fs.existsSync(mlstFile)) {
        log(`Could not find mlst file ${mlstFile}`);
        return null;
    }
    const mlstData = fs.readFileSync(mlstFile, 'utf8');
    // parse as tsv line
    // filename <TAB> PubMLST scheme <TAB> sequence_type <TAB> [allele IDs <TAB> ...]
    const mlstObj = {};
    const lines = mlstData.split('\n'); // should just be one line
    const data = lines[0].split('\t');
    if (data.length < 3) {
        log(`mlst file ${mlstFile} doesn't have the normal number of columns`);
        return null;
    }
    mlstObj['filename'] = data[0];
    mlstObj['scheme'] = data[1];
    mlstObj['sequence_type'] = data[2];
    mlstObj['alleles'] = data.slice(3);
    return mlstObj;
}

module.exports = getMLST;
