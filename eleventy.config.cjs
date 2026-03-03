const { BROWSER_FLAVOR, WPT_BRANCH, INCLUDE_TENTATIVE } = require("./const.js");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("site/assets");
  eleventyConfig.addPassthroughCopy("site/2024");
  eleventyConfig.addPassthroughCopy("site/2025");

  eleventyConfig.addGlobalData("browserFlavor", () => BROWSER_FLAVOR);
  eleventyConfig.addGlobalData("wptBranch", () => WPT_BRANCH);
  eleventyConfig.addGlobalData("includeTentative", () => INCLUDE_TENTATIVE);

  return {
    dir: {
      input: "site",
      output: "docs",
    },
  };
}
