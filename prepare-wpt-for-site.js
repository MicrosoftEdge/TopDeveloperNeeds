import fs from "fs/promises";

import { rimraf }  from "rimraf";

import wpt from "./site/_data/wpt.json" assert { type: "json" };
import features from "./site/_data/features.json" assert { type: "json" };

const GRAPH_DATA_DIR = "site/assets/wpt";
const MAIN_GRAPH_OUTPUT_FILE = `${GRAPH_DATA_DIR}/all_tests.json`;

function getBrowserName(code) {
  return {
    c: "chrome",
    f: "firefox",
    e: "edge",
    s: "safari",
  }[code];
}

function generateMainGraphData() {
  const graphData = [];

  for (let dateStr in wpt) {
    const dateData = wpt[dateStr];

    const totalPerBrowser = {};

    for (let featureName in dateData) {
      if (!features.find(({ id }) => id === featureName)) {
        continue;
      }

      const featureData = dateData[featureName];

      for (let browserCode in featureData) {
        // Skip SHAs.
        if (browserCode === "r") {
          continue;
        }

        // Get complete browser names.
        const browserName = getBrowserName(browserCode);

        if (!totalPerBrowser[browserName]) {
          totalPerBrowser[browserName] = {
            passed: 0,
            total: 0,
          };
        }

        totalPerBrowser[browserName].passed += featureData[browserCode][0];
        totalPerBrowser[browserName].total += featureData[browserCode][1];
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

  for (let dateStr in wpt) {
    const featureData = wpt[dateStr][featureID];
    
    const perBrowser = {
      date: dateStr
    };

    for (let browserCode in featureData) {
      // Skip SHAs.
      if (browserCode === "r") {
        continue;
      }

      // Get complete browser names.
      const browserName = getBrowserName(browserCode);
      const passed = featureData[browserCode][0];
      const total = featureData[browserCode][1];

      perBrowser[browserName] = { passed, total };
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
