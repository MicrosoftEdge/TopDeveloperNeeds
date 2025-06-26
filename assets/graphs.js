function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "2-digit",
    month: "short",
  });
}

const lineColors = {
  "All subtests": "#000000",
  Edge: "#39ABD7",
  Chrome: "#F9BC30",
  Firefox: "#7BE1D9",
  Safari: "#8A4695",
};

function onChartResize(chart) {
  const viewportAspectRatio = window.innerWidth / window.innerHeight;
  if (viewportAspectRatio < 0.8 && chart.aspectRatio !== 1.5) {
    chart.options.aspectRatio = 1.5;
    chart.resize();
  } else if (viewportAspectRatio >= 0.8 && chart.aspectRatio !== 3) {
    chart.options.aspectRatio = 3;
    chart.resize();
  }
  console.log(chart.aspectRatio);
}

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

const debouncedOnChartResize = debounce(onChartResize);

const chartPlugins = {
  legend: {
    position: "top",
    labels: {
      boxHeight: 1,
      boxWidth: 15,
    },
    onHover: function (event, item, legend) {
      for (let index = 0; index < legend.chart.data.datasets.length; index++) {
        if (index !== item.datasetIndex) {
          legend.chart.data.datasets[index].borderColor = "#0003";
        } else {
          legend.chart.data.datasets[index].borderWidth = 3;
        }
      }
      legend.chart.update();
    },
    onLeave: function (event, item, legend) {
      for (let index = 0; index < legend.chart.data.datasets.length; index++) {
        legend.chart.data.datasets[index].borderColor =
          lineColors[legend.chart.data.datasets[index].label];
        legend.chart.data.datasets[index].borderWidth = 2;
      }
      legend.chart.update();
    },
  },
};

const chartOptions = {
  pointStyle: false,
  animations: false,
  interaction: {
    mode: "x",
  },
  responsive: true,
  aspectRatio: 3,
  onResize: debouncedOnChartResize,
  plugins: chartPlugins,
  scales: {
    y: {
      beginAtZero: true,
    },
    x: {
      type: "time",
      time: {
        displayFormats: {
          quarter: "MMM YYYY",
        }
      },
      ticks: {
        callback: function (value, index) {
          return index % 2 === 0 ? formatDate(value) : "";
        },
        maxRotation: 90,
        minRotation: 90,
      },
    },
  },
};

// Experimental WPT test runs don't always have all browsers.
// This utility method "smoothese" over missing data points to avoid gaps in the charts.
function fixMissingDataPoint(data, dataItem, index, browser, totalOrPassed) {
  if (dataItem[browser] && dataItem[browser][totalOrPassed] !== 0) {
    // The data point exists for this browser in this test run, and is not 0.
    return dataItem[browser][totalOrPassed];
  } else {
    // The data point is either missing or is 0.
    // Look at previous non-null/non-0 data points for this browser.
    for (let i = index - 1; i >= 0; i--) {
      if (data[i][browser] && data[i][browser][totalOrPassed] !== 0) {
        return data[i][browser][totalOrPassed];
      }
    }
  }
}

function drawChart(canvas, data) {
  new Chart(canvas, {
    type: "line",
    data: {
      labels: data.map((d) => new Date(d.date)),
      datasets: [
        {
          label: "All subtests",
          data: data.map((d, i) =>
            Math.max(
              fixMissingDataPoint(data, d, i, "chrome", "total"),
              fixMissingDataPoint(data, d, i, "safari", "total"),
              fixMissingDataPoint(data, d, i, "firefox", "total"),
              fixMissingDataPoint(data, d, i, "edge", "total")
            )
          ),
          borderWidth: 2,
          borderColor: lineColors["All subtests"],
        },
        {
          label: "Edge",
          data: data.map((d, i) => fixMissingDataPoint(data, d, i, "edge", "passed")),
          borderWidth: 2,
          borderColor: lineColors.Edge,
        },
        {
          label: "Chrome",
          data: data.map((d, i) => fixMissingDataPoint(data, d, i, "chrome", "passed")),
          borderWidth: 2,
          borderColor: lineColors.Chrome,
        },
        {
          label: "Firefox",
          data: data.map((d, i) => fixMissingDataPoint(data, d, i, "firefox", "passed")),
          borderWidth: 2,
          borderColor: lineColors.Firefox,
        },
        {
          label: "Safari",
          data: data.map((d, i) => fixMissingDataPoint(data, d, i, "safari", "passed")),
          borderWidth: 2,
          borderColor: lineColors.Safari,
        },
      ],
    },
    options: chartOptions,
  });
}

async function drawMainChart() {
  const response = await fetch("assets/wpt/all_tests.json");
  const allTestsData = await response.json();
  const canvas = document.querySelector("#main-chart");
  drawChart(canvas, allTestsData);
}

async function drawFeatureChart(id) {
  const response = await fetch(`assets/wpt/${id}.json`);
  const data = await response.json();
  const canvas = document.getElementById(`chart-${id}`);
  drawChart(canvas, data);
}

drawMainChart();

const featuresEl = document.querySelector(".features");
featuresEl.querySelectorAll(".feature").forEach((featureEl) => {
  const detailsEl = featureEl.querySelector("details");

  detailsEl.addEventListener("toggle", (event) => {
    if (detailsEl.open && !featureEl.dataset.init) {
      featureEl.dataset.init = true;
      drawFeatureChart(featureEl.id);
    }
  });
});
