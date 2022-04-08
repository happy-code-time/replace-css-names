const chalk = require("chalk");
const fs = require("fs");
const through = require("through2");
const readline = require("readline");
const path = require('path');

module.exports = class ReplaceCssNames {
  private TYPE_CSS: string;
  private TYPE_REACT: string;
  private config: { [key: string]: any; }
  private displayResult: boolean;
  private path: string;
  private output: string;
  private data: string;
  private restModulo: number;
  private restTime: number;
  private progressBg: string;
  private matches: { find: string; replace: string; type: string }[];
  private type: string;
  private charsLength: number;
  private matchResult: { find: string; type: string; replace?: string, message?: string; attribute?: string; }[];
  private ignore: string[];
  private currentCode = '';
  private logger: {
    logging: boolean;
    prefix: string;
    displayFilename: boolean;
    displayPercentage: boolean;
    type: string;
    barBg: string;
  };
  private logginIsOn: boolean;
  private loggingPrefix: string;
  private loggingDisplayFilename: boolean;
  private loggingDisplayPercentage: boolean;
  private loggingType: string;
  private spinnerCount: number;
  private attributes: string[]
  private forceReplace: {find: string; type: string}[];
  private encoding: string;

  constructor(configuration: { [key: string]: any; }) {
    this.TYPE_CSS = "css";
    this.TYPE_REACT = "react";
    this.config = this.isObject(configuration) ? configuration : {};
    this.displayResult = this.isBoolean(this.config.displayResult) ? this.config.displayResult : false;
    this.matches = this.isArray(this.config.matches) ? this.config.matches : [];
    this.data = this.isString(this.config.data) ? this.config.data : undefined;
    this.output = this.isString(this.config.output) ? this.config.output : undefined;
    this.path = this.isString(this.config.path) ? this.config.path : '';
    this.restModulo = this.isNumber(this.config.restModulo) ? this.config.restModulo : 1000;
    this.restTime = this.isNumber(this.config.restTime) ? this.config.restTime : 500;
    this.ignore = this.isArray(this.config.ignore) ? this.config.ignore : [];
    this.type = this.isString(this.config.type) ? this.config.type : "";
    this.attributes = this.isArray(this.config.attributes) ? ['className', 'id', ...this.config.attributes] : ['className', 'id'];
    this.forceReplace = this.isArray(this.config.forceReplace) ? this.config.forceReplace : [];
    this.encoding = this.isString(this.config.encoding) ? this.config.encoding : "UTF-8";
    this.charsLength = 0;
    this.matchResult = [];
    this.currentCode = '';
    this.logger = this.isObject(this.config.logger) ? this.config.logger : {
      logging: true,
      prefix: 'Extract',
      displayFilename: true,
      displayPercentage: true,
      type: 'bar',
      barBg: 'bgWhite'
    };
    this.progressBg = this.isString(this.logger.barBg) ? this.logger.barBg : 'bgWhite';
    this.logginIsOn = this.isBoolean(this.logger.logging) ? this.logger.logging : true;
    this.loggingPrefix = this.isString(this.logger.prefix) ? this.logger.prefix : 'Extract';
    this.loggingDisplayFilename = this.isBoolean(this.logger.displayFilename) ? this.logger.displayFilename : true;
    this.loggingDisplayPercentage = this.isBoolean(this.logger.displayPercentage) ? this.logger.displayPercentage : true;
    this.loggingType = this.isString(this.logger.type) ? this.logger.type : 'bar';
    this.spinnerCount = 0;
    //@ts-ignore
    return this.replace();
  }

  isObject(a: any): boolean {
    return '[object Object]' === Object.prototype.toString.call(a);
  }

  isArray(a: any): boolean {
    return '[object Array]' === Object.prototype.toString.call(a);
  }

  isString(a: any): boolean {
    return '[object String]' === Object.prototype.toString.call(a);
  }

  isBoolean(a: any): boolean {
    return '[object Boolean]' === Object.prototype.toString.call(a);
  }

  isNumber(a: any): boolean {
    return '[object Number]' === Object.prototype.toString.call(a);
  }

  log(count: number) {
    if (!this.logginIsOn) {
      return;
    }

    switch (this.loggingType) {
      case 'spinner':
      case 'dots':
      case 'dots2':
      case 'arc':
        {
          return this.logLoader(this.loggingType, count);
        }
      case 'line':
        {
          return this.logLine(count);
        }
      case 'bar':
      default:
        {
          return this.logProgress(count);
        }
    }
  }

  getBackgroundColor(): any {
    if (undefined !== chalk[this.progressBg]) {
      return chalk[this.progressBg];
    }

    return chalk.bgWhite;
  }

  getFilename() {
    const path = this.path.split('/')[this.path.split('/').length - 1];
    return path.substring(0, path.length);
  }

  xCalc(count: number) {
    /**
     * X calculation for current percentage
     * 
     * 6893 = 100%
     *  234 = x
     * 
     * x = ((234*100)/6893)%
     */
    const current = (count * 100) / this.charsLength;
    const percentage_progress = (current).toFixed(2);

    return {
      current,
      percentage_progress
    }
  }

  logLoader(type: string, count: number) {
    let loadingItems = [
      '|',
      '/',
      '-',
      '\\'
    ];

    if ('arc' === type) {
      loadingItems = [
        "◜",
        "◠",
        "◝",
        "◞",
        "◡",
        "◟"
      ];
    }

    if ('dots' === type) {
      loadingItems = [
        "⠋",
        "⠙",
        "⠹",
        "⠸",
        "⠼",
        "⠴",
        "⠦",
        "⠧",
        "⠇",
        "⠏"
      ];
    }

    if ('dots2' === type) {
      loadingItems = [
        "⣾",
        "⣽",
        "⣻",
        "⢿",
        "⡿",
        "⣟",
        "⣯",
        "⣷"
      ];
    }

    const path = this.getFilename();
    const { percentage_progress } = this.xCalc(count);

    let filename = '';

    if (this.loggingDisplayFilename) {
      filename = `${this.loggingPrefix}${'' !== this.loggingPrefix ? ' ' : ''}${path} `;
    }

    let prc = '';

    if (this.loggingDisplayPercentage) {
      prc = ` ${percentage_progress} %`;
    }

    this.spinnerCount = (this.spinnerCount > loadingItems.length - 1) ? 0 : this.spinnerCount;
    const spinner = loadingItems[this.spinnerCount];
    const minus = `${filename}${prc} ${spinner} `.length;

    const maxWidth = process.stdout.columns - minus;
    const empty_bar_length = maxWidth;
    const filled_bar = spinner;
    const empty_bar = this.get_bar(empty_bar_length, " ");

    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${filename}${filled_bar}${empty_bar}${prc}`);
    this.spinnerCount += 1;
  }

  logProgress(count: number) {
    const path = this.getFilename();
    const { current, percentage_progress } = this.xCalc(count);

    let filename = '';

    if (this.loggingDisplayFilename) {
      filename = `${this.loggingPrefix}${'' !== this.loggingPrefix ? ' ' : ''}${path} `;
    }

    let prc = '';

    if (this.loggingDisplayPercentage) {
      prc = ` ${percentage_progress} %`;
    }

    const minus = `${filename}${prc}`.length;

    const maxWidth = process.stdout.columns - minus;
    const filled = maxWidth * (current / 100);
    const filled_bar_length = (filled).toFixed(0);
    const empty_bar_length = maxWidth - parseInt(filled_bar_length);
    const filled_bar = this.get_bar(parseInt(filled_bar_length), " ", this.getBackgroundColor());
    const empty_bar = this.get_bar(empty_bar_length, " ");

    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${filename}${filled_bar}${empty_bar}${prc}`);
  }

  logLine(count: number) {
    const path = this.getFilename();
    const { current, percentage_progress } = this.xCalc(count);

    let filename = '';

    if (this.loggingDisplayFilename) {
      filename = `${this.loggingPrefix}${'' !== this.loggingPrefix ? ' ' : ''}${path} `;
    }

    let prc = '';

    if (this.loggingDisplayPercentage) {
      prc = ` ${percentage_progress} %`;
    }

    const minus = `${filename}${prc}>`.length;

    const maxWidth = process.stdout.columns - minus;
    const filled = maxWidth * (current / 100);
    const filled_bar_length = (filled).toFixed(0);
    const empty_bar_length = maxWidth - parseInt(filled_bar_length);
    const filled_bar = this.get_bar(parseInt(filled_bar_length), "=");
    const empty_bar = this.get_bar(empty_bar_length, " ");

    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${filename}${filled_bar}>${empty_bar}${prc}`);
  }

  get_bar(length: number, char: string, color = (a: any) => a) {
    let str = "";

    for (let i = 0; i < length; i++) {
      str += char;
    }

    return color(str);
  }

  desc(validatedConfiguration: { find: string, type: string, replace: string }[]): { find: string, type: string, replace: string }[] {
    validatedConfiguration = validatedConfiguration.sort((a, b) => {
      if (a.find.length > b.find.length) {
        return -1;
      }

      if (a.find.length < b.find.length) {
        return 1;
      }

      return 0;
    });

    return validatedConfiguration;
  }

  writeNewCode(code: string): Promise<boolean> {
    return new Promise(resolve => {
      const dirname = path.dirname(this.output);
      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname);
      }

      if('' !== this.currentCode)
      {
        this.currentCode = this.currentCode + '\n';
      }

      const data = this.currentCode + code;
      fs.writeFileSync(this.output, data);
      resolve(true);
    });
  }

  setCurrentCodeFromTmpFile(): Promise<boolean> {
    return new Promise(resolve => {

      if (fs.existsSync(this.output)) {
        const currentCode = fs.readFileSync(this.output, this.encoding);

        if (currentCode.length) {
          this.currentCode = currentCode;
        }
      }

      resolve(true);
    });
  }

  getCurrentCode(): Promise<string> {
    return new Promise(resolve => {
      let code = '';

      if (fs.existsSync(this.output)) {
        const currentCode = fs.readFileSync(this.output, this.encoding);

        if (currentCode.length) {
          code = currentCode;
        }
      }

      resolve(code);
    });
  }

  getCurrentData(): Promise<string>
  {
    return new Promise(resolve => 
      {
      if(fs.existsSync(this.data))
      {
        this.data = fs.readFileSync(this.data, this.encoding);
      }

      resolve(this.data);
    });
  }

  /**
   * Hex colors
   * #ddd
   * #3d4456
   */
  hasHex(word: string) {
    return new RegExp(/^[#]{1}[a-zA-Z0-9]{3,6}/g).test(word);
  }

  /**
   * The end of rgba colors
   * .8 // rgb(0,0,0.8);
   */
  hasRgbType1(word: string) {
    return new RegExp(/^[.]{1}[0-9]{1,2}/g).test(word);
  }

  /**
   * The end of rgba colors
   * 0.8 // rgb(0,0,0.8);
   */
  hasRgbType2(word: string) {
    return new RegExp(/^[0-9]{1}[.]{1}[0-9]{1,2}/g).test(word);
  }

  /**
   * End of url
   * .gif" // background-image: url("/url/image.gif");
   * .ttf?22t19m"
   * .woff?22t19m"
   * .woff"
   * .eot"
   * .woff2"
   * .png"
   */
  hasUrl(word: string) {
    return new RegExp(/^[.]{1}[a-zA-Z0-9?&]{1,}["]{1}/g).test(word);
  }

  /**
   * End of url
   * w3.org/2000/svg' // background-image: url("/url/image.gif");
   */
  hasPath(word: string) {
    return new RegExp(/[a-zA-Z0-9?&/]{1,}[']{1}/g).test(word) || new RegExp(/[a-zA-Z0-9?&/]{1,}["]{1}/g).test(word);
  }

  hasQuestionMark(word: string) {
    return new RegExp(/[\?]{1}/g).test(word);
  }

  hasClass(line: string): boolean {
    return new RegExp(/[.]{1}[a-zA-Z-_0-9]{1,}/g).test(line);
  }

  hasId(line: string): boolean {
    return new RegExp(/[#]{1}[a-zA-Z-_0-9]{1,}/g).test(line);
  }

  /**
   * Has s
   * .2s
   * 0.2s
   */
  hasSecond(word: string) {
    return new RegExp(/^[0-9]{0,1}[.]{1}[0-9]{1,2}[s]{1}/g).test(word);
  }

  /**
   * Has em
   * .22em
   * 0.22em
   * 0.2em
   */
  hasEm(word: string) {
    return new RegExp(/^[0-9]{0,1}[.]{1}[0-9]{1,2}[em]{2}/g).test(word);
  }

  /**
   * Has rem
   * .22rem
   * 0.22rem
   * 0.2rem
   */
  hasRem(word: string) {
    return new RegExp(/^[0-9]{0,1}[.]{1}[0-9]{1,2}[rem]{3}/g).test(word);
  }

  inIgnoreList(word: string, type: string): boolean 
  {
    if(this.ignore.length) 
    {
      for(let x = 0; x < this.ignore.length; x++)
      {
        let i = this.ignore[x];
        let f = i.substring(1, i.length);
        let t = '';

        if('.' === i.charAt(0))
        {
          t = 'class';
        }
        if('#' === i.charAt(0))
        {
          t = 'id';
        }

        if('' !== t && word === f && t === type)
        {
          return true;
        }
      }
    }

    return false;
  }

  isValid(word: string, type: string): boolean 
  {
    if (
      !word.length
      || this.inIgnoreList(word, type)
      || this.hasHex(word)
      || this.hasRgbType1(word)
      || this.hasRgbType2(word)
      || this.hasUrl(word)
      || this.hasPath(word)
      || this.hasQuestionMark(word)
      || this.hasSecond(word)
      || this.hasEm(word)
      || this.hasRem(word)
    ) {
      return false;
    }

    return true;
  }

  getSingleReplacement(word: string): string 
  {
    for (let x = 0; x < this.matches.length; x++) 
    {
      if (word === this.matches[x].find) 
      {
        return this.matches[x].replace;
      }
    }

    return word;
  }

  getReplacements(current: { type: string; find: string; }[]): Promise<string> 
  {
    return new Promise(async (resolve) => 
    {
      let line = '';

      for (let x = 0; x < current.length; x++) 
      {
        let { type, find } = current[x];

        if (['class', 'id'].includes(type) && this.isValid(find, type)) 
        {
          line += this.getSingleReplacement(find);
        }
        else 
        {
          line += find;
        }
      }

      resolve(line);
    })
  }

  replaceMatchesSingleLine(line: string): Promise<string> {
    return new Promise(async (resolve) => {
      const chars = line.split('');
      let word = '';
      let current: { type: string; find: string; }[] = [];
      let type = '';

      const walkChar = (i: number): Promise<number> => {
        return new Promise(async (walkCharResolve) => {

          /**
           * Will match class or id, but currently some text bevore our match
           */
          if (
            '.' === chars[i] && undefined !== chars[i + 1] && this.hasClass(chars[i] + chars[i + 1])
            || '#' === chars[i] && undefined !== chars[i + 1] && this.hasId(chars[i] + chars[i + 1])
          ) {
            current.push(
              {
                find: word,
                type
              }
            );
            word = '';
            type = '';
          }
          /**
           * Start of class name
           */
          if ('.' === chars[i] && undefined !== chars[i + 1] && this.hasClass(chars[i] + chars[i + 1])) {
            /**
             * Previous was match
             */
            if ('' !== type) {
              current.push(
                {
                  find: word,
                  type
                }
              );
              word = '';
            }

            type = 'class';
          }

          /**
           * Start of id
           */
          if ('#' === chars[i] && undefined !== chars[i + 1] && this.hasId(chars[i] + chars[i + 1])) {
            /**
             * Previous was match
             */
            if ('' !== type) {
              current.push(
                {
                  find: word,
                  type
                }
              );
              word = '';
            }

            type = 'id';
          }

          /**
           * On special char, push match and run loop again
           */
          if ('' !== type && [';', ':', '{', '}', '<', '>', '@', ',', '(', ')', '^', '=', '[', '/', ' '].includes(chars[i])) {
            current.push(
              {
                find: word,
                type
              }
            );
            word = '';
            type = '';
          }

          word += chars[i];

          /**
           * Is last item
           */
          if (i === chars.length - 1) {
            current.push(
              {
                find: word,
                type
              }
            );
          }

          i += 1;
          walkCharResolve(i);
        });
      };

      const walkChars = (i: number = 0): Promise<number> => {
        return new Promise(async (walkCharResolve) => {
          i = await walkChar(i);

          if (undefined !== chars[i]) {
            await walkChars(i);
            return walkCharResolve(i);
          }
          else {
            return walkCharResolve(i);
          }
        });
      };

      await walkChars();
      const replacedLine = await this.getReplacements(current);
      resolve(replacedLine);
    });
  }

  walkLine(count: number, line: string): Promise<{ count: number, code: string }> {
    return new Promise(async (resolve) => {
      const x = line.trim();
      count += 1;

      if (!x.length || (!this.hasClass(x) && !this.hasId(x))) {
        return resolve(
          {
            count,
            code: line
          }
        );
      }

      line = await this.replaceMatchesSingleLine(line);

      resolve(
        {
          count,
          code: line
        }
      );
    });
  }

  replaceByMatches(sourceCode: string): Promise<string> {
    return new Promise(async (resolve) => {
      let lines: string[] = sourceCode.split('{').join('{\n').split('\n');
      this.charsLength = lines.length;

      const walkLines = (i: number = 0): Promise<string[]> => {
        return new Promise(async (walkMatchesResolve) => {
          const data = await this.walkLine(i, lines[i]);
          lines[i] = data.code;
          i = data.count;
          this.log(i);

          if (undefined !== lines[i]) {
            let timeout = 0;

            if (0 === i % this.restModulo) {
              timeout = this.restTime;
            }

            return setTimeout(async () => {
              await walkLines(i);
              return walkMatchesResolve(lines);
            }, timeout);
          }
          else {
            return walkMatchesResolve(lines);
          }
        })
      };

      lines = await walkLines();
      resolve(lines.join(''));
    });
  }

  singleForce(newCode: string, replacement: { find: string, type: string, splitBy: string}): Promise<string> 
  {
      return new Promise(async (resolve) => 
      {
          const { splitBy, find, type } = replacement;
          let lines: any = newCode.split(splitBy);

          /**
           * No match found in current split
           */
          if(1 === lines.length)
          {
              return resolve(newCode);
          }
          else
          {
              let match: any = this.matches.filter( h => h.find === find && h.type === type);

              if(0 !== match.length)
              {
                  const lastChar = splitBy.substring(splitBy.length-1, splitBy.length);
                  const { replace } = match[0];
                  return resolve(lines.join(`${replace}${lastChar}`));
              }
              else
              {
                  return resolve(newCode);
              }
          }
      });
  }

  forceReplacement(source: string, forceReplaceValidated: {find: string; type: string; splitBy: string}[]): Promise<string> 
  {
      return new Promise(async (resolve) => 
      {
          this.charsLength = forceReplaceValidated.length;

          const walkForces = (i: number, str: string): Promise<string> => 
          {
              return new Promise(async (walkForcesResolve) => 
              {
                  str = await this.singleForce(str, forceReplaceValidated[i]);
                  i += 1;

                  this.log(i);

                  if (undefined !== forceReplaceValidated[i]) 
                  {
                      str = await walkForces(i, str);
                      return walkForcesResolve(str);
                  }
                  else {
                      return walkForcesResolve(str);
                  }
              })
          }

          source = await walkForces(0, source);
          resolve(source);
      });
  }

  buildForceReplace(): Promise<{ find: string; type: string; splitBy: string }[]>
  {
      return new Promise( resolve => {
          const valited: { find: string; type: string; splitBy: string }[] = [];

          this.forceReplace.map( o => 
          {
              const { find, type } = o;
  
              if(
                  this.isString(find) 
                  && find.length 
                  && this.isString(type) 
                  && type.length 
                  && 0 !== this.matches.filter( h => h.find === find && h.type === type).length
              )
              {
                  valited.push(
                      {
                          splitBy: `${find}\ `,
                          find,
                          type
                      }
                  );
                  valited.push(
                      {
                          splitBy: `${find}'`,
                          find,
                          type
                      }
                  );
                  valited.push(
                      {
                          splitBy: `${find}"`,
                          find,
                          type
                      }
                  );
              }
          });

          resolve(valited);
      });
  }

  processReact(source: string): Promise<string> 
  {
    this.matchResult = [];

    return new Promise(async (resolve, reject) => 
    {
      let newData = await this.walkAttributes(source);
      const forceReplaceValidated = await this.buildForceReplace();

      if(forceReplaceValidated.length)
      {
        newData = await this.forceReplacement(newData, forceReplaceValidated);
      }

      resolve(newData);
    });
  }

  walkAttributes(source: string): Promise<string> 
  {
    return new Promise(async (walkAttributesResolve) => 
    {
      const walkAttr = (attr: number, source: string): Promise<string> => 
      {
        return new Promise(async (walkAttrResolve, reject) => 
        {
          const result: any = await this.attributeWalker(attr, source);
          source = result.code;
          attr = result.next;

          if (undefined !== this.attributes[attr]) 
          {
            source = await walkAttr(attr, source);
            return walkAttrResolve(source);
          }

          return walkAttrResolve(source);
        });
      }

      const newCode = await walkAttr(0, source);
      walkAttributesResolve(newCode);
    })
  }

  attributeWalker(at: number, source: string): Promise<any> 
  {
    return new Promise(async (attributeWalkerResolve) => 
    {
      const currentAttribute: string = this.attributes[at];
      let lines: any = source.split(currentAttribute);
      this.charsLength = lines.length;
      let newCode = '';

      const lineWalker = (n: number): Promise<string> => 
      {
        return new Promise( (lineWalkerResolve, reject) => 
        {
          let timeout = 0;

          if (0 === n % this.restModulo) {
                timeout = this.restTime;
            }

          setTimeout( async () => 
          {
            const attrToDisplay = currentAttribute.replace(/[:\"\']/g, '');
            const result: any = await this.lineWalk(n, lines[n], attrToDisplay);

            if (n === 0) {
              newCode += result.line;
            }
            else {
              newCode += `${currentAttribute}${result.line}`;
            }
  
            n = result.next;
            this.log(n);
  
            if(undefined === lines[n])
            {
              return lineWalkerResolve(newCode);
            }
  
            newCode = await lineWalker(n);
            return lineWalkerResolve(newCode);
          }, timeout);
        });
      };

      const x = await lineWalker(0);

      if (this.displayResult && this.matchResult.length) 
      {
        console.log();
        console.table(this.matchResult);
        this.matchResult = [];
      }

      console.log();
      at++;

      attributeWalkerResolve(
        {
          next: at,
          code: x
        }
      );
    });
  };

  lineWalk(x: number, lineData: any, attributeName: string): Promise<any> {
    return new Promise(async (lineWalkResolve, reject) => {
      if (0 === x) {
        x += 1;
        return lineWalkResolve(
          {
            next: x,
            line: lineData
          }
        );
      }

      const line = await this.charWalker(lineData, attributeName);

      x += 1;
      return lineWalkResolve(
        {
          next: x,
          line
        }
      );
    });
  };

  /**
   * Char loop initializator
   */
  charWalker(line: string, attributeName: string): Promise<string> {
    return new Promise(async (charWalkerResolve) => {
      const chars = line.split('');

      const charWalk = (i: number, line: string): Promise<string> => {
        return new Promise(async (charWalkResolve, reject) => {
          const result: any = await this.nextChar(i, line, chars, attributeName);
          line = result.lineData;
          i = result.next;

          if (null !== i && undefined !== chars[i]) {
            line = await charWalk(i, line);
            return charWalkResolve(line);
          }

          return charWalkResolve(line);
        })
      };

      const dataLine: any = await charWalk(0, '');
      charWalkerResolve(dataLine);
    });
  }

  nextChar(c: number, line: string, chars: string[], attributeName: string): Promise<any> {
    return new Promise(nextCharResolve => {
      line += chars[c];

      if ('\"' === chars[c] || !new RegExp(/^[a-zA-Z0-9_\- ]+$/, 'g').test(line)) {
        /**
         * Empty className
         */
        if ('\"' === chars[c] && 1 === line.length) {
          const charsAtEnd = [];

          for (let i = c; i < chars.length; i++) {
            charsAtEnd.push(chars[i]);
          }

          line = charsAtEnd.join('');
        }
        else {
          /**
           * Remove last char
           */
          const lastChar = line.charAt(line.length);
          line = line.substring(0, line.length - 1);

          const replacement = this.getReplacementsReact(line, attributeName);

          const charsAtEnd = [];

          for (let i = c; i < chars.length; i++) {
            charsAtEnd.push(chars[i]);
          }

          line = `${replacement}${lastChar}${charsAtEnd.join('')}`;
        }

        return nextCharResolve(
          {
            next: null,
            lineData: line
          }
        );
      }

      c++;
      nextCharResolve(
        {
          next: c,
          lineData: line
        }
      );
    });
  };

  getReplacementsReact(classNames: string, currentAttribute: string): string 
  {
    currentAttribute = currentAttribute.trim();

    if (0 === this.matches.length || 0 === classNames.length) 
    {
      return classNames;
    }

    let allClassNames: string[] = classNames.split(" ");
    let type = '';

    if(currentAttribute === 'className')
    {
      type = 'class';
    }
    if(currentAttribute === 'id')
    {
      type = 'id';
    }

    const newCls = [];

    for (let x = 0; x < allClassNames.length; x++) 
    {
      let find = allClassNames[x];

      if (find.length) 
      {
        if (this.inIgnoreList(find, type)) 
        {
          this.matchResult.push({
            find,
            type,
            message: 'Whitelist'
          });
        }
        else 
        {
          const match = this.matches.filter(m => m.find === find && m.type === type);

          if (match.length) 
          {

            if(-1 !== match[0].find.indexOf('bg'))
            {
              console.log(match[0].find);
            }

            find = match[0].replace; 
            // this.getReplacementReact(find, type);
            this.matchResult.push({ find, replace: match[0].replace, type, attribute: currentAttribute });
          }
          else 
          {           
            this.matchResult.push({ find, type, attribute: currentAttribute });
          }
        }
      }

      newCls.push(find);
    }

    return newCls.join(" ");
  }

  getReplacementReact(match: string, type: string): string 
  {
    for (let x = 0; x < this.matches.length; x++) 
    {
      if (this.matches[x].find === match && type === this.matches[x].type) 
      {
        match = this.matches[x].replace;
        break;
      }
    }

    return match;
  }

  getAttributes(): string[]
  {
    const n: string[] = [];

    this.attributes.map( a => 
    {
      n.push(`${a}:"`);
      n.push(`${a}: "`);
      n.push(`${a}:'`);
      n.push(`${a}: '`);
    });

    return n;
  }

  replace() {
    return new Promise(async (resolve) => {
      if (!this.isString(this.output)) {
        throw new Error(`Expected type string for path, got: ${typeof this.output}.`)
      }

      /**
       * Check for supported types
       */
      if (![this.TYPE_CSS, this.TYPE_REACT].includes(this.type)) {
        throw new Error(`Unsupported type: ${this.type}.`);
      }

      if (!this.isArray(this.matches) || 0 === this.matches.length) {
        throw new Error(`Matches are empty`);
      }

      const m = this.desc(this.matches);
      this.matches = m;

      if (this.TYPE_CSS === this.type) {
        /**
         * Get code from previous file, if exists
         */
        await this.setCurrentCodeFromTmpFile();
        const sourceCode = await this.getCurrentData();
        const data = await this.replaceByMatches(sourceCode);
        await this.writeNewCode(data);
        console.log();
        resolve(data);
      }
      if (this.TYPE_REACT === this.type) 
      {
        const sourceCode = await this.getCurrentData();
        this.attributes = await this.getAttributes();
        const data: string = await this.processReact(sourceCode);
        await this.writeNewCode(data);
        console.log();
        resolve(data);
      }
    })
  }
};
