module.exports = function(eleventyConfig) {
  // Copy static assets and existing pages
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/signup");
  eleventyConfig.addPassthroughCopy("src/newsletter");
  eleventyConfig.addPassthroughCopy("src/thankyou");
  eleventyConfig.addPassthroughCopy("src/launch-dashboard");
  eleventyConfig.addPassthroughCopy({ "src/root-files": "/" });

  // Watch for CSS changes
  eleventyConfig.addWatchTarget("src/assets/css/");

  // Collections
  eleventyConfig.addCollection("upcomingEvents", collection => {
    const now = new Date();
    return collection.getFilteredByGlob("src/events/*.md")
      .filter(item => new Date(item.data.date) >= now)
      .sort((a, b) => new Date(a.data.date) - new Date(b.data.date));
  });

  eleventyConfig.addCollection("pastEvents", collection => {
    const now = new Date();
    return collection.getFilteredByGlob("src/events/*.md")
      .filter(item => new Date(item.data.date) < now)
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
  });

  eleventyConfig.addCollection("press", collection => {
    return collection.getFilteredByGlob("src/press/*.md")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
  });

  // Filters
  eleventyConfig.addFilter("formatDate", (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  eleventyConfig.addFilter("date", (date, format) => {
    if (!date) return '';
    const d = new Date(date);

    switch(format) {
      case 'MMM':
        return d.toLocaleDateString('en-US', { month: 'short' });
      case 'MMMM':
        return d.toLocaleDateString('en-US', { month: 'long' });
      case 'D':
        return d.getDate();
      case 'YYYY':
        return d.getFullYear();
      case 'MMMM D, YYYY':
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      default:
        return d.toLocaleDateString('en-US');
    }
  });

  eleventyConfig.addFilter("formatTime", (time) => {
    if (!time) return '';
    return time;
  });

  eleventyConfig.addFilter("limit", (array, limit) => {
    return array.slice(0, limit);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
