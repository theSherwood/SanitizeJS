"use strict";

/*
DEV NOTES:

This needs to be more dynamic. Function calls rather than switch cases.

TODOS:

* Make a push function that looks for flags before it pushes and can more easily redirect to other places on the decision tree
*/

(function() {
  const u = require("./utils");

  const split = str => {
    const data = {
      segments: [],

      // Segments in progress
      wordStack: [],
      numberStack: [],
      stringStack: []
    };

    const flags = {
      numberFlags: {
        haveSeenPeriod: false
      },
      stringFlags: {
        templateLiteral: false,
        templateLitExpIndex: -1 // template literal expression ${...}
      }
    };

    for (let i = 0; i < str.length; i++) {
      primarySwitch(str[i], i, data, flags, str);
    }

    if (data.wordStack.length > 0) {
      data.segments.push(data.wordStack.join(""));
    }
    if (data.numberStack.length > 0) {
      data.segments.push(data.numberStack.join(""));
    }
    // console.log(str, data.segments);
    return data.segments;
  };

  const primarySwitch = (char, i, data, flags, str) => {
    switch (true) {
      case data.wordStack.length > 0: // a word is underway
        inWordStack(str[i], i, data, flags, str);
        break;
      case data.numberStack.length > 0: // a number is underway
        inNumberStack(str[i], i, data, flags, str);
        break;
      case data.stringStack.length > 0: // a string is underway
        inStringStack(str[i], i, data, flags, str);
        break;
      default:
        emptyStacks(str[i], i, data, flags, str);
    }
  };

  const inWordStack = (char, i, data, flags, str) => {
    const { wordStack, numberStack, stringStack, segments } = data;
    switch (true) {
      case /[\w$]/.test(char): // letter, _, $, or digit
        wordStack.push(char);
        break;
      case /['"]/.test(char):
        // if (char === "`") flags.stringFlags.templateLiteral = true;
        segments.push(wordStack.join(""));
        wordStack.length = 0;
        stringStack.push(char);
        break;
      case /[`]/.test(char):
        segments.push(wordStack.join(""));
        wordStack.length = 0;
        segments.push(...handleTemplateLiteral(i, str));
        break;
      default:
        segments.push(wordStack.join(""));
        wordStack.length = 0;
        primarySwitch(char, i, data, flags, str);
        break;
    }
  };

  const inNumberStack = (char, i, data, flags, str) => {
    const { wordStack, numberStack, stringStack, segments } = data;
    switch (true) {
      case /[\d]/.test(char):
        numberStack.push(char);
        break;
      case /\./.test(char):
        if (flags.numberFlags.haveSeenPeriod) {
          // there's already a period
          segments.push(numberStack.join(""));
          numberStack.length = 0;
        }
        numberStack.push(char);
        flags.numberFlags.haveSeenPeriod = !flags.numberFlags.haveSeenPeriod;
        break;
      case /[\w$]/.test(char):
        segments.push(numberStack.join(""));
        numberStack.length = 0;
        wordStack.push(char);
        break;
      case /['"]/.test(char):
        // if (char === "`") flags.stringFlags.templateLiteral = true;
        segments.push(numberStack.join(""));
        numberStack.length = 0;
        stringStack.push(char);
        break;
      case /[`]/.test(char):
        segments.push(numberStack.join(""));
        numberStack.length = 0;
        segments.push(...handleTemplateLiteral(i, str));
        break;
      default:
        segments.push(numberStack.join(""));
        numberStack.length = 0;
        primarySwitch(char, i, data, flags, str);
        break;
    }
  };

  const inStringStack = (char, i, data, flags, str) => {
    const { wordStack, numberStack, stringStack, segments } = data;
    switch (true) {
      case stringStack[0] === char:
        stringStack.push(char);
        if (!u.isEscaped(i, str)) {
          // quote char has not been escaped
          segments.push(stringStack.join(""));
          stringStack.length = 0;
          flags.stringFlags.templateLiteral = false;
        }
        break;
      case char === "$" && flags.stringFlags.templateLiteral:
        if (u.isEscaped(i, str)) {
          stringStack.push(char);
        } else if (str[i + 1] === "{") {
          flags.stringFlags.templateLitExpIndex = 0;
          segments.push(stringStack.join(""));
          stringStack.length = 0;
        } else {
          stringStack.push(char);
        }
        break;
      case char === "`" &&
        !u.isEscaped(i, str) &&
        flags.stringFlags.templateLiteral:
        stringStack.push(char);
        segments.push(stringStack.join(""));
        stringStack.length = 0;
        flags.stringFlags.templateLiteral = false;
        break;
      default:
        stringStack.push(char);
        break;
    }
  };

  const emptyStacks = (char, i, data, flags, str) => {
    const { wordStack, numberStack, stringStack, segments } = data;
    switch (true) {
      case /(?=[\w$])(?=[^\d])/.test(char): // word character or _ or $ but not digit
        wordStack.push(char);
        break;
      case /[\d\.]/.test(char): // starts a number (int or float)
        numberStack.push(char);
        if (char === ".") flags.numberFlags.haveSeenPeriod = true;
        break;
      case /['"]/.test(char): // starts a string
        stringStack.push(char);
        break;
      case /[`]/.test(char):
        const templateLiteralSegments = handleTemplateLiteral(i, str);
        break;
      default:
        segments.push(char); // starts no stack
        break;
    }
  };

  const handleTemplateLiteral = (i, str) => {
    const templateLiteralStacks = [["`"]];
    let templateSegment = 0;
    let templateExpressionFlag = false;
    const templateExpression = [];
    for (let j = i + 1; j < str.length; j++) {
      switch (true) {
        case templateExpressionFlag:
          templateExpression.push(str[j]);
          if (str[j] === "}" && !u.isEscaped(j, str)) {
            templateLiteralStacks.push(
              ...split(templateExpression.slice(1, -1).join(""))
            );
            templateExpressionFlag = false;
            templateExpression.length = 0;
            templateSegment = templateLiteralStacks.length;
            templateLiteralStacks.push([]);
          } else if (str[j] === "`" && !u.isEscaped(j, str)) {
            throw new Error("Cannot parse nested template literals");
          }
          break;
        case str[j] === "$" && !u.isEscaped(j, str):
          if (j + 1 < str.length && str[j + 1] === "{") {
            templateExpressionFlag = true;
            templateLiteralStacks[templateSegment] = templateLiteralStacks[
              templateSegment
            ].join("");
          }
          break;
        case str[j] === "`" && !u.isEscaped(j, str):
          templateLiteralStacks[templateSegment].push(str[j]);
          templateLiteralStacks[templateSegment] = templateLiteralStacks[
            templateSegment
          ].join("");
          return templateLiteralStacks;
        default:
          templateLiteralStacks[templateSegment].push(str[j]);
          break;
      }
    }
  };

  module.exports = { split, handleTemplateLiteral };
})();
