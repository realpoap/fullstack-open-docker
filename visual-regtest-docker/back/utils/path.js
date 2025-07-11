const fs = require('fs');
const path = require('path');

const createFolders = (url, folderName) => {
    const hostname = url.split('/')[2].replace(/^www\./, '');
    // Format date to match regex pattern: YYYY-MM-DDTHH:MM:SS
    const now = new Date();
    const date = now.toISOString().slice(0, 19); // This will give us YYYY-MM-DDTHH:MM:SS format
    // TODO: snapshot folder name could be put in a config file
    const folderWebsite = `${folderName}/${hostname}`;
    // Replace colons with hyphens for folder name to avoid filesystem issues
    const safeDate = date.replace(/:/g, '-');
    const folderDate = `${folderName}/${hostname}/${safeDate}`;

    if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
    }
    if (!fs.existsSync(folderWebsite)) {
        fs.mkdirSync(folderWebsite);
    }
    if (!fs.existsSync(folderDate)) {
        fs.mkdirSync(folderDate);
    }

    // Get the path part of the URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Use 'root' for homepage or empty path
    const name = pathname === '' || pathname === '/' ? 'root' : pathname;
    // Use the same safe date format (with hyphens) for the path reference
    const path = `${folderName}/${hostname}/${safeDate}/${name}.png`;
    return { date: safeDate, hostname, path };
}

const parseCustomDate = (dateStr) => {
    // Split the date string at 'T' to separate date and time
    const [datePart, timePart] = dateStr.split('T');
    // Replace hyphens with colons only in the time part
    const standardTimePart = timePart.replace(/-/g, ':');
    // Recombine with 'T'
    const standardDateStr = `${datePart}T${standardTimePart}`;
    return new Date(standardDateStr);
};

const getFolders = (url, date, latestDate) => {
    const hostname = url.split('/')[2].replace(/^www\./, '');
    const folderSnapshots = 'snapshots'; // TODO: snapshot folder could be put in a config file
    const folderWebsite = `${folderSnapshots}/${hostname}`;
    console.log('folderWebsite', folderWebsite)

    // Check if the folders exist
    if (!fs.existsSync(folderSnapshots) || !fs.existsSync(folderWebsite)) {
        return { latest: null, secondLatest: null };
    }

    // Get all date folders
    const dateFolders = fs.readdirSync(folderWebsite)
        .filter(folder => {
            // Filter for valid date format folders (YYYY-MM-DDTHH:MM:SS)
            const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/;
            return dateRegex.test(folder) && fs.statSync(path.join(folderWebsite, folder)).isDirectory();
        })
        .map(folder => ({
            folder,
            date: parseCustomDate(folder)
        }))
        .sort((a, b) => b.date - a.date)
        .map(item => item.folder);

    // Use the provided latest date if available, otherwise use the first one from sorted list
    const latest = latestDate || (dateFolders.length > 0 ? dateFolders[0] : null);

    // If a specific date is provided, use it as the comparison date
    if (date) {
        console.log('selected date in compare function:', date)
        const toCompare = dateFolders.find(folder => folder.toString() === date.toString())
        console.log('folder to compare:', toCompare)
        return {
            latest: latest ? `${folderWebsite}/${latest}` : null,
            toCompare: toCompare ? `${folderWebsite}/${toCompare}` : null
        };
    }

    // If no date is provided, use the second most recent date
    return {
        latest: latest ? `${folderWebsite}/${latest}` : null,
        toCompare: dateFolders.length > 1 ? `${folderWebsite}/${dateFolders[1]}` : null
    };
}

const getFilePath = (url, latest, toCompare) => {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Use 'root' for homepage or empty path
    const name = pathname === '' || pathname === '/' ? 'root' : pathname;

    // Ensure we're using the full path from the root
    const latestSnapshotPath = latest ? `${latest}/${name}.png` : null;
    const toComparePath = toCompare ? `${toCompare}/${name}.png` : null;

    console.log('latest:', latest, 'toCompare:', toCompare);
    console.log('latestSnapshotPath:', latestSnapshotPath, 'toComparePath:', toComparePath);

    return { latestSnapshotPath, toComparePath };
}

module.exports = { createFolders, getFolders, getFilePath };