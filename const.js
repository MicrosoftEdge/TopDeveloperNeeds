// The weeks we're interested in getting WPT data from.
export const WEEKS = [
  {from: "2024-07-03", to: "2024-07-09"},
  {from: "2024-07-10", to: "2024-07-16"},
  {from: "2024-07-17", to: "2024-07-23"},
  {from: "2024-07-24", to: "2024-07-30"},
  {from: "2024-07-31", to: "2024-08-06"},
  {from: "2024-08-07", to: "2024-08-13"},
  {from: "2024-08-14", to: "2024-08-20"},
  {from: "2024-08-21", to: "2024-08-27"},
  {from: "2024-08-28", to: "2024-09-03"},
  {from: "2024-09-04", to: "2024-09-10"},
  {from: "2024-09-11", to: "2024-09-17"},
  {from: "2024-09-18", to: "2024-09-24"},
  {from: "2024-09-25", to: "2024-10-01"},
  {from: "2024-10-02", to: "2024-10-08"},
  {from: "2024-10-09", to: "2024-10-15"},
  {from: "2024-10-16", to: "2024-10-22"},
  {from: "2024-10-23", to: "2024-10-29"},
  {from: "2024-10-30", to: "2024-11-05"},
  {from: "2024-11-06", to: "2024-11-12"},
  {from: "2024-11-13", to: "2024-11-19"},
  {from: "2024-11-20", to: "2024-11-26"},
  {from: "2024-11-27", to: "2024-12-03"},
  {from: "2024-12-04", to: "2024-12-10"},
  {from: "2024-12-11", to: "2024-12-17"},
  {from: "2024-12-18", to: "2024-12-24"},
  {from: "2024-12-25", to: "2024-12-31"},
  {from: "2025-01-01", to: "2025-01-07"},
  {from: "2025-01-08", to: "2025-01-14"},
  {from: "2025-01-15", to: "2025-01-21"},
  {from: "2025-01-22", to: "2025-01-28"},
  {from: "2025-01-29", to: "2025-02-04"},
  {from: "2025-02-05", to: "2025-02-11"},
  {from: "2025-02-12", to: "2025-02-18"},
  {from: "2025-02-19", to: "2025-02-25"},
  {from: "2025-02-26", to: "2025-03-04"},
  {from: "2025-03-05", to: "2025-03-11"},
  {from: "2025-03-12", to: "2025-03-18"},
  {from: "2025-03-19", to: "2025-03-25"},
  {from: "2025-03-26", to: "2025-04-01"},
  {from: "2025-04-02", to: "2025-04-08"},
  {from: "2025-04-09", to: "2025-04-15"},
  {from: "2025-04-16", to: "2025-04-22"},
  {from: "2025-04-23", to: "2025-04-29"},
  {from: "2025-04-30", to: "2025-05-06"},
  {from: "2025-05-07", to: "2025-05-13"},
  {from: "2025-05-14", to: "2025-05-20"},
  {from: "2025-05-21", to: "2025-05-27"},
  {from: "2025-05-28", to: "2025-06-03"},
  {from: "2025-06-04", to: "2025-06-10"},
  {from: "2025-06-11", to: "2025-06-17"},
  {from: "2025-06-18", to: "2025-06-24"},
  {from: "2025-06-25", to: "2025-07-01"},
  {from: "2025-07-02", to: "2025-07-08"},
  {from: "2025-07-09", to: "2025-07-15"},
  {from: "2025-07-16", to: "2025-07-22"},
  {from: "2025-07-23", to: "2025-07-29"},
  {from: "2025-07-30", to: "2025-08-05"},
  {from: "2025-08-06", to: "2025-08-12"},
  {from: "2025-08-13", to: "2025-08-19"},
  {from: "2025-08-20", to: "2025-08-26"},
  {from: "2025-08-27", to: "2025-09-02"},
  {from: "2025-09-03", to: "2025-09-09"},
  {from: "2025-09-10", to: "2025-09-16"},
  {from: "2025-09-17", to: "2025-09-23"},
  {from: "2025-09-24", to: "2025-09-30"},
  {from: "2025-10-01", to: "2025-10-07"},
  {from: "2025-10-08", to: "2025-10-14"},
  {from: "2025-10-15", to: "2025-10-21"},
  {from: "2025-10-22", to: "2025-10-28"},
  {from: "2025-10-29", to: "2025-11-04"},
  {from: "2025-11-05", to: "2025-11-11"},
  {from: "2025-11-12", to: "2025-11-18"},
  {from: "2025-11-19", to: "2025-11-25"},
  {from: "2025-11-26", to: "2025-12-02"},
  {from: "2025-12-03", to: "2025-12-09"},
  {from: "2025-12-10", to: "2025-12-16"},
  {from: "2025-12-17", to: "2025-12-23"},
  {from: "2025-12-24", to: "2025-12-30"},
  {from: "2025-12-31", to: "2026-01-06"},
  {from: "2026-01-07", to: "2026-01-13"},
  {from: "2026-01-14", to: "2026-01-20"},
  {from: "2026-01-21", to: "2026-01-27"},
  {from: "2026-01-28", to: "2026-02-03"},
  {from: "2026-02-04", to: "2026-02-10"},
  {from: "2026-02-11", to: "2026-02-17"},
  {from: "2026-02-18", to: "2026-02-24"}
];

// The browsers we're interested in.
export const BROWSERS = ["chrome", "edge", "firefox", "safari"];

// The browser version we're using for WPT test results.
// "experimental": most recent WPT results.
// export const BROWSER_FLAVOR = "experimental";
// "stable": more in line with the compat data.
export const BROWSER_FLAVOR = "stable";

// The branch where we're getting the WPT data from.
export const WPT_BRANCH = "master";
