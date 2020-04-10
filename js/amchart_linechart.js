function cumulative_data() {
  // Themes begin
  am4core.useTheme(am4themes_animated);
  am4core.useTheme(am4themes_dark);

  // Themes end
  am4core.ready(function () {
    var chart = am4core.create("chartdiv", am4charts.XYChart);

    chart.dataSource.url = globals.dailySummaryFile;
    chart.dataSource.parser = new am4core.CSVParser();
    chart.dataSource.parser.options.useColumnNames = true;
    chart.dataSource.parser.options.skipEmpty = false;
    chart.dataSource.parser.options.numberFields = ["Total Beds Needed", "Total Projected Cases"];
    chart.colors.step = 2;
    // Converts Y axis values in K,M,B
    chart.numberFormatter.numberFormat = "###a";

    // Create axes
    var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.renderer.minGridDistance = 50;
    categoryAxis.dataFields.category = "date";
    categoryAxis.renderer.labels.template.rotation = -45;

    // Create series

    function createAxisAndSeries(field, name, color, opposite, bullet) {
      var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

      var series = chart.series.push(new am4charts.LineSeries());
      series.dataFields.valueY = field;
      series.dataFields.categoryX = "date";
      series.stroke = color;
      series.yAxis = valueAxis;
      series.fill = color;
      series.name = name;
      series.tooltipText = "{name}: [bold]{valueY}[/]";
      series.tensionX = 0.8;

      series.showOnInit = true;

      switch (bullet) {
        case "triangle":
          var bullet = series.bullets.push(new am4charts.Bullet());
          bullet.width = 12;
          bullet.height = 12;
          bullet.horizontalCenter = "middle";
          bullet.verticalCenter = "middle";

          var triangle = bullet.createChild(am4core.Triangle);
          triangle.stroke = color;
          triangle.strokeWidth = 2;
          triangle.direction = "top";
          triangle.width = 12;
          triangle.height = 12;
          break;
        case "rectangle":
          var bullet = series.bullets.push(new am4charts.Bullet());
          bullet.width = 10;
          bullet.height = 10;
          bullet.horizontalCenter = "middle";
          bullet.verticalCenter = "middle";

          var rectangle = bullet.createChild(am4core.Rectangle);
          rectangle.stroke = color;
          rectangle.strokeWidth = 2;
          rectangle.width = 10;
          rectangle.height = 10;
          break;
        default:
          var bullet = series.bullets.push(new am4charts.CircleBullet());
          bullet.circle.stroke = color;
          bullet.circle.strokeWidth = 2;
          break;
      }

      valueAxis.renderer.line.strokeOpacity = 1;
      valueAxis.renderer.line.strokeWidth = 2;
      valueAxis.renderer.line.stroke = series.stroke;
      valueAxis.renderer.labels.template.fill = am4core.color("#fff");
      valueAxis.renderer.opposite = opposite;
    }

    createAxisAndSeries("Total Beds Needed", "Total Beds Needed", am4core.color("rgb(227, 74, 51)"), false, "rectangle");
    createAxisAndSeries("Total Projected Cases", "Total Projected Cases", am4core.color("rgb(49, 163, 8)"), true, "circle");

    // Add legend
    chart.legend = new am4charts.Legend();

    // Add cursor
    chart.cursor = new am4charts.XYCursor();
  })
}

function daily_data() {

  // Themes begin
  am4core.useTheme(am4themes_animated);
  am4core.useTheme(am4themes_dark);

  // Themes end
  am4core.ready(function () {
    var chart = am4core.create("chartdiv", am4charts.XYChart);

    chart.dataSource.url = "./data/nssac-ncov-sd-summary.csv";
    chart.dataSource.parser = new am4core.CSVParser();
    chart.dataSource.parser.options.useColumnNames = true;
    chart.dataSource.parser.options.skipEmpty = false;
    chart.dataSource.parser.options.numberFields = ["newConfirmed", "newDeaths", "newRecovered"];
    chart.colors.step = 2;

    // Create axes
    var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.renderer.minGridDistance = 50;
    categoryAxis.dataFields.category = "date";
    categoryAxis.renderer.labels.template.rotation = -45;

    // Create series
    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    function createAxisAndSeries(field, name, color) {
      var series = chart.series.push(new am4charts.LineSeries());
      series.dataFields.valueY = field;
      series.dataFields.categoryX = "date";
      series.stroke = color;
      series.yAxis = valueAxis;
      series.fill = color;
      series.name = name;
      series.tooltipText = "{name}: [bold]{valueY}[/]";
      series.tensionX = 0.8;
      series.showOnInit = true;

      var bullet = series.bullets.push(new am4charts.CircleBullet());
      bullet.circle.stroke = color;

      valueAxis.renderer.labels.template.fill = am4core.color("#fff");
      valueAxis.renderer.opposite = false;
    }

    createAxisAndSeries("newConfirmed", "Confirmed", am4core.color("rgb(227, 74, 51)"));
    createAxisAndSeries("newDeaths", "Deaths", am4core.color("rgb(43, 140, 190)"));
    createAxisAndSeries("newRecovered", "Recovered", am4core.color("rgb(49, 163, 8)"));

    // Add legend
    chart.legend = new am4charts.Legend();

    // Add cursor
    chart.cursor = new am4charts.XYCursor();
  })
}