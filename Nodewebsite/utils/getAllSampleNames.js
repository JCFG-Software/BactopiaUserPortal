const fs = require('fs');

/** Find all samples that are in the SAMPLES_DIR directory
 * Each directory in that path is a sample
 * If the path does not exist, an empty array is returned
 * @return {string[]} - array of sample names
 */
function getAllSampleNames() {
    const samples_dir = process.env.SAMPLES_DIR;
    if (!samples_dir) {
        console.error('SAMPLES_DIR not set');
        return [];
    }
    let sample_names = [];
    try {
        // don't include dotfiles or bactopia-runs directory
        sample_names = fs.readdirSync(samples_dir, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.') && dirent.name !== 'bactopia-runs')
            .map((dirent) => dirent.name);
    } catch {
        console.error(`Could not read directory ${samples_dir}`);
    }
    return sample_names;
}

module.exports = getAllSampleNames;
