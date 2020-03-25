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
globals.dataLevels = ["State", "County"]; //state_fips, county_fips in the CSV header

//store REST API URL for corresponding polygon
globals.mapServiceUrls = {
  //ver 2
  //"NCOV_World_Countries_States_Provinces" was created by Drew MacQueen, the Scholars’ Lab at UVA
  //State: "https://services2.arcgis.com/8k2PygHqghVevhzy/arcgis/rest/services/NCOV_World_Countries_States_Provinces/FeatureServer/0",
  //County: "https://services2.arcgis.com/8k2PygHqghVevhzy/arcgis/rest/services/NCOV_World_Countries_States_Provinces/FeatureServer/0"
  //ver 3 add princess diamond, US unknown and missing countries, more simplied, etc
  //"NCOV_World_Countries_States_Provinces_wUnknown" was created by Drew MacQueen, the Scholars’ Lab at UVA
  State: "https://services2.arcgis.com/8k2PygHqghVevhzy/arcgis/rest/services/NCOV_World_Countries_States_Provinces_wUnknown/FeatureServer/0",
  County: "https://services2.arcgis.com/8k2PygHqghVevhzy/arcgis/rest/services/NCOV_World_Countries_States_Provinces_wUnknown/FeatureServer/0"
}
//flag used to indicate data level in the file, e.g., State, County
globals.dataLevel = "";

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
globals.dailySummaryFile = "data/nssac-ncov-sd-summary.csv";
globals.dailySummary = [];

globals.regionFile = "data/nssac-ncov-sd-region_list.csv";
globals.regionNames = [];

globals.regionSummaryFile = "./data/nssac-ncov-sd-summary.csv";

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
  function(
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
      "xmin": -16666948,
      "xmax": -4456592,
      "ymin": 2015549,
      "ymax": 7064062,
      "spatialReference": {
        "wkid": 102100
      }
    });
    globals.defaultExtents.AF = new Extent({
      "xmin": -4696291.017839989,
      "xmax": 9754587.801638449,
      "ymin": -3644517.508636239,
      "ymax": 4378312.9801737275,
      "spatialReference": {
        "wkid": 102100
      }
    });
    globals.defaultExtents.AS = new Extent({
      "xmin": 5117000.421521468,
      "xmax": 1.9567879240999904E7,
      "ymin": 934366.2337577409,
      "ymax": 8957196.722567707,
      "spatialReference": {
        "wkid": 102100
      }
    });
    globals.defaultExtents.EU = new Extent({
      "xmin": -3059233,
      "xmax": 7066205,
      "ymin": 5006523,
      "ymax": 10017938,
      "spatialReference": {
        "wkid": 102100
      }
    });
    globals.defaultExtents.NA = new Extent({
      "xmin": -1.792417738475593E7,
      "xmax": -3473298.5652774936,
      "ymin": 973501.9922397411,
      "ymax": 8996332.481049707,
      "spatialReference": {
        "wkid": 102100
      }
    });
    globals.defaultExtents.OC = new Extent({
      "xmin": 8296780.798183954,
      "xmax": 2.0037508342788905E7,
      "ymin": -6472076.058960726,
      "ymax": 1550754.42984924,
      "spatialReference": {
        "wkid": 102100
      }
    });
    globals.defaultExtents.SA = new Extent({
      "xmin": -1.2699553627408953E7,
      "xmax": 1751325.1920694842,
      "ymin": -6540563.636304227,
      "ymax": 1482266.8525057398,
      "spatialReference": {
        "wkid": 102100
      }
    });

    globals.map = new Map("mapCanvas", {
      basemap: "gray",
      extent: globals.defaultExtents.default
    });

    globals.map.infoWindow.resize(280,210);

    //connect onClick event listeners for buttons:
    //"Query" to search by name; "Clear" to clear graphics
    registry.forEach(function(d) {
      if (d.declaredClass === "dijit.form.Button") {
        d.on("click", activateTool);
      }
    });

    //add response to enter key on query input box
    dojo.byId("queryByName").addEventListener('keypress', function(event) {
      if (event.keyCode == 13) {
        queryByName();
      }
    });

    $('.moreOptionDropDown').on("click", function(e) {
      e.stopPropagation();
      $('#optionMenu').removeClass('displayNone');
      $('#optionMenu').toggle();
    });

    $('.hamburgerIcon').click(function(e) {
      e.stopPropagation();
      $('.optionMenu').toggle();
    });

    $(document).click(function() {
      if (this.id != 'optionMenu') {
        $(".optionMenu").hide();
      }
    });

    $('#timeline').on('click', function(e) {
      $('#timelinediv').html('');
      timeline_data();
    });

    $('#regionSelect').on('change', function(e) {
      globals.regionSelected = this.value;
      if(globals.regionSelected == 'All regions'){
        globals.filteredRegion = [];
        globals.regionSummaryFile = "./data/nssac-ncov-sd-summary.csv";
        getDataFromCSVFile(globals.regionSummaryFile);
        resetMapToDefault();
        $('.resetDefault').click();
      }else{
        queryByRegionName();
        filteredRegion(globals.regionSelected);
        globals.regionSummaryFile = "./data/regions/nssac-ncov-sd-summary-"+globals.regionSelected.toLowerCase()+".csv";
        getDataFromCSVFile(globals.regionSummaryFile);
        $('.logarithmicDiv').css("visibility","hidden");
        toggleChart();
      }
      setRendererSingle();
    });

    $('#regionMobileSelect').on('change', function(e) {
      globals.regionSelected = this.value;
      if(globals.regionSelected == 'All regions'){
        globals.filteredRegion = [];
        globals.regionSummaryFile = "./data/nssac-ncov-sd-summary.csv";
        getDataFromCSVFile(globals.regionSummaryFile);
        resetMapToDefault();
        $('.resetDefault').click();
      }else{
        queryByRegionName();
        filteredRegion(globals.regionSelected);
        globals.regionSummaryFile = "./data/regions/nssac-ncov-sd-summary-"+globals.regionSelected.toLowerCase()+".csv";
        getDataFromCSVFile(globals.regionSummaryFile);
        toggleChart();
      }
      setRendererSingle();
    });
    
    bindChart();
    
    var $videoSrc;
    $('.video-btn').click(function() {
      $videoSrc = $(this).data("src");
    });

    // when the modal is opened autoplay it
    $('#myModal').on('shown.bs.modal', function(e) {

      $("#video").attr('src', $videoSrc + "?autoplay=1&amp;modestbranding=1&amp;showinfo=0");
    })

    $('#myModal').on('hide.bs.modal', function(e) {
      $("#video").attr('src', $videoSrc);
    })

    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      $('#chartView').click();
      $('#queryByName').attr('placeholder', 'Comma separated names');
      $('.announcement').removeClass('d-flex');
      $('.newFeatures').removeClass('d-flex');
      $('.announcement').hide();
      $('.newFeatures').hide();
    }

    //Setup Date Picker
    min = new Date('2020-01-23');
    max = new Date();

    $('[data-toggle=datepicker1]').each(function() {
      var target = $(this).data('target-name');
      var t = $('input[name=' + target + ']');
      t.datepicker({
        minDate: min,
        maxDate: max,
        dateFormat: "mm-dd-yy",
        autoclose: true,
        onSelect: function(selected, evnt) {
          var dateIndex = checkDateIndex(selected);
          dateIndex = dateIndex == -1 ? 0 : dateIndex;
          globals.map.timeSlider.setThumbIndexes([dateIndex]);
          $('#legend').show();
          changeDate(selected);
          if(globals.regionSelected !== 'All regions'){
            queryByRegionName();
          }
        }
      });
      $(this).on("click", function() {
        t.datepicker("show");
      });
    });

    $('[data-toggle=datepicker2]').each(function() {
      var target = $(this).data('target-name');
      var t = $('input[name=' + target + ']');
      t.datepicker({
        minDate: min,
        maxDate: max,
        dateFormat: "mm-dd-yy",
        autoclose: true,
        onSelect: function(selected, evnt) {
          var dateIndex = checkDateIndex(selected);
          dateIndex = dateIndex == -1 ? 0 : dateIndex;
          globals.map.timeSlider.setThumbIndexes([dateIndex]);
          $('#legend').show();
          changeDate(selected);
          if(globals.regionSelected !== 'All regions'){
            queryByRegionName();
          }
        }
      });
      $(this).on("click", function() {
        t.datepicker("show");
      });
    });


    function checkDateIndex(value) {
      var timeStopsMDY = globals.map.timeSlider.timeStops.map(function(item){
        return (item.getMonth()+1).toString().padStart(2,'0') + "-" + item.getDate().toString().padStart(2,'0') + '-' + item.getFullYear();
      });
      return timeStopsMDY.findIndex(function(item) {
        return item == value;
      });
    }

    //set globals.dailySummary which is to set calendar default date as well
    getRegionDataFromCSVFile(globals.regionFile);
    var defaultDate = globals.dailySummary[globals.dailySummary.length - 1][0];
    $(".datepicker1").datepicker("setDate", defaultDate);
    $(".datepicker2").datepicker("setDate", defaultDate);
    globals.selectedDate = defaultDate;
    globals.renderFile = "data/nssac-ncov-sd-" + defaultDate + ".csv"

    initialSetup();
    getCSVDataAndRendering();

    /////////////////////////////////////////////////
    //
    // BELOWS ARE FUNCTIONS CALLED BY ABOVE INI
    //
    ////////////////////////////////////////////////

    //initial setup for the map, globals.query and globals.queryTask to query this level by NAME
    function initialSetup() {
      //display map and zoom to China
      var infoTemplate = new InfoTemplate(
        "Place : ${NAME}",
        "${NAME:globals.joinFunctionInfoWindow}"
      );
      var layer = new FeatureLayer(globals.mapServiceUrls.State, {
        id: "state_layer",
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        infoTemplate: infoTemplate,
        outFields: ["NAME", "ISO_3"]
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
      globals.map.on("layers-add-result", initSlider);

      //setup QueryTask (for filter by region)
      globals.queryTask = new QueryTask(globals.mapServiceUrls.State);
      globals.query = new Query();
      globals.query.outSpatialReference = {
        "wkid": 102100
      };
      globals.query.returnGeometry = true;
      globals.query.outFields = ["NAME"];

      globals.map.on("update-end", function() {
        $('.loading').hide();
      });

      layer.on("update-end", function() {
        $('.loading').hide();
      });
    }


    function initSlider() {
      var timeSlider = new TimeSlider({
        style: "width: 100%;"
      }, document.getElementById("timeSliderDiv"));
      globals.map.setTimeSlider(timeSlider);

      var timeExtent = new TimeExtent();
      timeExtent.startTime = new Date("01/22/2020");
      var endTime = globals.selectedDate.replace(/-/g, '/');
      timeExtent.endTime = new Date(endTime);
      timeSlider.setThumbCount(1);
      timeSlider.createTimeStopsByTimeInterval(timeExtent, 1, "esriTimeUnitsDays");
      timeSlider.setThumbIndexes([0, 1]);
      timeSlider.setThumbMovingRate(700);
      timeSlider.startup();

      //add labels for every other time stop
      var ticksLength = Math.floor(timeSlider.timeStops.length / 10);
      console.log('timeSlider.timeStops.length --> ' + timeSlider.timeStops.length);
      var labels = arrayUtils.map(timeSlider.timeStops, function(timeStop, i) {
        if (i % ticksLength === 0) {
          return timeStop.toLocaleDateString();
        } else {
          return "";
        }
      });

      if (!(/Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
        timeSlider.setLabels(labels);
      }

      var startDateString = timeExtent.startTime.toDateString().slice(4);
      var endDateString = timeExtent.endTime.toDateString().slice(4);

      globals.startDateString = startDateString;
      globals.endDateString = endDateString;

      //document.getElementById("daterange").innerHTML = "Time Slider from <strong><i> " + startDateString + "</strong> to <strong>" + endDateString + "</i></strong>";
      if (!(/Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
     //   document.getElementById("selectedDate").innerHTML = "Selected Date <strong><i> " + globals.endDateString + "</i></strong>";
      }
      var self = this;
      timeSlider.on("time-extent-change", function(evt) {
        var dateToSet = new Date(parseInt(evt.endTime.getFullYear()), parseInt(evt.endTime.getMonth()), parseInt(evt.endTime.getDate()));
        $(".datepicker1").datepicker("setDate", dateToSet);
        $(".datepicker2").datepicker("setDate", dateToSet);

        var formattedDate = ("0" + parseInt(dateToSet.getMonth() + 1)).slice(-2) + "-" + ("0" + dateToSet.getDate()).slice(-2) + "-" + dateToSet.getFullYear();
        document.getElementById("selectedDate").innerHTML = "Selected Date <strong><i> " + dateToSet.toDateString().slice(4) + "</i></strong>";
        if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          document.getElementById("daterange").innerHTML = "";
        }

        if (globals.map.timeSlider.playing) {
          $('#legend').hide();
        }
        
        if(globals.regionSelected !== 'All regions'){
          changeDate(formattedDate);
        }else{
          highlighColumn(formattedDate);
          if (!(timeSlider.getCurrentTimeExtent().endTime.toString() == timeSlider.timeStops[timeSlider.timeStops.length - 1].toString())) {
            changeDate(formattedDate);
          }
          if (timeSlider.getCurrentTimeExtent().endTime.toString() == timeSlider.timeStops[timeSlider.timeStops.length - 1].toString()) {
            setTimeout(function() {
              resetToDefault(timeSlider, changeDate, startDateString, endDateString);
            }, 1500);
          }
        }
      });

      timeSlider.on("pause", function() {
        if (!globals.map.timeSlider.playing) {
          $('#legend').show();
        }
      });
    }


    $('.resetDefault').on("click", function(event) {
      resetToDefault(globals.map.timeSlider, changeDate, globals.startDateString, globals.endDateString);
    });

    function getCSVDataAndRendering() {
      fileURL = globals.renderFile;
      var csvStore = new CsvStore({
        url: fileURL
      });

      csvStore.fetch({
        onComplete: function(items) {
          csvDataReady(csvStore, items);
          //before we display anything, decide what's data level based on first attribute name
          if (globals.csvDataHeader[0].toLowerCase() == "name") {
            globals.dataLevel = "State";
            globals.map.getLayer("state_layer").show();
          }
          if (globals.csvDataHeader[0].toLowerCase() == "county_fips") {
            globals.dataLevel = "County";
            globals.map.getLayer("state_layer").hide();
          }
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
          csvHeader.push("Active");
        }
        var itemData = [];
        for (var j = 0; j < csvHeader.length; j++) {
          if (j > 2 && parseFloat(csvStore.getValue(items[i], csvHeader[j]))) {
            itemData.push(parseFloat(csvStore.getValue(items[i], csvHeader[j])));
          } else {
            itemData.push(csvStore.getValue(items[i], csvHeader[j])); //alway parse the first column as string
          }
        }
        itemData[6] = itemData[3] - itemData[4] - itemData[5];
        globals.csvData.push(itemData);
      }

      //set global variable csvDataHeader
      globals.csvDataHeader = csvHeader;

      //compute stat for csvData
      computeCSVStats();

      //default render field is the 4th column (skip name,region,last update)
      if (!globals.renderFieldIndex)
        globals.renderFieldIndex = 6;

      //show csv data in data table
      var names = [];
      for (var i = 0; i < globals.csvData.length; i++) {
        names.push(globals.csvData[i][0]);
      }

      if(globals.regionSelected !== 'All regions'){
        names = remove(names, globals.regionSelected);
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
        if (country == 'Mainland China') {
          if(tempChinaRow[2] < globals.csvData[i][2].split('*')[0].trim())
            tempChinaRow[2] = globals.csvData[i][2].split('*')[0].trim()
          tempChinaRow[3] += parseInt(globals.csvData[i][3]);
          tempChinaRow[4] += parseInt(globals.csvData[i][4]);
          tempChinaRow[5] += parseInt(globals.csvData[i][5]);
          tempChinaRow[6] += parseInt(globals.csvData[i][3]) - parseInt(globals.csvData[i][4]) - parseInt(globals.csvData[i][5]);
        }
        if (country == 'USA' || country == 'United States') {
          if(tempUSARow[2] < globals.csvData[i][2].split('*')[0].trim())
            tempUSARow[2] = globals.csvData[i][2].split('*')[0].trim()
          tempUSARow[3] += parseInt(globals.csvData[i][3]);
          tempUSARow[4] += parseInt(globals.csvData[i][4]);
          tempUSARow[5] += parseInt(globals.csvData[i][5]);
          tempUSARow[6] += parseInt(globals.csvData[i][3]) - parseInt(globals.csvData[i][4]) - parseInt(globals.csvData[i][5]);
        }

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

    //main function for single attribute rendering: color codes polygons, display legend, etc
    function setRendererSingle() {
      //show summary info
      console.log('setRendererSingle');
      var html = getSummaryInfo();
      var html1 = getSummaryInfoOnMap();
      if (/Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        html = html.replace("number", "#");
        html1 = html1.replace("number", "#");
      }

     //  dojo.byId("summaryInfo").innerHTML = html;
      // dojo.byId("summaryInfoGraph").innerHTML = html;
       dojo.byId("summaryInfoOnMap").innerHTML = html1;
      dojo.connect(dojo.byId("renderField"), "onclick", changeRenderField);
    //  dojo.connect(dojo.byId("renderMobileField"), "onclick", changeRenderField);
      renderLegend();
    }


    function renderLegend() {
      //clear out the current legend
      console.log('renderLegend');
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
      if (globals.csvDataHeader[globals.renderFieldIndex] == 'Confirmed') {
        //for confirmed, suspected
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
      } else if (globals.csvDataHeader[globals.renderFieldIndex] == 'Deaths') {
        //for deaths
        //PuBu
        colors.push(new Color([241, 238, 246]));
        colors.push(new Color([189, 201, 225]));
        colors.push(new Color([116, 169, 207]));
        colors.push(new Color([43, 140, 190]));
        colors.push(new Color([4, 90, 141]));
        var breakMins = [1, 2, 6, 11, 21];
        var breakMaxs = [1, 5, 10, 20, 9999];
      } else if (globals.csvDataHeader[globals.renderFieldIndex] == 'Recovered') {
        //for recovered
        //YlGn
        colors.push(new Color([255, 255, 204]));
        colors.push(new Color([194, 230, 153]));
        colors.push(new Color([120, 198, 121]));
        colors.push(new Color([49, 163, 84]));
        colors.push(new Color([0, 104, 55]));
        var breakMins = [1, 10, 50, 100, 500];
        var breakMaxs = [9, 49, 99, 499, 99999];
      } else{
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
          new Color([255, 0, 0, ])
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
      globals.renderFile = "data/nssac-ncov-sd-" + selectedDate + ".csv"
      //check whether file exists
      var http = new XMLHttpRequest();
      http.open('HEAD', globals.renderFile, false);
      http.send();
      if (http.status != 404) {
        renderByFile();
        dojo.byId("info").innerHTML = "";
        dojo.byId("infoGraph").innerHTML = "";
      } else {
        if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && $('#dataView').hasClass('disabled')) {
          alert("Data for " + selectedDate + " is not available yet.");
        }
        dojo.byId("info").innerHTML = "<span style='padding: 3px;'>Data for " + selectedDate + " is not available yet.</span>";
        dojo.byId("infoGraph").innerHTML = "<span style='padding: 3px;'>Data for " + selectedDate + " is not available yet.</span>";
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
      console.log('changeRenderField');
      globals.renderFieldIndex = Number(event.target.value);
      $('.renderField').addClass('disabled');
      $(event.target).removeClass('disabled');
      //use new field to render
      setRendererSingle(false);
    }

    //Assumption: name for a place (state/province/country) is stored in a global variable called csvData
    //used for rendering function to join polygon and the data in csvData
    //this function relies on 3 global variables: renderFieldIndex, csvDataRanges[renderFieldIndex][0], csvDataRanges[renderFieldIndex][1]
    globals.joinFunction = function(value) {
      for (var i = 0; i < globals.csvData.length; i++) {
        if (globals.dataLevel == "County")
          var fipsValue = (value.hasOwnProperty("attributes")) ? value.attributes.NAME : value;
        if (globals.dataLevel == "State")
          var fipsValue = (value.hasOwnProperty("attributes")) ? value.attributes.NAME : value;
        var returnValue;

        var csvFipsValue = globals.csvData[i][0];
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
    globals.joinFunctionInfoWindow = function(value) {
      var featureID = null;
      for (var i = 0; i < globals.csvData.length; i++) {
        if (globals.dataLevel == "State")
          var fipsValue = (value.hasOwnProperty("attributes")) ? value.attributes.NAME : value;
        var returnValue = '';
        var csvFipsValue = globals.csvData[i][0];
        if (fipsValue == csvFipsValue) {
          featureID = fipsValue;
          break;
        }
      }
      //now use all fields to set info window
      for (var i = 0; i < globals.csvData.length; i++) {
        if (globals.csvData[i][0] == featureID) {
          //hard coded for now, DX 02/03/2020
          returnValue += "<b>Place Name:</b> " + globals.csvData[i][0];
          returnValue += "<br><b>Region:</b> " + globals.csvData[i][1];
          // HARD CODED added 03/22 DX
          for (var j = 3; j < 6; j++)
            returnValue += "<br><b>" + globals.csvDataHeader[j] + ":</b> " + globals.csvData[i][j];
          returnValue += "<br><b>Last Update:</b> " + globals.csvData[i][2];
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
      clearDIV("displayOption");
      clearDIV("legend");
      clearDIV("defaultSliderOption");
    }

    function remove(array, element) {
      return array.filter(function(item) {return item == element; });
    }

    //for a list of name, separated by comma,
    //query corresonding layer and show results in GraphicLayer and data table
    function queryByName() {
      //testing string: Hubei, Hunan
      var inputStr = dojo.byId("queryByName").value;
      if (inputStr.length == 0)
        alert("Query string cannot be empty.");
      else {
        var errorFlag = false;
        dojo.byId("info").innerHTML = "";
        dojo.byId("infoGraph").innerHTML = "";
        inputStr = inputStr.replace(/%/g, '');
        var inputStrSplit = inputStr.split(",");
        var where = '';
        if (inputStr.length == 0)
          alert("Already showing all data.");
        else {
          if (inputStr.trim().toLowerCase() == "usa" || inputStr.trim().toLowerCase() == "us" || inputStr.trim().toLowerCase() == "united states")
            where = "ISO_3 = 'USA'";
          else if (inputStr.trim().toLowerCase() == "china" || inputStr.trim().toLowerCase() == "mainland china")
            where = "ISO_3 = 'CHN' OR ISO_3 = 'MAC' OR ISO_3 = 'HKG' OR ISO_3 = 'TWN' ";
          else {
            for (var i = 0; i < inputStrSplit.length; i++) {
              var temp = inputStrSplit[i].trim();
              if (where == '')
                where += "NAME LIKE '%" + temp.toString() + "%'";
              else
                where += " OR NAME LIKE '%" + temp.toString() + "%'";
            }
          }
          if (!errorFlag) { //update data table and perform query ONLY when the input does not have error
            //now query correspding layer
            query = new Query();
            query.outSpatialReference = {
              "wkid": 102100
            };
            query.returnGeometry = true;
            //setup QueryTask (for display Level selection)
            var queryTask = new QueryTask(globals.mapServiceUrls.State);
            query.outFields = ["NAME"];

            query.where = where;
            var symbol = new SimpleFillSymbol(
              SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL,
              new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([102, 255, 255]),
                2
              ),
              new Color([255, 0, 0, ])
            );
            var names = [];
            queryTask.execute(query, function(fset) {
              globals.map.graphics.clear();
              if (fset.features.length > 0) {
                for (var i = 0; i < fset.features.length; i++) {
                  //symbol for selected county
                  var graphic = new Graphic(fset.features[i].geometry, symbol);
                  globals.map.graphics.add(graphic);
                  //check whether it has number for selected attribute
                  // if(  DX stops here 02/04
                  //add name to names (for table display)
                  var temp = fset.features[i].attributes.NAME;
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
          } //if (!errorFlag )
        } //check for hacking
      } //else if (inputStr.length == 0)
    }

    function queryByRegionName() {
      //testing string: Hubei, Hunan
      var inputStr = globals.regionSelected;
      if (inputStr.length == 0)
        alert("Query string cannot be empty.");
      else {
        var errorFlag = false;
        dojo.byId("info").innerHTML = "";
        dojo.byId("infoGraph").innerHTML = "";
        inputStr = inputStr.replace(/%/g, '');
        var inputStrSplit = inputStr.split(",");
        var where = '';
        if (inputStr.length == 0)
          alert("Already showing all data.");
        else {
          if (inputStr.trim().toLowerCase() == "usa" || inputStr.trim().toLowerCase() == "us" || inputStr.trim().toLowerCase() == "united states")
            where = "ISO_3 = 'USA'";
          else if (inputStr.trim().toLowerCase() == "china" || inputStr.trim().toLowerCase() == "mainland china")
            where = "ISO_3 = 'CHN' OR ISO_3 = 'MAC' OR ISO_3 = 'HKG' OR ISO_3 = 'TWN' ";
          else {
            for (var i = 0; i < inputStrSplit.length; i++) {
              var temp = inputStrSplit[i].trim();
                if (where == '')
                  where += "NAME = '" + temp.toString() + "'";
                else
                  where += " OR NAME = '" + temp.toString() + "'";
            }
          }
          if (!errorFlag) { //update data table and perform query ONLY when the input does not have error
            //now query correspding layer
            query = new Query();
            query.outSpatialReference = {
              "wkid": 102100
            };
            query.returnGeometry = true;
            //setup QueryTask (for display Level selection)
            var queryTask = new QueryTask(globals.mapServiceUrls.State);
            query.outFields = ["NAME"];

            query.where = where;
            var symbol = new SimpleFillSymbol(
              SimpleFillSymbol.STYLE_NULL,
              new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([102, 255, 255]),
                2
              ),
              new Color([255, 0, 0])
            );
            var names = [];
            queryTask.execute(query, function(fset) {
              globals.map.graphics.clear();
              if (fset.features.length > 0) {
                for (var i = 0; i < fset.features.length; i++) {
                  
                  var graphic = new Graphic(fset.features[i].geometry, symbol);
                  globals.map.graphics.add(graphic);

                  //symbol for selected county
                  //add name to names (for table display)
                  var temp = fset.features[i].attributes.NAME;
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
          } //if (!errorFlag )
        } //check for hacking
      } //else if (inputStr.length == 0)
    }

    //main function to prepare html for data table
    //hard coded: move the 3rd column, i.e., Last Update, to the end DX 02/07/2020
    //@param names an array that stores a list of place name
    function showCSVDataInTable(names) {
      globals.map.infoWindow.hide();
      var tableHTML = null;
      var lengthMenuOptions = null;
      var downloadOptions = "";
      tableHTML = "<table id=\"example\" class=\"display\" cellspacing=\"0\" width=\"100%\">\n<thead><tr>";
      // change caption in the table. hard coded, DX 02/04/2020
      tableHTML += "<th>Place</th><th>Region</th>";
      for (var i = 3; i < globals.csvDataHeader.length; i++)
        tableHTML += "<th>" + globals.csvDataHeader[i] + "</th>";
      tableHTML += "<th>Last Update</th>";

      tableHTML += "</tr></thead><tbody>";
      var showUSAFlag = false;
      var showMainlandChinaFlag = false;
      for (var i = 0; i < globals.csvData.length; i++) {
        var name = globals.csvData[i][0];
        if (names.indexOf(name) == -1)
          continue;
        else {
          tableHTML += "<tr>";
          //customized order: move 3rd column to the end
          tableHTML += "<td>" + name + "</td>";
          tableHTML += "<td>" + globals.csvData[i][1] + "</td>";
          for (var j = 3; j < globals.csvDataHeader.length; j++) {
            tableHTML += "<td>" + globals.csvData[i][j].toLocaleString() + "</td>";
          }
          tableHTML += "<td>" + globals.csvData[i][2] + "</td>";
          tableHTML += "</tr>\n";
          if (globals.csvData[i][1] == 'USA' || globals.csvData[i][1] =='United States')
              showUSAFlag = true;
          if (globals.csvData[i][1] == 'Mainland China')
              showMainlandChinaFlag = true;
        }
      }
      //add usaRowForSeledtedDate and mainlandChinaRowForSelectedDate
      if (showMainlandChinaFlag)
          tableHTML += getHTMLRowFromArray(globals.mainlandChinaRowForSelectedDate);
      if (showUSAFlag)
          tableHTML += getHTMLRowFromArray(globals.usaRowForSelectedDate);
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
          [2, "desc"]
        ],
        scrollY: '60vh',
        scrollX: true,
        scrollCollapse: true,
        "language": {
          search: '',
          searchPlaceholder: "Filter data by",
          lengthMenu: lengthMenuOptions
        },
        oLanguage: {
          "oPaginate": {
            "sNext": '<i title="Next" class="fa fa-chevron-right" ></i>',
            "sPrevious": '<i title="Previous" class="fa fa-chevron-left" ></i>'
          }
        },
        buttons: [
          {
            extend:    'csvHtml5',
            text:      downloadOptions,
            titleAttr: 'CSV'
          }
        ],
        columnDefs: [
            {
                render: function (data, type, full, meta) {
                    return "<div class='text-wrap width-600'>" + data + "</div>";
                },
                targets: 5
            }
         ]
      });
    }


    if (/Android|webOS|iPhone|iPod|ipad|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      $.fn.DataTable.ext.pager.numbers_length = 4;
    } else {
      $.fn.DataTable.ext.pager.numbers_length = 5;
    }

    //for a data array, return html string for data table
    function getHTMLRowFromArray(row){
      var html = "<tr>";
      html += "<td>" + row[0] + "</td>";
      html += "<td>" + row[1] + "</td>";
      for (var i = 3; i < row.length; i++) {
            html += "<td>" + row[i].toLocaleString() + "</td>";
      }
      html += "<td>" + row[2] + "</td></tr>\n"; //last updated field
      return html;
    }

    //for a given csv file, fetch data and store it in data (an array)
    function getDataFromCSVFile(file) {
      $.ajax({
        url: file,
        async: false,
        success: function(csv) {
          var items = $.csv.toObjects(csv);
          var jsonobject = JSON.stringify(items);
          globals.chartDataFile = JSON.parse(jsonobject);
          globals.dailySummary = $.csv.toArrays(csv);
          //bindChart();
        },
        dataType: "text",
        complete: function() {}
      });
    }

    function getGlobalDataFromCSVFile(file) {
      $.ajax({
        url: file,
        async: false,
        success: function(csv) {
          var items = $.csv.toObjects(csv);
          var jsonobject = JSON.stringify(items);
          globals.globalChartDataSummary = JSON.parse(jsonobject);
        },
        dataType: "text",
        complete: function() {}
      });
    }

     //for a given region csv file, fetch data and store it in data (an array)
     function getRegionDataFromCSVFile(file) {
      $.ajax({
        url: file,
        async: false,
        success: function(csv) {
          globals.regionNames = $.csv.toArrays(csv);
          var option = '';
          for (var i=0;i<globals.regionNames.length;i++){
            if(globals.regionNames[i] == 'All regions')
              option += '<option value="'+ globals.regionNames[i] + '" selected>' + globals.regionNames[i] + '</option>';
            else
              option += '<option value="'+ globals.regionNames[i] + '">' + globals.regionNames[i] + '</option>';
          }
          $('#regionSelect').append(option);
          $('#regionMobileSelect').append(option);
        },
        dataType: "text",
        complete: function() {}
      });
    }

    // return summary information for the date in html format
    function getSummaryInfo() {
      var totalConfirmed = 0;
      var totalDeaths = 0;
      var totalRecovered = 0;
      var dailyConfirmed = 0;
      var dailyDeaths = 0;
      var dailyRecovered = 0;
      if(globals.regionSelected != 'All regions'){
        if(globals.filteredRegion.length > 0){
           totalConfirmed = parseInt(globals.filteredRegion[0][3]);
           totalDeaths = parseInt(globals.filteredRegion[0][4]);
           totalRecovered = parseInt(globals.filteredRegion[0][5]);
        } else{
           totalConfirmed = parseInt(0);
           totalDeaths = parseInt(0);
           totalRecovered = parseInt(0);
        }
      } else{
          totalConfirmed = parseInt(globals.csvDataStats[3][2]);
          totalDeaths = parseInt(globals.csvDataStats[4][2]);
          totalRecovered = parseInt(globals.csvDataStats[5][2]);
        }
        
      dailyConfirmed = parseInt(getNewCases('Confirmed'));
      dailyDeaths = parseInt(getNewCases('Deaths'));
      dailyRecovered = parseInt(getNewCases('Recovered'));
      var totalActive = totalConfirmed - totalDeaths - totalRecovered;
      var dailyActive = dailyConfirmed - dailyDeaths - dailyRecovered;
	    var usaActiveCount = globals.usaRowForSelectedDate[3] - globals.usaRowForSelectedDate[4] - globals.usaRowForSelectedDate[5];
    
      var totalActive1 = parseInt(globals.csvDataStats[3][2]) - parseInt(globals.csvDataStats[4][2]) - parseInt(globals.csvDataStats[5][2]);
      
      html = "<div class='d-flex' style='flex:1;justify-content: space-between;'>";
      html += "<div class='column w-100'>";
      if(globals.regionSelected == 'All regions'){
        html += "<div class='cardInfo dailyConfirmedCount p-1'>";
        html += "<span style='color:aqua;'>United States:</span> <span class='dailyActiveCount'> Active: " + usaActiveCount.toLocaleString() + "</span> ";
          html += "<span class='dailyConfirmedCount'> Conf: " + globals.usaRowForSelectedDate[3].toLocaleString() + "</span> ";
          html += "<span class='dailyDeathCount'> Deaths: " + globals.usaRowForSelectedDate[4].toLocaleString() + "</span> ";
          html += "<span class='dailyRecoveredCount'> Rec: " + globals.usaRowForSelectedDate[5].toLocaleString() + "</span></div>";
        html += "</div></div>";
      } else{
        html += "<div class='cardInfo dailyConfirmedCount p-1'>";
        html += "<span style='color:aqua;'>All regions: </span> <span class='dailyActiveCount'> Active: " + totalActive1.toLocaleString()+ "</span> ";
          html += "<span class='dailyConfirmedCount'> Conf: " + parseInt(globals.csvDataStats[3][2]).toLocaleString() + "</span> ";
          html += "<span class='dailyDeathCount'> Deaths: " + parseInt(globals.csvDataStats[4][2]).toLocaleString() + "</span> ";
          html += "<span class='dailyRecoveredCount'> Rec: " + parseInt(globals.csvDataStats[5][2]).toLocaleString() + "</span></div>";
        html += "</div></div>";
      }
      html += "<div class='mb-2 d-flex' style='flex:1;justify-content: space-between;'>";
	    html += "<div class='column'>";
      html += "<div class='cardInfo'>";
      html += "<div id='dailyActiveCount' class='dailyActiveCount d-flex justify-content-center'>" + "<span class='fa fa-arrow-circle-up uparrow'></span>" + dailyActive.toLocaleString() + "</div>";
      html += "<div class='activeCount d-flex justify-content-center'>" + totalActive.toLocaleString() + "</div>";
      html += "<div class='d-flex justify-content-center' style='background-color: rgb(255,140,0) !important;color: black;'>Active</div>";
	    html += "</div></div>";
      html += "<div class='column'>";
      html += "<div class='cardInfo'>";
      html += "<div id='dailyConfirmedCount' class='dailyConfirmedCount d-flex justify-content-center'>" + "<span class='fa fa-arrow-circle-up uparrow'></span>" + dailyConfirmed.toLocaleString() + "</div>";
      html += "<div class='confirmedCount d-flex justify-content-center'>" + totalConfirmed.toLocaleString() + "</div>";
      html += "<div class='d-flex justify-content-center' style='background-color: rgb(227, 74, 51) !important;color: black;'>Confirmed</div>";
      html += "</div></div>";
      html += "<div class='column'>";
      html += "<div class='cardInfo'>";
      html += "<div id='dailyDeathCount' class='dailyDeathCount d-flex justify-content-center'>" + "<span class='fa fa-arrow-circle-up uparrow'></span>" + dailyDeaths.toLocaleString() + "</div>";
      html += "<div class='deathsCount d-flex justify-content-center'>" + totalDeaths.toLocaleString() + "</div>";
      html += "<div class='d-flex justify-content-center' style='background-color:rgb(43, 140, 190) !important;color: black;'>Deaths</div>";
      html += "</div></div>";
      html += "<div class='column'>";
      html += "<div class='cardInfo'>";
      html += "<div id='dailyRecoveredCount' class='dailyRecoveredCount d-flex justify-content-center'>" + "<span class='fa fa-arrow-circle-up uparrow'></span>" + dailyRecovered.toLocaleString() + "</div>";
      html += "<div class='recoveredCount d-flex justify-content-center'>" + totalRecovered.toLocaleString() + "</div>";
      html += "<div class='d-flex justify-content-center' style='background-color: rgb(49, 163, 8) !important;color: black;'>Recovered</div>";
      html += "</div></div>";
      return html;
    }

    function getSummaryInfoOnMap() {
      var html = "<div class='summaryInfoHeader'><i>Cumulative number from <b><span class='numCountry'>" + globals.numberCountryForSelectedDate + "</span></b> countries. </i>";
	    html += "<i>Last Update : " + globals.csvDataStats[2][1].split('*')[0].trim() + " (UTC).</i>";
      html += "</div>";
      return html;
    }

    //for a given attribute, return (daily) new cases number
    //globals.dailySummary was set by the summary CSV files with below dateFormat
    //date,totalConfirmed,totalDeaths,totalRecovered,newConfirmed,newDeaths,newRecovered
    function getNewCases(attribute) {
      for (var i = 0; i < globals.dailySummary.length; i++) {
        if (globals.dailySummary[i][0] == globals.selectedDate) {
          switch (attribute) {
            case 'Confirmed':
              return globals.dailySummary[i][4];
            case 'Deaths':
              return globals.dailySummary[i][5];
            case 'Recovered':
              return globals.dailySummary[i][6];
            default:
              // code block
          } //end of switch
        } //end of if
      } //end of for
      return 0;
    }

    //////////////////////////////////////
    // Functions related to action button
    //////////////////////////////////////
    function activateTool() {
      console.log('activateTool');
      var tool = this.label.toUpperCase().replace(/ /g, "_");
      if (tool == "RESET") {
        globals.map.graphics.clear();
        globals.map.infoWindow.hide();
        globals.selectedRegions = [];
        dojo.byId("info").innerHTML = "";
        dojo.byId("infoGraph").innerHTML = "";
        dojo.byId("queryByName").value = "";
        globals.map.setExtent(globals.defaultExtents.default);
        var names = [];
        for (var i = 0; i < globals.csvData.length; i++) {
          names.push(globals.csvData[i][0]);
        }
        showCSVDataInTable(names);
      } else if (tool == "QUERY")
        queryByName();
      else { //set default zoom by name
        globals.map.infoWindow.hide();
        globals.map.setExtent(globals.defaultExtents[tool]);
      }
    }

  });

function bindChart() {
  $('.toggleView').on("click", function (event) {
    $('.toggleView').addClass('disabled');
    $(event.target).removeClass('disabled');
    if (event.target.value == 'data') {
      $('.mapContainer').hide();
      $('.graphContainer').hide();
      $('.dataContainer').show();
      if ($($.fn.dataTable.tables(true)))
        $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
    }
    else if (event.target.value == 'charts') {
      $('.mapContainer').hide();
      $('.graphContainer').show();
      // if(globals.regionSelected == 'All regions'){
      //   logarithamic_cumulative_data();
      //   $('.logarithmicDiv').css("visibility","visible");
      // }else{
      //   cumulative_data();
      // }
      cumulative_data();
      $('.logarithmicDiv').css("visibility","visible");
      $('.dataContainer').hide();
    }
    else {
      $('.dataContainer').hide();
      $('.mapContainer').show();
      $('.graphContainer').hide();
    }
  });

  $('.toggleGraphView').on("click", function (event) {
    $('.toggleGraphView').addClass('disabled');
    $(event.target).removeClass('disabled');
    if (event.target.value == 'dataView') {
      $('.graphContainer').hide();
      $('.dataContainer').show();
      if ($($.fn.dataTable.tables(true)))
        $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
    }
    else {
      $('.dataContainer').hide();
      $('.graphContainer').show();
      // if(globals.regionSelected == 'All regions'){
      //   logarithamic_cumulative_data();
      //   $('.logarithmicDiv').css("visibility","visible");
      // }else{
      //   cumulative_data();
      // }
      cumulative_data();
    }
  });
  
  $('#graphView').click();
  
  $('#chartToggle').on('change', function (e) {
    $('#chartdiv').html('');
    if (this.checked) {
      // if(globals.regionSelected == 'All regions'){
      //   logarithamic_cumulative_data();
      //   $('.logarithmicDiv').css("visibility","visible");
      // }else{
      //   cumulative_data();
      // }
      cumulative_data();
    } else {
      $('.logarithmicDiv').css("visibility","hidden");
      daily_data();
    }
  });
  $('#chartToggle').change();

  // $('#logScaleToggle').on('change', function(e) {
  //   $('#chartdiv').html('');
  //   globals.logScale = this.checked;
  //   $('#chartToggle').prop('checked', true);
  //   if(this.checked){
  //     logarithamic_cumulative_data();
  //   }else{
  //     cumulative_data();
  //   }
  // });
  // $('#logScaleToggle').change();
}

function toggleChart() {
  if ($('#chartToggle').is(':checked'))
    cumulative_data();
  else
    daily_data();
}

function filteredRegion(regionValue) {
  var filtered = [];
  for (var i = 0; i < globals.csvData.length; i++) {
    if(globals.csvData[i][1] == 'USA'){
      globals.csvData[i][1] = 'United States';
    }
    if (globals.csvData[i][1].startsWith(regionValue)) {
      filtered.push(globals.csvData[i]);
    }
  }
  globals.filteredRegion = filtered;
}

function resetToDefault(timeSlider, changeDate, startDateString, endDateString) {
  $('.logarithmicDiv').css("visibility","visible");
  globals.regionSummaryFile = "./data/nssac-ncov-sd-summary.csv";
  globals.chartDataFile = globals.globalChartDataSummary;
  $("#chartToggle").bootstrapToggle("on");
  timeSlider.setThumbIndexes([0]);
  timeSlider.pause();
  var defaultDate = new Date(timeSlider.timeStops[timeSlider.timeStops.length - 1].toString());
  var dateToSet = new Date(parseInt(defaultDate.getFullYear()), parseInt(defaultDate.getMonth()), parseInt(defaultDate.getDate()));
  $(".datepicker1").datepicker("setDate", dateToSet);
  $(".datepicker2").datepicker("setDate", dateToSet);
  var formattedDate = ("0" + parseInt(dateToSet.getMonth() + 1)).slice(-2) + "-" + ("0" + dateToSet.getDate()).slice(-2) + "-" + dateToSet.getFullYear();
  changeDate(formattedDate);
  $('#legend').show();
  if (/Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    document.getElementById("selectedDate").innerHTML = "";
    document.getElementById("daterange").innerHTML = "Time Slider from <strong><i> " + startDateString + "</strong> to <strong>" + endDateString + "</i></strong>";
  }else{
    document.getElementById("selectedDate").innerHTML = "Selected Date <strong><i> " + globals.endDateString + "</i></strong>";
    document.getElementById("daterange").innerHTML = "Time Slider from <strong><i> " + startDateString + "</strong> to <strong>" + endDateString + "</i></strong>";
  }
  $('#regionSelect').val('All regions');
  $('#regionMobileSelect').val('All regions');
  globals.regionSelected = 'All regions';
}

function resetMapToDefault(){
  globals.map.graphics.clear();
  globals.map.infoWindow.hide();
  globals.selectedRegions = [];
  dojo.byId("info").innerHTML = "";
  dojo.byId("infoGraph").innerHTML = "";
  dojo.byId("queryByName").value = "";
  globals.map.setExtent(globals.defaultExtents.default);
}
