/*
* This is the basic client that will attempt to get data out of LERC tiles.
* The data from each tile of the LERC data set is stored into an array under the
* correct layer during tile load, and each time the map is moved around, zoomed, etc.,
* the visible lerc tiles are drawn based on user given parameters like color and
* range.
*/


/* Stores all the pixel data for each layer */
var layer_array = new Array();
var translated_values = [];
//Change to localhost once applicable
var server_name = "localhost";
/*
* Given the name of the layer (will be the key) and the array of values of a
* tile, it will store it in the layer_array. How to access an element of layer_array:
* layer_array[layer_name]
* Each element of layer_array[layer_name] is a tile, which has the accessible properties
* coord and values, accessible by tile["coord"] and tile["values"]
*/

/* Stores the tile into the layer_array */
function storePixels(tile, layer_name){
    var layer_exists = false;
    for(key in layer_array){
        if(key == layer_name){
            layer_exists = true;
        }
    }
    /* If the layer does not exist yet, create it */
    if(!layer_exists){
        layer_array[layer_name] = [];
    }
    layer_array[layer_name].push(tile);
}
function webificationTranslator(layer_name){
    var xml = new XMLHttpRequest();
    var file_name = "data/" + layer_name + ".json";
    xml.overrideMimeType("application/json");
    xml.open("GET", file_name, true);
    // xml.open("GET", "http://airsl2.gesdisc.eosdis.nasa.gov/pomegranate/Aqua_AIRS_Level2/AIRS2RET.006/2002/244/AIRS.2002.09.01.140.L2.RetStd_IR.v6.0.7.0.G13207150837.hdf/TSurfAir%5B%5D?output=json", true);
    xml.responseType = "json";
    // xml.withCredentials = true;
    xml.send();
    var values = [];
    xml.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var data = xml.response.data;
            for(i = 0; i < 1350; i++){
                // console.log("Data at " + i + "[" + Math.floor(i/30) + "][" + i%30 + "] = " + data[Math.floor(i / 30)][i%30])
                values.push(data[Math.floor(i / 30)][i%30]);
            }
        }
    }
    translated = true;
    translated_values[layer_name] = values;
}
/*
* Intercept the tile and store the LERC data inside some arrays
*/
function tileLoader(image, src, layer_name) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    xhr.codec = LERC();
    var url = src;
    xhr.open("Get", url, true);
    xhr.send();
    var img = image.getImage();
    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var tile = [];
            img.decodedPixels = this.codec.decode(this.response, { returnMask: true });
            tile["coord"] = image.getTileCoord();
            if(layer_name == "webification"){
                webificationTranslator("TSurfAir");
                webificationTranslator("totH2OStd");
                webificationTranslator("CldFrcTot");
                webificationTranslator("CO_total_column");
                webificationTranslator("time");
            }
            storePixels(tile, layer_name);
            map.render();
        }
    }

    img.src = src;
}

/* Creates the map, setting the projection, max resolution, etc. */
var map = new ol.Map({
    view: new ol.View({
        maxResolution: 0.140625,
        maxZoom: 9,
        projection: ol.proj.get("EPSG:4326"),
        extent: [-180, -90, 180, 90],
        center: [0, 30],
        zoom: 1
    }),
    target: "map",
    renderer: ["canvas", "dom"]
});

/* This is the base map, which is displayed under the data layer */
var base_source = new ol.source.WMTS({
    url: "https://gibs-a.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?TIME=2023-10-22T00:00:00Z",
    layer: "BlueMarble_ShadedRelief",
    format: "image/jpeg",
    style: "default",
    crossOrigin: "Anonymous",
    minZoom: 1,
    matrixSet: "500m",
    wrapX: true,
    extent: [-36000, -90, 360000, 90],
    tileGrid: new ol.tilegrid.WMTS({
        origin: [-180, 90],
        resolutions: [
            0.5625,
            0.28125,
            0.140625,
            0.0703125,
            0.03515625,
            0.017578125,
            0.0087890625,
            0.00439453125,
            0.002197265625
        ],
        matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        tileSize: 512
    })
});

var webification_source = new ol.source.WMTS({
    url: "http://" + server_name + "/wmts-geo/wmts.cgi?",
    layer: "airs_test",
    style: "default",
    format: "image/lerc",
    matrixSet: "EPSG4326_500m",
    tilePixelRatio: 2,
    crossOrigin: "Anonymous",
    minZoom: 1,
    extent: [-36000, -90, 360000, 90],
    wrapX: true,
    tileGrid: new ol.tilegrid.WMTS({
        origin: [-180, 90],
        resolutions: [
            0.5625,
            0.28125,
            0.140625,
            0.0703125,
            0.03515625,
            0.017578125,
            0.0087890625,
            0.00439453125,
            0.002197265625
        ],
        matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        tileSize: 512,
        zIndex: 0,

    }),
    tileLoadFunction: function(image, src) {
        tileLoader(image, src, "webification");
    }
});

var air_source = new ol.source.WMTS({
    url: "http://" + server_name + "/wmts-geo/wmts.cgi?",
    layer: "airs_TSurfAir",
    style: "default",
    format: "image/lerc",
    matrixSet: "EPSG4326_500m",
    tilePixelRatio: 2,
    crossOrigin: "Anonymous",
    minZoom: 1,
    extent: [-36000, -90, 360000, 90],
    wrapX: true,
    tileGrid: new ol.tilegrid.WMTS({
        origin: [-180, 90],
        resolutions: [
            0.5625,
            0.28125,
            0.140625,
            0.0703125,
            0.03515625,
            0.017578125,
            0.0087890625,
            0.00439453125,
            0.002197265625
        ],
        matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        tileSize: 512,
        zIndex: 0,

    }),
    tileLoadFunction: function(image, src) {
        tileLoader(image, src, "TSurfAir");
    }
});

var CO_source = new ol.source.WMTS({
    url: "http://"+ server_name + "/wmts-geo/wmts.cgi?",
    layer: "airs_CO_total_column",
    style: "default",
    format: "image/lerc",
    matrixSet: "EPSG4326_500m",
    tilePixelRatio: 2,
    crossOrigin: "Anonymous",
    minZoom: 1,
    extent: [-36000, -90, 360000, 90],
    wrapX: true,
    tileGrid: new ol.tilegrid.WMTS({
        origin: [-180, 90],
        resolutions: [
            0.5625,
            0.28125,
            0.140625,
            0.0703125,
            0.03515625,
            0.017578125,
            0.0087890625,
            0.00439453125,
            0.002197265625
        ],
        matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        tileSize: 512,
        zIndex: 0,

    }),
    tileLoadFunction: function(image, src) {
        tileLoader(image, src, "CO_total_column");
    }
});

var H2O_source = new ol.source.WMTS({
    url: "http://" + server_name + "/wmts-geo/wmts.cgi?",
    layer: "airs_totH2OStd",
    style: "default",
    format: "image/lerc",
    matrixSet: "EPSG4326_500m",
    tilePixelRatio: 2,
    crossOrigin: "Anonymous",
    minZoom: 1,
    extent: [-36000, -90, 360000, 90],
    wrapX: true,
    tileGrid: new ol.tilegrid.WMTS({
        origin: [-180, 90],
        resolutions: [
            0.5625,
            0.28125,
            0.140625,
            0.0703125,
            0.03515625,
            0.017578125,
            0.0087890625,
            0.00439453125,
            0.002197265625
        ],
        matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        tileSize: 512,
        zIndex: 0,

    }),
    tileLoadFunction: function(image, src) {
        tileLoader(image, src, "totH2OStd");
    }
});

var cloud_source = new ol.source.WMTS({
    url: "http://" + server_name + "/wmts-geo/wmts.cgi?",
    layer: "airs_CldFrcTot",
    style: "default",
    format: "image/lerc",
    matrixSet: "EPSG4326_500m",
    tilePixelRatio: 2,
    crossOrigin: "Anonymous",
    minZoom: 1,
    extent: [-36000, -90, 360000, 90],
    wrapX: true,
    tileGrid: new ol.tilegrid.WMTS({
        origin: [-180, 90],
        resolutions: [
            0.5625,
            0.28125,
            0.140625,
            0.0703125,
            0.03515625,
            0.017578125,
            0.0087890625,
            0.00439453125,
            0.002197265625
        ],
        matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        tileSize: 512,
        zIndex: 0,

    }),
    tileLoadFunction: function(image, src) {
        tileLoader(image, src, "CldFrcTot");
    }
});

/* This is the layer containing all of the country boundaries/names/cities/etc. */
var world_bounds_source = new ol.source.TileArcGISRest({
    url: "http://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer",
    crossOrigin: "Anonymous"
});

/* This is the layer containing the vector min/max points as well as the drawn box */
var vector_source = new ol.source.Vector();

var base_layer = new ol.layer.Tile({
    source: base_source,
    extent: [-36000, -90, 360000, 90],
    retrieved: false
});

var world_bounds_layer = new ol.layer.Tile({
    source: world_bounds_source
});

// The webification layer
var webification_layer = new ol.layer.Tile({
    source: webification_source
})

var air_layer = new ol.layer.Tile({
    source: air_source
})

var CO_layer = new ol.layer.Tile({
    source: CO_source
})

var H2O_layer = new ol.layer.Tile({
    source: H2O_source
})

var cloud_layer = new ol.layer.Tile({
    source: cloud_source
})

var stroke = new ol.style.Stroke({
    color: 'blue'
});

var textStroke = new ol.style.Stroke({
    color: 'white',
    width: 2
});

var textColor = new ol.style.Fill({
    color: 'black'
});

/*
* This is a layer that highlights country bounds when hovering over them.
*/
var vector_layer = new ol.layer.Vector({
    source: vector_source,
    style: function(feature){
        return new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.5)'
            }),
            stroke: stroke,
            image: new ol.style.Circle({
                radius: feature.get('size'),
                fill: new ol.style.Fill({
                    color: '#ff0000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#000000',
                    width: 2
                })
            }),
            text: new ol.style.Text({
                font: '14px Calibri, sans-serif',
                text: feature.get('key'),
                stroke: textStroke,
                fill: textColor
            })
        })
    }
});

var style = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: '#000000',
        width: 1
    })
});

//Custom layer for each data set
map.addLayer(base_layer);
map.addLayer(webification_layer);
map.addLayer(air_layer);
map.addLayer(CO_layer);
map.addLayer(H2O_layer);
map.addLayer(cloud_layer);
map.addLayer(world_bounds_layer);
map.addLayer(vector_layer);


// Toggle whether or not the non-frontprint version is displayed
function toggleAir(){
    if(!document.getElementById("air-layer").checked){
        webification_layer.setVisible(false);
    }
    else{
        webification_layer.setVisible(true);
    }
}

function render(){
    map.render();
}

// Custom value sliders for each data set
var slider_air = new Slider('#slider-air', {
});

var slider_carbon = new Slider('#slider-carbon', {
});

var slider_vapor = new Slider('#slider-vapor', {
});

var slider_cloud = new Slider('#slider-cloud', {
});

var slider_transparency_air = new Slider('#slider-transparency-air', {
});

var slider_time = new Slider('#slider-time', {
});
/*
* This function changes the color under the slider on change of the dropdown.
*/
function changeSliderAirColor(){
    var scaleOption = document.getElementById("color-options-air").selectedIndex;
    var current_slider_string = "#slider-air-div";
    switch (scaleOption){
        case 0:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to left, white, black)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "white";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "black";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = " ";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = " ";
        }
        map.render();
        break;
        case 1:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to left, white, black)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "white";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "black";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 2:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0000BD, #0000FF, #0042FF, #0084FF, #00BDFF, #00FFFF, #42FFBD, #84FF84, #BDFF42, #FFFF00, #FFBD00, #FF8400, #FF4200, #FF0000, #BD0000, #840000)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#840000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0000BD";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 3:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0000BD, #0000FF, #0042FF, #0084FF, #00BDFF, #00FFFF, #42FFBD, #84FF84, #BDFF42, #FFFF00, #FFBD00, #FF8400, #FF4200, #FF0000, #BD0000, #840000)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#840000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0000BD";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 4:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #191BD0, #2954F8, #3E99F8, #68C2FA, #80DBFC, #97EFFD, #AAF6FE, #CEFFFF, #FEFE7E, #FFEB4D, #FFC440, #FF8F31, #FF461F, #FF0017, #DA0011, #A3000A)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#A3000A";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#191BD0";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 5:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #191BD0, #2954F8, #3E99F8, #68C2FA, #80DBFC, #97EFFD, #AAF6FE, #CEFFFF, #FEFE7E, #FFEB4D, #FFC440, #FF8F31, #FF461F, #FF0017, #DA0011, #A3000A)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#A3000A";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#191BD0";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 6:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #352A87, #3145BC, #0465E1, #0F77DB, #1388D3, #079CCF, #07AAC1, #20B4AD, #49BC94, #7ABF7C, #A5BE6B, #CABB5C, #ECB94C, #FEC634, #F6DD22, #F9FB0E)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#F9FB0E";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#352A87";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 7:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #352A87, #3145BC, #0465E1, #0F77DB, #1388D3, #079CCF, #07AAC1, #20B4AD, #49BC94, #7ABF7C, #A5BE6B, #CABB5C, #ECB94C, #FEC634, #F6DD22, #F9FB0E)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#F9FB0E";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#352A87";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 8:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0800F7, #1800E7, #2900D6, #3900C6, #4A00B5, #5A00A5, #6B0094, #7B0084, #8C0073, #9C0063, #AD0052, #BD0042, #CE0031, #DE0021, #EF0010, #FF0000)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FF0000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0800F7";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 9:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0800F7, #1800E7, #2900D6, #3900C6, #4A00B5, #5A00A5, #6B0094, #7B0084, #8C0073, #9C0063, #AD0052, #BD0042, #CE0031, #DE0021, #EF0010, #FF0000)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FF0000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0800F7";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 10:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #000000, #001C0E, #00332F, #07415B, #234787, #4E48A8, #8148B8, #B14DB5, #D65AA5, #EB718F, #EE8E80, #E6AF7F, #DBCE90, #D8E7B2, #DFF4D8, #FBFBFB)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FBFBFB";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 11:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #000000, #001C0E, #00332F, #07415B, #234787, #4E48A8, #8148B8, #B14DB5, #D65AA5, #EB718F, #EE8E80, #E6AF7F, #DBCE90, #D8E7B2, #DFF4D8, #FBFBFB)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FBFBFB";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;

    }
}

function changeSliderCarbonColor(){
    var scaleOption = document.getElementById("color-options-air").selectedIndex;
    var current_slider_string = "#slider-carbon-div";
    switch (scaleOption){
        case 0:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to left, white, black)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "white";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "black";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = " ";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = " ";
        }
        map.render();
        break;
        case 1:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to left, white, black)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "white";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "black";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 2:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0000BD, #0000FF, #0042FF, #0084FF, #00BDFF, #00FFFF, #42FFBD, #84FF84, #BDFF42, #FFFF00, #FFBD00, #FF8400, #FF4200, #FF0000, #BD0000, #840000)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#840000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0000BD";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 3:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0000BD, #0000FF, #0042FF, #0084FF, #00BDFF, #00FFFF, #42FFBD, #84FF84, #BDFF42, #FFFF00, #FFBD00, #FF8400, #FF4200, #FF0000, #BD0000, #840000)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#840000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0000BD";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 4:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #191BD0, #2954F8, #3E99F8, #68C2FA, #80DBFC, #97EFFD, #AAF6FE, #CEFFFF, #FEFE7E, #FFEB4D, #FFC440, #FF8F31, #FF461F, #FF0017, #DA0011, #A3000A)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#A3000A";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#191BD0";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 5:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #191BD0, #2954F8, #3E99F8, #68C2FA, #80DBFC, #97EFFD, #AAF6FE, #CEFFFF, #FEFE7E, #FFEB4D, #FFC440, #FF8F31, #FF461F, #FF0017, #DA0011, #A3000A)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#A3000A";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#191BD0";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 6:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #352A87, #3145BC, #0465E1, #0F77DB, #1388D3, #079CCF, #07AAC1, #20B4AD, #49BC94, #7ABF7C, #A5BE6B, #CABB5C, #ECB94C, #FEC634, #F6DD22, #F9FB0E)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#F9FB0E";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#352A87";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 7:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #352A87, #3145BC, #0465E1, #0F77DB, #1388D3, #079CCF, #07AAC1, #20B4AD, #49BC94, #7ABF7C, #A5BE6B, #CABB5C, #ECB94C, #FEC634, #F6DD22, #F9FB0E)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#F9FB0E";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#352A87";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 8:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0800F7, #1800E7, #2900D6, #3900C6, #4A00B5, #5A00A5, #6B0094, #7B0084, #8C0073, #9C0063, #AD0052, #BD0042, #CE0031, #DE0021, #EF0010, #FF0000)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FF0000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0800F7";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 9:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0800F7, #1800E7, #2900D6, #3900C6, #4A00B5, #5A00A5, #6B0094, #7B0084, #8C0073, #9C0063, #AD0052, #BD0042, #CE0031, #DE0021, #EF0010, #FF0000)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FF0000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0800F7";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 10:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #000000, #001C0E, #00332F, #07415B, #234787, #4E48A8, #8148B8, #B14DB5, #D65AA5, #EB718F, #EE8E80, #E6AF7F, #DBCE90, #D8E7B2, #DFF4D8, #FBFBFB)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FBFBFB";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 11:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #000000, #001C0E, #00332F, #07415B, #234787, #4E48A8, #8148B8, #B14DB5, #D65AA5, #EB718F, #EE8E80, #E6AF7F, #DBCE90, #D8E7B2, #DFF4D8, #FBFBFB)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FBFBFB";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;

    }
}

function changeSliderVaporColor(){
    var scaleOption = document.getElementById("color-options-air").selectedIndex;
    var current_slider_string = "#slider-vapor-div";
    switch (scaleOption){
        case 0:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to left, white, black)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "white";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "black";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = " ";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = " ";
        }
        map.render();
        break;
        case 1:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to left, white, black)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "white";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "black";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 2:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0000BD, #0000FF, #0042FF, #0084FF, #00BDFF, #00FFFF, #42FFBD, #84FF84, #BDFF42, #FFFF00, #FFBD00, #FF8400, #FF4200, #FF0000, #BD0000, #840000)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#840000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0000BD";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 3:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0000BD, #0000FF, #0042FF, #0084FF, #00BDFF, #00FFFF, #42FFBD, #84FF84, #BDFF42, #FFFF00, #FFBD00, #FF8400, #FF4200, #FF0000, #BD0000, #840000)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#840000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0000BD";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 4:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #191BD0, #2954F8, #3E99F8, #68C2FA, #80DBFC, #97EFFD, #AAF6FE, #CEFFFF, #FEFE7E, #FFEB4D, #FFC440, #FF8F31, #FF461F, #FF0017, #DA0011, #A3000A)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#A3000A";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#191BD0";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 5:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #191BD0, #2954F8, #3E99F8, #68C2FA, #80DBFC, #97EFFD, #AAF6FE, #CEFFFF, #FEFE7E, #FFEB4D, #FFC440, #FF8F31, #FF461F, #FF0017, #DA0011, #A3000A)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#A3000A";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#191BD0";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 6:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #352A87, #3145BC, #0465E1, #0F77DB, #1388D3, #079CCF, #07AAC1, #20B4AD, #49BC94, #7ABF7C, #A5BE6B, #CABB5C, #ECB94C, #FEC634, #F6DD22, #F9FB0E)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#F9FB0E";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#352A87";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 7:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #352A87, #3145BC, #0465E1, #0F77DB, #1388D3, #079CCF, #07AAC1, #20B4AD, #49BC94, #7ABF7C, #A5BE6B, #CABB5C, #ECB94C, #FEC634, #F6DD22, #F9FB0E)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#F9FB0E";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#352A87";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 8:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0800F7, #1800E7, #2900D6, #3900C6, #4A00B5, #5A00A5, #6B0094, #7B0084, #8C0073, #9C0063, #AD0052, #BD0042, #CE0031, #DE0021, #EF0010, #FF0000)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FF0000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0800F7";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 9:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0800F7, #1800E7, #2900D6, #3900C6, #4A00B5, #5A00A5, #6B0094, #7B0084, #8C0073, #9C0063, #AD0052, #BD0042, #CE0031, #DE0021, #EF0010, #FF0000)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FF0000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0800F7";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 10:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #000000, #001C0E, #00332F, #07415B, #234787, #4E48A8, #8148B8, #B14DB5, #D65AA5, #EB718F, #EE8E80, #E6AF7F, #DBCE90, #D8E7B2, #DFF4D8, #FBFBFB)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FBFBFB";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 11:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #000000, #001C0E, #00332F, #07415B, #234787, #4E48A8, #8148B8, #B14DB5, #D65AA5, #EB718F, #EE8E80, #E6AF7F, #DBCE90, #D8E7B2, #DFF4D8, #FBFBFB)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FBFBFB";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;

    }
}

function changeSliderCloudColor(){
    var scaleOption = document.getElementById("color-options-air").selectedIndex;
    var current_slider_string = "#slider-cloud-div";
    switch (scaleOption){
        case 0:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to left, white, black)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "white";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "black";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = " ";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = " ";
        }
        map.render();
        break;
        case 1:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to left, white, black)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "white";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "black";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 2:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0000BD, #0000FF, #0042FF, #0084FF, #00BDFF, #00FFFF, #42FFBD, #84FF84, #BDFF42, #FFFF00, #FFBD00, #FF8400, #FF4200, #FF0000, #BD0000, #840000)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#840000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0000BD";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 3:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0000BD, #0000FF, #0042FF, #0084FF, #00BDFF, #00FFFF, #42FFBD, #84FF84, #BDFF42, #FFFF00, #FFBD00, #FF8400, #FF4200, #FF0000, #BD0000, #840000)";
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#840000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0000BD";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 4:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #191BD0, #2954F8, #3E99F8, #68C2FA, #80DBFC, #97EFFD, #AAF6FE, #CEFFFF, #FEFE7E, #FFEB4D, #FFC440, #FF8F31, #FF461F, #FF0017, #DA0011, #A3000A)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#A3000A";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#191BD0";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 5:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #191BD0, #2954F8, #3E99F8, #68C2FA, #80DBFC, #97EFFD, #AAF6FE, #CEFFFF, #FEFE7E, #FFEB4D, #FFC440, #FF8F31, #FF461F, #FF0017, #DA0011, #A3000A)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#A3000A";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#191BD0";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 6:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #352A87, #3145BC, #0465E1, #0F77DB, #1388D3, #079CCF, #07AAC1, #20B4AD, #49BC94, #7ABF7C, #A5BE6B, #CABB5C, #ECB94C, #FEC634, #F6DD22, #F9FB0E)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#F9FB0E";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#352A87";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 7:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #352A87, #3145BC, #0465E1, #0F77DB, #1388D3, #079CCF, #07AAC1, #20B4AD, #49BC94, #7ABF7C, #A5BE6B, #CABB5C, #ECB94C, #FEC634, #F6DD22, #F9FB0E)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#F9FB0E";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#352A87";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 8:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0800F7, #1800E7, #2900D6, #3900C6, #4A00B5, #5A00A5, #6B0094, #7B0084, #8C0073, #9C0063, #AD0052, #BD0042, #CE0031, #DE0021, #EF0010, #FF0000)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FF0000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0800F7";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 9:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #0800F7, #1800E7, #2900D6, #3900C6, #4A00B5, #5A00A5, #6B0094, #7B0084, #8C0073, #9C0063, #AD0052, #BD0042, #CE0031, #DE0021, #EF0010, #FF0000)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FF0000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#0800F7";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 10:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #000000, #001C0E, #00332F, #07415B, #234787, #4E48A8, #8148B8, #B14DB5, #D65AA5, #EB718F, #EE8E80, #E6AF7F, #DBCE90, #D8E7B2, #DFF4D8, #FBFBFB)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FBFBFB";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;
        case 11:
        document.querySelector(current_slider_string + " " + "div.slider-selection").style.backgroundImage = "linear-gradient(to right, #000000, #001C0E, #00332F, #07415B, #234787, #4E48A8, #8148B8, #B14DB5, #D65AA5, #EB718F, #EE8E80, #E6AF7F, #DBCE90, #D8E7B2, #DFF4D8, #FBFBFB)"
        if(!document.getElementById("filter-values-air").checked){
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "#FBFBFB";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "#000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.border = "thin solid #000000";
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.border = "thin solid #000000";
        }
        else{
            document.querySelector(current_slider_string + " " + "div.slider-track-high").style.background = "";
            document.querySelector(current_slider_string + " " + "div.slider-track-low").style.background = "";
        }
        map.render();
        break;

    }
}

/* Given an array, stores all tiles within the extent of the foreachtileinextent loop within the array */
function findTilesInExtent(tile_coord, layer_name, tile_array){
    var tiles = layer_array[layer_name];
    for(i = 0; i < tiles.length; i++){
        var coord = tiles[i]["coord"];
        if(coord[0] == tile_coord[0] && coord[1] == tile_coord[1] && coord[2] == tile_coord[2]){
            tile_array.push(tiles[i]);
            break;
        }
    }
}

/* Finds the top left pixel that specifies where a tile should be drawn from */
function findDrawTilePixel(tilegrid, tile_coord){
    var extent = tilegrid.getTileCoordExtent(tile_coord);
    var coord = [extent[0], extent[3]];
    var pixel = map.getPixelFromCoordinate(coord);
    return pixel;
}

var changed = false;

function getImgData(mapLayer, tileCoord){
  var imgData = mapLayer.getSource().a.get(tileCoord.join('/')).g;
  return imgData.decodedPixels.pixelData;
}

function getImgDataClick(mapLayer, tileCoord){
  var imgData = mapLayer.getSource().a.get(tileCoord.join('/')).g;
  console.log(tileCoord)
  console.log(imgData.decodedPixels);
  return imgData.decodedPixels.pixelData;
}

function getNoDataValue(mapLayer, tileCoord){
  var noDataValue = mapLayer.getSource().a.get(tileCoord.join('/')).g;
  return noDataValue.decodedPixels.noDataValue;
}

// Draws webification tiles using min, max, and time as a filter. Main difference
// between this and other tile draws is that its get value refers back to the json
// that stored those values.
function drawWebificationTiles(data_name, canvas, tiles, tilegrid, size, color_scale, min, max, opacity, filter, timeMin, timeMax){
    var context = canvas.getContext('2d');
    for(i = 0; i < tiles.length; i++){
        var tile = tiles[i];
        var tile_coord = tile["coord"];
        var pixel = findDrawTilePixel(tilegrid, tile_coord);
        pixel = [Math.round(pixel[0]), Math.round(pixel[1])];
        var image = context.createImageData(size, size);
        var values = getImgData(webification_layer, tile_coord);
        var no_data_value = getNoDataValue(webification_layer, tile_coord);
        var change = false;
        for(j = 0; j < values.length; j++){
            var index = values[j];
            var value = getValue(data_name, values[j], no_data_value);
            if(!filter){
                if(value != null){
                    if(value < min && index >= timeMin && index <= timeMax){
                        value = min;
                    }
                    if(value > max){
                        value = max;
                    }
                    var colors = color(color_scale, value, min, max);
                    /* Opacity doesn't seem to work, so artificial opacity (visually translucency) is used */
                    image.data[j * 4] = colors[0];
                    image.data[j * 4 + 1] = colors[1];
                    image.data[j * 4 + 2] = colors[2];
                    image.data[j * 4 + 3] = opacity;
                }
                else{
                  image.data[j * 4] = 0;
                  image.data[j * 4 + 1] = 0;
                  image.data[j * 4 + 2] = 0;
                  image.data[j * 4 + 3] = 0;
                }
            }
            else{
                if(value != null && value > min && value < max && index >= timeMin && index <= timeMax){
                    var colors = color(color_scale, value, min, max);
                    image.data[j * 4] = colors[0];
                    image.data[j * 4 + 1] = colors[1];
                    image.data[j * 4 + 2] = colors[2];
                    image.data[j * 4 + 3] = opacity;
                }
                else{
                  image.data[j * 4] = 0;
                  image.data[j * 4 + 1] = 0;
                  image.data[j * 4 + 2] = 0;
                  image.data[j * 4 + 3] = 0;
                }
            }

        }
        if(change){
            changed = true;
        }
        var new_canvas = document.createElement("canvas");
        new_canvas.width = size * devicePixelRatio;
        new_canvas.height = size * devicePixelRatio;

        var new_canvas_2 = document.createElement("canvas");
        new_canvas_2.width = size;
        new_canvas_2.height = size;
        new_canvas_2.getContext('2d').putImageData(image, 0, 0);

        new_canvas.getContext('2d').scale(devicePixelRatio, devicePixelRatio);
        new_canvas.getContext('2d').drawImage(new_canvas_2, 0, 0);

        context.drawImage(new_canvas, pixel[0] * devicePixelRatio, pixel[1] * devicePixelRatio);
    }
}

/*
* Draws a tile at the starting pixel with the given size, opacity, and
* using the color_scale and min, max specified.
*/
function drawTiles(layer, canvas, tiles, tilegrid, size, color_scale, min, max, opacity, filter){
    var context = canvas.getContext('2d');
    for(i = 0; i < tiles.length; i++){
        var tile = tiles[i];
        var tile_coord = tile["coord"];
        var pixel = findDrawTilePixel(tilegrid, tile_coord);
        pixel = [Math.round(pixel[0]), Math.round(pixel[1])];
        var image = context.createImageData(size, size);
        var values = getImgData(layer, tile_coord);
        var no_data_value = getNoDataValue(layer, tile_coord);
        if(!filter){
            for(j = 0; j < values.length; j++){
                var value = values[j];
                if(value != no_data_value){
                    if(value < min){
                        value = min;
                    }
                    if(value > max){
                        value = max;
                    }
                    var colors = color(color_scale, value, min, max);
                    /* Opacity doesn't seem to work, so artificial opacity (visually translucency) is used */
                    image.data[j * 4] = colors[0];
                    image.data[j * 4 + 1] = colors[1];
                    image.data[j * 4 + 2] = colors[2];
                    image.data[j * 4 + 3] = opacity;
                }
                else{
                  image.data[j * 4] = 0;
                  image.data[j * 4 + 1] = 0;
                  image.data[j * 4 + 2] = 0;
                  image.data[j * 4 + 3] = 0;
                }
            }
        }
        else{
            for(j = 0; j < values.length; j++){
                var value = values[j];
                if(value != no_data_value && value > min && value < max){
                    var colors = color(color_scale, value, min, max);
                    image.data[j * 4] = colors[0];
                    image.data[j * 4 + 1] = colors[1];
                    image.data[j * 4 + 2] = colors[2];
                    image.data[j * 4 + 3] = opacity;
                }
                else{
                  image.data[j * 4] = 0;
                  image.data[j * 4 + 1] = 0;
                  image.data[j * 4 + 2] = 0;
                  image.data[j * 4 + 3] = 0;
                }
            }
        }
        var new_canvas = document.createElement("canvas");
        new_canvas.width = size * devicePixelRatio;
        new_canvas.height = size * devicePixelRatio;

        var new_canvas_2 = document.createElement("canvas");
        new_canvas_2.width = size;
        new_canvas_2.height = size;
        new_canvas_2.getContext('2d').putImageData(image, 0, 0);

        new_canvas.getContext('2d').scale(devicePixelRatio, devicePixelRatio);
        new_canvas.getContext('2d').drawImage(new_canvas_2, 0, 0);

        context.drawImage(new_canvas, pixel[0] * devicePixelRatio, pixel[1] * devicePixelRatio);
    }
}

/*
 * Each of the following layers calculates what tiles are currently visible and then
 * changes the tiles that are currently shown to look like what they are supposed to be.
 */
webification_layer.on('postcompose', function(evt){
    getSlider();
    if(layer_array["webification"] != null && !document.getElementById("web-checkbox").checked){
        var view = map.getView();
        var current_extent = view.calculateExtent(map.getSize());
        var tilegrid = webification_layer.getSource().getTileGrid();
        var zoom = tilegrid.getZForResolution(view.getResolution(), 0);
        var size = tilegrid.getTileSize(zoom);
        var visible_tiles = [];
        tilegrid.forEachTileCoord(current_extent, zoom, function(tile_coord){
            findTilesInExtent(tile_coord, "webification", visible_tiles);
        })
        if(visible_tiles.length != 0){
            var canvas = evt.context.canvas;
            var ctx = canvas.getContext('2d');
            var color_scale = document.getElementById("color-options-air")[document.getElementById("color-options-air").selectedIndex].innerHTML;
            var range = getSlider().getValue();
            var filter = document.getElementById("filter-values-air").checked;
            var opacity = 255 * slider_transparency_air.getValue()/100;
            var data_name = getRadioVal();
            drawWebificationTiles(data_name, canvas, visible_tiles, tilegrid,
                                  size, color_scale, range[0], range[1],
                                  opacity, filter,
                                  slider_time.getValue()[0],
                                  slider_time.getValue()[1]);
        }
    }
})

air_layer.on('postcompose', function(evt){
    getSlider();
    changeSliderAirColor();
    if(layer_array["TSurfAir"] != null && document.getElementById("web-checkbox").checked && getRadioVal() == "TSurfAir"){
        var view = map.getView();
        var current_extent = view.calculateExtent(map.getSize());
        var tilegrid = air_layer.getSource().getTileGrid();
        var zoom = tilegrid.getZForResolution(view.getResolution(), 0);
        var size = tilegrid.getTileSize(zoom);
        var visible_tiles = [];
        tilegrid.forEachTileCoord(current_extent, zoom, function(tile_coord){
            findTilesInExtent(tile_coord, "TSurfAir", visible_tiles);
        })
        if(visible_tiles.length != 0){
            var canvas = evt.context.canvas;
            var ctx = canvas.getContext('2d');
            var color_scale = document.getElementById("color-options-air")[document.getElementById("color-options-air").selectedIndex].innerHTML;
            var range = slider_air.getValue();
            var filter = document.getElementById("filter-values-air").checked;
            var opacity = 255 * slider_transparency_air.getValue()/100;
            drawTiles(air_layer, canvas, visible_tiles, tilegrid, size, color_scale, range[0], range[1], opacity, filter);
        }
    }
})

CO_layer.on('postcompose', function(evt){
    changeSliderCarbonColor();
    if(layer_array["CO_total_column"] != null && document.getElementById("web-checkbox").checked && getRadioVal() == "CO_total_column"){
        var view = map.getView();
        var current_extent = view.calculateExtent(map.getSize());
        var tilegrid = CO_layer.getSource().getTileGrid();
        var zoom = tilegrid.getZForResolution(view.getResolution(), 0);
        var size = tilegrid.getTileSize(zoom);
        var visible_tiles = [];
        tilegrid.forEachTileCoord(current_extent, zoom, function(tile_coord){
            findTilesInExtent(tile_coord, "CO_total_column", visible_tiles);
        })
        if(visible_tiles.length != 0){
            var canvas = evt.context.canvas;
            var ctx = canvas.getContext('2d');
            var color_scale = document.getElementById("color-options-air")[document.getElementById("color-options-air").selectedIndex].innerHTML;
            var range = slider_carbon.getValue();
            var filter = document.getElementById("filter-values-air").checked;
            var opacity = 255 * slider_transparency_air.getValue()/100;
            drawTiles(CO_layer, canvas, visible_tiles, tilegrid, size, color_scale, range[0], range[1], opacity, filter);
        }
    }
})

H2O_layer.on('postcompose', function(evt){
    changeSliderVaporColor();
    if(layer_array["totH2OStd"] != null && document.getElementById("web-checkbox").checked && getRadioVal() == "totH2OStd"){
        var view = map.getView();
        var current_extent = view.calculateExtent(map.getSize());
        var tilegrid = H2O_layer.getSource().getTileGrid();
        var zoom = tilegrid.getZForResolution(view.getResolution(), 0);
        var size = tilegrid.getTileSize(zoom);
        var visible_tiles = [];
        tilegrid.forEachTileCoord(current_extent, zoom, function(tile_coord){
            findTilesInExtent(tile_coord, "totH2OStd", visible_tiles);
        })
        if(visible_tiles.length != 0){
            var canvas = evt.context.canvas;
            var ctx = canvas.getContext('2d');
            var color_scale = document.getElementById("color-options-air")[document.getElementById("color-options-air").selectedIndex].innerHTML;
            var range = slider_vapor.getValue();
            var filter = document.getElementById("filter-values-air").checked;
            var opacity = 255 * slider_transparency_air.getValue()/100;
            drawTiles(H2O_layer, canvas, visible_tiles, tilegrid, size, color_scale, range[0], range[1], opacity, filter);
        }
    }
})

cloud_layer.on('postcompose', function(evt){
    changeSliderCloudColor();
    if(layer_array["CldFrcTot"] != null && document.getElementById("web-checkbox").checked && getRadioVal() == "CldFrcTot"){
        var view = map.getView();
        var current_extent = view.calculateExtent(map.getSize());
        var tilegrid = cloud_layer.getSource().getTileGrid();
        var zoom = tilegrid.getZForResolution(view.getResolution(), 0);
        var size = tilegrid.getTileSize(zoom);
        var visible_tiles = [];
        tilegrid.forEachTileCoord(current_extent, zoom, function(tile_coord){
            findTilesInExtent(tile_coord, "CldFrcTot", visible_tiles);
        })
        if(visible_tiles.length != 0){
            var canvas = evt.context.canvas;
            var ctx = canvas.getContext('2d');
            var color_scale = document.getElementById("color-options-air")[document.getElementById("color-options-air").selectedIndex].innerHTML;
            var range = slider_cloud.getValue();
            var filter = document.getElementById("filter-values-air").checked;
            var opacity = 255 * slider_transparency_air.getValue()/100;
            drawTiles(cloud_layer, canvas, visible_tiles, tilegrid, size, color_scale, range[0], range[1], opacity, filter);
        }
    }
})

function getSlider(){
    var data = getRadioVal();
    changeSliderAirColor();
    changeSliderCarbonColor();
    changeSliderVaporColor();
    changeSliderCloudColor();
    switch(data){
        case "TSurfAir":
            document.getElementById("slider-air-div").style.display = "block";
            document.getElementById("slider-carbon-div").style.display = "none";
            document.getElementById("slider-vapor-div").style.display = "none";
            document.getElementById("slider-cloud-div").style.display = "none";
            return slider_air;
            break;
        case "CO_total_column":
            document.getElementById("slider-air-div").style.display = "none";
            document.getElementById("slider-carbon-div").style.display = "block";
            document.getElementById("slider-vapor-div").style.display = "none";
            document.getElementById("slider-cloud-div").style.display = "none";
            return slider_carbon;
            break;
        case "totH2OStd":
            document.getElementById("slider-air-div").style.display = "none";
            document.getElementById("slider-carbon-div").style.display = "none";
            document.getElementById("slider-vapor-div").style.display = "block";
            document.getElementById("slider-cloud-div").style.display = "none";
            return slider_vapor;
            break;
        case "CldFrcTot":
            document.getElementById("slider-air-div").style.display = "none";
            document.getElementById("slider-carbon-div").style.display = "none";
            document.getElementById("slider-vapor-div").style.display = "none";
            document.getElementById("slider-cloud-div").style.display = "block";
            return slider_cloud;
            break;
    }
}

function getRadioVal() {
    var form = document.getElementById("data-picker");
    var name = "layer";
    var val;
    // get list of radio buttons with specified name
    var radios = form.elements[name];

    // loop through list of radio buttons
    for (var i=0, len=radios.length; i<len; i++) {
        if ( radios[i].checked ) { // radio checked?
            val = radios[i].value; // if so, hold its value in val
            break; // and break out of for loop
        }
    }
    return val; // return value of checked radio or undefined if none checked
}

var color = function(color, value, min, max){
    switch(color){
        case "Grayscale/Scalar":
        return getGreyScalar(value, min, max);
        break;
        case "Grayscale/Logarithmic":
        return getGreyLog(value, min, max);
        break;
        case "Jet/Scalar":
        return getJetScalar(value, min, max);
        break;
        case "Jet/Logarithmic":
        return getJetLog(value, min, max);
        break;
        case "Panoply-diff/Scalar":
        return getPanoplyScalar(value, min, max);
        break;
        case "Panoply-diff/Logarithmic":
        return getPanoplyLog(value, min, max);
        break;
        case "Parula/Scalar":
        return getParulaScalar(value, min, max);
        break;
        case "Parula/Logarithmic":
        return getParulaLog(value, min, max);
        break;
        case "Red-Blue/Scalar":
        return getRedBlueScalar(value, min, max);
        break;
        case "Red-Blue/Logarithmic":
        return getRedBlueLog(value, min, max);
        break;
        case "Cube-Helix/Scalar":
        return getCubeHelixScalar(value, min, max);
        break;
        case "Cube-Helix/Logarithmic":
        return getCubeHelixLog(value, min, max);
        break;
        case "Diverging":
        return getDiverging(value, min, max);
        break;
    }
}

function getValue(layer_name, value, no_data_value){
    var values = translated_values[layer_name];
    if(value != no_data_value){
        if(value >= 0 && value <= values.length){
            return values[value];
        }
    }
    else{
        return null;
    }
}

/* Finds the value where the mouse currently is */
function findValue(layer, layer_name, webified){
    var pixel = [mousePosition[0], mousePosition[1]];
    var coord = map.getCoordinateFromPixel(pixel);
    var tilegrid = layer.getSource().getTileGrid();
    var tileCoord = tilegrid.getTileCoordForCoordAndResolution(coord, map.getView().getResolution());
    var tile_extent = tilegrid.getTileCoordExtent(tileCoord);
    var tilePixel = map.getPixelFromCoordinate([tile_extent[0], tile_extent[3]]);
    var row = pixel[0] - tilePixel[0];
    var column = pixel[1] - Math.round(tilePixel[1]);
    var zoom = tilegrid.getZForResolution(map.getView().getResolution());
    var i = Math.round(column * tilegrid.getTileSize(zoom) + row);
    if(webified){
        var value = getValue(layer_name, getImgDataClick(webification_layer, tileCoord)[i], getNoDataValue(webification_layer, tileCoord));
    }
    else{
        var value = getImgData(layer, tileCoord)[i];
        if(value == getNoDataValue(layer, tileCoord)){
            value = null;
        }
    }
    if(value == null){
        value = "N/A";
    }

    return value;
}

var dragBox = new ol.interaction.DragBox({
    condition: ol.events.condition.platformModifierKeyOnly,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: [255, 255, 0, 1]
        })
    })
});

map.addInteraction(dragBox);

/* Finds the intersection of two extents and returns the extent of that intersection rectangle */
function findIntersection(box_extent, tile_extent){
    var x1 = Math.max(box_extent[0], tile_extent[0]);
    var y1 = Math.max(box_extent[1], tile_extent[1]);
    var x2 = Math.min(box_extent[2], tile_extent[2]);
    var y2 = Math.min(box_extent[3], tile_extent[3]);

    return [x1, y1, x2, y2];
}

var current_layer;
var csv_data = [];
/* Finds the aggregate statistics within the box */
function calculateBox(tilegrid, tile_size, tile_array, box_extent){
    var layer_name;
    var layer;
    // Start by figuring out which layer was selected
    switch(document.getElementById("layer-picker").selectedIndex){
        case 0:
            layer_name = "TSurfAir";
            break;
        case 1:
            layer_name = "CO_total_column";
            break;
        case 2:
            layer_name = "totH2OStd";
            break;
        case 3:
            layer_name = "CldFrcTot";
            break;
    }
    current_layer = document.getElementById("layer-picker").selectedIndex;
    csv_data.length = 0;
    var min = Number.MAX_VALUE;
    var min_coord = [];
    var max = Number.MAX_VALUE * -1;
    var max_coord = [];
    var total = 0;
    var num_values = 0;
    /* Does all the math for each of the tiles to find values within all the intersection rectangles */
    for(i = 0; i < tile_array.length; i++){
        var tile_extent = tilegrid.getTileCoordExtent(tile_array[i]["coord"]);
        var intersection_extent = findIntersection(tile_extent, box_extent);
        var intersection_top_corner = map.getPixelFromCoordinate([intersection_extent[0], intersection_extent[3]]);
        var intersection_bottom_corner = map.getPixelFromCoordinate([intersection_extent[2], intersection_extent[1]]);
        var tile_top_corner = map.getPixelFromCoordinate([tile_extent[0], tile_extent[3]]);
        var tile_bottom_corner = map.getPixelFromCoordinate([tile_extent[2], tile_extent[1]]);
        var height = Math.abs(Math.round(intersection_top_corner[1] - intersection_bottom_corner[1]));
        var width = Math.abs(Math.round(intersection_top_corner[0] - intersection_bottom_corner[0]));
        var starting_x = Math.round(intersection_top_corner[0] - tile_top_corner[0]);
        var starting_y = Math.round(intersection_top_corner[1] - tile_top_corner[1]);

        /* The pixel within the current box to start iterating from */
        var tile = getImgData(webification_layer, tile_array[i]["coord"]);
        var current_tile_pixel = starting_y * tile_size + starting_x;
        for(j = 0; j < height; j++){
            for(k = 0; k < width; k++){
                var value = getValue(layer_name, tile[current_tile_pixel], tile_array[i]["no_data_value"]);
                if(value != null){
                    var x = tile_top_corner[0] + current_tile_pixel % tile_size;
                    var y = tile_top_corner[1] + current_tile_pixel/Math.round(tile_size);
                    var pixel = [x, y];
                    if(current_layer != 3){
                        chart_data.push(Math.round(value));
                    }
                    else{
                        chart_data.push(Math.round(value * 100));
                    }
                    csv_data.push([value, map.getCoordinateFromPixel(pixel)[0], map.getCoordinateFromPixel(pixel)[1]]);
                    total += value;
                    num_values++;
                    if(value < min){
                        min = value;
                        /* Calculate the coordinate of the min point using the where the tile's starting point is and the conversion function */
                        min_coord = map.getCoordinateFromPixel(pixel);
                    }
                    if(value > max){
                        max = value;
                        max_coord = map.getCoordinateFromPixel(pixel);
                    }
                }
                current_tile_pixel++;
            }
            current_tile_pixel = current_tile_pixel - width + tile_size;
        }
    }

    average = total/num_values;

    var min_pix = new ol.Feature({
        geometry: new ol.geom.Point(min_coord),
        size: '5'
    });

    var min_pix_text = new ol.Feature({
        geometry: new ol.geom.Point([min_coord[0], min_coord[1] + .1]),
        size: '0',
        key: 'Minimum'
    });

    vector_source.addFeature(min_pix);
    vector_source.addFeature(min_pix_text);

    var max_pix = new ol.Feature({
        geometry: new ol.geom.Point(max_coord),
        size: 5
    });

    var max_pix_text = new ol.Feature({
        geometry: new ol.geom.Point([max_coord[0], max_coord[1] + .1]),
        size: 0,
        key: "Maximum"
    });

    vector_source.addFeature(max_pix);
    vector_source.addFeature(max_pix_text);

    document.getElementById("min-val").innerHTML = "<b>Min:</b> " + min;
    document.getElementById("min-coord").innerHTML = "<b>Min Coordinates: </b>(" + min_coord[0].toFixed(2) + ", " + min_coord[1].toFixed(2) + ")";
    document.getElementById("max-val").innerHTML = "<b>Max:</b> " + max;
    document.getElementById("max-coord").innerHTML = "<b>Max Coordinates: </b>(" + max_coord[0].toFixed(2) + ", " + max_coord[1].toFixed(2) + ")";
    document.getElementById("average-val").innerHTML = "<b>Average: </b>" + average;
}

var chart_data = [];
var dataX = [];
var dataY = [];
var data_exists = false;

// Draws a box and stores and finds all necessary data
dragBox.on('boxend', function(){
    vector_source.clear();
    chart_data.length = 0;
    data_exists = true;
    var geometry = dragBox.getGeometry();
    var feature = new ol.Feature({geometry: geometry});
    var view = map.getView();
    var layer = webification_layer;
    vector_source.addFeature(feature);
    var tilegrid = layer.getSource().getTileGrid();
    var zoom = tilegrid.getZForResolution(view.getResolution(), 0);
    var extent = geometry.getExtent();
    var box_tiles = [];
    tilegrid.forEachTileCoord(extent, zoom, function(tile_coord){
        findTilesInExtent(tile_coord, "webification", box_tiles);
    });

    calculateBox(tilegrid, tilegrid.getTileSize(zoom), box_tiles, extent);

    /* Store the data so a chart can be drawn if wished */
    [dataX, dataY] = sortData(chart_data);
})

// Sorts data into values and their number of occurences
function sortData(values){
    var unique_values = [], value_counts = [], prev;

    values.sort(function(a, b){return a - b});
    for ( var i = 0; i < values.length; i++ ) {
        if (values[i] !== prev) {
            unique_values.push(values[i]);
            value_counts.push(1);
        } else {
            value_counts[value_counts.length-1]++;
        }
        prev = values[i];
    }

    return [unique_values, value_counts];
}

// Creates a chart in a separate window
function createChart(){
    if(data_exists){
        switch(current_layer){
            case 0:
                localStorage.setItem("Title", "Air Temperature");
                localStorage.setItem("xAxis", "Temperature");
                localStorage.setItem("units", "K");
                break;
            case 1:
                localStorage.setItem("Title", "Total Column Carbon Monoxide");
                localStorage.setItem("xAxis", "Amount of Carbon Dioxide");
                localStorage.setItem("units", "molecules/cm^2");
                break;
            case 2:
                localStorage.setItem("Title", "Total Precipitable Water Vapor");
                localStorage.setItem("xAxis", "Amount of Precipitable Water Vapor");
                localStorage.setItem("units", "kb/m^2");
                break;
            case 3:
                localStorage.setItem("Title", "Total Cloud Fraction");
                localStorage.setItem("xAxis", "Cloud Fraction");
                localStorage.setItem("units", "/100");
                break;

        }

        localStorage.setItem("xValues", dataX);
        localStorage.setItem("yValues", dataY)
        window.open("chart.html");
    }
    else{
        document.getElementById("chartContainer").innerHTML = "<b>Error- No area selected</b>";
    }
}

// Creates a downloadable CSV file
function createCSV(){
    var csvContent = "data:text/csv;charset=utf-8,";
    var lineArray = [];
    var lineArray = [];
    csv_data.forEach(function (infoArray, index) {
        var line = infoArray.join(",");
        lineArray.push(index == 0 ? "Value,Longitude,Latitude\n" + line : line);
    });
    var csvContent = lineArray.join("\n");

    var csvContent = lineArray.join("\n");

    window.URL = window.webkitURL || window.URL;

    var contentType = 'text/csv';

    var csvFile = new Blob([csvContent], {type: contentType});

    var a = document.createElement('a');
    switch(current_layer){
        case 0:
            a.download = "TSurfAir.csv";
            break;
        case 1:
            a.download = "CO_total_column.csv";
            break;
        case 2:
            a.download = "totH2OStd.csv";
            break;
        case 3:
            a.download = "CldFrcTot.csv";
            break;
    }
    a.href = window.URL.createObjectURL(csvFile);
    a.textContent = 'Download CSV';

    a.dataset.downloadurl = [contentType, a.download, a.href].join(':');

    document.body.appendChild(a);
    a.click();
}

// Downloads the full data set
function download(){
    var b = document.createElement('b');
    switch(document.getElementById("layer-download").selectedIndex){
        case 0:
            b.download = "data/TSurfAir.json";
            break;
        case 1:
            b.download = "data/CO_total_column.json";
            break;
        case 2:
            b.download = "data/totH2OStd.json";
            break;
        case 3:
            b.download = "data/CldFrcTot.json";
            break;
    }
    document.body.appendChild(b)
    window.open(b.download);
}

// This code finds the mouse and then displays values of points on click
var mousePosition = null;
var container = document.getElementById('map');

/*
* Get the mousePosition as a two element array [x, y] whenever the mouse is
* moved.
*/
container.addEventListener('mousemove', function(event) {
    mousePosition = map.getEventPixel(event);
});

/*
* Set the mousePosition to null when the mouse leaves the map. Also sets the
* RGB colors to null.
*/
container.addEventListener('mouseout', function() {
    mousePosition = null;
});


map.on('click', function(evt){
    var coord = map.getCoordinateFromPixel([mousePosition[0], mousePosition[1]]);
    console.log(coord)
    var html = "<b>Latitude:</b> " + coord[1].toFixed(2) + "<br><b>Longitude:</b> " + coord[0].toFixed(2) + "<br>&nbsp;&nbsp;&nbsp;&nbsp;<table class='table-bordered'><th>Webified Layer</th><th>Value</th><tr><td>Air Temperature</td><td>";
    html = html + findValue(webification_layer, "TSurfAir", true) + "K" + "</td></tr>";
    html = html + "<tr><td>Cloud Fraction Total</td><td>" +  findValue(webification_layer, "CldFrcTot", true) + "</td></tr>";
    html = html + "<tr><td>CO Total Column</td><td>" +  findValue(webification_layer, "CO_total_column", true) + "<br>molecules/cm^3" +  "</td></tr>";
    html = html + "<tr><td>Total Precipitable Water Vapor</td><td>" +  findValue(webification_layer, "totH2OStd", true) + "kb/m^2" +  "</td></tr>";
    html = html + "<tr><td>Time</td><td>" + findValue(webification_layer, "time", true) + "</td></tr>";
    html = html + "</table>";

    html = html + "<br>&nbsp;&nbsp;&nbsp;&nbsp;<table class='table-bordered'><th>Non-Webified Layer</th><th>Value</th><tr><td>Air Temperature</td><td>";
    html = html + findValue(air_layer, "TSurfAir", false) + "K" + "</td></tr>";
    html = html + "<tr><td>Cloud Fraction Total</td><td>" +  findValue(cloud_layer, "CldFrcTot", false) + "</td></tr>";
    html = html + "<tr><td>CO Total Column</td><td>" +  findValue(CO_layer, "CO_total_column", false) + "<br>molecules/cm^3" +  "</td></tr>";
    html = html + "<tr><td>Total Precipitable Water Vapor</td><td>" +  findValue(H2O_layer, "totH2OStd", false) + "kb/m^2" +  "</td></tr>"
    html = html + "</table>";
    document.getElementById("info-box").innerHTML = html;
})
