var viewer;
var layer_data = [];
var values = [];
var time = [];
window.onload = function(){
    var base_layer = new Cesium.WebMapTileServiceImageryProvider({
        url : '//gibs.earthdata.nasa.gov/wmts-geo/wmts.cgi?TIME=2013-06-16',
        layer : 'BlueMarble_ShadedRelief_Bathymetry',
        style : 'default',
        format : 'image/jpeg',
        tileMatrixSetID : 'EPSG4326_500m',
        tilingScheme : gibs.GeographicTilingScheme(),
        maximumLevel: 8,
        credit : new Cesium.Credit('NASA GIBS')
    });

    var air_layer = new Cesium.WebMapTileServiceImageryProvider({
        url: "http://skywalker.jpl.nasa.gov/wmts-geo/wmts.cgi?",
        layer: "airs_test",
        crossOrigin: "Anonymous",
        style: "default",
        format: "image/lerc",
        tileMatrixSetID: "EPSG4326_500m",
        tilingScheme : gibs.GeographicTilingScheme(),
        maximumLevel: 8
    })

    var slider_air = new Slider('#slider-air', {
    });

    var slider_time = new Slider('#slider-time', {
    });

    var jsonLoaded = false;
    /* Modifies the loading of the tile */
    air_layer.requestImage = function(x, y, level){
        if(!jsonLoaded){
            Cesium.loadJson("../data/TSurfAir.json").then(function(data){
                for(i = 0; i < 1350; i++){
                    values.push(data.data[Math.floor(i / 30)][i % 30]);
                }
                translated_values = values;
            })
            jsonLoaded = true;
        }
        if(air_layer.ready){
            return loadTile(x, y, level, slider_air.getValue()[0], slider_air.getValue()[1],
            slider_time.getValue()[0], slider_time.getValue()[1]);
        }
    }
    /* When loading a tile, it reads the values to determine the coloration */
    function loadTile(x, y, level, min, max, timeMin, timeMax){
        var src = "http://skywalker.jpl.nasa.gov/wmts-geo/wmts.cgi?" +
        "&layer=airs_test&style=default&tilematrixset=EPSG4326_500m&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Flerc&TileMatrix=" +
        level + "&TileCol=" + x + "&TileRow=" + y;
        var image = new Image();
        image.src = src;
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        image.crossOrigin = "Anonymous";
        var context = canvas.getContext("2d");
        return new Promise(function(resolve, reject){
            Cesium.loadArrayBuffer(src).then(function(data){
                var codec = LERC();
                image.decodedPixels =  codec.decode(data);
                var imageData = image.decodedPixels.pixelData;
                var no_data_value = image.decodedPixels.noDataValue;
                var newImageData = context.createImageData(512, 512);
                var color_scale = document.getElementById("color-options-air")[document.getElementById("color-options-air").selectedIndex].innerHTML;
                console.log("(" + x + ", " + y + ", " + level + ")")
                for(i = 0; i < imageData.length; i++){
                    var index = imageData[i];
                    if(index >= 0 && index <= values.length){
                        value = translated_values[index];
                    }
                    else{
                        value = no_data_value;
                    }
                    if(value != no_data_value && index <= timeMax && index >= timeMin){
                        var colors = color(color_scale, value, min, max);
                        newImageData.data[i * 4] = colors[0];
                        newImageData.data[i * 4 + 1] = colors[1];
                        newImageData.data[i * 4 + 2] = colors[2];
                        newImageData.data[i * 4 + 3] = 255;
                    }
                    else{
                        newImageData.data[i * 4] = 0;
                        newImageData.data[i * 4 + 1] = 0;
                        newImageData.data[i * 4 + 2] = 0;
                        newImageData.data[i * 4 + 3] = 0;
                    }
                }
                console.log("(" + x + ", " + y + ", " + level + ")")
                var tile = [];
                tile["values"] = imageData;
                tile["coord"] = [x, y, level];
                console.log(tile["coord"])
                tile["no_data_value"] = no_data_value;
                layer_data.push(tile);
                context.putImageData(newImageData, 0, 0);
                image.src = context.canvas.toDataURL();
                image.onload = function(){
                    resolve(image);
                }
                image.onerror = function(){
                    reject(image);
                }
            })
        })
    }

    viewer = new Cesium.Viewer('cesium-container', {
        imageryProvider : base_layer,
        terrainProvider : new Cesium.CesiumTerrainProvider({
		          url : '//assets.agi.com/stk-terrain/world'
        }),
        baseLayerPicker : false
    });

    var scene = viewer.scene;
    var handler;

    var scene = viewer.scene;
    var cartesian = new Cesium.Cartesian3();
 var scratchCartographic = new Cesium.Cartographic();
 var scratchJulian = new Cesium.JulianDate();
 var center = new Cesium.Cartographic();
 var firstPoint = new Cesium.Cartographic();
 var firstPointSet = false;
 var mouseDown = false;
 var camera = viewer.camera;
 var rectangleCoordinates = new Cesium.Rectangle();
 var minMaxPoints = scene.primitives.add(new Cesium.PointPrimitiveCollection());
    var handler;

var data = [];
var dataX = [];
var dataY = [];
    var screenSpaceEventHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    //Draw the selector while the user drags the mouse while holding shift (from a Cesium demo credits to Allen Korenevsky)
      screenSpaceEventHandler.setInputAction(function drawSelector(movement) {
        if (!mouseDown) {
            scene.screenSpaceCameraController.enableRotate = true;
            scene.screenSpaceCameraController.enableTranslate = true;
            scene.screenSpaceCameraController.enableZoom = true;
            scene.screenSpaceCameraController.enableTilt = true;
            scene.screenSpaceCameraController.enableLook = true;
          return;
        }

        scene.screenSpaceCameraController.enableRotate = false;
        scene.screenSpaceCameraController.enableTranslate = false;
        scene.screenSpaceCameraController.enableZoom = false;
scene.screenSpaceCameraController.enableTilt = false;
scene.screenSpaceCameraController.enableLook = false;

        cartesian = camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid, cartesian);

        /* Draws the rectangle and calculates which pixels are within the selected box */
        if (cartesian) {
          //mouse cartographic
          scratchCartographic = Cesium.Cartographic.fromCartesian(cartesian, Cesium.Ellipsoid.WGS84, scratchCartographic);

          if (!firstPointSet) {
            Cesium.Cartographic.clone(scratchCartographic, firstPoint);
            firstPointSet = true;
          }
          else {
            rectangleCoordinates.east = Math.max(scratchCartographic.longitude, firstPoint.longitude);
            rectangleCoordinates.west = Math.min(scratchCartographic.longitude, firstPoint.longitude);
            rectangleCoordinates.north = Math.max(scratchCartographic.latitude, firstPoint.latitude);
            rectangleCoordinates.south = Math.min(scratchCartographic.latitude, firstPoint.latitude);

            data.length = 0;
            var max = Number.MIN_VALUE;
            var maxIndex = null;
            var min = Number.MAX_VALUE;
            var minIndex = null;
            var total = 0;
            var num_vals = 0;
            var average;
            if(rectangleCoordinates.east <= 108 * Math.PI / 180 && rectangleCoordinates.west <= 108 * Math.PI / 180){
                for(i = 0; i < layer_data.length; i++){
                    var tile = layer_data[i];
                    if(tile["coord"][0] == 0 && tile["coord"][1] == 0 && tile["coord"][2] == 0){
                        break;
                    }
                }
                var indexes = [];
                var x1 = Math.round(((rectangleCoordinates.west + Math.PI) * 180 / Math.PI)/288 * 512);
                var y1 = Math.round(((Math.PI/2 - rectangleCoordinates.north) * 180 / Math.PI)/180 * 320);
                var x2 = Math.round(((rectangleCoordinates.east + Math.PI) * 180 / Math.PI)/288 * 512);
                var y2 = Math.round(((Math.PI/2 - rectangleCoordinates.south) * 180 / Math.PI)/180 * 320);
                var height = y2 - y1;
                var width = x2 - x1;
                var currentPixel = y1 * 512 + x1;
                for(i = 0; i < height; i++){
                    for(j = 0; j < width; j++){
                        var index = tile["values"][currentPixel];
                        var value;
                        if(index >= 0 && index <= 1350){
                            value = translated_values[index];
                        }
                        if(index != tile["no_data_value"]){
                            total += value;
                            num_vals += 1;
                            if(value > max){
                                max = value;
                                maxIndex = currentPixel;
                            }
                            if(value < min){
                                min = value;
                                minIndex = currentPixel;
                            }
                        }
                        currentPixel++;
                    }
                    currentPixel = currentPixel - width + 512;
                }
                average = total/num_vals;

                var latMin = (90 - (Math.round(minIndex / 512)) / 320 * 180);
                var latMax = (90 - (Math.round(maxIndex / 512)) / 320 * 180);
                var lonMin = (-180 + (minIndex % 512) / 512 * 288);
                var lonMax = (-180 + (maxIndex % 512) / 512 * 288);
                var minPosition = Cesium.Cartesian3.fromDegrees(lonMin, latMin);
                var maxPosition = Cesium.Cartesian3.fromDegrees(lonMax, latMax);
                minMaxPoints.removeAll();
                minMaxPoints.add({
                    position: minPosition,
                    show: true,
                    color: Cesium.Color.BLUE,
                    outlineColor: Cesium.Color.WHITE,
                    pixelSize: 5,
                    outlineWidth: .5,
                    id: min
                })
                minMaxPoints.add({
                    position: maxPosition,
                    show: true,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    pixelSize: 5,
                    outlineWidth: .5,
                    id: max
                })
                document.getElementById("box-values").innerHTML = "Min: " + min + "<br>Min Coordinates: (" + lonMin + ", " + latMin + ") <br>Max: " + max + "<br>Max Coordinates: (" + lonMax + ", " + latMax + ")<br>Average: " + average + "<br>";
            }
            if(rectangleCoordinates.east > 108 * Math.PI / 180 && rectangleCoordinates.west > 108 * Math.PI / 180){
                for(i = 0; i < layer_data.length; i++){
                    var tile = layer_data[i];
                    if(tile["coord"][0] == 1 && tile["coord"][1] == 0 && tile["coord"][2] == 0){
                        break;
                    }
                }
                var x1 = Math.round(((rectangleCoordinates.west - 108 * Math.PI / 180) * 180 / Math.PI)/72 * 128);
                var y1 = Math.round(((Math.PI/2 - rectangleCoordinates.north) * 180 / Math.PI)/180 * 320);
                var x2 = Math.round(((rectangleCoordinates.east - 108 * Math.PI / 180) * 180 / Math.PI)/72 * 128);
                var y2 = Math.round(((Math.PI/2 - rectangleCoordinates.south) * 180 / Math.PI)/180 * 320);
                var height = y2 - y1;
                var width = x2 - x1;
                var currentPixel = y1 * 512 + x1;
                for(i = 0; i < height; i++){
                    for(j = 0; j < width; j++){
                        var index = tile["values"][currentPixel];
                        var value;
                        if(index >= 0 && index <= 1350){
                            value = translated_values[index];
                            data.push(value);
                        }
                        if(index != tile["no_data_value"]){
                            total += value;
                            num_vals += 1;
                            if(value > max){
                                max = value;
                                maxIndex = currentPixel;
                            }
                            if(value < min){
                                min = value;
                                minIndex = currentPixel;
                            }
                        }
                        currentPixel++;
                    }
                    currentPixel = currentPixel - width + 512;
                }
                console.log(indexes)
                console.log(total)
                average = total/num_vals;
                console.log("max: " + max + " min: " + min + " total: " + total + " average: " + average)

                var latMin = (90 - (Math.round(minIndex / 512)) / 320 * 180);
                var latMax = (90 - (Math.round(maxIndex / 512)) / 320 * 180);
                var lonMin = (108 + (minIndex % 512) / 128 * 72);
                var lonMax = (108 + (maxIndex % 512) / 128 * 72);
                console.log("min index: " + minIndex + "max index: " + maxIndex)
                var minPosition = Cesium.Cartesian3.fromDegrees(lonMin, latMin);
                var maxPosition = Cesium.Cartesian3.fromDegrees(lonMax, latMax);
                minMaxPoints.removeAll();
                minMaxPoints.add({
                    position: minPosition,
                    show: true,
                    color: Cesium.Color.BLUE,
                    outlineColor: Cesium.Color.WHITE,
                    pixelSize: 5,
                    outlineWidth: .5,
                    id: min
                })
                minMaxPoints.add({
                    position: maxPosition,
                    show: true,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    pixelSize: 5,
                    outlineWidth: .5,
                    id: max
                })
                document.getElementById("box-values").innerHTML = "Min: " + min + "<br>Min Coordinates: (" + lonMin + ", " + latMin + ") <br>Max: " + max + "<br>Max Coordinates: (" + lonMax + ", " + latMax + ")<br>Average: " + average + "<br>";
            }

            if(rectangleCoordinates.east <= 108 * Math.PI / 180 && rectangleCoordinates.west > 108 * Math.PI / 180){
                var tile0;
                var tile1;
                for(i = 0; i < layer_data.length; i++){
                    var tile = layer_data[i];
                    if(tile["coord"][0] == 0 && tile["coord"][1] == 0 && tile["coord"][2] == 0){
                        tile0 = tile;
                    }
                    if(tile["coord"][0] == 1 && tile["coord"][1] == 0 && tile["coord"][2] == 0){
                        tile1 = tile;
                    }
                }
                var x1 = Math.round(((rectangleCoordinates.west + Math.PI) * 180 / Math.PI)/288 * 512);
                var y1 = Math.round(((Math.PI/2 - rectangleCoordinates.north) * 180 / Math.PI)/180 * 320);
                var x2 = Math.round(((rectangleCoordinates.east + 108 * Math.PI / 180) * 180 / Math.PI)/72 * 128);
                var y2 = Math.round(((Math.PI/2 - rectangleCoordinates.south) * 180 / Math.PI)/180 * 320);
                var height = y2 - y1;
                var width1 = x2;
                var width0 = 512 - x1;
                var currentPixel = y1 * 512 + x1;
                for(i = 0; i < height; i++){
                    for(j = 0; j < width0; j++){
                        var index = tile["values"][currentPixel];
                        var value;
                        if(index >= 0 && index <= 1350){
                            value = translated_values[index];
                            data.push(value);
                        }
                        if(index != tile["no_data_value"]){
                            total += value;
                            num_vals += 1;
                            if(value > max){
                                max = value;
                                maxIndex = currentPixel;
                            }
                            if(value < min){
                                min = value;
                                minIndex = currentPixel;
                            }
                        }
                        currentPixel++;
                    }
                    currentPixel = currentPixel - width0 + 512;
                }

                var latMin = (90 - (Math.round(minIndex / 512)) / 320 * 180);
                var latMax = (90 - (Math.round(maxIndex / 512)) / 320 * 180);
                var lonMin = (-180 + (minIndex % 512) / 512 * 288);
                var lonMax = (-180 + (maxIndex % 512) / 512 * 288);
                var minPosition = Cesium.Cartesian3.fromDegrees(lonMin, latMin);
                var maxPosition = Cesium.Cartesian3.fromDegrees(lonMax, latMax);

                var maxChange = false;
                var minChange = false;
                var currentPixel = y1 * 512;
                for(i = 0; i < height; i++){
                    for(j = 0; j < width1; j++){
                        var index = tile["values"][currentPixel];
                        var value;
                        if(index >= 0 && index <= 1350){
                            value = translated_values[index];
                            data.push(value);
                        }
                        if(index != tile["no_data_value"]){
                            total += value;
                            num_vals += 1;
                            if(value > max){
                                max = value;
                                maxChange = true;
                                maxIndex = currentPixel;
                            }
                            if(value < min){
                                min = value;
                                minChange = true;
                                minIndex = currentPixel;
                            }
                        }
                        currentPixel++;
                    }
                    currentPixel = currentPixel - width1 + 512;
                }
                average = total/num_vals;

                if(maxChange){
                    latMax = (90 - (Math.round(maxIndex / 512)) / 320 * 180);
                    lonMax = (108 + (maxIndex % 512) / 128 * 72);
                    maxPosition = Cesium.Cartesian3.fromDegrees(lonMax, latMax);
                }

                if(minChange){
                    latMin = (90 - (Math.round(minIndex / 512)) / 320 * 180);
                    lonMin = (108 + (minIndex % 512) / 128 * 72);
                    minPosition = Cesium.Cartesian3.fromDegrees(lonMin, latMin);
                }

                minMaxPoints.removeAll();
                minMaxPoints.add({
                    position: minPosition,
                    show: true,
                    color: Cesium.Color.BLUE,
                    outlineColor: Cesium.Color.WHITE,
                    pixelSize: 5,
                    outlineWidth: .5,
                    id: min
                })
                minMaxPoints.add({
                    position: maxPosition,
                    show: true,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    pixelSize: 5,
                    outlineWidth: .5,
                    id: max
                })
                document.getElementById("box-values").innerHTML = "Min: " + min + "<br>Min Coordinates: (" + lonMin + ", " + latMin + ") <br>Max: " + max + "<br>Max Coordinates: (" + lonMax + ", " + latMax + ")<br>Average: " + average + "<br>";
            }
            //Don't draw if rectangle has 0 size. Will cause Cesium to throw an error.
            selector.show = rectangleCoordinates.east !== rectangleCoordinates.west || rectangleCoordinates.north !== rectangleCoordinates.south;


          }
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.CTRL);

      screenSpaceEventHandler.setInputAction(function startClickShift() {
        mouseDown = true;
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.CTRL);

      var endClickShift = function endClickShift() {
          scene.screenSpaceCameraController.enableRotate = true;
          scene.screenSpaceCameraController.enableTranslate = true;
          scene.screenSpaceCameraController.enableZoom = true;
          scene.screenSpaceCameraController.enableTilt = true;
          scene.screenSpaceCameraController.enableLook = true;
        mouseDown = false;
        firstPointSet = false;
      };

      screenSpaceEventHandler.setInputAction(endClickShift, Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.CTRL);
      screenSpaceEventHandler.setInputAction(endClickShift, Cesium.ScreenSpaceEventType.LEFT_UP);

      //Hide the selector by clicking anywhere
      screenSpaceEventHandler.setInputAction(function hideSelector() {
        selector.show = false;
        minMaxPoints.removeAll()
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      var getSelectorLocation = new Cesium.CallbackProperty(function getSelectorLocation(time, result) {
        return Cesium.Rectangle.clone(rectangleCoordinates, result);
      }, false);

      var getSelectorHeight = new Cesium.CallbackProperty(function getSelectorHeight() {
        return Cesium.Math.clamp(camera._positionCartographic.height - 3500000, 0, 100000);
      }, false);

      var selectorRectangle = {
        coordinates: getSelectorLocation,
        height: getSelectorHeight,
        outline : true,
        outlineColor : Cesium.Color.WHITE,
        material : Cesium.Color.WHITE.withAlpha(.25)
    };
      selector = viewer.entities.add({
        selectable: false,
        show: false,
        rectangle: selectorRectangle
      });

    // Mouse over the globe to see the cartographic position
    handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(function(movement) {
        var cartesian = viewer.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
        if (cartesian) {
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
            var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);
            document.getElementById('info-box').innerHTML = "(" + longitudeString + ", " + latitudeString + ")" + "<br>" + findValue(cartographic);
        } else {
            document.getElementById('info-box').innerHTML = "N/A";
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


    viewer.imageryLayers.addImageryProvider(base_layer);
    viewer.imageryLayers.addImageryProvider(air_layer);
    // viewer.imageryLayers.addImageryProvider(air_layer);

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

    function toRadians(degrees){
        return degrees * Math.PI/180;
    }

    function haversineDistance(lat1, lat2, lon1, lon2){
        var a = Math.pow(Math.sin((lat1 - lat2)/2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2)/2), 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371 * c;
    }

    /* Finds value of a point, uses extents */
    function findValue(position){
        var x = position.longitude;
        var y = position.latitude;

        x = x * 180 / Math.PI;
        y = y * 180 / Math.PI;

        if(x <= 108){
            var row = Math.round(Math.abs(90 - y)/180 * 320);
            var col = Math.round(Math.abs(-180 - x)/288 * 512);
            for(i = 0; i < layer_data.length; i++){
                var tile = layer_data[i];
                if(tile["coord"][0] == 0 && tile["coord"][1] == 0 && tile["coord"][2] == 0){
                    var result = tile["values"][row * 512 + col];
                    if(result >= 0 && result <= 1350){
                        return translated_values[result];
                    }
                    else{
                        return "N/A";
                    }
                }
            }
        }
        else{
            var row = Math.round(Math.abs(90 - y)/180 * 320);
            var col = Math.round(Math.abs(108 - x)/72 * 128);
            for(i = 0; i < layer_data.length; i++){
                var tile = layer_data[i];
                if(tile["coord"][0] == 1 && tile["coord"][1] == 0 && tile["coord"][2] == 0){
                    var value = tile["values"][row * 512 + col];
                    if(value == tile["no_data_value"]){
                        return "N/A";
                    }
                    return value;
                }
            }
        }
    }
}

/* Forces Cesium to reload tiles */
function render(){
    var layer = viewer.imageryLayers.get(2);
    hideLayer(layer);
    window.setTimeout(function(){layer.show = true;}, 10);
}

function hideLayer(layer){
    layer.show = false;
}

function showLayer(layer){
    layer.show = true;
}