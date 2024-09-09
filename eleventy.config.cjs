module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("site/assets");
  
  return {
    dir: {
      input: "site",
      output: "docs",
    },
  };
}
