
function cumulative_data(){
am4core.useTheme(am4themes_animated);
am4core.useTheme(am4themes_dark);

// Create chart instance
globals.chart = am4core.create("chartdiv",  am4charts.XYChart);

globals.chart.dataSource.url = globals.regionSummaryFile;
globals.chart.dataSource.parser = new am4core.CSVParser();
globals.chart.dataSource.parser.options.useColumnNames = true;
globals.chart.dataSource.parser.options.skipEmpty = false;
globals.chart.dataSource.parser.options.numberFields = ["totalConfirmed","totalDeaths","totalRecovered"];

globals.chart.dataSource.events.on("parseended", function(ev) {
  var data = ev.target.data;
  for (var i = 0; i < data.length; i++) {
    data[i]["activeCount"] = data[i]["totalConfirmed"] - data[i]["totalDeaths"] - data[i]["totalRecovered"];
  }
});

var categoryAxis = globals.chart.xAxes.push(new am4charts.CategoryAxis());
categoryAxis.dataFields.category = "date";
categoryAxis.title.text = "Date";
categoryAxis.renderer.minGridDistance = 20;
categoryAxis.renderer.labels.template.rotation = -45;
categoryAxis.renderer.labels.template.horizontalCenter = "right";
categoryAxis.renderer.labels.template.verticalCenter = "top";
categoryAxis.renderer.grid.template.disabled = true;
categoryAxis.renderer.labelColorField = "white";

var  valueAxis = globals.chart.yAxes.push(new am4charts.ValueAxis());
valueAxis.title.text = "Count";
valueAxis.calculateTotals = true;
valueAxis.min = 0;
valueAxis.renderer.grid.template.disabled = true;

var series4 = globals.chart.series.push(new am4charts.ColumnSeries());
series4.dataFields.valueY = "activeCount";
series4.dataFields.categoryX = "date";
series4.name = "Active";
series4.tooltipText = "{name}: [bold]{valueY}[/]";
series4.clustered = false;
series4.stacked = true;
series4.fill = am4core.color("rgb(255,140,0)");
series4.columns.template.strokeWidth = 0;

var series3 = globals.chart.series.push(new am4charts.ColumnSeries());
series3.dataFields.valueY = "totalRecovered";
series3.dataFields.categoryX = "date";
series3.name = "Recovered";
series3.tooltipText = "{name}: [bold]{valueY}[/]";
series3.hidden = true;
series3.clustered = false;
series3.stacked = true;
series3.fill = am4core.color("rgb(49, 163, 8)");
series3.columns.template.strokeWidth = 0;

var series2 = globals.chart.series.push(new am4charts.ColumnSeries());
series2.dataFields.valueY = "totalDeaths";
series2.dataFields.categoryX = "date";
series2.name = "Deaths";
series2.tooltipText = "{name}: [bold]{valueY}[/]";
series2.hidden = true;
series2.clustered = false;
series2.stacked = true;
series2.fill = am4core.color("rgb(43, 140, 190)");
series2.columns.template.strokeWidth = 0;

// Create series
var series = globals.chart.series.push(new am4charts.ColumnSeries());
series.dataFields.valueY = "totalConfirmed";
series.dataFields.categoryX = "date";
series.name = "Confirmed";
series.tooltipText = "{name}: [bold]{valueY}[/]";
series.stacked = false;
series.clustered = false;
series.fill = am4core.color("rgb(227, 74, 51)");
series.columns.template.strokeWidth = 0;
series.toBack();

// Add cursor
globals.chart.legend = new am4charts.Legend();
globals.chart.legend.reverseOrder = true;
globals.chart.cursor = new am4charts.XYCursor();
globals.chart.legend.marginRight = 50;
}

function logarithamic_cumulative_data() {
  am4core.useTheme(am4themes_animated);
  am4core.useTheme(am4themes_dark);
  am4core.ready(function () {
  globals.chart = am4core.create("chartdiv", am4charts.XYChart);

  var data = globals.chartDataFile;
  for (var i = 0; i < data.length; i++) {
    if (data[i]["totalConfirmed"] == 0) {
      data[i]["totalConfirmed"] = 1;
    }
    if (data[i]["totalDeaths"] == 0) {
      data[i]["totalDeaths"] = 1;
    }
    if (data[i]["totalRecovered"] == 0) {
      data[i]["totalRecovered"] = 1;
    }
    data[i]["activeCount"] = parseInt(data[i]["totalConfirmed"]) - parseInt(data[i]["totalDeaths"]) - parseInt(data[i]["totalRecovered"]);
    if (data[i]["activeCount"] == 0) {
      data[i]["activeCount"] = 1;
    }
  }

  globals.chart.data = data;

  //globals.chart.dateFormatter.inputDateFormat = "MM-dd-yyyy";
  var categoryAxis = globals.chart.xAxes.push(new am4charts.CategoryAxis());
  categoryAxis.dataFields.category = "date";
  categoryAxis.title.text = "Date";
  categoryAxis.renderer.minGridDistance = 20;
  categoryAxis.renderer.labels.template.rotation = -45;
  categoryAxis.renderer.labels.template.horizontalCenter = "right";
  categoryAxis.renderer.labels.template.verticalCenter = "top";
  categoryAxis.renderer.grid.template.disabled = true;
  categoryAxis.renderer.labelColorField = "white";

  var valueAxis = globals.chart.yAxes.push(new am4charts.ValueAxis());
  if (globals.logScale) {
    valueAxis.logarithmic = true;
  }
  valueAxis.min = 1;
  valueAxis.renderer.grid.template.disabled = true;
  valueAxis.renderer.fixedWidthGrid = 100;
  valueAxis.cursorTooltipEnabled = false;
  valueAxis.renderer.labels.template.adapter.add("text", (text) => {
    if (text === "1") {
      return "0"
    }
    else {
      return text;
    }
  })

  var series = globals.chart.series.push(new am4charts.ColumnSeries());
  series.dataFields.categoryX = "date";
  series.dataFields.valueY = "totalConfirmed";
  series.name = "Confirmed";
  series.tooltipText = "{name}: [bold]{valueY}[/]";
  series.stacked = false;
  series.clustered = false;
  series.fill = am4core.color("rgb(227, 74, 51)");
  series.columns.template.strokeWidth = 0;
  series.toBack();

  var series2 = globals.chart.series.push(new am4charts.ColumnSeries());
  series2.dataFields.categoryX = "date";
  series2.dataFields.valueY = "totalDeaths";
  series2.name = "Deaths";
  series2.tooltipText = "{name}: [bold]{valueY}[/]";
  series2.hidden = true;
  series2.clustered = false;
  series2.stacked = true;
  series2.fill = am4core.color("rgb(43, 140, 190)");
  series2.columns.template.strokeWidth = 0;

  var series3 = globals.chart.series.push(new am4charts.ColumnSeries());
  series3.dataFields.categoryX = "date";
  series3.dataFields.valueY = "totalRecovered";
  series3.name = "Recovered";
  series3.tooltipText = "{name}: [bold]{valueY}[/]";
  series3.hidden = true;
  series3.clustered = false;
  series3.stacked = true;
  series3.fill = am4core.color("rgb(49, 163, 8)");
  series3.columns.template.strokeWidth = 0;

  var series4 = globals.chart.series.push(new am4charts.ColumnSeries());
  series4.dataFields.categoryX = "date";
  series4.dataFields.valueY = "activeCount";
  series4.name = "Active";
  series4.tooltipText = "{name}: [bold]{valueY}[/]";
  series4.clustered = false;
  series4.stacked = true;
  series4.fill = am4core.color("rgb(255,140,0)");
  series4.columns.template.strokeWidth = 0;

  globals.chart.cursor = new am4charts.Cursor();
  globals.chart.legend = new am4charts.Legend();
  globals.chart.legend.marginRight = 50;
  });
}

function daily_data()
{
am4core.useTheme(am4themes_animated);
am4core.useTheme(am4themes_dark);

am4core.ready(function() {
// Create chart instance
globals.chart = am4core.create("chartdiv",  am4charts.XYChart);

globals.chart.dataSource.url = globals.regionSummaryFile;
globals.chart.dataSource.parser = new am4core.CSVParser();
globals.chart.dataSource.parser.options.useColumnNames = true;
globals.chart.dataSource.parser.options.skipEmpty = false;
globals.chart.dataSource.parser.options.numberFields = ["newConfirmed","newDeaths","newRecovered"];

var categoryAxis = globals.chart.xAxes.push(new am4charts.CategoryAxis());
categoryAxis.dataFields.category = "date";
categoryAxis.title.text = "Date";
categoryAxis.renderer.minGridDistance = 20;
categoryAxis.renderer.labels.template.rotation = -45;
categoryAxis.renderer.labels.template.horizontalCenter = "right";
categoryAxis.renderer.labels.template.verticalCenter = "top";
categoryAxis.renderer.grid.template.disabled = true;
categoryAxis.renderer.labelColorField = "white";

var  valueAxis = globals.chart.yAxes.push(new am4charts.ValueAxis());
valueAxis.title.text = "Count (stacked)";
valueAxis.calculateTotals = true;
valueAxis.min = 0;
valueAxis.renderer.grid.template.disabled = true;
valueAxis.renderer.fixedWidthGrid =100;
  
// Create series
var series = globals.chart.series.push(new am4charts.ColumnSeries());
series.dataFields.valueY = "newConfirmed";
series.dataFields.categoryX = "date";
series.name = "Confirmed";
series.tooltipText = "{name}: [bold]{valueY}[/]";
series.stacked = true;
series.clustered = false;
series.fill = am4core.color("rgb(227, 74, 51)");
series.columns.template.strokeWidth = 0;

var series2 = globals.chart.series.push(new am4charts.ColumnSeries());
series2.dataFields.valueY = "newDeaths";
series2.dataFields.categoryX = "date";
series2.name = "Deaths";
series2.tooltipText = "{name}: [bold]{valueY}[/]";
series2.stacked = true;
series2.clustered = false;
series2.fill = am4core.color("rgb(43, 140, 190)");
series2.columns.template.strokeWidth = 0;

var series3 = globals.chart.series.push(new am4charts.ColumnSeries());
series3.dataFields.valueY = "newRecovered";
series3.dataFields.categoryX = "date";
series3.name = "Recovered";
series3.tooltipText = "{name}: [bold]{valueY}[/]";
series3.stacked = true;
series3.clustered = false;
series3.fill = am4core.color("rgb(49, 163, 8)");
series3.columns.template.strokeWidth = 0;

// Add cursor
globals.chart.legend = new am4charts.Legend();
globals.chart.cursor = new am4charts.XYCursor();
globals.chart.legend.marginRight = 50;
});
	
}

function highlighColumn(date) {
    globals.chart.series.each(function(series) {
      if (series instanceof am4charts.ColumnSeries) {
        series.columns.each(function(column) {
          if (column.dataItem.categoryX == date) {
            column.isActive = true;
            column.fillOpacity = 1;
          }
          else {
            column.isActive = false;
            column.fillOpacity = 0.5;
          }
        })
      }
    })
  }

function resetCharts(){
    globals.chart.series.each(function(series) {
        if (series instanceof am4charts.ColumnSeries) {
        series.columns.each(function(column) {
            column.fillOpacity = 1;
        })
      }
    })
}
