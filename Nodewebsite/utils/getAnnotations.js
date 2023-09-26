const fs = require("fs");
const path = require("path");
const log = require("debug")("utils:getAnnotations");

/*
 * getAnnotations
 * Find the annotations within the relevant directory for a
 *  given runName
 * @param {string} runName - name of the run/folder
 * @return {object} - object with annotations from prokka
 */
function getAnnotations(runName) {
    if (!runName || !process.env.SAMPLES_DIR) {
        log(`runName or SAMPLES_DIR not set`);
        return null;
    }
    // get the path to the annotations
    const annotationPath = path.join(
        process.env.SAMPLES_DIR,
        runName,
        "main",
        "annotator",
        "prokka"
    );
    // check folder exists
    if (!fs.existsSync(annotationPath)) {
        log(`Could not find annotations at ${annotationPath}`);
        return null;
    }
    // get the annotations from {runName}.txt
    const annotationFile = path.join(annotationPath, `${runName}.tsv`);
    if (!fs.existsSync(annotationFile)) {
        log(`Could not find annotation file ${annotationFile}`);
        return null;
    }
    // read the file into tsv as an array of objects
    const annotations = fs.readFileSync(annotationFile, "utf8").split('\n');
    const headers = annotations.shift().split("\t");
    const annotationsArr = annotations.map((line) => {
        const obj = {};
        line.split("\t").forEach((value, index) => {
            obj[headers[index]] = value;
        });
        return obj;
    });
    if (annotationsArr.length === 0) {
        log(`No annotations found in ${annotationFile}`);
    }
    return annotationsArr;
}

module.exports = getAnnotations;
