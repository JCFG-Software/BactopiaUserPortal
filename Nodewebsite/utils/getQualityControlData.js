const fs = require('fs');
const path = require('path');
const log = require('debug')('utils:getQualityControlData');

/*
    * Get JSON data from quality control files for a given sample
    * @param {string} name - name of the sample, and the folder it's in
    * @return {array} - array of objects with each object being a QC json file
    *
*/
function getQualityControlFiles(runName){
    // so just return the names and paths of files in the QC directory
    // return as { [key: string]: string }[]
    if (!runName || !process.env.SAMPLES_DIR) {
        log(`runName or SAMPLES_DIR not set`);
        return {};
    }
    const qcDir = path.join(process.env.SAMPLES_DIR, runName, 'main', 'qc', 'summary');
    if (!fs.existsSync(qcDir)) {
        log(`Could not find QC directory ${qcDir}`);
        return {};
    }
    const qcFiles = fs.readdirSync(qcDir);
    // filter to json files
    const qcData = [];
    qcFiles.forEach((file) => {
        if (file.endsWith('.json')) {
            // read the JSON and add to array
            const qcFile = fs.readFileSync(path.join(qcDir, file));
            const qcFileObj = JSON.parse(qcFile)?.qc_stats;
            if (!qcFileObj) {
                // bad file
                return;
            }
            // add the name of the file to the object
            qcFileObj.name = file.replace('.json', '');
            qcData.push(qcFileObj);
        }
    });
    return qcData;
}

module.exports = getQualityControlFiles;
