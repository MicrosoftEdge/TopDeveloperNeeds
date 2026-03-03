import { features as webFeatures } from "web-features";
import data from "./features.json" with { type: "json" };

import { BROWSERS, BROWSER_FLAVOR, WPT_BRANCH, INCLUDE_TENTATIVE } from "./const.js";

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

function getWPTTestResultURL(feature) {
  if (!feature.wpt) {
    return undefined;
  }

  const wptPath = feature.wpt;
  const wptUrl = new URL(`https://wpt.fyi${wptPath}`);
  wptUrl.searchParams.append("label", BROWSER_FLAVOR);
  wptUrl.searchParams.append("label", WPT_BRANCH);
  const qParams = [wptUrl.searchParams.get("q") || ""];
  if (!INCLUDE_TENTATIVE) {
    qParams.push("!is:tentative");
  }
  wptUrl.searchParams.set("q", qParams.join(" "));
  return wptUrl.toString();
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

function formatRationale(feature) {
  const { rationale } = feature;

  return (rationale || []).map((r) => {
    return {
      description: r.description,
      link: r.link,
    };
  });
}

function getDescription(feature) {
  // If a description is provided, just use it.
  if (feature.description) {
    return feature.description;
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

function getFeatureSupportForGroup(ids) {
  const jointSupport = {};

  for (const id of ids) {
    const featureSupport = getFeatureSupportForSingleFeature(id);
    for (const browser of BROWSERS) {
      if (browser in jointSupport) {
        if (jointSupport[browser] === false || featureSupport[browser] === false) {
          // If either the overall feature is already not supported
          // or the specific feature isn't, then the overall feature isn't supported.
          jointSupport[browser] = false;
        } else {
          // Otherwise, that means both the overall feature is supported, and
          // the specific feature is supported.
          // Get the higher support value.
          const overallSupport = parseFloat(jointSupport[browser]);
          const featureSupportValue = parseFloat(featureSupport[browser]);
          jointSupport[browser] = Math.max(overallSupport, featureSupportValue) + "";
        }
      } else {
        jointSupport[browser] = featureSupport[browser];
      }
    }
  }

  return jointSupport;
}

function getFeatureSupportForSingleFeature(id) {
  const support = {};
  for (const browser of BROWSERS) {
    support[browser] = webFeatures[id].status.support[browser] || false;
  }
  return support;
}

function getFeatureSupport(feature) {
  const idOrIds = feature.webFeaturesID;
  if (!idOrIds) {
    const noSupport = {};
    for (const browser of BROWSERS) {
      noSupport[browser] = false;
    }
    return noSupport;
  }

  return Array.isArray(idOrIds)
    ? getFeatureSupportForGroup(idOrIds)
    : getFeatureSupportForSingleFeature(idOrIds);
}

function main() {
  // Go through the list of features.
  return data.map((feature) => {
    // Get the feature's metadata.
    const id = getID(feature);
    const wptURL = getWPTTestResultURL(feature);
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
      support,
      graphNote: feature.graphNote,
      wpt: feature.wpt,
      wptURL,
      test262: feature.test262,
      // If forceUpdateResults is set to true, this causes fetch-test-results.js to
      // get WPT results again, even if they are already in the JSON file.
      // Useful for when the wpt URL has changed.
      forceUpdateResults: feature.forceUpdateResults
    };
  }).sort((a, b) => {
    // Sort features alphabetically by name.
    return a.name.localeCompare(b.name);
  });
}

const generated = main();

console.log(JSON.stringify(generated, null, 2));
