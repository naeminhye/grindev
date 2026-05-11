const en = require('./en.json');
const ja = require('./ja.json');

function findMissingKeys(objEn, objJa, path = '') {
    Object.keys(objEn).forEach(key => {
        const currentPath = path ? `${path}.${key}` : key;
        if (!objJa || !objJa.hasOwnProperty(key)) {
            console.log(`Missing: ${currentPath}`);
        } else if (typeof objEn[key] === 'object' && objEn[key] !== null) {
            findMissingKeys(objEn[key], objJa[key], currentPath);
        }
    });
}

findMissingKeys(en, ja);