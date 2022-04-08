# Replace Css Names

Replace all CSS class name's and id's based on given matches array. 

# How it works

Read data from the provided key "data". Replace all class names and ids with provided replacement.
Each current output are written to the output path.

# This module are based on the module

Extract class and id names from css file

[extract-css-names](https://www.npmjs.com/package/extract-css-names)

# Example how to use it with gulp (for css file)

    const ReplaceCssNames = require('replace-css-names');
    const fs = require("fs");

    gulp.task('replace:css', async (done) => {
        /**
         * Target file to write
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
         * Get matches from file
         */
        const extractedFromCss = `${__dirname}/extracted-names-for-css`;

        if (!fs.existsSync(extractedFromCss)) 
        {
            throw new Error(`The required file cannot be found: ${extractedFromCss}`);
        }

        let extractedMatchesCss = [];

        /**
         * From string back to array
         */
        try {
            extractedMatchesCss = fs.readFileSync(extractedFromCss, 'UTF-8');
            extractedMatchesCss = JSON.parse(extractedMatchesCss);
        }
        catch (e) {
            throw new Error(e);
        }

        const files = [
            `public/css/packages.css`,
            `public/css/app.css`,
        ];

        const replace = (c = 0) => 
        {
            return new Promise( async (resolve, reject) => 
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
                        matches: extractedMatchesCss,
                        data: cssString,
                        restModulo: 10000, 
                        restTime: 200,
                        displayResult: false,
                        ignore: [],
                    }
                );

                c++;
        
                if (undefined !== files[c]) 
                {
                    await replace(c);
                    return resolve(true);
                }
                else 
                {
                    resolve(true);
                }
            })
        }

        await replace();
        done();
    });

    gulp.task('obfuscate:css',
        gulp.series(
            [
                'replace:css'
            ]
        )
    );

## Example how to use it with node js (for css file)

    const ReplaceCssNames = require('replace-css-names');
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
        `public/css/packages.css`,
        `public/css/app.css`,
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

## Example how to use it with gulp (for js file)

    gulp.task('replace:react', async (done) => 
    {
        /**
         * Target path
         */
        const output = `${__dirname}/public/_App.js`;
        /**
        * Remove old replace file
        */
        if (fs.existsSync(output)) 
        {
            fs.unlinkSync(output);
        }

        /**
        * Get matches
        */
        const extractedFromJs = `${__dirname}/extracted-names-for-js`;

        if (!fs.existsSync(extractedFromJs)) 
        {
            throw new Error(`The required file cannot be found: ${extractedFromJs}`);
        }

        let extractedMatchesJs = [];

        try {
            extractedMatchesJs = fs.readFileSync(extractedFromJs, 'UTF-8');
            extractedMatchesJs = JSON.parse(extractedMatchesJs);
        }
        catch (e) {
            throw new Error(e);
        }

        const files = [
            `${__dirname}/build/_App.js`,
        ];

        const replace = (c = 0) => 
        {
            return new Promise( async (resolve, reject) => 
            {
                const fileContent = fs.readFileSync(files[c], 'UTF-8');

                await new ReplaceCssNames(
                    {
                        path: files[c],
                        output,
                        logger: {
                            logging: true,
                            prefix: 'Replace',
                            displayFilename: true,
                            displayPercentage: true,
                            type: 'arc',
                            barBg: 'bgCyan',
                        },
                        type: 'react',
                        matches: extractedMatchesJs,
                        data: fileContent,
                        restModulo: 10000, 
                        restTime: 200, 
                        displayResult: false,
                        ignore: [],
                        attributes: ['defaultClass'],
                        forceReplace: []
                    }
                );

                c++;
        
                if (undefined !== files[c]) 
                {
                    await replace(c);
                    return resolve(true);
                }
                else 
                {
                    resolve(true);
                }
            })
        }

        await replace();
        done();
    });

    gulp.task('obfuscate:css',
        gulp.series(
            [
                'replace:react'
            ]
        )
    );

# Example of file before replacement (css file)

    .flex{display:flex}.flex-row{flex-direction:row}.flex-column{flex-direction:column}.w-100{width:100%}.d-none{display:none}

# Example of file after replacement (css file)

    .k195{display:flex}.z147{flex-direction:row}.f107{flex-direction:column}.o190{width:100%}.s183{display:none}

# Example of file before replacement (js file)

    ,{className:"".concat(n," ").concat(d," ").concat(t," ").concat(this.state.mounted?"":"td0"),style:f}),x().createElement("div",i()({className:"area-header"},S(o)&&O({},o)),r),!this.state.isMinified&&x().createElement("div",i()({className:"area-sidebar"},S(c)&&O({},c)),this.state.sidebarData),x().createElement("div",i()({className:"area-content

# Example of file after replacement (js file)

    {className:"".concat(n," ").concat(d," ").concat(t," ").concat(this.state.mounted?"":"td0"),style:f}),x().createElement("div",i()({className:"v107"},S(o)&&O({},o)),r),!this.state.isMinified&&x().createElement("div",i()({className:"d96"},S(c)&&O({},c)),this.state.sidebarData),x().createElement("div",i()({className:"e96 ".

# Limitations for js/react files

Only Modules there are generated from the base path (not node_modules) are replaced. Modules imported from node_modules are not replaced.

# ExtractCssNames options 

| Option          | type    | Description   
| --------------- | ------- | ------------- |
| `path`          | string  | Path of the current file
| `output`        | string  | Path to store/write current replaced file content
| `data`          | string  | Path to file or data as string. If is file (fs.existsSync), the file content are readed.
| `encoding`      | string  | Read/Write file with this encoding standard. Default 'UTF-8'.
| `type`          | string  | Type of files content. Available types: 'css', 'react'
| `matches`       | array   | Array of objects: [ { find: string; replace: string; type: string;}, ... ]
| `attributes`    | array   | Array of strings/atrribute names to replace. Default [ 'className', 'id' ]. Only available if type is 'react'
| `forceReplace`  | array   | Array of strings. If sensitive match, does not replace a class or id, you can force it ( the forced name has to be availbale in the matches array)
| `restModulo`    | number  | Each number of lines should be made a break
| `restTime`      | number  | Duration of the break in ms
| `displayResult` | boolean | Display the replace result in the terminal
| `ignore`        | array   | Ignore names to replace (with provided type: '.' for class and '#' for id on char 0), [ '.classNameToIgnore', '#idToIgnore' ].
| `logger`        | object  | Logger options

# ExtractCssNames logger options 

| Option              | type    | Description   
| ------------------- | ------- | ------------- |
| `logging`           | boolean | Display current process 
| `prefix`            | string  | Prefix on the logging line 
| `displayFilename`   | boolean | Display current processed filename (filename extracted from path)
| `displayPercentage` | boolean | Display current percentage value
| `type`              | string  | Process animation type. Available types: 'spinner', 'bar', 'dots', 'dots2', 'arc', 'line'
| `barBg`             | string  | If the animation type is bar, then set the bar's background-color. Background colors are based on the `chalk` module

# Ignore match worker

The ignore list, includes all names that should be ignored to replace (Whitelist).
If the provided string has on char position 0 of the string an '.' then its detected as class, if an '#' then its detected as an id.

# Maintainer

[David Janitzek](https://github.com/janitzed/)