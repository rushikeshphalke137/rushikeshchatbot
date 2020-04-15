function summaryData() {

  // Dispose all Charts and clear Browser memory/cache
  am4core.disposeAllCharts();

  // Themes begin
  am4core.useTheme(am4themes_animated);

  // Create chart instance
  var chart = am4core.create("chartdiv", am4charts.XYChart);
  chart.hiddenState.properties.opacity = 0;
  // Converts Y axis values in K,M,B
  chart.numberFormatter.numberFormat = "###a";

  chart.dataSource.url = globals.dailySummaryFile;
  chart.dataSource.parser = new am4core.CSVParser();
  chart.dataSource.parser.options.useColumnNames = true;
  chart.dataSource.parser.options.skipEmpty = false;
  chart.dataSource.parser.options.numberFields = ["Total Hospitalizations", "Total Projected Demand (%)"];

  var colors = ["#bd1e2e", "#5e3aba", "#fc4503", "#167d1a", "#c6d42c", "#7de067", "#80cbd9", "#b60fdb", "#c2305a", "#9c2187"];

  // Create axes
  var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
  categoryAxis.dataFields.category = "date";

  categoryAxis.dateFormatter = new am4core.DateFormatter();
  categoryAxis.dateFormatter.dateFormat = "MM-dd";

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

function selectedRegionsChart() {

  // Don't render Charts for multiple results.
  if (globals.selectedHRRNumbers.length != 1) {
    summaryData();
    return;
  }

  // Dispose all Charts and clear Browser memory/cache
  am4core.disposeAllCharts();

  // Themes begin
  am4core.useTheme(am4themes_animated);

  // Create chart instance
  var chart = am4core.create("chartdiv", am4charts.XYChart);
  chart.hiddenState.properties.opacity = 0;

  var colors = ["#bd1e2e", "#5e3aba", "#fc4503", "#167d1a", "#c6d42c", "#7de067", "#80cbd9", "#b60fdb", "#c2305a", "#9c2187"];

  for (i = 0; i < globals.selectedHRRNumbers.length; i++) {

    // Create axes
    var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.renderer.minGridDistance = 50;
    dateAxis.renderer.labels.template.rotation = -45;
    dateAxis.renderer.line.strokeOpacity = 1;
    dateAxis.renderer.line.strokeWidth = 1;
    dateAxis.renderer.labels.template.fill = am4core.color("#fff");
    dateAxis.renderer.grid.template.fill = am4core.color("#fff");

    var datafile = globals.scenariosDirectory + "/regions/nssac_ncov_ro_summary_hrr_" + globals.selectedHRRNumbers[i] + ".csv";

    // Create Hospitalization series
    createHospitalizationSeries(chart, colors[i], datafile);

    // Create Demand series
    createDemandSeries(chart, datafile);
  }

  // Add legend
  chart.legend = new am4charts.Legend();
  // Sets color of Legends to white
  chart.legend.labels.template.fill = am4core.color("#fff");
  chart.legend.valueLabels.template.fill = am4core.color("#fff");

  // Add cursor
  chart.cursor = new am4charts.XYCursor();

}

function createDemandSeries(chart, datafile) {

  // Create Demand Value axis
  var demandValueAxis = chart.yAxes.push(new am4charts.ValueAxis());
  demandValueAxis.renderer.opposite = true;
  demandValueAxis.renderer.line.stroke = am4core.color("#5e3aba");
  demandValueAxis.renderer.line.strokeOpacity = 1;
  demandValueAxis.renderer.line.strokeWidth = 1;
  demandValueAxis.renderer.labels.template.fill = am4core.color("#fff");
  demandValueAxis.renderer.grid.template.fill = am4core.color("#fff");

  // Create Demand series
  var demandSeries = chart.series.push(new am4charts.LineSeries());
  if (datafile) {
    demandSeries.dataSource.url = datafile;
    demandSeries.dataSource.parser = new am4core.CSVParser();
    demandSeries.dataSource.parser.options.useColumnNames = true;
    demandSeries.dataFields.dateX = "date";
  } else {
    demandSeries.dataFields.categoryX = "date";
  }

  demandSeries.dataFields.valueY = "Total Projected Demand (%)";
  demandSeries.yAxis = demandValueAxis;

  demandSeries.stroke = am4core.color("#5e3aba");
  demandSeries.fill = am4core.color("#5e3aba");

  demandSeries.strokeWidth = 2;
  demandSeries.tensionX = 0.8;
  demandSeries.sequencedInterpolation = true;
  demandSeries.defaultState.transitionDuration = 1000;

  demandSeries.name = "Projected Demand (%)";
  demandSeries.tooltipText = "Projected Demand : [bold]{valueY}[/]";
  demandSeries.tooltip.background.fill = am4core.color("#5e3aba");
  demandSeries.showOnInit = true;

  // Create data points
  var bullet = demandSeries.bullets.push(new am4charts.CircleBullet());
  bullet.width = 5;
  bullet.height = 5;

  bullet.circle.stroke = am4core.color("#5e3aba");
  bullet.circle.strokeWidth = 2;
}

function createHospitalizationSeries(chart, color, datafile) {

  // Create Hospitalization Value axis
  var hospitalizationValueAxis = chart.yAxes.push(new am4charts.ValueAxis());
  hospitalizationValueAxis.renderer.opposite = false;
  hospitalizationValueAxis.renderer.line.stroke = am4core.color(color);
  hospitalizationValueAxis.renderer.line.strokeOpacity = 1;
  hospitalizationValueAxis.renderer.line.strokeWidth = 1;
  hospitalizationValueAxis.renderer.labels.template.fill = am4core.color("#fff");
  hospitalizationValueAxis.renderer.grid.template.fill = am4core.color("#fff");

  // Create Uncertainity Bound Series
  var uncertainitySeries = chart.series.push(new am4charts.LineSeries());
  if (datafile) {
    uncertainitySeries.dataSource.url = datafile;
    uncertainitySeries.dataSource.parser = new am4core.CSVParser();
    uncertainitySeries.dataSource.parser.options.useColumnNames = true;
    uncertainitySeries.dataFields.dateX = "date";
  } else {
    uncertainitySeries.dataFields.categoryX = "date";
  }

  uncertainitySeries.dataFields.openValueY = "Lower Hospitalization Bound";
  uncertainitySeries.dataFields.valueY = "Upper Hospitalization Bound";
  uncertainitySeries.yAxis = hospitalizationValueAxis;

  uncertainitySeries.stroke = am4core.color(color);
  uncertainitySeries.fill = am4core.color(color);
  uncertainitySeries.hiddenInLegend = true;

  uncertainitySeries.tensionX = 0.8;
  uncertainitySeries.fillOpacity = 0.4;
  uncertainitySeries.sequencedInterpolation = true;
  uncertainitySeries.defaultState.transitionDuration = 1000;

  // Create Hospitalization series
  var hospitalizationSeries = chart.series.push(new am4charts.LineSeries());
  if (datafile) {
    hospitalizationSeries.dataSource.url = datafile;
    hospitalizationSeries.dataSource.parser = new am4core.CSVParser();
    hospitalizationSeries.dataSource.parser.options.useColumnNames = true;
    hospitalizationSeries.dataFields.dateX = "date";
  } else {
    hospitalizationSeries.dataFields.categoryX = "date";
  }

  hospitalizationSeries.dataFields.valueY = "Total Hospitalizations";
  hospitalizationSeries.yAxis = hospitalizationValueAxis;

  hospitalizationSeries.stroke = am4core.color(color);
  hospitalizationSeries.fill = am4core.color(color);

  hospitalizationSeries.strokeWidth = 2;
  hospitalizationSeries.tensionX = 0.8;
  hospitalizationSeries.sequencedInterpolation = true;
  hospitalizationSeries.defaultState.transitionDuration = 1000;

  hospitalizationSeries.name = "Total Hospitalizations";
  hospitalizationSeries.tooltipText = "Total Hospitalizations : [bold]{valueY}[/]";
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