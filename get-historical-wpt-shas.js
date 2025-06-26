import fs from "fs/promises";

import { WEEKS, BROWSERS, BROWSER_FLAVOR } from "./const.js";

import existingSHAs from "./historical-shas.json" with { type: "json" };

function getURLFor(from, to) {
  // The URL to fetch the data from.
  const products = BROWSERS.map(b => `product=${b}`).join('&');
  // max-count=3 is arbitrary here, just to give us more chances of getting runs
  // where all browsers are present. Might need to adjust later.
  return `https://wpt.fyi/api/runs?aligned=true&labels=${BROWSER_FLAVOR}&${products}&from=${from}&to=${to}&max-count=3`;
}

async function fetchRuns(url) {
  // console.log(`Retrieving test run data from ${url} ...`);
  const response = await fetch(url);
  const data = await response.json();

  // console.log("Attempting to find a SHA that covered all browsers ...");
  
  let browsers = new Set();
  let sha = null;
  let date = null;

  for (const run of data) {
    // Here is our candidate sha and initial browser.
    sha = run.revision;
    date = run.time_start.substring(0, 10);
    browsers.add(run.browser_name);

    // Now iterate once more over data looking for the same sha,
    // and accumulating the browsers that it corresponds to.
    for (const additionalRun of data) {
      if (additionalRun === run) {
        continue;
      }

      if (additionalRun.revision === sha) {
        browsers.add(additionalRun.browser_name);
      }
    }

    if (browsers.size === BROWSERS.length) {
      // console.log(`Found ${sha} on ${date}!`);
      break;
    }

    // console.log(`${sha} doesn't cover all browsers, moving on to next run ...`);
    browsers = new Set();
    sha = null;
    date = null;
  }

  return {sha, date};
}

async function main() {
  const shas = [];

  for (const week of WEEKS) {
    // Check if we don't already have the SHA for that week.
    const isExisting = existingSHAs[BROWSER_FLAVOR].find(entry => {
      return entry.week.from === week.from && entry.week.to === week.to;
    });

    // Check if that week is in the future.
    const today = new Date();
    const from = new Date(week.from);
    if (from > today) {
      console.log(`Looking for WPT SHA from ${week.from} to ${week.to}: SKIPPING (week is in the future)`);
      continue;
    }
    
    if (isExisting) {
      console.log(`Looking for WPT SHA from ${week.from} to ${week.to}: SKIPPING (already known)`);
      shas.push(isExisting);
      continue;
    }
    
    const url = getURLFor(week.from, week.to);
    const data = await fetchRuns(url);
    if (data.sha) {
      console.log(`Looking for WPT SHA from ${week.from} to ${week.to}: FOUND (${data.sha} on ${data.date})`);
      data.week = week;
      shas.push(data);
    } else {
      console.log(`Looking for WPT SHA from ${week.from} to ${week.to}: NOT FOUND`);
      // Missing data for this week...
      // This can happen, and the graphs need to deal with it.
    }
  }

  existingSHAs[BROWSER_FLAVOR] = shas;
  await fs.writeFile("./historical-shas.json", JSON.stringify(existingSHAs, null, 2));
}

main();
