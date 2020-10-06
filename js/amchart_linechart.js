function renderSummaryDataChart() {
    var chartTitle = globals.configuration.chart_title;
    renderChartData(chartTitle);
}

function renderQueriedRegionsChart() {
    var chartTitle = "Demand Forecast for Queried Regions";
    renderChartData(chartTitle);
}

function renderSelectedRegionsChart(selectedHRRNumber, selectedHRRName) {
    globals.chartTitleRegion = "Demand Forecast for " + selectedHRRName;
    renderChartData(globals.chartTitleRegion);
    renderAllScenariosPOB(globals.chartTitleRegion);
    renderAllScenariosWH(globals.chartTitleRegion);
}

function renderChartData(chartTitle) {
    // Dispose all Charts and clear Browser memory/cache
    am4core.disposeAllCharts();

    // Themes begin
    am4core.useTheme(am4themes_animated);

    // Create chart instance
    var chart = am4core.create("chartdiv", am4charts.XYChart);
    chart.data = globals.timelineJsonData;
    chart.hiddenState.properties.opacity = 0;

    let title = chart.titles.create();
    title.text = chartTitle;
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
    categoryAxis.tooltip.disabled = true; //to disable button blackcolor tooltip #43

    categoryAxis.renderer.line.strokeOpacity = 1;
    categoryAxis.renderer.line.stroke = am4core.color("#D3D3D3"); // ffffff
    categoryAxis.renderer.line.strokeWidth = 1;

    categoryAxis.dataFields.category = "date";

    categoryAxis.renderer.minGridDistance = 50;
    categoryAxis.renderer.labels.template.rotation = -25;
    categoryAxis.renderer.line.strokeOpacity = 1;
    categoryAxis.renderer.line.strokeWidth = 1;
    categoryAxis.renderer.labels.template.fill = am4core.color("#fff");
    categoryAxis.renderer.grid.template.fill = am4core.color("#fff");
    categoryAxis.renderer.grid.template.location = 0;

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

function createDemandSeries(chart) {

    // Create Demand Value axis
    var demandValueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    let maxUpperDemandValue = 0;
    let minLowerDemandValue = 100;

    chart.data.forEach(function (chartValue, index) {
        if (maxUpperDemandValue < Number(chartValue['Upper Projected Demand Bound']))
            maxUpperDemandValue = Number(chartValue['Upper Projected Demand Bound']);

        if (minLowerDemandValue > Number(chartValue['Lower Projected Demand Bound']))
            minLowerDemandValue = Number(chartValue['Lower Projected Demand Bound']);
    });

    demandValueAxis.min = minLowerDemandValue - 10;
    demandValueAxis.max = maxUpperDemandValue + (maxUpperDemandValue * 0.5);

    //demandValueAxis.renderer.minGridDistance = 35; //used for steps in right hand side y axis
    demandValueAxis.renderer.grid.template.strokeOpacity = 1;
    demandValueAxis.renderer.grid.template.stroke = am4core.color("#D3D3D3"); // ffffff 8DB8D6
    demandValueAxis.renderer.grid.template.strokeWidth = 1;
    demandValueAxis.tooltip.disabled = true; //right hand size 

    demandValueAxis.renderer.line.strokeOpacity = 1;
    demandValueAxis.renderer.line.stroke = am4core.color("#D3D3D3"); // ffffff 8DB8D6
    demandValueAxis.renderer.line.strokeWidth = 1;

    demandValueAxis.title.text = "Percentage of Occupied Beds";
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
    demandSeries.dataFields.rangeValueY = "Total Projected Demand (Range)";

    demandSeries.yAxis = demandValueAxis;

    demandSeries.stroke = am4core.color("#3479A1");
    demandSeries.fill = am4core.color("#3479A1");

    demandSeries.strokeWidth = 2;
    demandSeries.sequencedInterpolation = true;
    demandSeries.defaultState.transitionDuration = 1000;

    demandSeries.name = "Percentage of Occupied Beds"; //button lavel
    if (globals.mobileDevice()) { //if its a mobile device
        demandSeries.name = "Occupied Beds (%)"; //button lavel
    }
    demandSeries.tooltip.label.ignoreFormatting = true;
    demandSeries.tooltipText = `Percentage of Occupied Beds: 
{rangeValueY}`;

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

    let maxHospitalizationValue = 0;
    let minHospitalizationValue = 100;

    chart.data.forEach(function (chartValue, index) {
        if (maxHospitalizationValue < Number(chartValue['Upper Hospitalization Bound']))
            maxHospitalizationValue = Number(chartValue['Upper Hospitalization Bound']);

        if (minHospitalizationValue > Number(chartValue['Lower Hospitalization Bound']))
            minHospitalizationValue = Number(chartValue['Lower Hospitalization Bound']);
    });

    hospitalizationValueAxis.min = minHospitalizationValue - 10;
    hospitalizationValueAxis.max = maxHospitalizationValue + (maxHospitalizationValue * 0.5);

    //hospitalizationValueAxis.renderer.minGridDistance = 50; //used for steps in value axis
    hospitalizationValueAxis.tooltip.disabled = true; //to disable button blackcolor tooltip #43 left side

    hospitalizationValueAxis.renderer.grid.template.strokeOpacity = 1;
    hospitalizationValueAxis.renderer.grid.template.stroke = am4core.color("#D3D3D3"); //ffffff 8DB8D6
    hospitalizationValueAxis.renderer.grid.template.strokeWidth = 1;

    hospitalizationValueAxis.renderer.line.strokeOpacity = 1;
    hospitalizationValueAxis.renderer.line.stroke = am4core.color("#D3D3D3 "); //fffff 8DB8D6
    hospitalizationValueAxis.renderer.line.strokeWidth = 1;

    hospitalizationValueAxis.title.text = "Weekly Hospitalizations";
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
    hospitalizationSeries.dataFields.rangeValueY = "Total Hospitalizations (Range)";

    hospitalizationSeries.yAxis = hospitalizationValueAxis;

    hospitalizationSeries.stroke = am4core.color(color);
    hospitalizationSeries.fill = am4core.color(color);

    hospitalizationSeries.strokeWidth = 2;
    hospitalizationSeries.sequencedInterpolation = true;
    hospitalizationSeries.defaultState.transitionDuration = 1000;

    hospitalizationSeries.name = "Weekly Hospitalizations";

    hospitalizationSeries.tooltip.label.ignoreFormatting = true;
    hospitalizationSeries.tooltipText = `Weekly Hospitalizations: 
{rangeValueY}`;


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

function mergeDataAcrossRegions(scenarioDirectory) {

    if (scenarioDirectory == undefined)
        scenarioDirectory = globals.scenariosDirectory;

    var mergedData = [];

    for (i = 0; i < globals.queriedRegionNumbers.length; i++) {
        var regionName = globals.queriedRegionNumbers[i] + "";

        // Check if region name contains a space, bcoz in case of virginia health, selectedHRRNumber would be for ex. "Far SW/Near SW".
        if (regionName.indexOf(' ') >= 0)
            regionName = regionName.split(" ").join("_");
        var datafile = scenarioDirectory + "/regions/nssac_ncov_ro_summary_" + globals.configuration.region + "_" + regionName + ".csv";

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

                        mergedData[loop]["Lower Hospitalization Bound"] = parseFloat(mergedData[loop]["Lower Hospitalization Bound"]) + parseFloat(filteredData["Lower Hospitalization Bound"]);
                        mergedData[loop]["Upper Hospitalization Bound"] = parseFloat(mergedData[loop]["Upper Hospitalization Bound"]) + parseFloat(filteredData["Upper Hospitalization Bound"]);
                        mergedData[loop]["Lower Projected Demand Bound"] = parseFloat(mergedData[loop]["Lower Projected Demand Bound"]) + parseFloat(filteredData["Lower Projected Demand Bound"]);
                        mergedData[loop]["Upper Projected Demand Bound"] = parseFloat(mergedData[loop]["Upper Projected Demand Bound"]) + parseFloat(filteredData["Upper Projected Demand Bound"]);
                        mergedData[loop]["Total Projected Demand (%)"] = parseFloat(mergedData[loop]["Total Projected Demand (%)"]) + parseFloat(filteredData["Total Projected Demand (%)"]);
                        mergedData[loop]["Total Hospitalizations (Median)"] = parseFloat(mergedData[loop]["Total Hospitalizations (Median)"]) + parseFloat(filteredData["Total Hospitalizations (Median)"]);
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
        mergedData[loop]["Total Projected Demand (%)"] = parseFloat(mergedData[loop]["Total Projected Demand (%)"]) / globals.queriedRegionNumbers.length;
        mergedData[loop]["Lower Projected Demand Bound"] = parseFloat(mergedData[loop]["Lower Projected Demand Bound"]) / globals.queriedRegionNumbers.length;
        mergedData[loop]["Upper Projected Demand Bound"] = parseFloat(mergedData[loop]["Upper Projected Demand Bound"]) / globals.queriedRegionNumbers.length;

        mergedData[loop]["Total Hospitalizations (Range)"] = numFormatter(mergedData[loop]["Total Hospitalizations (Median)"]) +
            " [" + numFormatter(mergedData[loop]["Lower Hospitalization Bound"]) + " - " + numFormatter(mergedData[loop]["Upper Hospitalization Bound"]) + "]";
        mergedData[loop]["Total Projected Demand (Range)"] = (mergedData[loop]["Total Projected Demand (%)"]).toFixed(2) +
            "% [" + (mergedData[loop]["Lower Projected Demand Bound"]).toFixed(2) + "% - " + (mergedData[loop]["Upper Projected Demand Bound"]).toFixed(2) + "%]";
    }
    return mergedData;
}

function mergeDailyDataAcrossRegions(scenariosDirectory) {

    if (scenariosDirectory == undefined)
        scenariosDirectory = globals.scenariosDirectory;

    var mergedData = [];

    for (i = 0; i < globals.queriedRegionNumbers.length; i++) {
        var regionName = globals.queriedRegionNumbers[i] + "";

        // Check if region name contains a space, bcoz in case of virginia health, selectedHRRNumber would be for ex. "Far SW/Near SW".
        if (regionName.indexOf(' ') >= 0)
            regionName = regionName.split(" ").join("_");
        var datafile = scenariosDirectory + "/regions/nssac_ncov_ro_summary_" + globals.configuration.region + "_" + regionName + "-daily.csv";

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

                        mergedData[loop]["Lower Hospitalization Bound"] = Number(mergedData[loop]["Lower Hospitalization Bound"]) + Number(filteredData["Lower Hospitalization Bound"]);
                        mergedData[loop]["Upper Hospitalization Bound"] = Number(mergedData[loop]["Upper Hospitalization Bound"]) + Number(filteredData["Upper Hospitalization Bound"]);
                        mergedData[loop]["Total Hospitalizations (Median)"] = Number(mergedData[loop]["Total Hospitalizations (Median)"]) + Number(filteredData["Total Hospitalizations (Median)"]);
                    }
                } else {
                    mergedData = currentData;
                }
            },
            dataType: "text",
            complete: function () { }
        });
    }

    return mergedData;
}

function mergeDataAcrossScenarios() {
    var mergedData = [];

    for (index = 0; index < globals.scenarios.length; index++) {
        var currentData = {};
        if (globals.selectedRegionNum != 0) {
            var datafile = globals.scenarios[index].directory + "/regions/nssac_ncov_ro_summary_" + globals.configuration.region + "_" + globals.selectedRegionNum + ".csv";
            currentData = getJSONData(datafile);
        } else if (globals.queriedRegionNames.length != 0) {
            currentData = mergeDataAcrossRegions(globals.scenarios[index].directory);
        } else {
            var datafile = globals.scenarios[index].directory + "/nssac_ncov_ro-summary.csv";
            currentData = getJSONData(datafile);
        }

        if (globals.isDurationSliderApplied)
            currentData = applyDurationSliderOnScenarioData(globals.scenarios[index].directory, currentData);

        if (globals.isCapacitySliderApplied)
            currentData = applyCapacitySliderOnScenarioData(currentData);

        if (mergedData.length > 0) {
            for (loop = 0; loop < mergedData.length; loop++) {
                var filteredData = currentData[loop];

                mergedData[loop]["Total Projected Demand (%)-" + index] = Number(filteredData["Total Projected Demand (%)"]);
                mergedData[loop]["Total Hospitalizations (Median)-" + index] = Number(filteredData["Total Hospitalizations (Median)"]);
                mergedData[loop]["Lower Projected Demand Bound-" + index] = Number(filteredData["Lower Projected Demand Bound"]);
                mergedData[loop]["Upper Projected Demand Bound-" + index] = Number(filteredData["Upper Projected Demand Bound"]);
                mergedData[loop]["Lower Hospitalization Bound-" + index] = Number(filteredData["Lower Hospitalization Bound"]);
                mergedData[loop]["Upper Hospitalization Bound-" + index] = Number(filteredData["Upper Hospitalization Bound"]);

                if (globals.demandMinValue > Number(mergedData[loop]["Lower Projected Demand Bound-" + index]))
                    globals.demandMinValue = Number(mergedData[loop]["Lower Projected Demand Bound-" + index]);
                if (globals.demandMaxValue < Number(mergedData[loop]["Upper Projected Demand Bound-" + index]))
                    globals.demandMaxValue = Number(mergedData[loop]["Upper Projected Demand Bound-" + index]);
            }
        } else {
            for (loop = 0; loop < currentData.length; loop++) {
                var filteredData = currentData[loop];

                currentData[loop]["Total Projected Demand (%)-" + index] = Number(filteredData["Total Projected Demand (%)"]);
                currentData[loop]["Total Hospitalizations (Median)-" + index] = Number(filteredData["Total Hospitalizations (Median)"]);
                currentData[loop]["Lower Projected Demand Bound-" + index] = Number(filteredData["Lower Projected Demand Bound"]);
                currentData[loop]["Upper Projected Demand Bound-" + index] = Number(filteredData["Upper Projected Demand Bound"]);
                currentData[loop]["Lower Hospitalization Bound-" + index] = Number(filteredData["Lower Hospitalization Bound"]);
                currentData[loop]["Upper Hospitalization Bound-" + index] = Number(filteredData["Upper Hospitalization Bound"]);
            }
            mergedData = currentData;
        }
    }

    return mergedData;
}

function renderAllScenarios() {
    var selection = $("#scenariosDropdown").children("option:selected").val();
    if (selection == "wh")
        renderAllScenariosWH(globals.chartTitleRegion);
    else
        renderAllScenariosPOB(globals.chartTitleRegion);
}

function renderAllScenariosPOB(data) {
    // Dispose all Charts and clear Browser memory/cache
    am4core.disposeAllCharts();

    // Themes begin
    am4core.useTheme(am4themes_animated);

    // Create chart instance
    var chart = am4core.create("chartdiv", am4charts.XYChart);
    chart.hiddenState.properties.opacity = 0;

    let title = chart.titles.create();
    if (data == undefined) {

        title.text = "Demand Forecast for All Scenarios";
    }
    else {

        title.text = data;
    }
    title.stroke = am4core.color("#fff");
    title.fill = am4core.color("#fff");
    title.fontSize = 16;
    title.marginBottom = 10;

    chart.data = mergeDataAcrossScenarios();
    chart.dateFormatter.dateFormat = "MM-dd-yyyy";

    // Create axes
    var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "date";

    categoryAxis.renderer.minGridDistance = 10;
    categoryAxis.renderer.grid.template.strokeWidth = 0;

    categoryAxis.renderer.labels.template.fill = am4core.color("#fff");
    categoryAxis.renderer.labels.template.rotation = -25;
    categoryAxis.renderer.labels.template.horizontalCenter = "right";
    categoryAxis.renderer.labels.template.verticalCenter = "middle";

    categoryAxis.tooltip.disabled = true; //to disable button blackcolor tooltip #43

    // Create Demand Value axis
    var demandValueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    demandValueAxis.min = 0;
    demandValueAxis.max = 170;
    demandValueAxis.strictMinMax = true;
    demandValueAxis.renderer.minGridDistance = 30; //used for steps in right hand side y axis
    demandValueAxis.renderer.grid.template.strokeWidth = 0;
    demandValueAxis.tooltip.disabled = true; //right hand size 

    demandValueAxis.title.text = "Percentage of Occupied Beds";
    demandValueAxis.title.fill = am4core.color("#fff");
    demandValueAxis.title.fontSize = 14;

    demandValueAxis.renderer.labels.template.fill = am4core.color("#fff");

    var range1 = demandValueAxis.axisRanges.create();
    range1.value = demandValueAxis.min;
    range1.endValue = globals.minHospitalCapacity;
    range1.axisFill.fill = am4core.color("green");
    range1.axisFill.fillOpacity = 0.3;
    range1.grid.strokeOpacity = 0;
    range1.label.inside = true;
    // range1.label.text = "Constraint";
    range1.label.verticalCenter = "bottom";
    range1.label.fill = am4core.color("green");

    var range = demandValueAxis.axisRanges.create();
    range.value = globals.minHospitalCapacity;
    range.endValue = globals.maxHospitalCapacity;
    range.axisFill.fill = am4core.color("orange");
    range.axisFill.fillOpacity = 0.3;
    range.grid.strokeOpacity = 0;
    range.label.inside = true;
    // range.label.text = "Caution";
    range.label.verticalCenter = "bottom";
    range.label.fill = am4core.color("orange");

    var range2 = demandValueAxis.axisRanges.create();
    range2.value = globals.maxHospitalCapacity;
    range2.endValue = demandValueAxis.max;
    range2.axisFill.fill = am4core.color("red");
    range2.axisFill.fillOpacity = 0.3;
    range2.grid.strokeOpacity = 0;
    range2.label.inside = true;
    // range2.label.text = "Crisis";
    range.label.verticalCenter = "bottom";
    range2.label.fill = am4core.color("red");

    var colors = ["#bd1e2e", "#5e3aba", "#7de067", "#c2305a", "#167d1a", "#c6d42c", "#80cbd9", "#b60fdb", "#9c2187", "#bd1e2e", "#5e3aba", "#fc4505", "#167d1b", "#c6d42d", "#7de065", "#80cbd7", "#b60fdd", "#c2305b", "#9c2178"];

    globals.series = [];
    globals.uncertainitySeries = [];
    var bullet = [];

    for (var i = 0; i < globals.scenarios.length; i++) {

        // Create Uncertainity Bound Series
        globals.uncertainitySeries[i] = chart.series.push(new am4charts.LineSeries());

        globals.uncertainitySeries[i].dataFields.categoryX = "date";
        globals.uncertainitySeries[i].dataFields.openValueY = "Lower Projected Demand Bound-" + i;
        globals.uncertainitySeries[i].dataFields.valueY = "Upper Projected Demand Bound-" + i;
        globals.uncertainitySeries[i].yAxis = demandValueAxis;

        globals.uncertainitySeries[i].stroke = am4core.color(colors[i]);
        globals.uncertainitySeries[i].fill = am4core.color(colors[i]);
        globals.uncertainitySeries[i].hiddenInLegend = true;

        globals.uncertainitySeries[i].fillOpacity = 0.4;
        globals.uncertainitySeries[i].sequencedInterpolation = true;
        globals.uncertainitySeries[i].defaultState.transitionDuration = 1000;

        globals.series[i] = chart.series.push(new am4charts.LineSeries());

        globals.series[i].dataFields.valueY = "Total Projected Demand (%)-" + i;
        globals.series[i].dataFields.categoryX = "date";

        globals.series[i].yAxis = demandValueAxis;

        globals.series[i].stroke = am4core.color(colors[i]);
        globals.series[i].strokeWidth = 2;
        globals.series[i].tensionX = 0.8;
        globals.series[i].sequencedInterpolation = true;
        globals.series[i].defaultState.transitionDuration = 1000;

        globals.series[i].name = globals.scenarios[i].scenario_display_name_line1;
        globals.series[i].tooltipText = "{name}: [bold]{valueY}[/]";
        globals.series[i].tooltip.getFillFromObject = false;
        globals.series[i].tooltip.background.fill = am4core.color(colors[i]);

        globals.series[i].showOnInit = true;

        // Create data points
        bullet[i] = globals.series[i].bullets.push(new am4charts.CircleBullet());
        bullet[i].width = 5;
        bullet[i].height = 5;

        bullet[i].circle.fill = am4core.color(colors[i]);
        bullet[i].circle.stroke = am4core.color(colors[i]);
        bullet[i].circle.strokeWidth = 2;

        // Hiding Uncertainity bounds when hiding the actual series
        globals.series[i].events.on("hidden", function (event) {
            if (globals.uncertainitySeries[globals.series.indexOf(event.target)] != undefined)
                globals.uncertainitySeries[globals.series.indexOf(event.target)].hide();
        });

        // Displaying Uncertainity bounds when displaying the actual series
        globals.series[i].events.on("shown", function (event) {
            if (globals.uncertainitySeries[globals.series.indexOf(event.target)] != undefined)
                globals.uncertainitySeries[globals.series.indexOf(event.target)].show();
        });
    }

    // Add legend
    chart.legend = new am4charts.Legend();
    chart.legend.labels.template.fill = am4core.color("#fff");

    // Add legend for range
    var legend1 = new am4charts.Legend();
    legend1.parent = chart.chartContainer;
    legend1.itemContainers.template.togglable = false;
    legend1.align = "right";
    legend1.position = "bottom";
    legend1.labels.template.fill = "#fff";
    legend1.data = [{
        "name": "Crisis",
        "fill": "#f5876c"
    }, {
        "name": "Caution",
        "fill": "#f5efa2",
    }, {
        "name": "Constraint",
        "fill": "#bcf084",
    }];


    // Add cursor
    chart.cursor = new am4charts.XYCursor();
}

function renderAllScenariosWH(data) {
    // Dispose all Charts and clear Browser memory/cache
    am4core.disposeAllCharts();

    // Themes begin
    am4core.useTheme(am4themes_animated);

    // Create chart instance
    var chart = am4core.create("chartdiv", am4charts.XYChart);
    chart.hiddenState.properties.opacity = 0;

    let title = chart.titles.create();
    if (data == undefined) {

        title.text = "Demand Forecast for All Scenarios";
    }
    else {

        title.text = data;
    }
    // title.text = "Demand Forecast for All Scenarios";
    title.stroke = am4core.color("#fff");
    title.fill = am4core.color("#fff");
    title.fontSize = 16;
    title.marginBottom = 10;

    chart.data = mergeDataAcrossScenarios();
    chart.dateFormatter.dateFormat = "MM-dd-yyyy";

    // Create axes
    var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "date";

    categoryAxis.renderer.minGridDistance = 10;
    categoryAxis.renderer.grid.template.strokeWidth = 1;

    categoryAxis.renderer.labels.template.fill = am4core.color("#fff");
    categoryAxis.renderer.labels.template.rotation = -25;
    categoryAxis.renderer.labels.template.horizontalCenter = "right";
    categoryAxis.renderer.labels.template.verticalCenter = "middle";

    categoryAxis.tooltip.disabled = true; //to disable button blackcolor tooltip #43

    // Create Demand Value axis
    var demandValueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    demandValueAxis.renderer.grid.template.strokeWidth = 1;
    demandValueAxis.tooltip.disabled = true; //right hand size 

    demandValueAxis.title.text = "Weekly Hospitalizations";
    demandValueAxis.title.fill = am4core.color("#fff");
    demandValueAxis.title.fontSize = 14;

    demandValueAxis.renderer.labels.template.fill = am4core.color("#fff");

    var colors = ["#bd1e2e", "#5e3aba", "#7de067", "#c2305a", "#167d1a", "#c6d42c", "#80cbd9", "#b60fdb", "#9c2187", "#bd1e2e", "#5e3aba", "#fc4505", "#167d1b", "#c6d42d", "#7de065", "#80cbd7", "#b60fdd", "#c2305b", "#9c2178"];

    globals.series = [];
    globals.uncertainitySeries = [];
    var bullet = [];

    for (var i = 0; i < globals.scenarios.length; i++) {

        // Create Uncertainity Bound Series
        globals.uncertainitySeries[i] = chart.series.push(new am4charts.LineSeries());

        globals.uncertainitySeries[i].dataFields.categoryX = "date";
        globals.uncertainitySeries[i].dataFields.openValueY = "Lower Hospitalization Bound-" + i;
        globals.uncertainitySeries[i].dataFields.valueY = "Upper Hospitalization Bound-" + i;
        globals.uncertainitySeries[i].yAxis = demandValueAxis;

        globals.uncertainitySeries[i].stroke = am4core.color(colors[i]);
        globals.uncertainitySeries[i].fill = am4core.color(colors[i]);
        globals.uncertainitySeries[i].hiddenInLegend = true;

        globals.uncertainitySeries[i].fillOpacity = 0.4;
        globals.uncertainitySeries[i].sequencedInterpolation = true;
        globals.uncertainitySeries[i].defaultState.transitionDuration = 1000;

        globals.series[i] = chart.series.push(new am4charts.LineSeries());

        globals.series[i].dataFields.valueY = "Total Hospitalizations (Median)-" + i;
        globals.series[i].dataFields.categoryX = "date";

        globals.series[i].yAxis = demandValueAxis;

        globals.series[i].stroke = am4core.color(colors[i]);
        globals.series[i].strokeWidth = 2;
        globals.series[i].tensionX = 0.8;
        globals.series[i].sequencedInterpolation = true;
        globals.series[i].defaultState.transitionDuration = 1000;

        globals.series[i].name = globals.scenarios[i].scenario_display_name_line1;
        globals.series[i].tooltipText = "{name}: [bold]{valueY}[/]";
        globals.series[i].tooltip.getFillFromObject = false;
        globals.series[i].tooltip.background.fill = am4core.color(colors[i]);

        globals.series[i].showOnInit = true;

        // Create data points
        bullet[i] = globals.series[i].bullets.push(new am4charts.CircleBullet());
        bullet[i].width = 5;
        bullet[i].height = 5;

        bullet[i].circle.fill = am4core.color(colors[i]);
        bullet[i].circle.stroke = am4core.color(colors[i]);
        bullet[i].circle.strokeWidth = 2;

        // Hiding Uncertainity bounds when hiding the actual series
        globals.series[i].events.on("hidden", function (event) {
            if (globals.uncertainitySeries[globals.series.indexOf(event.target)] != undefined)
                globals.uncertainitySeries[globals.series.indexOf(event.target)].hide();
        });

        // Displaying Uncertainity bounds when displaying the actual series
        globals.series[i].events.on("shown", function (event) {
            if (globals.uncertainitySeries[globals.series.indexOf(event.target)] != undefined)
                globals.uncertainitySeries[globals.series.indexOf(event.target)].show();
        });
    }

    // Add legend
    chart.legend = new am4charts.Legend();
    chart.legend.labels.template.fill = am4core.color("#fff");

    var legend1 = new am4charts.Legend();
    legend1.parent = chart.chartContainer;
    legend1.align = "right";
    legend1.position = "bottom";
    legend1.labels.template.fill = "#fff";
    legend1.data = [{
        "name": "Crisis",
        "fill": "#f5876c"
    }, {
        "name": "Caution",
        "fill": "#f5efa2",
    }, {
        "name": "Constraint",
        "fill": "#bcf084",
    }];


    // Add cursor
    chart.cursor = new am4charts.XYCursor();
}

function numFormatter(num) {
    // Here we get number as string value.
    num = Number(num);

    if (num < 9999) return num.toLocaleString();

    if (num >= 10000 && num <= 999999)
        return (num / 1000).toFixed(2) + 'K';

    if (num >= 1000000 && num <= 999999999)
        return (num / 1000000).toFixed(2) + 'M';
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