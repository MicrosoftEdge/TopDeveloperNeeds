// This script is used to fetc the WPT and TEST262 results for the features
// we care about in features.json.
// The script goes over all SHAs in wpt-shas.json and all dates in test262-dates.json,
// over all features. But it only fetches the test results for
// the combination of sha/feature (or date/feature) that we haven't seen before,
// based on what's already in site/_data/testResults.json.

import playwright from "playwright";
import fs from "fs/promises";

import { TEST262_DATA_END_POINT, WEEKS, BROWSERS, BROWSER_FLAVOR, JS_ENGINES_PER_BROWSER } from "./const.js";

import features from "./site/_data/features.json" with { type: "json" };

import wptShaData from "./wpt-shas.json" with { type: "json" };
const wptShas = wptShaData[BROWSER_FLAVOR];

import test262Data from "./test262-dates.json" with { type: "json" };
const test262Dates = test262Data[BROWSER_FLAVOR];

// Output file where the data is stored.
// This file should be organized by date. One entry per day.
// Then by feature (keyed on web-features ID).
// And then by browser.
const OUTPUT_FILE = "site/_data/testResults.json";

function buildEmptyResults(meta = {}) {
  const emptyResult = { ...meta };
  for (const browserName of BROWSERS) {
    emptyResult[browserName] = null;
  }
  return emptyResult;
}

async function getTestResults(feature, week) {
  if (feature.wpt) {
    console.log(`Looking for WPT results for ${feature.id} for week ${week.from} to ${week.to} ...`);

    const shaEntry = wptShas.find(entry => {
      return entry.week.from === week.from && entry.week.to === week.to;
    });

    if (!shaEntry) {
      console.log(`No WPT SHA found for week ${week.from} to ${week.to}. Writing empty results.`);
      return buildEmptyResults({ sha: null });
    }

    return await getWPTResults(feature.wptURL, shaEntry?.sha);
  } else if (feature.test262) {
    console.log(`Looking for Test262 results for ${feature.id} for week ${week.from} to ${week.to} ...`);

    const dateEntry = test262Dates.find(entry => {
      return entry.week.from === week.from && entry.week.to === week.to;
    });

    if (!dateEntry) {
      console.log(`No Test262 date found for week ${week.from} to ${week.to}. Writing empty results.`);
      return buildEmptyResults({ date: null });
    }

    return await getTest262Results(feature.test262, dateEntry?.date);
  }
}

async function getTest262Results(test262FeatureName, date) {
  try {
    const response = await fetch(`${TEST262_DATA_END_POINT}/${date}/features.json`);
    const data = await response.json();

    const results = data[test262FeatureName];
    const total = results.total;

    const test262Results = {};
    for (const browserName of BROWSERS) {
      const engine = JS_ENGINES_PER_BROWSER[browserName];
      const passed = results.engines[engine];
      test262Results[browserName] = [passed, total];
    }

    return test262Results;
  } catch (e) {
    console.error(`Error fetching Test262 results for ${test262FeatureName} on ${date}:`, e);
    const emptyResult = {};
    for (const browserName of BROWSERS) {
      emptyResult[browserName] = null;
    }
    return emptyResult;
  }
}

async function getWPTResults(wptURL, sha) {
  const scrapingBrowser = await playwright.chromium.launch({ headless: true });
  const context = await scrapingBrowser.newContext();
  const page = await context.newPage();

  // Creating the right WPT results URL, targeting the right SHA.
  const wptUrl = new URL(wptURL);
  wptUrl.searchParams.set("sha", sha);

  // Go to the page.
  await page.goto(wptUrl.toString());

  // Wait for the results to be completely loaded.
  // In particular, wait for the text "Subtest Total" to appear in the table.
  try {
    await page.waitForSelector("td code:has-text('Subtest Total')");
  } catch (e) {
    // Not all tests have results for all SHAs. Some tests might be 
    // newer than the SHA we're trying to get results for.
    const emptyResult = { sha };
    for (const browserName of BROWSERS) {
      emptyResult[browserName] = null;
    }
    return emptyResult;
  }

  // Get the list of browsers on that page.
  // The list is in the first thead>tr of the page.
  // Each browser is represented by a th which contains a web component
  // in a shadow root.
  const tableHeaderTexts = await page.locator('test-run div div').allTextContents();
  const browsers = tableHeaderTexts
    .map(t => t.toLowerCase().trim())
    .map(t => {
      const browser = BROWSERS.find(b => t.includes(b));
      return browser;
    })
    .filter(t => !!t && t.length > 0);

  // Get the test result data from the page.
  // They're in the last tr with class totals-row.
  // Each td contains the number of test passes vs. total.
  const resultTexts = await page.locator('.totals-row .numbers span').allTextContents();

  const wptResults = { sha };

  for (let i = 0; i < browsers.length; i++) {
    const browserName = browsers[i];
    const result = resultTexts[i];
    const [passed, total] = result.split(" / ");
    wptResults[browserName] = [parseInt(passed, 10), parseInt(total, 10)];
  }

  await scrapingBrowser.close();

  return wptResults;
}

// Get the latest WPT or TEST262 results, for each feature, given the WPT path.
// Store the result as a new entry under site/_data/testResults.json, per browser.

async function main() {
  // Read the content of the output file
  // to see what we already have.
  const fileContent = await fs.readFile(OUTPUT_FILE, "utf-8");
  const existingTestResultsData = JSON.parse(fileContent);

  // Create a new object for the new content.
  // But fill it with the existing content first by doing
  // a deep copy.
  const newContent = JSON.parse(JSON.stringify(existingTestResultsData));

  for (const week of WEEKS) {
    console.log("");
    console.log(`--- Getting results for week ${week.from} to ${week.to} ---`);

    // We use the "from" date as the index for the results.
    const indexDate = week.from;

    for (const feature of features) {
      console.log("");
      console.log(`--- Feature: ${feature.id} ---`);

      if (existingTestResultsData[indexDate] && existingTestResultsData[indexDate][feature.id] && !feature.forceUpdateResults) {
        console.log(`Already have data for ${feature.id} for this date. Skipping.`);
        continue;
      }

      const results = await getTestResults(feature, week);
      if (!results) {
        continue;
      }

      if (!newContent[indexDate]) {
        newContent[indexDate] = {};
      }

      newContent[indexDate][feature.id] = results;

      // We write to the file at each step of the way
      // to avoid losing data if the script crashes.
      console.log(`Writing data for ${feature.id} (${indexDate}) to ${OUTPUT_FILE} ...`);
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(newContent, null, 2));
    }
  }

  // Sort the entire content by date and write it again to the file.
  const sortedContent = Object.keys(newContent)
    .sort((dateStrA, dateStrB) => {
      const dateA = new Date(dateStrA);
      const dateB = new Date(dateStrB);
      return dateA - dateB;
    })
    .reduce((acc, key) => {
      acc[key] = newContent[key];
      return acc;
    }, {});

  console.log(`\nWriting sorted data to ${OUTPUT_FILE} ...`);
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(sortedContent, null, 2));
}

main();
