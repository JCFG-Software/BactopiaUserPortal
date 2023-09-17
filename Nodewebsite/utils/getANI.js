
const fs = require('fs/promises');
const path = require('path');
const log = require('debug')('utils:getANI');

/**
    * @description      - Get the average nucliotide identity (ANI) between a reference
    *                    genome and all other genomes in the database.
    *                    ANI is computed using the ANIcalculator tool.
    * @requires         - Bactopia's fastANI has been computed for all genomes in the database
    *                    and stored in SAMPLES_DIR/bactopia-runs/fastani-<TIMESTAMP>
    *
    *
    *
    *
*/


async function getANI(sample_id){
    // check for samples dirA
    const SAMPLES_DIR = process.env.SAMPLES_DIR;
    // may have multiple fastani runs
    // get the most recent one
    const tools_dir = path.join(SAMPLES_DIR, "bactopia-runs");
    // get all the fastani runs
    const fastani_runs = (await fs.readdir(tools_dir)).filter((file) => file.startsWith("fastani-"));
    // get the most recent one (suffix is YYYYMMDD-HHMMSS)
    const most_recent_run = fastani_runs.sort().reverse()[0];
    const fastani_dir = path.join(tools_dir, most_recent_run, "fastani");
    // get the fastani file for the sample
    const fastani_file = path.join(fastani_dir, `${sample_id}.tsv`);
    // check if the file exists
    // read the file
    const fastani_data = await fs.readFile(fastani_file, 'utf8').catch((err) => {
        log(`Error: Could not find fastani file for ${sample_id}`);
        log(`Path: ${fastani_file}`);
        return;
    });
    if(!fastani_data) return;
    // parse as tsv
    const fastani_lines = fastani_data.split("\n");
    const ani_data = [];
    const headers = fastani_lines[0].split("\t");
    for (let i = 1; i < fastani_lines.length; i++) {
        const line = fastani_lines[i];
        const line_data = line.split("\t");
        const line_obj = {};
        for (let j = 0; j < line_data.length; j++) {
            const data = line_data[j];
            line_obj[headers[j]] = data;
        }
        ani_data.push(line_obj);
    }
    log(ani_data);
    return ani_data;
}

module.exports = getANI;



