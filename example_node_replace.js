const ReplaceCssNames = require('./ReplaceCssNames/replace-css-names');
const fs = require("fs");

/**
 * Read matches from file
 */
const target = `${__dirname}/replaced-css-names.css`;
/**
 * Remove old replace file!
 */
if(fs.existsSync(target))
{
    fs.unlinkSync(target);
}

/**
 * Get matches
 */
const matchesFile = `${__dirname}/extracted-css-names.js`;

if(!fs.existsSync(matchesFile))
{
    throw new Error(`The required file cannot be found: ${matchesFile}`);
}

let matches = [];
try{
    matches = fs.readFileSync(matchesFile, 'UTF-8');
    matches = JSON.parse(matches);
}
catch(e)
{
    throw new Error(e);
}

const files = [
    // `dako/public/1.0.0/css/packages.css`,
    `dako/public/1.0.0/css/app.css`,
];

const replace = async (c = 0) =>
{
    const cssString = fs.readFileSync(files[c], 'UTF-8');

    await new ReplaceCssNames(
        {
            path: files[c],
            target,
            logging: true, 
            loggingType: 'progress', 
            matches,
            type: 'css',
            data: cssString,
            restModulo: 1000, // Each 1000 lines
            restTime: 200 // make a coffee break for 200ms
        }
    );

    c++;

    if(undefined !== files[c])
    {
        await replace(c);
    }
}

replace();

