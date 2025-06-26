const { BROWSER_FLAVOR, WPT_BRANCH } = require("./const.js");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("site/assets");
  eleventyConfig.addPassthroughCopy("site/2024");

  eleventyConfig.addGlobalData("browserFlavor", () => BROWSER_FLAVOR);
  eleventyConfig.addGlobalData("wptBranch", () => WPT_BRANCH);

  return {
    dir: {
      input: "site",
      output: "docs",
    },
  };
}
