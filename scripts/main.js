//*******************
// global variables
//*******************
//root holder for all global variables
var globals = {};
//map for the applicaiton
globals.map = null;
//default extents
globals.defaultExtents = {};

//supported data levels
//to be cleaned up
globals.dataLevels = ["State", "County"];

//store REST API URL for corresponding polygon
globals.mapServiceUrls = {
  HRR: "https://services2.arcgis.com/8k2PygHqghVevhzy/arcgis/rest/services/covid19_nssac_resource_optimization/FeatureServer/0"
}

//flag used to indicate data level in the file, e.g., State, County
globals.dataLevel = "State";

//array that holds data from csv file, only one csv file at a time
globals.csvData = [];
//array that holds header from csv file
globals.csvDataHeader = [];
//array that holds stats from csv file, min, max and total for each attribute
globals.csvDataStats = [];
//array that holds range for each attribute for display, this is the same as csvDataStats initially
globals.csvDataRanges = [];

//join function to retrieve data in CSV column for a given Name & render field index
globals.joinFunction = null;

//join function for setting up infoWindow
globals.joinFunctionInfoWindow = null;

//selected date (from datepicker), '1-aug-09' is the default
globals.selectedDate = null;
globals.numberCountryForSelectedDate = null;

globals.selectedScenario;
globals.scenariosDirectory;
globals.dailySummaryFile;

//file used for rendering
globals.renderFile = null;

//display level, -1 is country level, otherwise, it's state's 2-digit FIPS
globals.displayLevel = null;

//render field index in the csv file's attribute list
//update whenever a range slider is enabed (overlay mode) or a field is selected (single mode)
globals.renderFieldIndex = null;

//QueryTask and Query, used in display level selection, e.g., choose a state
globals.queryTask = null;
globals.query = null;

//added for manually picking counties
globals.selectedRegions = [];
globals.selectedHRRNumbers = [];

globals.filteredRegion = [];
globals.regionSelected = "All regions";

globals.chartDataFile = [];
globals.globalDataSummary = [];


require([
    "esri/Color",
    "esri/geometry/Extent",
    "esri/graphic",
    "esri/dijit/Legend",
    "esri/InfoTemplate",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/map",
    "esri/renderers/ClassBreaksRenderer",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/renderers/SimpleRenderer",
    "esri/TimeExtent",
    "esri/dijit/TimeSlider",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/toolbars/draw",
    "esri/urlUtils",
    "dojo/on",
    "dojo/parser",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dijit/registry",
    "dijit/Tooltip",
    "dojox/data/CsvStore",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "dojo/domReady!"
  ],
  function (
    Color, Extent, Graphic, Legend, InfoTemplate,
    FeatureLayer, GraphicsLayer, Map, ClassBreaksRenderer,
    SimpleFillSymbol, SimpleLineSymbol, SimpleRenderer,
    TimeExtent, TimeSlider,
    Query, QueryTask, Draw, urlUtils,
    on, parser, arrayUtils,
    lang, registry, Tooltip,
    CsvStore
  ) {
    parser.parse();

    $.getJSON("supported_scenarios.json")
      .done(function (json) {
        globals.scenarios = json.scenarios;
        globals.selectedScenario = globals.scenarios[0];
        globals.scenariosDirectory = globals.selectedScenario.directory;

        renderScenarios();
        executeDefaultWorkflow();
      })
      .fail(function (jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.log("Request Failed to load 'supported_scenarios.json' file. Reason :: " + err);
      });

    //keep track of value for each drop down menu
    globals.displayLevel = 'State';

    globals.defaultExtents.default = new Extent({
      "xmin": -124.730045456146,
      "xmax": -66.9505093527641,
      "ymin": 24.5439397696533,
      "ymax": 49.3839397693269,
      "spatialReference": {
        "wkid": 4326
      }
    });

    globals.map = new Map("mapCanvas", {
      basemap: "gray",
      extent: globals.defaultExtents.default,
      zoom: 4
    });

    globals.map.infoWindow.resize(280, 210);

    globals.mobileDevice = function () {
      var check = false;
      (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
      })(navigator.userAgent || navigator.vendor || window.opera);
      return check;
    };

    // This is to hide Application in Mobile's landscape mode
    if (globals.mobileDevice() && (window.orientation == 90 || window.orientation == -90)) {
      $('.supported-content').addClass('d-none');
      $('.not-supported').addClass('d-flex');
      $('.not-supported').removeClass('d-none');
    } else {
      $('.not-supported').addClass('d-none');
      $('.supported-content').addClass('d-block');
      $('.supported-content').removeClass('d-none');
    }

    bindMenuEvents();
    bindChartAndDataTab();
    bindSearchAndResetButton();

    function executeDefaultWorkflow() {
      // Initialize Query Tooltip
      $('[data-toggle="popover"]').popover();

      // Clear all Tooltips
      $('[data-toggle="tooltip"]').tooltip('dispose');

      let scenarioChanged = true;

      globals.dailySummaryFile = globals.scenariosDirectory + "/nssac_ncov_ro-summary.csv";
      getGlobalDataFromCSVFile(globals.dailySummaryFile);

      if (globals.selectedDate == undefined || globals.selectedDate == null) {
        globals.selectedDate = globals.dailySummary[1][0];
        scenarioChanged = false;
      }

      globals.renderFile = globals.scenariosDirectory + "/nssac_ncov_ro_" + globals.selectedDate + ".csv";

      setupMapLayer();
      getCSVDataAndRendering();
      renderTimeline();

      if (scenarioChanged) {
        $('#timeline .content').removeClass('content-selected');
        $('#timeline #date-' + globals.selectedDate).addClass('content-selected');
      }


      if (globals.selectedRegions.length == 0) {
        // Render Summary chart
        renderSummaryDataChart();
      } else {
        renderQueriedRegionsChart();
      }

      // Select default option as Charts
      $('.charts').click();

      // Initialize all Tooltips
      $('[data-toggle="tooltip"]').tooltip();
    }

    //initial setup for the map, globals.query and globals.queryTask to query this level by NAME
    function setupMapLayer() {
      //display map and zoom to China
      var infoTemplate = new InfoTemplate(
        "Place : ${HRRCITY}",
        "${HRRCITY:globals.joinFunctionInfoWindow}"
      );

      var layer = new FeatureLayer(globals.mapServiceUrls.HRR, {
        id: "state_layer",
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        infoTemplate: infoTemplate,
        outFields: ["HRRNUM", "HRRCITY", "DHS_Beds", "Total_Pop"]
      });

      var symbol = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID,
          new Color([128, 128, 128]), 1),
        new Color([255, 255, 255, 0.5])
      );
      layer.setRenderer(new SimpleRenderer(symbol));
      globals.map.addLayers([layer]);

      layer.on("click", monitorClick);

      //setup QueryTask (for filter by region)
      globals.queryTask = new QueryTask(globals.mapServiceUrls.HRR);
      globals.query = new Query();
      globals.query.outSpatialReference = {
        "wkid": 4326
      };
      globals.query.returnGeometry = true;
      globals.query.outFields = ["HRRCITY"];

      globals.map.on("update-end", function () {
        $('.loading').hide();
      });

      layer.on("update-end", function () {
        $('.loading').hide();
      });

      globals.map.infoWindow.on('hide', function () {
        if (globals.selectedRegions.length == 0) {
          renderSummaryDataChart();
        } else {
          renderQueriedRegionsChart();
        }
      })
    }

    function getCSVDataAndRendering() {
      fileURL = globals.renderFile;
      var csvStore = new CsvStore({
        url: fileURL
      });
      csvStore.fetch({
        onComplete: function (items) {
          csvDataReady(csvStore, items);

          globals.dataLevel = "State";
          globals.map.getLayer("state_layer").show();

          if (globals.dataLevels.indexOf(globals.dataLevel) !== -1) {
            setRendererSingle();
          }
        }, //onComplete
        onError: csvOnError
      });
    }

    //process data in csvStore and store them in a global variable called csvData
    function csvDataReady(csvStore, items) {
      //reset all global variables related to CSV data
      globals.csvData = [];
      globals.csvDataHeader = [];
      globals.csvDataStats = [];
      globals.csvDataRanges = [];

      var csvHeader = null;
      for (var i = 0; i < items.length; i++) {
        var currentItemAttributes = csvStore.getAttributes(items[i]);
        if (csvHeader == null) {
          csvHeader = currentItemAttributes;
        }

        // console.log('csvHeader-new', csvHeader);
        var itemData = [];
        for (var j = 0; j < csvHeader.length; j++) {

          if (j === 0 || j === 1 || j === 5) {
            itemData.push(csvStore.getValue(items[i], csvHeader[j])); //alway parse the first column as string
            continue;
          }

          itemData.push(parseFloat(csvStore.getValue(items[i], csvHeader[j])));
        }
        globals.csvData.push(itemData);
      }

      //set global variable csvDataHeader
      globals.csvDataHeader = csvHeader;

      //compute stat for csvData
      computeCSVStats();

      //default render field is the 4th column (skip name,region,last update)
      if (!globals.renderFieldIndex)
        globals.renderFieldIndex = 2;

      //  show csv data in data table
      if (globals.selectedRegions.length == 0) {
        var names = [];
        for (var i = 0; i < globals.csvData.length; i++) {
          names.push(globals.csvData[i][1]);
        }
        showCSVDataInTable(names);
      } else {
        showCSVDataInTable(globals.selectedRegions);
      }
    }

    function csvOnError(error) {
      //  dojo.byId("info").innerHTML = "Data reading error.";
      //dojo.byId("infoGraph").innerHTML = "Data reading error.";
      //console.log("csvOnError function called");
    }

    //compute stats for CSVData, store [min, max, total] for each attribute and store in csvDataStats
    function computeCSVStats() {
      var tempStats = [];
      var countries = [];
      for (var j = 0; j < globals.csvDataHeader.length; j++) {
        tempStats.push([null, null, 0]); //the 3rd one is for total
        globals.csvDataRanges.push([null, null]);
      }

      for (var i = 0; i < globals.csvData.length; i++) {
        for (var j = 0; j < globals.csvDataHeader.length; j++) {
          //check min
          if (tempStats[j][0]) {
            if (tempStats[j][0] > globals.csvData[i][j]) {
              tempStats[j][0] = globals.csvData[i][j];
            }
          } else {
            tempStats[j][0] = globals.csvData[i][j];
          }

          //check max
          if (tempStats[j][1]) {
            if (tempStats[j][1] < globals.csvData[i][j]) {
              tempStats[j][1] = globals.csvData[i][j];
            }
          } else {
            tempStats[j][1] = globals.csvData[i][j];
          }
          //set total
          tempStats[j][2] += parseInt(globals.csvData[i][j]);
        }
        var country = globals.csvData[i][1].split('(')[0].trim();

        if (!countries.includes(country))
          countries.push(country);

        // filteredRegion(globals.regionSelected);
      }

      //at this point, we have updated stats on all fields
      globals.csvDataStats = tempStats;
      //decide to switch to # of countries (need to exclude Hong Kong, Macau and Taiwan)
      globals.numberCountryForSelectedDate = countries.length - 3;

      //set range for each attribute the same as csvDataStats
      //globals.csvDataRanges = tempStats.slice(0);;
      for (var i = 0; i < globals.csvDataHeader.length; i++) {
        globals.csvDataRanges[i][0] = tempStats[i][0];
        globals.csvDataRanges[i][1] = tempStats[i][1];
      }
    }

    function setRendererSingle() {
      dojo.connect(dojo.byId("renderField"), "onclick", changeRenderField);
      renderLegend();
    }

    function renderLegend() {
      //clear out the current legend
      clearDIV("legend");

      //reference the legend div
      var legendDiv = document.getElementById("legend");
      //create a new table to hold the legend items
      var table = document.createElement("table");
      table.id = "legend_table0";

      var renderer = new ClassBreaksRenderer(null, globals.joinFunction);

      var numClasses = 5;
      //different colors for different attribute
      var colors = [];
      if (globals.csvDataHeader[globals.renderFieldIndex] == 'Vent. Avail') {
        //for confirmed, suspected
        numClasses = 6;
        //OrRd
        colors.push(new Color([179, 0, 0]));
        colors.push(new Color([227, 74, 51]));
        colors.push(new Color([252, 141, 89]));
        colors.push(new Color([253, 187, 132]));
        colors.push(new Color([253, 212, 158]));
        colors.push(new Color([254, 240, 217]));

        var breakMins = [1, 101, 501, 1001, 1501, 2501];
        var breakMaxs = [100, 500, 1000, 1500, 2500, 29999];
      } else if (globals.csvDataHeader[globals.renderFieldIndex] == 'Projected Demand (%)') {
        //for deaths
        //PuBu
        colors.push(new Color([241, 238, 246]));
        colors.push(new Color([189, 201, 225]));
        colors.push(new Color([116, 169, 207]));
        colors.push(new Color([43, 140, 190]));
        colors.push(new Color([4, 90, 141]));

        var breakMins = [1, 81, 91, 101, 121];
        var breakMaxs = [80, 90, 100, 120, 29999];
      } else if (globals.csvDataHeader[globals.renderFieldIndex] == 'Staff Avail') {
        //for recovered
        //YlGn
        colors.push(new Color([255, 255, 204]));
        colors.push(new Color([194, 230, 153]));
        colors.push(new Color([120, 198, 121]));
        colors.push(new Color([49, 163, 84]));
        colors.push(new Color([0, 104, 55]));

        var breakMins = [1, 10, 50, 100, 500];
        var breakMaxs = [9, 49, 99, 499, 99999];
      } else {
        numClasses = 6;
        //OrRd
        colors.push(new Color([254, 240, 217]));
        colors.push(new Color([253, 212, 158]));
        colors.push(new Color([253, 187, 132]));
        colors.push(new Color([252, 141, 89]));
        colors.push(new Color([227, 74, 51]));
        colors.push(new Color([179, 0, 0]));

        var breakMins = [1, 10, 100, 500, 1000, 10000];
        var breakMaxs = [9, 99, 499, 999, 9999, 299999];
      }

      //add render field to legend
      var tableRow = document.createElement("tr");
      var fieldCell = document.createElement("td");
      fieldCell.setAttribute("colspan", 2);
      tableRow.style.borderBottom = '1px solid gray';
      fieldCell.textContent = globals.csvDataHeader[globals.renderFieldIndex];
      tableRow.appendChild(fieldCell);
      table.appendChild(tableRow);

      //main loop to add break and set legend (using a table)
      //uses values stored in breakMins and breakMaxs arrays as the breaks
      for (var i = 0; i < numClasses; i++) {
        var BreakMin = breakMins[i];
        var BreakMax = breakMaxs[i];

        renderer.addBreak({
          minValue: BreakMin,
          maxValue: BreakMax,
          symbol: new SimpleFillSymbol(
            "solid",
            //new SimpleLineSymbol("solid", colors[i], 1),
            new SimpleLineSymbol("solid", new Color([128, 128, 128]), 1),
            colors[i]
          )
        });

        ///////////
        var tableRow = document.createElement("tr");
        var colorCell = document.createElement("td");

        var hexcolor = ""
        var colorpart = colors[i].r.toString(16)
        if (colorpart == "0") {
          colorpart = "00"
        }
        if (colorpart.length == 1) { //added condition to cover cases where there is a '0' starting hex code
          colorpart = "0" + colorpart;
        }
        hexcolor += colorpart;
        var colorpart = colors[i].g.toString(16)
        if (colorpart == "0") {
          colorpart = "00"
        }
        if (colorpart.length == 1) {
          colorpart = "0" + colorpart;
        }
        hexcolor += colorpart;
        var colorpart = colors[i].b.toString(16)
        if (colorpart == "0") {
          colorpart = "00"
        }
        if (colorpart.length == 1) {
          colorpart = "0" + colorpart;
        }
        hexcolor += colorpart;

        //console.log("h: "+hexcolor + " l: " + hexcolor.length);
        colorCell.setAttribute("style", "background-color: #" + hexcolor + "; width: 15px");

        var labelCell = document.createElement("td");

        var labelText;
        if (i != numClasses - 1)
          labelText = BreakMin.toLocaleString() + " - " + BreakMax.toLocaleString();
        else
          labelText = BreakMin.toLocaleString() + " +";
        labelCell.textContent = labelText;

        tableRow.appendChild(colorCell);
        tableRow.appendChild(labelCell);
        table.appendChild(tableRow);
        ///////////
      }

      var layer_name = globals.dataLevel.toLowerCase() + "_layer";
      globals.map.getLayer(layer_name).setRenderer(renderer);
      globals.map.getLayer(layer_name).redraw();

      //add completed legend table
      legendDiv.appendChild(table);
    }

    //when ctrl key is pressed on a click event, add feature to globals.selectedRegions
    //when shift key is press on a click event, remove feature from globals.selectedRegions
    function monitorClick(evt) {
      if (evt.ctrlKey === true || evt.metaKey === true) { //ADD SELECTED FEATURE TO LIST
        //turn off infoWindow
        globals.map.setInfoWindowOnClick(false);
        //symbol for selected county
        var symbol = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL,
          new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            new Color([102, 255, 255]),
            2
          ),
          new Color([255, 0, 0])
        );

        var fips;
        if (globals.dataLevel == "County")
          fips = evt.graphic.attributes["FIPS"];
        else if (globals.dataLevel == "State")
          fips = evt.graphic.attributes["NAME"];

        var attr = {
          "NAME": fips
        };
        var graphic = new Graphic(evt.graphic.geometry, symbol, attr);

        var index = globals.selectedRegions.indexOf(fips);
        if (index == -1) { //not in the list, need to add
          //add graphic
          globals.map.graphics.add(graphic);
          //add FIPS for slection to global variable
          globals.selectedRegions.push(fips);
          //monitor map's GraphicsLayer (the layer we keep selected counties) for click event
          globals.map.graphics.on("click", monitorClick);
        }
        //show selected counties in data table
        showCSVDataInTable(globals.selectedRegions);
      } else if (evt.shiftKey === true) {
        //disable click & recenter as it is SHIFT key's default function
        globals.map.disableClickRecenter();
        globals.map.setInfoWindowOnClick(false);
        var fips = evt.graphic.attributes["NAME"];
        var index = globals.selectedRegions.indexOf(fips);
        if (index != -1) { //in the list, need to remove
          globals.map.graphics.remove(evt.graphic);
          //globals.map.graphics.redraw();
          //remove FIPS for selection from global variable
          globals.selectedRegions.splice(index, 1);
        }
        //show selected counties in data table
        showCSVDataInTable(globals.selectedRegions);
      } else globals.map.setInfoWindowOnClick(true);
    }

    function changeDate(selectedDate) {
      globals.selectedDate = selectedDate;
      globals.renderFile = globals.scenariosDirectory + "/nssac_ncov_ro_" + selectedDate + ".csv";
      // globals.renderFile = "data_ro/nssac_ncov_ro_" + selectedDate + ".csv"
      //check whether file exists
      var http = new XMLHttpRequest();
      http.open('HEAD', globals.renderFile, false);
      http.send();
      if (http.status === 404) {
        if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && $('#dataView').hasClass('disabled')) {
          alert("Data for " + selectedDate + " is not available yet.");
        }
      } else {
        renderByFile();
      }

    }

    //Lots of clean up is required before reading the file
    function renderByFile() {
      globals.displayLevel = -1;
      $("#displayLevel").val("-1");
      for (var i = 1; i < globals.csvDataHeader.length; i++) {
        var c = globals.map.getLayer('county_layer' + i);
        if (c)
          globals.map.removeLayer(c);
      }
      //clear display option
      clearDisplayOptionWrapper();
      getCSVDataAndRendering();
    }

    //Change rendering field, this is ONLY for single attribute mode
    function changeRenderField(event) {
      globals.renderFieldIndex = Number(event.target.value);
      $('.renderField').addClass('disabled');
      $(event.target).removeClass('disabled');

      //use new field to render
      setRendererSingle(false);
    }

    //Assumption: name for a place (state/province/country) is stored in a global variable called csvData
    //used for rendering function to join polygon and the data in csvData
    //this function relies on 3 global variables: renderFieldIndex, csvDataRanges[renderFieldIndex][0], csvDataRanges[renderFieldIndex][1]
    globals.joinFunction = function (value) {
      //  console.log('value-new', value);
      for (var i = 0; i < globals.csvData.length; i++) {
        var fipsValue = (value.hasOwnProperty("attributes")) ? value.attributes.HRRCITY : value;
        var returnValue;

        var csvFipsValue = globals.csvData[i][1];
        if (fipsValue == csvFipsValue) {
          var csvDataValue = globals.csvData[i][globals.renderFieldIndex];
          //check to see whether the value is in display range
          if (csvDataValue >= globals.csvDataRanges[globals.renderFieldIndex][0] && csvDataValue <= globals.csvDataRanges[globals.renderFieldIndex][1]) {
            returnValue = csvDataValue;
            break;
          }
        }
      }
      return returnValue;
    }

    // joint csv data by name, this funciton is ONLY used by feature layer's info window
    // test for presence to a property named "attributes" to
    // determine whether or the "value" argument is a graphic or number
    globals.joinFunctionInfoWindow = function (value) {
      //now use all fields to set info window
      var returnValue = '';
      for (var i = 0; i < globals.csvData.length; i++) {
        if (globals.csvData[i][1] == value) {
          //hard coded for now, DX 02/03/2020
          returnValue += "<b>HRR:</b> " + globals.csvData[i][1];

          // HARD CODED added 03/22 DX
          for (var j = 2; j < globals.csvDataHeader.length - 3; j++)
            if (globals.csvDataHeader[j] === 'Projected Demand (%)') {
              returnValue += "<br><b> Projected Demand :</b> " + globals.csvData[i][j] + " %";
            } else {
              returnValue += "<br><b>" + globals.csvDataHeader[j] + ":</b> " + globals.csvData[i][j];
            }
          renderSelectedRegionsChart(globals.csvData[i][0], globals.csvData[i][1]);
          break;
        }
      }

      return returnValue;
    }

    function clearDIV(divID) {
      var div = document.getElementById(divID);
      while (div.childNodes.length > 0) {
        div.removeChild(div.childNodes[0]);
      }
    }

    function clearDisplayOptionWrapper() {
      clearDIV("legend");
    }

    function queryByName() {
      var inputStr = $("#queryByName").val();
      if (inputStr.length != 0) {
        inputStr = inputStr.replace(/%/g, '');
        var inputStrSplit = inputStr.split(",");
        var where = '';

        for (var i = 0; i < inputStrSplit.length; i++) {
          var temp = inputStrSplit[i].trim();
          if (where == '')
            where += "HRRCITY LIKE '%" + temp.toString() + "%'";
          else
            where += " OR HRRCITY LIKE '%" + temp.toString() + "%'";
        }

        //now query correspding layer
        query = new Query();
        query.outSpatialReference = {
          "wkid": 102100
        };
        query.returnGeometry = true;
        //setup QueryTask (for display Level selection)
        var queryTask = new QueryTask(globals.mapServiceUrls.HRR);
        query.outFields = ["HRRNUM", "HRRCITY", "DHS_Beds", "Total_Pop"];

        query.where = where;
        var symbol = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL,
          new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            new Color([102, 255, 255]),
            2
          ),
          new Color([255, 0, 0])
        );
        var names = [];
        var selectedHRRNum = [];
        queryTask.execute(query, function (fset) {
          globals.map.graphics.clear();
          if (fset.features.length > 0) {
            for (var i = 0; i < fset.features.length; i++) {
              //symbol for selected county
              var graphic = new Graphic(fset.features[i].geometry, symbol);
              globals.map.graphics.add(graphic);
              //check whether it has number for selected attribute
              // if(  DX stops here 02/04
              //add name to names (for table display)
              var temp = fset.features[i].attributes.HRRCITY;
              var hrrNumber = fset.features[i].attributes.HRRNUM;

              if (names.indexOf(temp) == -1) {
                names.push(temp);
                selectedHRRNum.push(hrrNumber);
              }
            }
            globals.selectedRegions = names;
            globals.selectedHRRNumbers = selectedHRRNum;

            // Display Chart 
            renderQueriedRegionsChart();
            showCSVDataInTable(globals.selectedRegions);
            var extent = esri.graphicsExtent(fset.features);
            globals.map.setExtent(extent, true);
          } else {
            $('.queryResultPopUp')[0].innerHTML = "No result found for <b>" + inputStr + "</b>.";
            $('#noResultFoundButton').click();
          }
        });

      } //check for hacking
    }

    //main function to prepare html for data table
    //hard coded: move the 3rd column, i.e., Last Update, to the end DX 02/07/2020
    //@param names an array that stores a list of place name
    function showCSVDataInTable(names) {
      globals.map.infoWindow.hide();
      var tableHTML = null;
      var lengthMenuOptions = null;
      var downloadOptions = "";
      tableHTML = '<table id="example" class="display" cellspacing="0" width="100%">\n<thead><tr>';
      for (var i = 1; i < globals.csvDataHeader.length - 3; i++)
        tableHTML += "<th>" + globals.csvDataHeader[i] + "</th>";

      tableHTML += "</tr></thead><tbody>";
      for (var i = 0; i < globals.csvData.length - 1; i++) {
        var name = globals.csvData[i][1];
        if (names.indexOf(name) == -1)
          continue;
        else {
          tableHTML += "<tr>";
          for (var j = 1; j < globals.csvDataHeader.length - 3; j++) {
            tableHTML += "<td>" + globals.csvData[i][j].toLocaleString() + "</td>";
          }
          tableHTML += "</tr>\n";
        }
      }
      tableHTML += "</table>";
      dojo.byId("dataTable").innerHTML = tableHTML;

      if (/Android|webOS|iPhone|iPod|ipad|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        lengthMenuOptions = '<select> <option value="10">10</option> <option value="25">25</option>' +
          '<option value="50">50</option> <option value="-1">All</option> </select>';

        downloadOptions = '<i class="fa fa-download" aria-hidden="true"></i>';
      } else {
        lengthMenuOptions = 'Display <select> <option value="10">10</option> <option value="25">25</option>' +
          '<option value="50">50</option> <option value="-1">All</option> </select>';

        downloadOptions = 'Download';
      }

      $('table.display').DataTable({
        dom: 'Blfrtip',
        "order": [
          [0, "asc"]
        ],
        scrollX: true,
        scrollCollapse: true,
        //"searching": false,
        "language": {
          search: '',
          lengthMenu: lengthMenuOptions
        },
        oLanguage: {
          "oPaginate": {
            "sNext": '<i title="Next" class="fa fa-chevron-right" ></i>',
            "sPrevious": '<i title="Previous" class="fa fa-chevron-left" ></i>'
          }
        },
        buttons: [{
          extend: 'csvHtml5',
          text: downloadOptions,
          titleAttr: 'CSV'
        }],
        columnDefs: [{
          render: function (data, type, full, meta) {
            return "<div class='text-wrap width-600'>" + data + "</div>";
          },
          targets: 0
        }]
      });
    }


    if (/Android|webOS|iPhone|iPod|ipad|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      $.fn.DataTable.ext.pager.numbers_length = 4;
    } else {
      $.fn.DataTable.ext.pager.numbers_length = 5;
    }

    function renderTimeline() {
      let filteredData = globals.dailySummary.slice(1); //remove heding row

      var timelineHTML = "";

      // Iterate over Summary data and craete Timelines
      for (index = 0; index < filteredData.length; index++) {
        let totalHospitalizations = Number(filteredData[index][2]).toLocaleString();
        let totalProjectedDemand = Number(filteredData[index][1]).toLocaleString();
        let actualDateString = filteredData[index][0];

        let formattedDate = new Date(filteredData[index][0].replace(/-/g, "/"));
        const representationDate = new Date(formattedDate).toDateString().slice(4).substring(0, 6);

        const lowerBound = Number(filteredData[index][3]).toLocaleString();
        const upperBound = Number(filteredData[index][4]).toLocaleString();

        var toolTipText = 'Projected Demand (%) : <b>' + totalProjectedDemand + '</b><br>' +
          'Total Hospitalizations <br>' +
          'Mean Value  : <b>' + totalHospitalizations + '</b><br>' +
          'Lower Bound : <b>' + lowerBound + '</b><br>' +
          'Upper Bound : <b>' + upperBound + '</b><br>';

        if (index === 0) {
          timelineHTML +=
            '<div class="d-flex content content-selected pr-md-2" id="date-' + actualDateString + '" data-toggle="tooltip" data-html="true" data-placement="bottom" title="' + toolTipText + '">';
        } else {
          timelineHTML +=
            '<div class="d-flex content pr-md-2" data-toggle="tooltip" id="date-' + actualDateString + '" data-toggle="tooltip" data-html="true" data-placement="bottom" title="' + toolTipText + '">';
        }

        timelineHTML += '<div class="d-flex date">' + representationDate + '</div>' +
          '<div class="content-data" style="flex:1;">' +
          '<div class="d-flex justify-content-center">' +
          '<div class="content-data-icon"><i class="fa fa-users"></i></div>' +
          '<div class="cases">' + totalHospitalizations + '</div></div>' +
          '<div class="d-flex justify-content-center">' +
          '<div class="content-data-icon"><i class="fa fa-bed"></i></div>' +
          '<div class="beds">' + totalProjectedDemand + ' %</div></div>' +
          '</div></div>';

      }

      $('#timeline').html(timelineHTML);

      $('#timeline .content').off().on('click', function (event) {
        const selectedDate = event.currentTarget.id.substring(5);

        // Remove selection
        $(".content-selected").each(function (i, item) {
          $(item).removeClass('content-selected');
        });

        // Add selection class to current timeline
        $(event.currentTarget).addClass('content-selected');

        changeDate(selectedDate);
      });

    }

    function renderScenarios() {

      var scenarioHTML = "";
      for (index = 0; index < globals.scenarios.length; index++) {

        const scenarioName = globals.scenarios[index].scenario_display_name;

        if (index == 0) {
          scenarioHTML += '<div class="d-flex mr-2 selected-scenario scenario-content" data-scenario="' + scenarioName + '"' +
            'data-toggle="tooltip" data-html="true" data-placement="right" title="' + globals.scenarios[index].description + '">';
        } else {
          scenarioHTML += '<div class="d-flex mr-2 scenario-content" data-scenario="' + scenarioName + '"' +
            'data-toggle="tooltip" data-html="true" data-placement="right" title="' + globals.scenarios[index].description + '">';
        }
        scenarioHTML += '<div class="d-flex" style="align-items: center;">' +
          '<img class="mr-1" style="height: 25px; width: 25px;" src="images/scenario.png" alt="Scenario"></div>' +
          '<div class="d-flex justify-content-center" style="text-transform: capitalize;">' + scenarioName + '</div></div>';
      }

      $('#scenarios').html(scenarioHTML);

      $('#scenarios .scenario-content').off().on('click', function (event) {
        const selectedScenario = event.currentTarget.dataset.scenario;

        // Remove selection
        $(".selected-scenario").each(function (i, item) {
          $(item).removeClass('selected-scenario');
        });

        // Add selection class to current timeline
        $(event.currentTarget).addClass('selected-scenario');

        for (index = 0; index < globals.scenarios.length; index++) {
          const scenario = globals.scenarios[index];

          if (scenario.scenario_display_name === selectedScenario) {
            globals.selectedScenario = scenario;
            globals.scenariosDirectory = scenario.directory;
            break;
          }
        }
        executeDefaultWorkflow();
      });

    }

    function getGlobalDataFromCSVFile(file) {
      $.ajax({
        url: file,
        async: false,
        success: function (csv) {
          var items = $.csv.toObjects(csv);
          var jsonobject = JSON.stringify(items);

          globals.globalChartDataSummary = JSON.parse(jsonobject);
          globals.chartDataFile = JSON.parse(jsonobject);
          globals.dailySummary = $.csv.toArrays(csv);
        },
        dataType: "text",
        complete: function () {}
      });
    }

    function resetMapToDefault() {
      if ($('#queryByName')[0].value == '') {
        return;
      }

      globals.map.graphics.clear();
      globals.map.infoWindow.hide();
      globals.selectedRegions = [];
      globals.selectedHRRNumbers = [];

      $('#queryByName')[0].value = "";
      globals.map.setExtent(globals.defaultExtents.default);

      // Reload Application as per selected Scenario
      executeDefaultWorkflow();
    }

    function bindSearchAndResetButton() {
      $('.resetDefault').on('click', function (e) {
        resetMapToDefault();
      });

      $('.queryFilter').on('click', function (e) {
        queryByName();
      });

      //add response to enter key on query input box
      $("#queryByName").keypress(function (event) {
        if (event.keyCode == 13) {
          queryByName();
        }
      });
    }

  });


function bindMenuEvents() {
  $('.moreOptionDropDown').off().on("click", function (e) {
    e.stopPropagation();
    $('#optionMenu').removeClass('displayNone');
    $('#optionMenu').toggle();
  });

  $('.hamburgerIcon').click(function (e) {
    e.stopPropagation();
    $('.optionMenu').toggle();
  });

  $(document).click(function () {
    if (this.id != 'optionMenu') {
      $(".optionMenu").hide();
    }
  });
}

function bindChartAndDataTab() {
  $('.charts').on('click', function (e) {
    $('.data').removeClass('selectedFilter');
    $('.charts').addClass('selectedFilter');
    $('#dataTable').addClass('d-none');
    $('#chartdiv').removeClass('d-none');
  });

  $('.data').on('click', function (e) {
    $('.charts').removeClass('selectedFilter');
    $('.data').addClass('selectedFilter');
    $('#chartdiv').addClass('d-none');
    $('#dataTable').removeClass('d-none');
    $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
  });
}

// function filteredRegion(regionValue) {
//   var filtered = [];
//   for (var i = 0; i < globals.csvData.length; i++) {

//     if (globals.csvData[i][1].startsWith(regionValue)) {
//       filtered.push(globals.csvData[i]);
//     }
//   }
//   globals.filteredRegion = filtered;
// }