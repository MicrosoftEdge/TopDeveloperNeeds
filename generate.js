import { features as webFeatures } from "web-features";
import { computeBaseline } from "compute-baseline";
import bcd from '@mdn/browser-compat-data' with { type: 'json' };

import data from "./features.json" assert { type: "json" };

import { BROWSERS, BROWSER_FLAVOR, WPT_BRANCH } from "./const.js";

function extractVersionAdded(singleBrowserVersionData) {
  if (
    singleBrowserVersionData.flags ||
    singleBrowserVersionData.version_removed ||
    singleBrowserVersionData.version_added === "preview"
  ) {
    return false;
  }

  if (
    singleBrowserVersionData.version_added &&
    singleBrowserVersionData.version_added.startsWith("≤")
  ) {
    return singleBrowserVersionData.version_added.slice(1);
  }

  return singleBrowserVersionData.version_added;
}

function resolveBCDCompatData(bcdDataForFeature, key) {
  if (
    !bcdDataForFeature ||
    !bcdDataForFeature.__compat ||
    !bcdDataForFeature.__compat.support
  ) {
    throw new Error(`Invalid BCD data for feature ${key}`);
  }
  const data = bcdDataForFeature.__compat.support;
  const resolved = {};

  for (const browser in data) {
    if (!BROWSERS.includes(browser)) {
      continue;
    }

    const versionsAdded = Array.isArray(data[browser])
      ? data[browser]
      : [data[browser]];

    resolved[browser] = versionsAdded
      .map(extractVersionAdded)
      .reduce((acc, curr) => {
        if (curr) {
          return Math.max(acc || 0, parseFloat(curr));
        }
        return acc;
      }, false);
  }

  return resolved;
}

const idFromName = (name) => {
  return name
    .toLowerCase()
    .replace(/\s/g, "-")
    .replace(/[.:]/g, "-")
    .replace(/[`<>()]/g, "");
};

function getID(feature) {
  if (feature.id) {
    return feature.id;
  }

  if (feature.webFeaturesID && !Array.isArray(feature.webFeaturesID)) {
    return feature.webFeaturesID;
  }

  return idFromName(feature.name);
}

function getWPTURL(feature) {
  const wptPath = feature.wpt;
  const wptUrl = new URL(`https://wpt.fyi${wptPath}`);
  wptUrl.searchParams.append("label", BROWSER_FLAVOR);
  wptUrl.searchParams.append("label", WPT_BRANCH);
  const qParams = [wptUrl.searchParams.get("q") || "", "!is:tentative"];
  wptUrl.searchParams.set("q", qParams.join(" "));
  return wptUrl.toString();
}

function getCanIUseURLs(feature) {
  const { caniuse, webFeaturesID: id } = feature;

  if (caniuse) {
    return [`https://caniuse.com/${caniuse}`];
  }

  if (id) {
    if (Array.isArray(id)) {
      return id
        .map((childId) => {
          return webFeatures[childId].caniuse
            ? `https://caniuse.com/${webFeatures[childId].caniuse}`
            : null;
        })
        .filter((url) => !!url);
    } else {
      return webFeatures[id].caniuse
        ? [`https://caniuse.com/${webFeatures[id].caniuse}`]
        : [];
    }
  }

  return [];
}

function getSpecURLs(feature) {
  const { spec, webFeaturesID: id } = feature;

  // If the feature already comes with its spec (or specs), just convert them into an array if needed.
  if (spec) {
    return Array.isArray(spec) ? spec : [spec];
  }

  // If the feature is a web feature, we can get the spec from web-features.
  if (id) {
    if (Array.isArray(id)) {
      return id
        .map((childId) => {
          return Array.isArray(webFeatures[childId].spec)
            ? webFeatures[childId].spec
            : [webFeatures[childId].spec];
        })
        .flat();
    } else {
      return Array.isArray(webFeatures[id].spec)
        ? webFeatures[id].spec
        : [webFeatures[id].spec];
    }
  }

  return [];
}

const htmlify = (str) => {
  return str.replace(/</g, "&lt;").replace(/`([^`]+)`/g, "<code>$1</code>");
};

function formatRationale(feature) {
  const { rationale } = feature;

  return (rationale || []).map((r) => {
    return {
      description: htmlify(r.description),
      link: r.link,
    };
  });
}

function getDescription(feature) {
  // If a description is provided, just use it.
  if (feature.description) {
    return htmlify(feature.description);
  }
  
  const id = feature.webFeaturesID;
  if (!id) {
    return null;
  }

  // Otherwise, it's a web-feature, and we need to check if it's a group or a single feature.
  if (Array.isArray(id)) {
    return id
      .map((childId) => webFeatures[childId].description_html)
      .join("<br>");
  }

  return webFeatures[id].description_html;
}

function getName(feature) {
  return feature.name || webFeatures[feature.webFeaturesID].name;
}

function getFeatureSupportForGroup(feature) {
  let { webFeaturesID: ids } = feature;
  
  const allKeys = [];
  for (const id of ids) {
    const featureKeys = webFeatures[id].compat_features;
    allKeys.push(...featureKeys);
  }

  const cbSupport = computeBaseline({ compatKeys: allKeys });
  const support = {};
  for (const [browser, release] of cbSupport.support) {
    if (BROWSERS.includes(browser.id)) {
      support[browser.id] = release ? release.version : false
    }
  }

  return support;
}

function getFeatureSupport(feature) {
  const isGroup = Array.isArray(feature.webFeaturesID);

  let support = {};

  if (isGroup) {
    support = getFeatureSupportForGroup(feature);
  } else {
    for (const browser of BROWSERS) {
      support[browser] = webFeatures[feature.webFeaturesID].status.support[browser] || false;
    }
  }

  return support;
}

function main() {
  // Go through the list of features.
  return data.map((feature) => {
    // Get the feature's metadata.
    const id = getID(feature);
    const caniuseLinks = getCanIUseURLs(feature);
    const wptLink = getWPTURL(feature);
    const spec = getSpecURLs(feature);
    const rationale = formatRationale(feature);
    const description = getDescription(feature);
    const name = getName(feature);

    // Compute the feature's browser support data, using the web-features data.
    const support = getFeatureSupport(feature);

    return {
      id,
      name,
      description,
      spec,
      rationale,
      caniuseLinks,
      support,
      wptLink
    };
  });
}

const generated = main();

console.log(JSON.stringify(generated, null, 2));