const ReplaceCssNames = require('./ReplaceCssNames');
const fs = require("fs");

/**
 * Target path
 */
const output = `${__dirname}/replaced.css`;
/**
 * Remove old file
 */
if(fs.existsSync(output))
{
    fs.unlinkSync(output);
}

/**
 * Get matches
 */
const matchesFile = `${__dirname}/extracted-names-for-css`;

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
    `dako/public/1.0.0/css/packages.css`,
    `dako/public/1.0.0/css/app.css`,
];

const replace = async (c = 0) =>
{
    const cssString = fs.readFileSync(files[c], 'UTF-8');

    await new ReplaceCssNames(
        {
            path: files[c],
            output,
            logger: {
                logging: true,
                prefix: 'Replace',
                displayFilename: true,
                displayPercentage: true,
                type: 'bar', 
                barBg: 'bgCyan'
            },
            type: 'css',
            matches,
            data: cssString,
            restModulo: 10000, 
            restTime: 200, 
            displayResult: false,
            ignore: [],
        }
    );

    c++;

    if(undefined !== files[c])
    {
        await replace(c);
    }
}

replace();

