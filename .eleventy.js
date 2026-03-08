const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);
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

  // Helper function to get current time in EST/EDT (America/New_York)
  const getNowInEST = () => {
    const nowUTC = new Date();
    const estFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = {};
    estFormatter.formatToParts(nowUTC).forEach(part => {
      parts[part.type] = part.value;
    });

    return new Date(
      `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
    );
  };

  // Helper function to parse event end time (assumes times are in EST/EDT)
  const getEventEndTime = (date, time) => {
    const eventDate = parseDate(date);
    if (!time) {
      // If no time specified, consider event over at end of day
      eventDate.setHours(23, 59, 59, 999);
      return eventDate;
    }

    // Parse end time from time string (e.g., "11:00 AM - 12:00 PM")
    const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)?\s*-\s*(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let endHour = parseInt(timeMatch[4]);
      const endMinute = parseInt(timeMatch[5]);
      const endPeriod = timeMatch[6];

      if (endPeriod && endPeriod.toUpperCase() === 'PM' && endHour !== 12) {
        endHour += 12;
      } else if (endPeriod && endPeriod.toUpperCase() === 'AM' && endHour === 12) {
        endHour = 0;
      }

      eventDate.setHours(endHour, endMinute, 0, 0);
      return eventDate;
    }

    // If we can't parse the time, default to end of day
    eventDate.setHours(23, 59, 59, 999);
    return eventDate;
  };

  // Collections — recurring events (e.g. Saturday Story Time) are excluded
  // from standard collections so they don't crowd out special events
  eleventyConfig.addCollection("upcomingEvents", collection => {
    const now = getNowInEST();
    const fourMonthsFromNow = new Date(now);
    fourMonthsFromNow.setMonth(now.getMonth() + 4);

    return collection.getFilteredByGlob("src/events/*.md")
      .filter(item => {
        if (item.data.recurring) return false;
        const eventEndTime = getEventEndTime(item.data.date, item.data.time);
        const eventDate = parseDate(item.data.date);
        return eventEndTime > now && eventDate <= fourMonthsFromNow;
      })
      .sort((a, b) => parseDate(a.data.date) - parseDate(b.data.date));
  });

  eleventyConfig.addCollection("pastEvents", collection => {
    const now = getNowInEST();
    return collection.getFilteredByGlob("src/events/*.md")
      .filter(item => {
        if (item.data.recurring) return false;
        const eventEndTime = getEventEndTime(item.data.date, item.data.time);
        return eventEndTime <= now;
      })
      .sort((a, b) => parseDate(b.data.date) - parseDate(a.data.date));
  });

  eleventyConfig.addCollection("press", collection => {
    return collection.getFilteredByGlob("src/press/*.md")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
  });

  // Featured event - next upcoming non-recurring event only
  eleventyConfig.addCollection("nextEvent", collection => {
    const now = getNowInEST();
    const upcoming = collection.getFilteredByGlob("src/events/*.md")
      .filter(item => {
        if (item.data.recurring) return false;
        const eventEndTime = getEventEndTime(item.data.date, item.data.time);
        return eventEndTime > now;
      })
      .sort((a, b) => parseDate(a.data.date) - parseDate(b.data.date));
    return upcoming.length > 0 ? [upcoming[0]] : [];
  });

  // Preview events - next 3 upcoming non-recurring events within 4 months (homepage)
  eleventyConfig.addCollection("previewSpecialEvents", collection => {
    const now = getNowInEST();
    const fourMonthsFromNow = new Date(now);
    fourMonthsFromNow.setMonth(now.getMonth() + 4);

    return collection.getFilteredByGlob("src/events/*.md")
      .filter(item => {
        if (item.data.recurring) return false;
        const eventEndTime = getEventEndTime(item.data.date, item.data.time);
        const eventDate = parseDate(item.data.date);
        return eventEndTime > now && eventDate <= fourMonthsFromNow;
      })
      .sort((a, b) => parseDate(a.data.date) - parseDate(b.data.date))
      .slice(0, 3);
  });

  // This week's events — for homepage "This Week" section
  eleventyConfig.addCollection("thisWeekEvents", collection => {
    const now = getNowInEST();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    return collection.getFilteredByGlob("src/events/*.md")
      .filter(item => {
        if (item.data.recurring) return false;
        const eventDate = parseDate(item.data.date);
        const eventEndTime = getEventEndTime(item.data.date, item.data.time);
        return eventEndTime > now && eventDate <= sevenDaysFromNow;
      })
      .sort((a, b) => parseDate(a.data.date) - parseDate(b.data.date));
  });

  // Upcoming Saturdays — programmatically generated for storytime date squares
  eleventyConfig.addNunjucksGlobal("upcomingSaturdays", () => {
    const now = getNowInEST();
    const saturdays = [];
    const d = new Date(now);
    // Find next Saturday
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 5; i++) {
      const isoDate = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
      saturdays.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        day: d.getDate(),
        isoDate
      });
      d.setDate(d.getDate() + 7);
    }
    return saturdays;
  });

  // Special guest lookup for storytime banner — returns guest name if an event
  // with specialGuest falls on the given date, otherwise null
  eleventyConfig.addNunjucksGlobal("getSpecialGuestForDate", (isoDate, events) => {
    if (!events || !isoDate) return null;
    const match = events.find(e => {
      if (!e.data.specialGuest) return false;
      const d = parseDate(e.data.date);
      const eventIso = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
      return eventIso === isoDate;
    });
    return match ? match.data.specialGuest : null;
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
      case 'DD':
        return String(d.getDate()).padStart(2, '0');
      case 'MM':
        return String(d.getMonth() + 1).padStart(2, '0');
      case 'YYYY':
        return d.getFullYear();
      case 'YYYY-MM-DD':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

  // Group an event collection by month for the events listing page
  eleventyConfig.addFilter("groupByMonth", (events) => {
    const groups = [];
    for (const event of (events || [])) {
      const d = parseDate(event.data.date);
      const monthKey = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      const last = groups[groups.length - 1];
      if (!last || last.month !== monthKey) {
        groups.push({ month: monthKey, events: [event] });
      } else {
        last.events.push(event);
      }
    }
    return groups;
  });

  eleventyConfig.addFilter("limit", (array, limit) => {
    return array.slice(0, limit);
  });

  // ISO datetime filters for Event JSON-LD schema
  // Approximate DST for Eastern Time: EDT (UTC-4) Apr–Oct, EST (UTC-5) otherwise
  const toEasternISO = (d) => {
    const pad = n => String(n).padStart(2, '0');
    const month = d.getMonth();
    const isDST = month >= 3 && month <= 9;
    const offset = isDST ? '-04:00' : '-05:00';
    return `${d.getFullYear()}-${pad(month + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00${offset}`;
  };

  eleventyConfig.addFilter("eventStartISO", (date, time) => {
    const d = parseDate(date);
    if (time) {
      const m = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (m) {
        let h = parseInt(m[1]);
        const min = parseInt(m[2]);
        const p = m[3].toUpperCase();
        if (p === 'PM' && h !== 12) h += 12;
        else if (p === 'AM' && h === 12) h = 0;
        d.setHours(h, min, 0, 0);
      }
    } else {
      d.setHours(0, 0, 0, 0);
    }
    return toEasternISO(d);
  });

  eleventyConfig.addFilter("eventEndISO", (date, time) => {
    const d = parseDate(date);
    if (time) {
      const m = time.match(/(\d+):(\d+)\s*(AM|PM)?\s*-\s*(\d+):(\d+)\s*(AM|PM)/i);
      if (m) {
        let h = parseInt(m[4]);
        const min = parseInt(m[5]);
        const p = m[6].toUpperCase();
        if (p === 'PM' && h !== 12) h += 12;
        else if (p === 'AM' && h === 12) h = 0;
        d.setHours(h, min, 0, 0);
      } else {
        d.setHours(23, 59, 0, 0);
      }
    } else {
      d.setHours(23, 59, 0, 0);
    }
    return toEasternISO(d);
  });

  // RFC 2822 date filter for RSS <pubDate>, timezone-aware using parseDate
  eleventyConfig.addFilter("toRssDate", (date) => {
    const d = parseDate(date);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const pad = n => String(n).padStart(2, '0');
    const month = d.getMonth();
    const isDST = month >= 3 && month <= 9;
    const offset = isDST ? '-0400' : '-0500';
    return `${days[d.getDay()]}, ${pad(d.getDate())} ${months[month]} ${d.getFullYear()} 00:00:00 ${offset}`;
  });

  // Add isPastEvent as a global function that can take multiple parameters
  eleventyConfig.addNunjucksGlobal("isPastEvent", (date, time) => {
    if (!date) return false;
    const now = getNowInEST();
    const eventEndTime = getEventEndTime(date, time);
    // Event is considered "past" only after the end time has passed (in EST/EDT)
    return eventEndTime <= now;
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
