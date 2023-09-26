const fs = require('fs');
const path = require('path');
const log = require('debug')('utils:getAssemblerData');

/** Get assembly data about a sample. This includes the makeup
 * of the genome (contigs, etc) and the assembly statistics
 * @param {string} runName - name of the run/folder
 * @return {object} - object with key: value metadata from assembler
 */
function getAssemblerData(runName) {
    // it's just a tsv
    // return as  { [key: string]: string }[]
    // probably only one row from what I can see, but leave room
    if (!runName || !process.env.SAMPLES_DIR) {
        log(`runName or SAMPLES_DIR not set`);
        return {};
    }
    const assemblerFile = path.join(
        process.env.SAMPLES_DIR,
        runName,
        'main',
        'assembler',
        runName + '.tsv',
    );
    if (!fs.existsSync(assemblerFile)) {
        log(`Could not find assembler file ${assemblerFile}`);
        return {};
    }
    const assemblerData = fs.readFileSync(assemblerFile, 'utf8');
    // parse as tsv file
    const assemblerDataObj = {};
    const lines = assemblerData.split('\n');
    const headers = lines[0].split('\t');
    const data = lines[1].split('\t');
    if (headers.length !== data.length) {
        log(`Assembler file ${assemblerFile} is not formatted correctly`);
        return {};
    }
    headers.forEach((header, i) => {
            assemblerDataObj[header] = data[i];
    });
    return assemblerDataObj;
}

module.exports = getAssemblerData;
