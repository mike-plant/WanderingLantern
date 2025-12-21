module.exports = function(eleventyConfig) {
  // Helper function to parse dates as local time
  const parseDate = (date) => {
    if (!date) return new Date();

    // If it's a string in YYYY-MM-DD format, parse as local time
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    // If it's already a Date object from YAML, convert from UTC to local
    if (date instanceof Date) {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      return new Date(year, month, day);
    }

    return new Date(date);
  };

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
    const fourMonthsFromNow = new Date();
    fourMonthsFromNow.setMonth(now.getMonth() + 4);

    return collection.getFilteredByGlob("src/events/*.md")
      .filter(item => {
        const eventDate = parseDate(item.data.date);
        return eventDate >= now && eventDate <= fourMonthsFromNow;
      })
      .sort((a, b) => parseDate(a.data.date) - parseDate(b.data.date));
  });

  eleventyConfig.addCollection("pastEvents", collection => {
    const now = new Date();
    return collection.getFilteredByGlob("src/events/*.md")
      .filter(item => parseDate(item.data.date) < now)
      .sort((a, b) => parseDate(b.data.date) - parseDate(a.data.date));
  });

  eleventyConfig.addCollection("press", collection => {
    return collection.getFilteredByGlob("src/press/*.md")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
  });

  // Featured event - next upcoming event only
  eleventyConfig.addCollection("nextEvent", collection => {
    const now = new Date();
    const upcoming = collection.getFilteredByGlob("src/events/*.md")
      .filter(item => parseDate(item.data.date) >= now)
      .sort((a, b) => parseDate(a.data.date) - parseDate(b.data.date));
    return upcoming.length > 0 ? [upcoming[0]] : [];
  });

  // Preview events - next 3 upcoming events within 4 months
  eleventyConfig.addCollection("previewEvents", collection => {
    const now = new Date();
    const fourMonthsFromNow = new Date();
    fourMonthsFromNow.setMonth(now.getMonth() + 4);

    return collection.getFilteredByGlob("src/events/*.md")
      .filter(item => {
        const eventDate = parseDate(item.data.date);
        return eventDate >= now && eventDate <= fourMonthsFromNow;
      })
      .sort((a, b) => parseDate(a.data.date) - parseDate(b.data.date))
      .slice(0, 3);
  });

  // Filters
  eleventyConfig.addFilter("formatDate", (date) => {
    if (!date) return '';
    const d = parseDate(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  eleventyConfig.addFilter("date", (date, format) => {
    if (!date) return '';
    const d = parseDate(date);

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

  eleventyConfig.addFilter("isPastEvent", (date) => {
    if (!date) return false;
    const eventDate = parseDate(date);
    const now = new Date();
    // Set both to start of day for comparison
    now.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    // Event is considered "past" on the day of the event (>= comparison)
    return eventDate <= now;
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
