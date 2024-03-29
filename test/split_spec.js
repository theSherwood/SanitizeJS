"use strict";

const { split } = require("../src/split");

describe("split", function() {
  describe("emptyStacks", () => {
    it("adds some non-word, -digit, and -quote char in a string to an array and returns it", () => {
      expect(split("{[-=+,.]} ")[0]).toEqual([
        "{",
        "[",
        "-",
        "=",
        "+",
        ",",
        ".",
        "]",
        "}",
        " "
      ]);
    });
  });

  describe("inWordStack", () => {
    it("returns an array in which word chars in series are added as one string", () => {
      expect(split("one two ")[0]).toEqual(["one", " ", "two", " "]);
    });

    it("completes word if the final char is part of a word", () => {
      expect(split("one two")[0]).toEqual(["one", " ", "two"]);
    });

    it("considers '_' and '$' to be word characters", () => {
      expect(split("$o_ne _t$wo _$ $_")[0]).toEqual([
        "$o_ne",
        " ",
        "_t$wo",
        " ",
        "_$",
        " ",
        "$_"
      ]);
    });

    it("considers digits to be word characters if they are not the first char in a word", () => {
      expect(split("o1ne t2wo")[0]).toEqual(["o1ne", " ", "t2wo"]);
    });

    it("considers digits to not be word characters if they are the first char in a word", () => {
      expect(split("1one 2two")[0]).toEqual(["1", "one", " ", "2", "two"]);
    });
  });

  describe("inNumberStack", () => {
    it("returns an array in which digit chars in series are added as one string", () => {
      expect(split("123 456 ")[0]).toEqual(["123", " ", "456", " "]);
    });

    it("will include up to 1 period ('.') as part of a number", () => {
      expect(split("1.23 .456 ")[0]).toEqual(["1.23", " ", ".456", " "]);
    });

    it("will not include more than 1 period ('.') as part of a number", () => {
      expect(split("1.2.3 .456. ")[0]).toEqual([
        "1.2",
        ".3",
        " ",
        ".456",
        ".",
        " "
      ]);
    });

    it("will handle a number if it is in final set of characters", () => {
      expect(split("123 456")[0]).toEqual(["123", " ", "456"]);
    });
  });

  describe("inStringStack", () => {
    it("treats anything within ' ... ' as a single segment", () => {
      expect(split("let x = 'Hello [ ] { }' ")[0]).toEqual([
        "let",
        " ",
        "x",
        " ",
        "=",
        " ",
        "'Hello [ ] { }'",
        " "
      ]);
    });

    it('treats anything within " ... " as a single segment', () => {
      expect(split('let x = "Hello [ ] { }" ')[0]).toEqual([
        "let",
        " ",
        "x",
        " ",
        "=",
        " ",
        '"Hello [ ] { }"',
        " "
      ]);
    });

    it("treats anything within \" ... \" as a single segment including '...'", () => {
      expect(split("let x = \"Hello '[ ]' { }\" ")[0]).toEqual([
        "let",
        " ",
        "x",
        " ",
        "=",
        " ",
        "\"Hello '[ ]' { }\"",
        " "
      ]);
    });

    it("handles a string at the end", () => {
      expect(split("let x = 'Hello'")[0]).toEqual([
        "let",
        " ",
        "x",
        " ",
        "=",
        " ",
        "'Hello'"
      ]);
    });

    it("throws an error if there isn't a matching end ' ", () => {
      expect(() => split("let x = 'Hello")).toThrow(
        new Error("SanitizeJS: Missing closing quote")
      );
    });

    it("throws an error if there isn't a matching end '\"' ", () => {
      expect(() => split('let x = "Hello')).toThrow(
        new Error("SanitizeJS: Missing closing quote")
      );
    });

    it("throws an error if there isn't a matching end ' \" ' (single quotes on the outside)", () => {
      expect(() => split('let x = "Hello')).toThrow(
        new Error("SanitizeJS: Missing closing quote")
      );
    });
  });
  describe("handleTemplateLiteral", () => {
    it("handles a simple template literal", () => {
      expect(split("let x = `hello ${y}`")[0]).toEqual([
        "let",
        " ",
        "x",
        " ",
        "=",
        " ",
        "`hello ",
        "y",
        "`"
      ]);
    });

    it("handles a complex template literal", () => {
      expect(split("let a = `hello ${x + y} and ${z}`")[0]).toEqual([
        "let",
        " ",
        "a",
        " ",
        "=",
        " ",
        "`hello ",
        "x",
        " ",
        "+",
        " ",
        "y",
        " and ",
        "z",
        "`"
      ]);
    });

    // it("handles nested templateLiterals", () => {
    //   expect(
    //     split("let x = `word ${a + ` word ${c} word ` + b} word` ")
    //   ).toEqual([
    //     "let",
    //     " ",
    //     "x",
    //     " ",
    //     "=",
    //     " ",
    //     "`word ",
    //     "a",
    //     " ",
    //     "+",
    //     " ",
    //     "` word ",
    //     "c",
    //     " word `",
    //     " ",
    //     "+",
    //     " ",
    //     "b",
    //     " word`",
    //     " "
    //   ]);
    // });
  });

  describe("labels", () => {
    it("returns an array of labels for the segments array", () => {
      expect(
        split("let a = `hello ${x + y} and ${z}` + 127.45 + 'string'")[1]
      ).toEqual([
        "w",
        " ",
        "w",
        " ",
        " ",
        " ",
        "t",
        "w",
        " ",
        " ",
        " ",
        "w",
        "t",
        "w",
        "t",
        " ",
        " ",
        " ",
        "n",
        " ",
        " ",
        " ",
        "s"
      ]);
    });
  });

  /* The following may be entirely unnecessary */
  // describe("multiline-string", () => {
  //   it("handles a multi-line string input with correct semicolons", () => {
  //     expect(
  //       split(`
  //       let x = 5;
  //       let y = 6;
  //       x + y;
  //     `)[0]
  //     ).toEqual([
  //       "let",
  //       " ",
  //       "x",
  //       " ",
  //       "=",
  //       " ",
  //       "5",
  //       ";",
  //       " ",
  //       "let",
  //       " ",
  //       "y",
  //       " ",
  //       "=",
  //       " ",
  //       "6",
  //       ";",
  //       " ",
  //       "x",
  //       " ",
  //       "+",
  //       " ",
  //       "y",
  //       ";"
  //     ]);
  //   });
  // });
});
