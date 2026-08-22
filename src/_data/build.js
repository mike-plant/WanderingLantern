// Build metadata. Used for the iCalendar DTSTAMP (which must record when the
// calendar object was generated, not when the event happens) and for the
// generatedAt field in /events.json.
module.exports = () => {
  const now = new Date();
  return {
    isoTime: now.toISOString(),
    icsStamp: now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""),
    date: now.toISOString().slice(0, 10),
  };
};
