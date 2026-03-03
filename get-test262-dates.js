import fs from "fs/promises";

import { TEST262_DATA_END_POINT, WEEKS, BROWSER_FLAVOR } from "./const.js";

import existingDates from "./test262-dates.json" with { type: "json" };

async function fetchRuns(from, to) {
  const response = await fetch(TEST262_DATA_END_POINT);
  const html = await response.text();

  // Extract dates from href attributes like href="2025-09-01/"
  // Using a simple regex that looks for date patterns in href attributes
  const datePattern = /href="(\d{4}-\d{2}-\d{2})\/"/g;
  const dates = [];
  let match;

  while ((match = datePattern.exec(html)) !== null) {
    const date = match[1];
    // Filter dates strictly within the from/to range
    if (date > from && date < to) {
      dates.push(date);
    }
  }

  if (dates.length === 0) {
    return null;
  }

  // Return the middle date
  const middleIndex = Math.floor(dates.length / 2);
  return dates[middleIndex];
}

async function main() {
  const dates = [];

  for (const week of WEEKS) {
    // Check if we don't already have the date for that week.
    const isExisting = existingDates[BROWSER_FLAVOR].find(entry => {
      return entry.week.from === week.from && entry.week.to === week.to;
    });

    // Check if that week is in the future.
    const today = new Date();
    const to = new Date(week.to);
    if (to >= today) {
      console.log(`Looking for WPT SHA from ${week.from} to ${week.to}: SKIPPING (week is not in the past)`);
      continue;
    }
    
    if (isExisting) {
      console.log(`Looking for Test262 date between ${week.from} and ${week.to}: SKIPPING (already known)`);
      dates.push(isExisting);
      continue;
    }
    
    const date = await fetchRuns(week.from, week.to);
    if (date) {
      console.log(`Looking for a Test262 date between ${week.from} and ${week.to}: FOUND (${date})`);
      dates.push({
        date,
        week
      });
    } else {
      console.log(`Looking for Test262 date between ${week.from} and ${week.to}: NOT FOUND`);
      // Missing data for this week...
    }
  }

  existingDates[BROWSER_FLAVOR] = dates;
  await fs.writeFile("./test262-dates.json", JSON.stringify(existingDates, null, 2));
}

main();
