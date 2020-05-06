function renderSummaryDataChart() {

  // Dispose all Charts and clear Browser memory/cache
  am4core.disposeAllCharts();

  // Themes begin

  // function am4themes_myTheme(target) {
  //   if (target instanceof am4charts.Axis) {
  //     target.background.fill = am4core.color("#DCCCA3");
  //   }
  // }

  am4core.useTheme(am4themes_animated);
 //am4core.useTheme(am4themes_myTheme);

  // Create chart instance
  var chart = am4core.create("chartdiv", am4charts.XYChart);
  chart.data = globals.chartDataFile;
  chart.hiddenState.properties.opacity = 0;
  // Converts Y axis values in K,M,B
  chart.numberFormatter.numberFormat = "###a";

  let title = chart.titles.create();
  title.text = globals.configuration.chart_title;
  title.stroke = am4core.color("#fff");
  title.fill = am4core.color("#fff");
  title.fontSize = 20;
  title.marginBottom = 15;

  var colors = ["#bd1e2e", "#3479A1", "#fc4503", "#167d1a", "#c6d42c", "#7de067", "#80cbd9", "#b60fdb", "#c2305a", "#9c2187"];

  // Create axes
  var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
  categoryAxis.renderer.grid.template.strokeOpacity = 1;
  categoryAxis.renderer.grid.template.stroke = am4core.color("#D3D3D3"); // ffffff
  categoryAxis.renderer.grid.template.strokeWidth = 1;

  categoryAxis.renderer.line.strokeOpacity = 1;
  categoryAxis.renderer.line.stroke = am4core.color("#D3D3D3"); // ffffff
  categoryAxis.renderer.line.strokeWidth = 1;

  categoryAxis.dataFields.category = "date";

  categoryAxis.renderer.minGridDistance = 50;
  categoryAxis.renderer.labels.template.rotation = -45;
  categoryAxis.renderer.line.strokeOpacity = 1;
  categoryAxis.renderer.line.strokeWidth = 1;
  categoryAxis.renderer.labels.template.fill = am4core.color("#fff");
  categoryAxis.renderer.grid.template.fill = am4core.color("#fff");

  categoryAxis.dateFormatter = new am4core.DateFormatter();
  categoryAxis.dateFormatter.dateFormat = "MM-dd";

  // Create Hospitalization series
  createHospitalizationSeries(chart, colors[0]);

  // Create Demand series
  createDemandSeries(chart);

  // Add legend
  chart.legend = new am4charts.Legend();
  // Sets color of Legends to white
  chart.legend.labels.template.fill = am4core.color("#fff");
  chart.legend.valueLabels.template.fill = am4core.color("#fff");

  // Add cursor
  chart.cursor = new am4charts.XYCursor();
}

function renderQueriedRegionsChart() {

  // Dispose all Charts and clear Browser memory/cache
  am4core.disposeAllCharts();

  // Themes begin
  am4core.useTheme(am4themes_animated);

  // Create chart instance
  var chart = am4core.create("chartdiv", am4charts.XYChart);
  chart.data = mergeDataAcrossRegions();
  chart.hiddenState.properties.opacity = 0;

  let title = chart.titles.create();
  title.text = "Demand Forecast for Queried HRRs";
  title.stroke = am4core.color("#fff");
  title.fill = am4core.color("#fff");
  title.fontSize = 20;
  title.marginBottom = 15;

  var colors = ["#bd1e2e", "#3479A1", "#fc4503", "#167d1a", "#c6d42c", "#7de067", "#80cbd9", "#b60fdb", "#c2305a", "#9c2187"];

  // Create axes
  var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
  categoryAxis.renderer.grid.template.strokeOpacity = 1;
  categoryAxis.renderer.grid.template.stroke = am4core.color("#D3D3D3"); // ffffff 8DB8D6
  categoryAxis.renderer.grid.template.strokeWidth = 1; 

  categoryAxis.renderer.line.strokeOpacity = 1;
  categoryAxis.renderer.line.stroke = am4core.color("#D3D3D3"); // ffffff 
  categoryAxis.renderer.line.strokeWidth = 1;

  categoryAxis.dataFields.category = "date";

  categoryAxis.renderer.minGridDistance = 50;
  categoryAxis.renderer.labels.template.rotation = -45;
  categoryAxis.renderer.line.strokeOpacity = 1;
  categoryAxis.renderer.line.strokeWidth = 1;
  categoryAxis.renderer.labels.template.fill = am4core.color("#fff");
  categoryAxis.renderer.grid.template.fill = am4core.color("#fff");

  // Create Hospitalization series
  createHospitalizationSeries(chart, colors[0]);

  // Create Demand series
  createDemandSeries(chart);

  // Add legend
  chart.legend = new am4charts.Legend();
  // Sets color of Legends to white
  chart.legend.labels.template.fill = am4core.color("#fff");
  chart.legend.valueLabels.template.fill = am4core.color("#fff");

  // Add cursor
  chart.cursor = new am4charts.XYCursor();
}

function renderSelectedRegionsChart(selectedHRRNumber, selectedHRRName) {
  var regionName = selectedHRRNumber + "";

  // Check if region name contains a space, bcoz in case of virginia health, selectedHRRNumber would be for ex. "Far SW/Near SW".
  if (regionName.indexOf(' ') >= 0)
    regionName = regionName.split(" ").join("_");

  var datafile = globals.scenariosDirectory + "/regions/nssac_ncov_ro_summary_" + globals.configuration.region + "_" + regionName + ".csv";

  // Dispose all Charts and clear Browser memory/cache
  am4core.disposeAllCharts();

  // Themes begin
  am4core.useTheme(am4themes_animated);

  // Create chart instance
  var chart = am4core.create("chartdiv", am4charts.XYChart);
  chart.data = getJSONData(datafile);
  chart.hiddenState.properties.opacity = 0;

  let title = chart.titles.create();
  title.text = "Demand Forecast for " + selectedHRRName;
  title.stroke = am4core.color("#fff");
  title.fill = am4core.color("#fff");
  title.fontSize = 20;
  title.marginBottom = 15;

  var colors = ["#bd1e2e", "#3479A1", "#fc4503", "#167d1a", "#c6d42c", "#7de067", "#80cbd9", "#b60fdb", "#c2305a", "#9c2187"];

  // Create axes
  var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
  categoryAxis.renderer.grid.template.strokeOpacity = 1;
  categoryAxis.renderer.grid.template.stroke = am4core.color("#D3D3D3"); // ffffff
  categoryAxis.renderer.grid.template.strokeWidth = 1;

  categoryAxis.renderer.line.strokeOpacity = 1;
  categoryAxis.renderer.line.stroke = am4core.color("#D3D3D3"); // ffffff
  categoryAxis.renderer.line.strokeWidth = 1;

  categoryAxis.dataFields.category = "date";

  categoryAxis.renderer.minGridDistance = 50;
  categoryAxis.renderer.labels.template.rotation = -45;
  categoryAxis.renderer.line.strokeOpacity = 1;
  categoryAxis.renderer.line.strokeWidth = 1;
  categoryAxis.renderer.labels.template.fill = am4core.color("#fff");
  categoryAxis.renderer.grid.template.fill = am4core.color("#fff");
  categoryAxis.renderer.grid.template.location = 0;

  // Create Hospitalization series
  createHospitalizationSeries(chart, colors[0]);

  // Create Demand series
  createDemandSeries(chart);

  // Add legend
  chart.legend = new am4charts.Legend();
  // Sets color of Legends to white
  chart.legend.labels.template.fill = am4core.color("#fff");
  chart.legend.valueLabels.template.fill = am4core.color("#fff");

  // Add cursor
  chart.cursor = new am4charts.XYCursor();
}

function createDemandSeries(chart) {

  // Create Demand Value axis
  var demandValueAxis = chart.yAxes.push(new am4charts.ValueAxis());
  demandValueAxis.renderer.grid.template.strokeOpacity = 1;
  demandValueAxis.renderer.grid.template.stroke = am4core.color("#D3D3D3"); // ffffff 8DB8D6
  demandValueAxis.renderer.grid.template.strokeWidth = 1;

  demandValueAxis.renderer.line.strokeOpacity = 1;
  demandValueAxis.renderer.line.stroke = am4core.color("#D3D3D3"); // ffffff 8DB8D6
  demandValueAxis.renderer.line.strokeWidth = 1;

  // demandValueAxis.renderer.baseGrid.template.stroke = am4core.color("#ffffff");
  demandValueAxis.title.text = "Projected Demand Percentage";
  demandValueAxis.title.fill = am4core.color("#fff");
  demandValueAxis.title.fontSize = 14;

  demandValueAxis.renderer.opposite = true;
  demandValueAxis.renderer.line.stroke = am4core.color("#3479A1");
  demandValueAxis.renderer.line.strokeOpacity = 1;
  demandValueAxis.renderer.line.strokeWidth = 1;
  demandValueAxis.renderer.labels.template.fill = am4core.color("#fff");
  demandValueAxis.renderer.grid.template.fill = am4core.color("#fff");

  // Create Uncertainity Bound Series
  var uncertainitySeries = chart.series.push(new am4charts.LineSeries());

  uncertainitySeries.dataFields.categoryX = "date";
  uncertainitySeries.dataFields.openValueY = "Lower Projected Demand Bound";
  uncertainitySeries.dataFields.valueY = "Upper Projected Demand Bound";
  uncertainitySeries.yAxis = demandValueAxis;

  uncertainitySeries.stroke = am4core.color("#3479A1");
  uncertainitySeries.fill = am4core.color("#3479A1");
  uncertainitySeries.hiddenInLegend = true;

  uncertainitySeries.fillOpacity = 0.4;
  uncertainitySeries.sequencedInterpolation = true;
  uncertainitySeries.defaultState.transitionDuration = 1000;

  // Create Demand series
  var demandSeries = chart.series.push(new am4charts.LineSeries());

  demandSeries.dataFields.categoryX = "date";
  demandSeries.dataFields.valueY = "Total Projected Demand (%)";
  demandSeries.yAxis = demandValueAxis;

  demandSeries.stroke = am4core.color("#3479A1");
  demandSeries.fill = am4core.color("#3479A1");

  demandSeries.strokeWidth = 2;
  demandSeries.sequencedInterpolation = true;
  demandSeries.defaultState.transitionDuration = 1000;

  demandSeries.name = "Projected Demand (%)";
  demandSeries.tooltipText = "Projected Demand : [bold]{valueY}%[/]";
  demandSeries.tooltip.background.fill = am4core.color("#3479A1");
  demandSeries.showOnInit = true;

  // Create data points
  var bullet = demandSeries.bullets.push(new am4charts.CircleBullet());
  bullet.width = 5;
  bullet.height = 5;

  bullet.circle.stroke = am4core.color("#3479A1");
  bullet.circle.strokeWidth = 2;

  // Hiding Uncertainity bounds when hiding the actual series
  demandSeries.events.on("hidden", function () {
    uncertainitySeries.hide();
  });

  // Displaying Uncertainity bounds when displaying the actual series
  demandSeries.events.on("shown", function () {
    uncertainitySeries.show();
  });
}

function createHospitalizationSeries(chart, color) {

  // Create Hospitalization Value axis
  var hospitalizationValueAxis = chart.yAxes.push(new am4charts.ValueAxis());
  hospitalizationValueAxis.renderer.minGridDistance = 50; //used for steps in value axis
  //hospitalizationValueAxis.adjustLabelPrecision = false;
//  hospitalizationValueAxis.min = 1;
 // hospitalizationValueAxis.strictMinMax = true; 
//  hospitalizationValueAxis.numberFormatter.numberFormat = "#.00";
//hospitalizationValueAxis.step = 1;
  hospitalizationValueAxis.renderer.grid.template.strokeOpacity = 1;
  hospitalizationValueAxis.renderer.grid.template.stroke = am4core.color("#D3D3D3"); //ffffff 8DB8D6
  hospitalizationValueAxis.renderer.grid.template.strokeWidth = 1;

  hospitalizationValueAxis.renderer.line.strokeOpacity = 1;
  hospitalizationValueAxis.renderer.line.stroke = am4core.color("#D3D3D3 "); //fffff 8DB8D6
  hospitalizationValueAxis.renderer.line.strokeWidth = 1;

  hospitalizationValueAxis.title.text = "Hospital Counts";
  hospitalizationValueAxis.title.fill = am4core.color("#fff");
  hospitalizationValueAxis.title.fontSize = 14;

  hospitalizationValueAxis.renderer.opposite = false;
  hospitalizationValueAxis.renderer.line.stroke = am4core.color(color);
  hospitalizationValueAxis.renderer.line.strokeOpacity = 1;
  hospitalizationValueAxis.renderer.line.strokeWidth = 1;
  hospitalizationValueAxis.renderer.labels.template.fill = am4core.color("#fff");
  hospitalizationValueAxis.renderer.grid.template.fill = am4core.color("#fff");

  // Create Uncertainity Bound Series
  var uncertainitySeries = chart.series.push(new am4charts.LineSeries());

  uncertainitySeries.dataFields.categoryX = "date";
  uncertainitySeries.dataFields.openValueY = "Lower Hospitalization Bound";
  uncertainitySeries.dataFields.valueY = "Upper Hospitalization Bound";
  uncertainitySeries.yAxis = hospitalizationValueAxis;
 // uncertainitySeries.numberFormatter.numberFormat = "#.";

  uncertainitySeries.stroke = am4core.color(color);
  uncertainitySeries.fill = am4core.color(color);
  uncertainitySeries.hiddenInLegend = true;

  uncertainitySeries.fillOpacity = 0.4;
  uncertainitySeries.sequencedInterpolation = true;
  uncertainitySeries.defaultState.transitionDuration = 1000;

  // Create Hospitalization series
  var hospitalizationSeries = chart.series.push(new am4charts.LineSeries());

  hospitalizationSeries.dataFields.categoryX = "date";
  hospitalizationSeries.dataFields.valueY = "Total Hospitalizations (Median)";
  hospitalizationSeries.yAxis = hospitalizationValueAxis;

  hospitalizationSeries.stroke = am4core.color(color);
  hospitalizationSeries.fill = am4core.color(color);

  hospitalizationSeries.strokeWidth = 2;
  hospitalizationSeries.sequencedInterpolation = true;
  hospitalizationSeries.defaultState.transitionDuration = 1000;

  hospitalizationSeries.name = "Total Hospitalizations";
//  hospitalizationSeries.tooltipText = "Total Hospitalizations {valueY}: [bold]{valueY.formatNumber('#a')}[/]";
  hospitalizationSeries.tooltipText = "Total Hospitalizations : [bold]{valueY.formatNumber('#,###.00')}[/]";
 // hospitalizationSeries.tooltipText = "Total Hospitalizations : [bold]{valueY}[/]";
  hospitalizationSeries.tooltip.background.fill = am4core.color(color);
  hospitalizationSeries.showOnInit = true;

  // Create data points
  var bullet = hospitalizationSeries.bullets.push(new am4charts.Bullet());
  bullet.width = 5;
  bullet.height = 5;
  bullet.horizontalCenter = "middle";
  bullet.verticalCenter = "middle";

  // Create Rectangle shape data points
  var rectangle = bullet.createChild(am4core.Rectangle);
  rectangle.stroke = am4core.color(color);
  rectangle.strokeWidth = 2;
  rectangle.width = 5;
  rectangle.height = 5;

  // Hiding Uncertainity bounds when hiding the actual series
  hospitalizationSeries.events.on("hidden", function () {
    uncertainitySeries.hide();
  });

  // Displaying Uncertainity bounds when displaying the actual series
  hospitalizationSeries.events.on("shown", function () {
    uncertainitySeries.show();
  });
}

function mergeDataAcrossRegions() {
  var mergedData = [];

  for (i = 0; i < globals.selectedHRRNumbers.length; i++) {
    var regionName = globals.selectedHRRNumbers[i] + "";

    // Check if region name contains a space, bcoz in case of virginia health, selectedHRRNumber would be for ex. "Far SW/Near SW".
    if (regionName.indexOf(' ') >= 0)
      regionName = regionName.split(" ").join("_");
    var datafile = globals.scenariosDirectory + "/regions/nssac_ncov_ro_summary_" + globals.configuration.region + "_" + regionName + ".csv";

    $.ajax({
      url: datafile,
      async: false,
      success: function (csv) {
        var items = $.csv.toObjects(csv);
        var jsonobject = JSON.stringify(items);
        var currentData = JSON.parse(jsonobject);

        if (mergedData.length > 0) {
          for (loop = 0; loop < mergedData.length; loop++) {
            var filteredData = currentData[loop];

            mergedData[loop]["Lower Hospitalization Bound"] = parseInt(mergedData[loop]["Lower Hospitalization Bound"]) + parseInt(filteredData["Lower Hospitalization Bound"]);
            mergedData[loop]["Upper Hospitalization Bound"] = parseInt(mergedData[loop]["Upper Hospitalization Bound"]) + parseInt(filteredData["Upper Hospitalization Bound"]);
            mergedData[loop]["Lower Projected Demand Bound"] = parseInt(mergedData[loop]["Lower Projected Demand Bound"]) + parseInt(filteredData["Lower Projected Demand Bound"]);
            mergedData[loop]["Upper Projected Demand Bound"] = parseInt(mergedData[loop]["Upper Projected Demand Bound"]) + parseInt(filteredData["Upper Projected Demand Bound"]);
            mergedData[loop]["Total Projected Demand (%)"] = parseInt(mergedData[loop]["Total Projected Demand (%)"]) + parseInt(filteredData["Total Projected Demand (%)"]);
            mergedData[loop]["Total Hospitalizations (Median)"] = parseInt(mergedData[loop]["Total Hospitalizations (Median)"]) + parseInt(filteredData["Total Hospitalizations (Median)"]);
          }
        } else {
          mergedData = currentData;
        }
      },
      dataType: "text",
      complete: function () { }
    });
  }

  // Average the Total Projected Demand
  for (loop = 0; loop < mergedData.length; loop++) {
    mergedData[loop]["Total Projected Demand (%)"] = Math.round(parseInt(mergedData[loop]["Total Projected Demand (%)"]) / globals.selectedHRRNumbers.length);
    mergedData[loop]["Lower Projected Demand Bound"] = Math.round(parseInt(mergedData[loop]["Lower Projected Demand Bound"]) / globals.selectedHRRNumbers.length);
    mergedData[loop]["Upper Projected Demand Bound"] = Math.round(parseInt(mergedData[loop]["Upper Projected Demand Bound"]) / globals.selectedHRRNumbers.length);
  }

  return mergedData;
}

function getJSONData(datafile) {

  var jsonData;
  $.ajax({
    url: datafile,
    async: false,
    success: function (csv) {
      var items = $.csv.toObjects(csv);
      var jsonobject = JSON.stringify(items);
      jsonData = JSON.parse(jsonobject);
    },
    dataType: "text",
    complete: function () { }
  });

  return jsonData;
}