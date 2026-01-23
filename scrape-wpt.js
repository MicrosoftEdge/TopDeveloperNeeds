// This script is used to scrape the WPT results for the features
// we care about in features.json.
// The script goes over all SHAs in historical-shas.json and
// over all features. But it only fetches the WPT results for
// the combination of sha/feature that we haven't seen before,
// based on what's already in site/_data/wpt.json.

import playwright from "playwright";
import fs from "fs/promises";

import { BROWSERS, BROWSER_FLAVOR } from "./const.js";

import features from "./site/_data/features.json" with { type: "json" };
import shaData from "./historical-shas.json" with { type: "json" };
const shas = shaData[BROWSER_FLAVOR];

// Output file where the data is stored.
// This file should be organized by date. One entry per day.
// Then by feature (keyed on web-features ID).
// And then by browser.
const OUTPUT_FILE = "site/_data/wpt.json";

async function getWPTResults(wptLink, sha) {
  const scrapingBrowser = await playwright.chromium.launch({ headless: true });
  const context = await scrapingBrowser.newContext();
  const page = await context.newPage();
  
  // Creating the right WPT results URL, targeting the right SHA.
  const wptUrl = new URL(wptLink);
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
    const emptyResult = { r: sha };
    for (const b of BROWSERS) {
      emptyResult[b.substring(0, 1)] = [0,0]
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

  const wptResults = { r: sha };

  for (let i = 0; i < browsers.length; i++) {
    const browser = browsers[i];
    const result = resultTexts[i];
    const [passed, total] = result.split(" / ");
    wptResults[browser.substring(0, 1)] = [parseInt(passed, 10), parseInt(total, 10)];
  }

  await scrapingBrowser.close();

  return wptResults;
}

// Get the latest WPT results, for each feature, given the WPT path.
// Store the result as a new entry under site/_data/wpt.json, per browser.

async function main() {
  // Read the content of the output file
  // to see what we already have.
  const fileContent = await fs.readFile(OUTPUT_FILE, "utf-8");
  const existingWPTData = JSON.parse(fileContent);

  // Create a new object for the new content.
  // But fill it with the existing content first by doing
  // a deep copy.
  const newContent = JSON.parse(JSON.stringify(existingWPTData));

  for (const { sha, date } of shas) {
    console.log("");
    console.log(`--- ${sha} (${date}) ---`);
    
    for (const feature of features) {
      console.log("");
      console.log(`--- ${feature.id} ---`);

      if (existingWPTData[date] && existingWPTData[date][feature.id] && !feature.wptOverride) {
        console.log(`Already have data for ${feature.id} at ${sha} (${date}). Skipping.`);
        continue;
      }

      console.log(`Getting data for ${feature.id} at ${sha} (${date}) ...`);

      const results = await getWPTResults(feature.wptLink, sha);
      
      if (!newContent[date]) {
        newContent[date] = {};
      }

      newContent[date][feature.id] = results;

      // We write to the file at each step of the way
      // to avoid losing data if the script crashes.
      console.log(`Writing data for ${feature.id} at ${sha} (${date}) to ${OUTPUT_FILE} ...`);
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(newContent));
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
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(sortedContent));
}

main();
