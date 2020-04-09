/* Main script used in COVID-19 Surveillance Dashboard
 *
 * supported functionality:
 *   select a date from datepicker
 *   change attritube used for rendering
 *   support "filter by clicking or query
 *   a dynamic data table supports search, sort and export
 *   tool tip to show help information
 *
 * By Dawen Xie
 */

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
//globals.dataLevels = ["State"]; //state_fips, county_fips in the CSV header
globals.dataLevels = ["State", "County"];

//store REST API URL for corresponding polygon
globals.mapServiceUrls = {
  //ver 2
  //"NCOV_World_Countries_States_Provinces" was created by Drew MacQueen, the Scholars’ Lab at UVA
  //State: "https://services2.arcgis.com/8k2PygHqghVevhzy/arcgis/rest/services/NCOV_World_Countries_States_Provinces/FeatureServer/0",
  //County: "https://services2.arcgis.com/8k2PygHqghVevhzy/arcgis/rest/services/NCOV_World_Countries_States_Provinces/FeatureServer/0"
  //ver 3 add princess diamond, US unknown and missing countries, more simplied, etc
  //"NCOV_World_Countries_States_Provinces_wUnknown" was created by Drew MacQueen, the Scholars’ Lab at UVA
  HRR: "https://services2.arcgis.com/8k2PygHqghVevhzy/arcgis/rest/services/covid19_nssac_resource_optimization/FeatureServer/0",
  // County: "https://services2.arcgis.com/8k2PygHqghVevhzy/arcgis/rest/services/NCOV_World_Countries_States_Provinces_wUnknown/FeatureServer/0"
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
//confirmed, deaths, recovered
globals.mainlandChinaRowForSelectedDate = [];
globals.usaRowForSelectedDate = [];

//daily summary in csv format: date,totalConfirmed,totalDeaths,totalRecovered,newConfirmed,newDeaths,newRecovered
//globals.dailySummaryFile = "data/nssac-ncov-sd-summary.csv";
globals.dailySummaryFile = "data_ro/nssac_ncov_ro-summary.csv";
globals.dailySummary = [];

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
globals.startDateString = "";
globals.endDateString = "";

globals.filteredRegion = [];
globals.regionSelected = "All regions";
globals.logScale = true;
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
    getGlobalDataFromCSVFile(globals.dailySummaryFile);
    getDataFromCSVFile(globals.dailySummaryFile);

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

    $('.moreOptionDropDown').on("click", function (e) {
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

    $('.charts').on('click', function (e) {
      $('.data').removeClass('selectedFilter');
      $('.charts').addClass('selectedFilter');
      $('#dataTable').addClass('d-none');
      $('#chartdiv').removeClass('d-none');

      cumulative_data();
    });

    $('.data').on('click', function (e) {
      $('.charts').removeClass('selectedFilter');
      $('.data').addClass('selectedFilter');
      $('#chartdiv').addClass('d-none');
      $('#dataTable').removeClass('d-none');
      $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
    });

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

    var $videoSrc;
    $('.video-btn').click(function () {
      $videoSrc = $(this).data("src");
    });

    // when the modal is opened autoplay it
    $('#myModal').on('shown.bs.modal', function (e) {

      $("#video").attr('src', $videoSrc + "?autoplay=1&amp;modestbranding=1&amp;showinfo=0");
    })

    $('#myModal').on('hide.bs.modal', function (e) {
      $("#video").attr('src', $videoSrc);
    })

    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      $('#chartView').click();
      $('#queryByName').attr('placeholder', 'Comma separated names');
    }


    var defaultDate = $.datepicker.formatDate('mm-dd-yy', new Date());
    var maxDate = globals.dailySummary[globals.dailySummary.length - 1][0];

    globals.selectedDate = defaultDate;
    globals.renderFile = "data_ro/nssac_ncov_ro_" + defaultDate + ".csv";

    //Setup Date Picker
    // $('[data-toggle=datepicker]').each(function () {
    //   var target = $(this).data('target-name');
    //   var t = $('input[name=' + target + ']');
    //   t.datepicker({
    //     minDate: defaultDate,
    //     maxDate: maxDate,
    //     dateFormat: "mm-dd-yy",
    //     autoclose: true,
    //     onSelect: function (selected, evnt) {
    //       $('#legend').show();
    //       changeDate(selected);
    //     }
    //   });
    //   $(this).on("click", function () {
    //     t.datepicker("show");
    //   });
    // });

    // $(".datepicker").datepicker("setDate", defaultDate);

    // Initialize Query Tooltip
    $('[data-toggle="popover"]').popover();

    // Select default option as Charts
    $('.charts').click();

    initialSetup();
    getCSVDataAndRendering();
    InitialSlider();

    // Update summary info to default date
    //updateSummaryInfo(defaultDate);

    /////////////////////////////////////////////////
    //
    // BELOWS ARE FUNCTIONS CALLED BY ABOVE INI
    //
    ////////////////////////////////////////////////

    //initial setup for the map, globals.query and globals.queryTask to query this level by NAME
    function initialSetup() {
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
      var names = [];
      for (var i = 0; i < globals.csvData.length; i++) {
        names.push(globals.csvData[i][1]);
      }

      showCSVDataInTable(names);
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
      var tempChinaRow = ['Mainland China', 'Mainland China', '', 0, 0, 0, 0];
      var tempUSARow = ['United States', 'United States', '', 0, 0, 0, 0];
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

        filteredRegion(globals.regionSelected);
      }

      //at this point, we have updated stats on all fields
      globals.csvDataStats = tempStats;
      //decide to switch to # of countries (need to exclude Hong Kong, Macau and Taiwan)
      globals.numberCountryForSelectedDate = countries.length - 3;
      globals.mainlandChinaRowForSelectedDate = tempChinaRow;
      globals.usaRowForSelectedDate = tempUSARow;

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
      } else if (globals.csvDataHeader[globals.renderFieldIndex] == 'Beds Avail') {
        //for deaths
        //PuBu
        colors.push(new Color([4, 90, 141]));
        colors.push(new Color([43, 140, 190]));
        colors.push(new Color([116, 169, 207]));
        colors.push(new Color([189, 201, 225]));
        colors.push(new Color([241, 238, 246]));

        var breakMins = [1, 401, 901, 1401, 2101];
        var breakMaxs = [400, 900, 1400, 2100, 29999];
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
      console.log('selectedDate', selectedDate);
      globals.selectedDate = selectedDate;
      globals.renderFile = "data_ro/nssac_ncov_ro_" + selectedDate + ".csv"
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
        updateSummaryInfo(selectedDate);
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
      getCSVDataAndRendering(true);
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
      var featureID = null;

      for (var i = 0; i < globals.csvData.length; i++) {
        if (globals.dataLevel == "State")
          var fipsValue = (value.hasOwnProperty("attributes")) ? value.attributes.HRRCITY : value;
        var returnValue = '';
        var csvFipsValue = globals.csvData[i][1];
        if (fipsValue == csvFipsValue) {
          featureID = fipsValue;
          break;
        }
      }
      //now use all fields to set info window
      for (var i = 0; i < globals.csvData.length; i++) {
        if (globals.csvData[i][1] == featureID) {
          //hard coded for now, DX 02/03/2020
          returnValue += "<b>Place Name:</b> " + globals.csvData[i][1];

          // HARD CODED added 03/22 DX
          for (var j = 2; j < globals.csvDataHeader.length; j++)
            returnValue += "<br><b>" + globals.csvDataHeader[j] + ":</b> " + globals.csvData[i][j];

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

    function remove(array, element) {
      return array.filter(function (item) {
        return item == element;
      });
    }

    //for a list of name, separated by comma,
    //query corresonding layer and show results in GraphicLayer and data table
    function queryByName() {
      //testing string: Hubei, Hunan
      var inputStr = $("#queryByName").val();
      if (inputStr.length == 0)
        alert("Already showing all data.");
      else {
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

              if (names.indexOf(temp) == -1)
                names.push(temp);
            }
            //names = remove(names, inputStr);
            showCSVDataInTable(names);
            var extent = esri.graphicsExtent(fset.features);
            globals.map.setExtent(extent, true);
          } else {
            dojo.byId("info").innerHTML = "No match found. Only used name column for query.";
            dojo.byId("infoGraph").innerHTML = "No match found. Only used name column for query.";
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
      for (var i = 1; i < globals.csvDataHeader.length - 1; i++)
        tableHTML += "<th>" + globals.csvDataHeader[i] + "</th>";

      tableHTML += "</tr></thead><tbody>";
      for (var i = 0; i < globals.csvData.length - 1; i++) {
        var name = globals.csvData[i][1];
        if (names.indexOf(name) == -1)
          continue;
        else {
          tableHTML += "<tr>";
          for (var j = 1; j < globals.csvDataHeader.length - 1; j++) {
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

    //for a given csv file, fetch data and store it in data (an array)
    function getDataFromCSVFile(file) {
      $.ajax({
        url: file,
        async: false,
        success: function (csv) {
          var items = $.csv.toObjects(csv);
          var jsonobject = JSON.stringify(items);
          globals.chartDataFile = JSON.parse(jsonobject);
          globals.dailySummary = $.csv.toArrays(csv);
        },
        dataType: "text",
        complete: function () {}
      });
    }

    function InitialSlider() {

      let loopCounter = 0;
      let loopingSliderHtml = "";
      $('[data-toggle="tooltip"]').tooltip('dispose');

      let filteredData = globals.dailySummary;

      for (var d = new Date(defaultDate); d <= new Date(maxDate); d.setDate(d.getDate() + 1)) {
        let totalCasses = 0;
        let bedsAvailable = 0;

        var formattedDate = ("0" + parseInt(d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2) + "-" + d.getFullYear();
        for (index = 0; index < filteredData.length; index++) {
          if (filteredData[index][0] === formattedDate) {
            totalCasses = Number(filteredData[index][3]).toLocaleString();
            bedsAvailable = Number(filteredData[index][1]).toLocaleString();
            break;
          }
        }
        const representationDate = d.toDateString().slice(4).substring(0, 6);

        var toolTipText = 'Projected Cases : <b>' + totalCasses + '</b> <br>' +
          'Beds Available : <b>' + bedsAvailable + '</b>';

        if (loopCounter === 0) {
          loopingSliderHtml += '<div class="carousel-item active">' +
            '<div class="d-flex content content-selected pr-lg-2" id="date-' + formattedDate + '" data-toggle="tooltip" data-html="true" data-placement="auto" title="' + toolTipText + '">';
        } else {
          loopingSliderHtml += '<div class="carousel-item" >' +
            '<div class="d-flex content pr-lg-2" data-toggle="tooltip" id="date-' + formattedDate + '" data-toggle="tooltip" data-html="true" data-placement="auto" title="' + toolTipText + '">';
        }

        loopingSliderHtml += '<div class="d-flex date">' + representationDate + '</div>' +
          '<div class="content-data" style="flex:1;">' +
          '<div class="d-flex justify-content-center">' +
          '<div class="content-data-icon"><i class="fa fa-users"></i></div>' +
          '<div class="cases">' + totalCasses + '</div></div>' +
          '<div class="d-flex justify-content-center">' +
          '<div class="content-data-icon"><i class="fa fa-bed"></i></div>' +
          '<div class="beds">' + bedsAvailable + '</div></div>' +
          '</div></div></div>';

        let dd = "#date-" + formattedDate;

        $('.carousel-inner').on({ // look for the #button somewhere in body
          click: function (ev) {
            let selectedDateCarosel;
            selectedDateCarosel = ev.currentTarget.id.substring(5);
            $(".content-selected").each(function (i, item) {
              $(item).removeClass('content-selected');
            });
            $(ev.currentTarget).addClass('content-selected');
            changeDate(selectedDateCarosel);
          }
        }, dd);
        loopCounter++;

      }

      $("#dateLooping").html(function (n) {
        return loopingSliderHtml;
      });

      // code start for carosel 
      $('#myCarousel').carousel({
        interval: false
      })

      $('.carousel').on('slid.bs.carousel', function () {
        let numItems = $('.carousel-item').length;
        let currentIndex = $('div.active').index() + 9;
        let CheckNextInterval;
        let selectedDate = $(".content-selected").attr('id');
        selectedDate = ".active #" + selectedDate;
        $('#dateLooping').removeClass('content-selected');

        $('.carousel-control-prev').show();
        $('.carousel-control-prev').css('display', 'flex');

        if (currentIndex >= numItems) { //if this is the last item then
          $('.carousel-control-next').hide();
        } else if (currentIndex === 9) { //if page load/refreshed and slider starts from 1st item by default or by sliding its the first item 
          $('.carousel-control-prev').hide();
        } else { // if this is not last item
          $('.carousel-control-next').show();
        }
        $(selectedDate).addClass('content-selected');
      });

      $('.carousel .carousel-item').each(function () {
        var minPerSlide = 7;
        var next = $(this).next();
        if (!next.length) {
          next = $(this).siblings(':first');
        }
        next.children(':first-child').clone().appendTo($(this));

        for (var i = 0; i < minPerSlide; i++) {
          next = next.next();
          if (!next.length) {
            next = $(this).siblings(':first');
          }

          next.children(':first-child').clone().appendTo($(this));
        }
      });
      // code end for carosel

      $('[data-toggle="tooltip"]').tooltip();
    }

    function getGlobalDataFromCSVFile(file) {
      $.ajax({
        url: file,
        async: false,
        success: function (csv) {
          var items = $.csv.toObjects(csv);
          var jsonobject = JSON.stringify(items);
          globals.globalChartDataSummary = JSON.parse(jsonobject);
        },
        dataType: "text",
        complete: function () {}
      });
    }

    function resetMapToDefault() {
      globals.map.graphics.clear();
      globals.map.infoWindow.hide();
      globals.selectedRegions = [];

      $('#queryByName')[0].value = "";
      globals.map.setExtent(globals.defaultExtents.default);
      globals.map.setZoom(4);

      getCSVDataAndRendering();
    }

  });


function filteredRegion(regionValue) {
  var filtered = [];
  for (var i = 0; i < globals.csvData.length; i++) {

    if (globals.csvData[i][1].startsWith(regionValue)) {
      filtered.push(globals.csvData[i]);
    }
  }
  globals.filteredRegion = filtered;
}

function resetToDefault(timeSlider, changeDate, startDateString, endDateString) {
  $('.logarithmicDiv').css("visibility", "visible");
  globals.chartDataFile = globals.globalChartDataSummary;
  $("#chartToggle").bootstrapToggle("on");
  timeSlider.setThumbIndexes([0]);
  timeSlider.pause();
  var defaultDate = new Date(timeSlider.timeStops[timeSlider.timeStops.length - 1].toString());
  var dateToSet = new Date(parseInt(defaultDate.getFullYear()), parseInt(defaultDate.getMonth()), parseInt(defaultDate.getDate()));

  var formattedDate = ("0" + parseInt(dateToSet.getMonth() + 1)).slice(-2) + "-" + ("0" + dateToSet.getDate()).slice(-2) + "-" + dateToSet.getFullYear();
  changeDate(formattedDate);
  $('#legend').show();
  if (/Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    document.getElementById("selectedDate").innerHTML = "";
    document.getElementById("daterange").innerHTML = "Time Slider from <strong><i> " + startDateString + "</strong> to <strong>" + endDateString + "</i></strong>";
  } else {
    document.getElementById("selectedDate").innerHTML = "Selected Date <strong><i> " + globals.endDateString + "</i></strong>";
    document.getElementById("daterange").innerHTML = "Time Slider from <strong><i> " + startDateString + "</strong> to <strong>" + endDateString + "</i></strong>";
  }
  $('#regionSelect').val('All regions');
  $('#regionMobileSelect').val('All regions');
  globals.regionSelected = 'All regions';
}

function updateSummaryInfo(selectedDate) {

  var filteredData = globals.dailySummary.filter(function (data) {
    if (data[0] === selectedDate) {
      return true;
    } else {
      return false;
    }
  });

  if (filteredData.length === 0) {
    console.log('No summary data available for ' + selectedDate);
    return;
  }
  filteredData = filteredData[0];

  $('[data-toggle="tooltip"]').tooltip('dispose');

  // Calculate Beds statistics
  var total = Number(filteredData[1]);
  var needed = Number(filteredData[4]);
  var available = total - needed;
  var availablePercentage = Number((available / total) * 100);

  var tooltip = "Beds Available : <b>" + available.toLocaleString() + "</b><br>";
  tooltip = tooltip + "Beds Needed : <b>" + needed.toLocaleString() + "</b><br>";
  tooltip = tooltip + "Total Beds : <b>" + total.toLocaleString() + "</b><br>";
  tooltip = tooltip + "Percentage Available : <b>" + availablePercentage.toFixed(2) + " %</b>";

  if (availablePercentage > 75) {
    $('.beds-progress-bar').addClass('bg-success');
  } else if (availablePercentage > 50 && availablePercentage < 75) {
    $('.beds-progress-bar').addClass('bg-warning');
  } else {
    $('.beds-progress-bar').addClass('bg-danger');
  }

  $('.bedsUsedCount').html(available.toLocaleString());
  $(".beds-progress-bar").attr('aria-valuenow', availablePercentage.toFixed(2));
  $(".beds-progress-bar").width(availablePercentage.toFixed(2) + "%");
  $(".beds-tooltip").attr('title', tooltip);

  // Calculate Ventilator statistics
  total = Number(filteredData[2]);
  needed = Number(filteredData[5]);
  available = total - needed;
  availablePercentage = Number((available / total) * 100);

  tooltip = "Ventilators Available : <b>" + available.toLocaleString() + "</b><br>";
  tooltip = tooltip + "Ventilators Needed : <b>" + needed.toLocaleString() + "</b><br>";
  tooltip = tooltip + "Total Ventilators : <b>" + total.toLocaleString() + "</b><br>";
  tooltip = tooltip + "Percentage Available : <b>" + availablePercentage.toFixed(2) + " %</b>";

  if (availablePercentage > 75) {
    $('.ventilator-progress-bar').addClass('bg-success');
  } else if (availablePercentage > 50 && availablePercentage < 75) {
    $('.ventilator-progress-bar').addClass('bg-warning');
  } else {
    $('.ventilator-progress-bar').addClass('bg-danger');
  }

  $(".ventUsedCount").html(available.toLocaleString());
  $(".ventilator-progress-bar").attr('aria-valuenow', availablePercentage.toFixed(2));
  $(".ventilator-progress-bar").width(availablePercentage.toFixed(2) + "%");
  $(".ventilator-tooltip").attr('title', tooltip);

  $('.totalCases').html(Number(filteredData[7]).toLocaleString());

  $('[data-toggle="tooltip"]').tooltip();
}