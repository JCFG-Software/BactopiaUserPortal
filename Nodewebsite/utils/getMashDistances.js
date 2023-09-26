const fs = require("fs");
const getAllSampleNames = require("./getAllSampleNames");
const log = require("debug")("utils:getMashDistances");
const { exec } = require("child_process");

/**
    * Performs a 1vALL mash comparison of a sample to all other available samples
    * @requires {string} process.env.SAMPLES_DIR - path to samples directory
    * @requires {string} mash - mash executable on path
    * @param {string} sampleName - name of sample to compare to all other samples
    * @param {31 | 21} kmers - kmer size to use for mash
    * @returns {Object} - object with keys of other sample names and values of mash distances
    */
async function getMashDistances(sampleName, kmers = 31) {
    const OS = process.platform;
    const command = OS == 'win32' ? 'wsl mash' : 'mash';
    const dir_prefix = OS == 'win32' ? `/mnt/${process.env?.SAMPLES_DRIVE || 'c'}` : '';
    const allSamples = getAllSampleNames();
    let thisSamplePath =`${process.env.SAMPLES_DIR}/${sampleName}/main/sketcher/${sampleName}-k${kmers}.msh` 
    if(allSamples.length < 2 || !fs.existsSync(thisSamplePath)){
        return {};
    }
    thisSamplePath = `${dir_prefix}${thisSamplePath}`;
    // remove this sample from the list
    allSamples.splice(allSamples.indexOf(sampleName), 1);
    let mashPaths = allSamples.map((sample) => `${process.env.SAMPLES_DIR}/${sample}/main/sketcher/${sample}-k${kmers}.msh`);
    // double check files exist, remove if not
    for(let i = 0; i < mashPaths.length; i++){
        const path = mashPaths[i];
        if(!fs.existsSync(path)){
            mashPaths.splice(i, 1);
            i--;
            log(`File ${path} does not exist, removing from mashPaths`);
        }
    }
    // add in dir prefix if on windows
    mashPaths = mashPaths.map(p => `${dir_prefix}${p}`)
    // place this sample at the front of the array
    mashPaths.unshift(thisSamplePath);

    const distances = {};

    return new Promise((resolve, reject) => {
        exec(`${command} dist -t ${mashPaths.join(' ')}`, (err, stdout, stderr) => {
            if (err) {
                log(err);
            }
            else {
                lines = stdout.split('\n');
                // remove first line with headers
                lines.shift();
                // remove last line with empty string
                lines.pop();
                lines.forEach((line) => {
                    const [other, similarity] = line.split('\t');
                    distances[other] = similarity;
                });
            }
            resolve(distances);
        });
    });
}

module.exports = getMashDistances;
