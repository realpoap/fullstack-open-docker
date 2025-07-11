const fs = require('fs');
const path = require('path');

/**
 * Converts a directory structure to a JSON representation
 * @param {string} dir - The directory path to convert
 * @returns {Promise<Array>} - A promise that resolves to an array representing the directory structure
 */
const dirToJSON = async (dir) => {
    const results = [];

    const recWalk = async (d, res) => {
        const list = await fs.promises.readdir(d);

        for (const name of list) {
            const file = path.resolve(d, name);
            const stat = await fs.promises.stat(file);

            if (stat.isDirectory()) {
                const tempResults = [];
                await recWalk(file, tempResults);
                const obj = {};
                obj[name] = tempResults;
                res.push(obj);
            } else {
                res.push(name);
            }
        }
    };

    try {
        await recWalk(dir, results);
        return results;
    } catch (err) {
        throw new Error(`Failed to convert directory to JSON: ${err.message}`);
    }
};

module.exports = { dirToJSON };