"use strict";

const split = require("../src/split");

describe("split", function() {
  describe("emptyStacks", () => {
    it("adds some non-word, -digit, and -quote char in a string to an array and returns it", () => {
      expect(split("{[-=+,.]} ")).toEqual([
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
      expect(split("one two ")).toEqual(["one", " ", "two", " "]);
    });

    it("completes word if the final char is part of a word", () => {
      expect(split("one two")).toEqual(["one", " ", "two"]);
    });

    it("considers '_' and '$' to be word characters", () => {
      expect(split("$o_ne _t$wo _$ $_")).toEqual([
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
      expect(split("o1ne t2wo")).toEqual(["o1ne", " ", "t2wo"]);
    });

    it("considers digits to not be word characters if they are the first char in a word", () => {
      expect(split("1one 2two")).toEqual(["1", "one", " ", "2", "two"]);
    });
  });

  describe("inNumberStack", () => {
    // Numbers
    it("returns an array in which digit chars in series are added as one string", () => {
      expect(split("123 456 ")).toEqual(["123", " ", "456", " "]);
    });

    it("will include up to exactly 1 period ('.') as part of a number", () => {
      expect(split("1.23 .456 ")).toEqual(["1.23", " ", ".456", " "]);
    });
  });
});
