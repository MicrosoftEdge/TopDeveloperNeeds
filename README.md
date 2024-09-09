# Microsoft Edge - 2024 web platform top developer needs

This repository contains the data and scripts that are used to generate the [Microsoft Edge - 2024 web platform top developer needs](https://microsoftedge.github.io/TopDeveloperNeeds/) dashboard.

For more information about the dashboard, see [Introducing the Edge 2024 web platform top developer needs dashboard](https://blogs.windows.com/msedgedev/2024/04/18/2024-web-platform-top-developer-needs-dashboard/) oin the Microsoft Edge blog.

The rest of this README file explains how to update the dashboard data and site.

## Prerequisites

* Install [Node.js](https://nodejs.org).
* Install the required dependencies by typing `npm install`.

## Updating the list of features

The features listed on the dashboard are defined in the `features.json` file.

To update the list of features, make changes to the file. The file contains a JSON array of objects, where each object represents a single feature.

Features are based on the features part of the [web-features project](https://github.com/web-platform-dx/web-features/). At a minimum, each feature object must contain the following information:

* `webFeaturesID`: the ID of the feature in the [web-features](https://github.com/web-platform-dx/web-features/) repo.
* `rationale`: a list of reasons why this feature is important for our dashboard. Each reason is an object with the following string properties `{ description, link }`.
* `wpt`: a string starting with `/results`, and including the optional request parameters that's used to retrieve WPT test results on the wpt.fyi site.

For example:

```json
{
  "webFeaturesID": "object-view-box",
  "wpt": "/results/css?q=object%20view%20box",
  "rationale": [
    {
      "description": "The feature is a pre-requisite for the View Transitions API, which is a highly requested feature",
      "link": "https://github.com/w3c/csswg-drafts/issues/7058"
    }
  ]
}
```

If the feature corresponds to a group of features from the web-features repo, make the following changes:

* `name`: define a name for the group of features.
* `webFeaturesIDs`: change this field's type to an array of the IDs of the features in the web-features repo.

For example, the Scrollbar styling group below is a group of three different web-features:

```json
{
  "name": "Scrollbar styling",
  "webFeaturesID": ["scrollbar-color", "scrollbar-gutter", "scrollbar-width"],
  "wpt": "/results/css?q=path%3A%2Fcss%2Fcss-scrollbars%20or%20%28scrollbar-gutter%20and%20path%3A%2Fcss%2Fcss-overflow%29",
  "rationale": [
    {
      "description": "Styling scrollbar ranked #5 in the State of CSS Survey 2023's browser incompatibilities question",
      "link": "https://2023.stateofcss.com/en-US/usage/#css_interoperability_features"
    }
  ]
}
```

In addition, you can provide the following optional fields:

* `id`: used to set the anchor link ID for the feature. By default anchor links match web-features IDs. Use `id` to override the default anchor link ID. This can be useful when updating a feature over time, to avoid breaking existing links.
* `name`: to override the name coming from the web-features repo.
* `description`: to override the description coming from the web-features repo.
* `spec`: to override the spec (or specs) coming from the web-features repo.

## Generating the dashboard data

1. Update the dependencies:

   * `npm update web-features`
     
     This updates to the most recent version of web-features.

   * `npx npm-check-updates -u`

     This updates to the most recent version of browser-compat-data, and other dependencies, such as Playwright.

   * `npm install`
   
     This installs the missing dependencies if new versions were found at the previous step.

   * `npx playwright install`

     This re-installs the Playwright executables, if needed.

1. To update the computed feature data file:

   * `npm run generate`
   
   This re-generates `site/_data/features.json` based on `features.json`.

1. To retrieve the latest WPT revision for this week:

   * `npm run get-wpt-shas`
   
     This adds more entries into the `historical-shas.json` file, which is needed to retrieve WPT test results.

1. To retrieve the WPT test results:

   * `npm run update-wpt`
   
     This fetches the missing WPT results for our features based on the `historical-shas.json` file, and puts them in `site/_data/wpt.json` as well as generates front-end files in `site/assets/`.

1. To build the site

   * `npm run build-site`
   
     This generates the dashboard website in the `docs` directory.

## Testing the dashboard

To test the built website before publishing it to the live server, run `npm run serve-site` and open a browser window to `http://localhost:8080/`.
