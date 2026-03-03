import fs from "fs/promises";

import { rimraf }  from "rimraf";

import { BROWSER_FLAVOR, BROWSERS } from "./const.js";
import testResults from "./site/_data/testResults.json" with { type: "json" };
import features from "./site/_data/features.json" with { type: "json" };

import shaData from "./wpt-shas.json" with { type: "json" };
const shas = shaData[BROWSER_FLAVOR];

const GRAPH_DATA_DIR = "site/assets/wpt";
const MAIN_GRAPH_OUTPUT_FILE = `${GRAPH_DATA_DIR}/all_tests.json`;

function generateMainGraphData() {
  const graphData = [];
  const lastKnownFeatureData = {};
  const allBrowsers = new Set();

  for (let dateStr in testResults) {
    const testResultsForDate = testResults[dateStr];

    const totalPerBrowser = {};

    for (let featureName in testResultsForDate) {
      if (!features.find(({ id }) => id === featureName)) {
        continue;
      }

      const featureData = testResultsForDate[featureName];
      
      // Initialize cache for this feature if needed
      if (!lastKnownFeatureData[featureName]) {
        lastKnownFeatureData[featureName] = {};
      }

      // Collect all browser names from this feature data
      for (let browserName in featureData) {
        if (BROWSERS.includes(browserName)) {
          allBrowsers.add(browserName);
        }
      }

      // Iterate through all known browsers
      for (let browserName of allBrowsers) {
        if (!totalPerBrowser[browserName]) {
          totalPerBrowser[browserName] = {
            passed: 0,
            total: 0,
          };
        }

        if (featureData[browserName]) {
          // We have data - use it and cache it
          totalPerBrowser[browserName].passed += featureData[browserName][0];
          totalPerBrowser[browserName].total += featureData[browserName][1];
          lastKnownFeatureData[featureName][browserName] = featureData[browserName];
        } else if (lastKnownFeatureData[featureName][browserName]) {
          // No current data - use last known data for this feature+browser
          totalPerBrowser[browserName].passed += lastKnownFeatureData[featureName][browserName][0];
          totalPerBrowser[browserName].total += lastKnownFeatureData[featureName][browserName][1];
        }
        // else: no current data and no cached data, contribute 0
      }
    }

    graphData.push({
      date: dateStr,
      ...totalPerBrowser,
    });
  }

  return graphData;
}

function generateFeatureGraphData(featureID) {
  const graphData = [];

  for (let dateStr in testResults) {
    const featureData = testResults[dateStr][featureID];
    
    const perBrowser = {
      date: dateStr
    };

    for (let browserName in featureData) {
      if (!BROWSERS.includes(browserName)) {
        continue;
      }

      if (featureData[browserName]) {
        const passed = featureData[browserName][0];
        const total = featureData[browserName][1];
        perBrowser[browserName] = { passed, total };
      } else {
        // Reuse the previous date results if there's one, or set to 0.
        const previousData = graphData.length > 0 ? graphData[graphData.length - 1][browserName] : null;
        perBrowser[browserName] = previousData ? { ...previousData } : { passed: 0, total: 0 };
      }
    }

    graphData.push(perBrowser);
  }

  return graphData;
}

async function main() {
  console.log("Deleting existing graph data ...");
  await rimraf(GRAPH_DATA_DIR);
  await fs.mkdir(GRAPH_DATA_DIR);

  console.log("Generating data for the main graph ...");
  const mainGraphData = generateMainGraphData();
  await fs.writeFile(MAIN_GRAPH_OUTPUT_FILE, JSON.stringify(mainGraphData));

  for (const { id } of features) {
    console.log(`Generating data for the ${id} graph ...`);
    const featureGraphData = generateFeatureGraphData(id);
    await fs.writeFile(`${GRAPH_DATA_DIR}/${id}.json`, JSON.stringify(featureGraphData));
  }
}

main();
