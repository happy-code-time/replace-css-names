const ReplaceCssNames = require('./ReplaceCssNames');
const fs = require("fs");

/**
 * Read matches from file
 */
const output = `dako/public/1.0.0/public/_App.js`;
/**
 * Remove old replace file!
 */
if(fs.existsSync(output))
{
    fs.unlinkSync(output);
}

/**
 * Get matches
 */
const matchesFile = `dako/public/1.0.0/css/extracted-names-for-js`;

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

const replace = async () =>
{
    await new ReplaceCssNames(
        {
            path: 'dako/public/1.0.0/_App.js',
            data: 'dako/public/1.0.0/_App.js',
            output,
            logger: {
                logging: true,
                prefix: 'Replace',
                displayFilename: true,
                displayPercentage: true,
                type: 'arc',
                barBg: 'bgCyan'
            },
            type: 'react',
            matches,
            restModulo: 10000,
            restTime: 200,
            displayResult: false,
            ignore: [],
            attributes: [],
            forceReplace: [
                {
                    find: 'bg-schema-2-1',
                    type: 'class'
                }
            ]
        }
    );
}

replace();

