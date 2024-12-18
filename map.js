
var chart;
var option;


function init(centerCoord) {
    //設定Mapbox的取用Token。
    mapboxgl.accessToken = 'pk.eyJ1IjoiYmlhYm9ibyIsImEiOiJjamVvejdlNXQxZnBuMndtdWhiZHRuaTNpIn0.PIS9wtUxm_rz_IzF2WFD1g';
    chart = echarts.init(document.getElementById('map'));

    //設定echarts載入mapbox的參數值
    option = {
        mapbox3D: {
            style: 'mapbox://styles/mapbox/outdoors-v12', //地圖樣式 mapbox style 改成有高低起伏的outdoor
            center: [centerCoord[1], centerCoord[0]],
            zoom: 12, //調整放大比例
            pitch: 60,  //俯視角 0(垂直)-60(水平) 
            altitudeScale: 2, //高度縮放
            shading: 'color',
            postEffect: {
                enable: true,
                SSAO: {
                    enable: true,
                    radius: 2
                }
            },
            light: {
                main: {
                    intensity: 1.5,
                    shadow: true,
                    shadowQuality: 'high'
                },
                ambient: {
                    intensity: 0.
                }
            }
        },
        //建立視覺對應顏色規則 
        visualMap: { //可註解掉 直接用下面的color
            type: 'piecewise',
            pieces: [{
                gte: 401,
                label: '> 400 m',
                color: '#EE4E4E',
                colorAlpha: 0.8
            }, {
                gt: 301,
                lt: 400,
                label: '301-400 m',
                color: '#FFC700',
                colorAlpha: 0.8
            }, {
                gt: 201,
                lt: 300,
                label: '201-300 m',
                color: '#FFF455',
                colorAlpha: 0.8
            }, {
                gt: 101,
                lte: 200,
                label: '101-200 m',
                color: '#219C90',
                colorAlpha: 0.8
            }, {
                lte: 100,
                label: '<= 100 m',
                color: '#46C6CC',
                colorAlpha: 0.8
            }],
            dimension: 3,
            seriesIndex: [0, 1],
            itemWidth: 36,
            itemHeight: 26,
            itemGap: 16,
            hoverLink: false,
            left: 20,
            bottom: 50,
            fontSize: 16,
            textStyle: {
                'color': 'black', // 直接改顏色
                'fontSize': 16 ,

            }
        }
    

    };

}


//左邊地圖
// function createMapMarker(centerCoord, markerData) {

//     // 設定 Mapbox 的取用 Token
//     mapboxgl.accessToken = 'pk.eyJ1IjoiYmlhYm9ibyIsImEiOiJjamVvejdlNXQxZnBuMndtdWhiZHRuaTNpIn0.PIS9wtUxm_rz_IzF2WFD1g';

//     // 初始化 Mapbox 地圖
//     const map = new mapboxgl.Map({
//         container: 'map', // HTML 容器的 ID
//         style: 'mapbox://styles/mapbox/streets-v11', // Mapbox 的地圖風格
//         center: centerCoord, // 地圖中心座標
//         zoom: 12, // 縮放比
//     });

//     // 添加座標點
//     markerData.forEach(data => {
//         // 建立標記
//         const marker = new mapboxgl.Marker({ color: '#CB6040' }) // 氣球顏色
//             .setLngLat(data.coord) // 設定標記點的經緯度
//             .setPopup(
//                 new mapboxgl.Popup({ offset: 25 }) // 加入彈出框，設定偏移
//                     .setHTML(`<h3>${data.station}</h3>`) // 彈出框內容
//             )
//             .addTo(map); // 將標記加入地圖
//     });

// }

//載入每個數據點
function loadScatterFlightPlanPath(data) {
    chart.setOption({
        series: [{
            name: 'Flight Path Point',
            id: 'Flight Path Point',
            type: 'scatter3D',
            coordinateSystem: 'mapbox3D',
            symbol: 'circle',
            symbolSize: 15,
            animation: false,
            data: data,
            label: {
                show: false
            },
            emphasis: {
                itemStyle: {
                    borderWidth: 0.3,
                    borderColor: 'white'
                }
            }
        }]
    });
}

//建立要餵入echarts的3D資料格式
function create3dFlightPointData(datas) {
    var processDatas = {}
    for (var i = 0; i < datas.length; i++) {
        var height = datas[i][2];
        var lDatas = [];
        if (height.toString() in processDatas) {
            lDatas = processDatas[height.toString()];
        }
        lDatas.push([datas[i][0], datas[i][1]]);
        processDatas[height.toString()] = lDatas;
    }
    var threeDNoiseData = generate3dNoiseData();
    var count = 0;
    var new_all_datas = []
    for (var key in processDatas) {
        var pDatas = processDatas[key];
        var pDatasLengh = pDatas.length / 4;
        for (var i = 0; i < pDatasLengh; i++) {
            j = i * 4;
            coords_data = [pDatas[j], pDatas[j + 1], pDatas[j + 2], pDatas[j + 3], pDatas[j]];
            var pPointDatas = getPointsFromLineByStaticDistance(coords_data);
            for (var j = 0; j < pPointDatas.length; j++) {
                new_all_datas.push([pPointDatas[j][0], pPointDatas[j][1], parseInt(key), threeDNoiseData[count]]);
                count += 1;
            }
        }
    }
    return new_all_datas;
}

//建立3D自然噪聲點數據(For demo)
function generate3dNoiseData() {
    var noise = new SimplexNoise(Math.random);
    var data = [];
    for (var i = 0; i < 100; i++) {
        for (var j = 0; j < 100; j++) {
            for (var k = 0; k < 100; k++) {
                var value = noise.noise3D(i / 20, j / 20, k / 20) * 60 + 10;
                data.push(value);
            }
        }
    }
    return data;
}

//建立自然噪聲點數據(For demo)
function createNoiseData(point_count) {
    var noise = new SimplexNoise(Math.random);
    var noise_data = [];
    var c = Math.ceil(Math.sqrt(point_count));
    for (var i = 0; i < c + 1; i++) {
        for (var j = 0; j < c + 1; j++) {
            var value = noise.noise2D(i / 20, j / 20) * 40 + 40;
            noise_data.push(value);
        }
    }
    return noise_data;
}

//建立要餵入echarts的格式
function createFlightPointsData(gpsList, height) {
    //建立自然噪聲點數據(For demo)
    let noiseData = createNoiseData(gpsList.length);
    var coord_data = [];
    for (var k = 0; k < gpsList.length; k++) {
        var gps = gpsList[k];
        coord_data.push({
            name: '',
            value: [gps[0], gps[1], height, noiseData[k]],
            itemStyle: {
                'color': 'white',
                'opacity': 0.8
            }
        });
    }
    return coord_data;
}

//建立要餵入echarts的格式
function createFlightPointsDataByHeightRange(gpsList, circle_count, min_height, max_height) {
    //計算每點上升高度
    var eachHeight = (max_height - min_height) / circle_count;
    var stepHeight = eachHeight / 360.0;
    var currentHeight = min_height;
    //建立自然噪聲點數據(For demo)
    let noiseData = createNoiseData(gpsList.length);
    var coord_data = [];
    for (var k = 0; k < gpsList.length; k++) {
        var gps = gpsList[k];
        coord_data.push({
            name: '',
            value: [gps[0], gps[1], currentHeight += stepHeight, noiseData[k]],
            itemStyle: {
                'color': 'white',
                'opacity': 0.8
            }
        });
    }
    return coord_data;
}


//建立要餵入echarts的格式 (高度改為拋物線)
function createFlightPointsDataByParabola(gpsList, min_height, max_height) {
    // 定義拋物線參數
    const totalPoints = gpsList.length;
    const midpointIndex = Math.floor(totalPoints / 2); 
    const maxPointHeight = max_height; // 頂點高度
    const a = 4 * (maxPointHeight - min_height) / Math.pow(totalPoints - 1, 2); // 拋物線寬度參數


    let coord_data = [];

    for (let k = 0; k < gpsList.length; k++) {
        const gps = gpsList[k];

        // 使用拋物線公式計算高度
        const height = -a * Math.pow(k - midpointIndex, 2) + maxPointHeight;

        coord_data.push({
            name: '',
            value: [gps[0], gps[1], height, height], // 高度設置為拋物線高度
            itemStyle: {
                'color': 'white',
                'opacity': 0.8
            }
        });
    }

    return coord_data;
}


function setScatterToMap(data) {
    chart.setOption({
        series: [{
            name: 'Flight Path Point',
            type: 'scatter3D',
            coordinateSystem: 'mapbox3D',
            symbol: 'circle',
            symbolSize: 8,
            animation: false,
            data: data,
            label: {
                show: false
            },
            emphasis: {
                itemStyle: {
                    borderWidth: 0.3,
                    borderColor: 'white'
                }
            }
        }]
    });
}

function createSqureCoords(center_coord, radius) {
    var point = turf.point([center_coord[1], center_coord[0]]);
    var distance = Math.sqrt((Math.pow(radius, 2) + Math.pow(radius, 2)));
    var bearings = [45, 135, 225, 315];
    var options = { units: 'kilometers' };
    var result = [];
    for (var i = 0; i < bearings.length; i++) {
        var destination = turf.destination(point, distance, bearings[i], options);
        result.push(destination);
    }
    result.push(result[0]);  // 加入起點為最後一條線終點
    var line = [];
    for (var i = 0; i < result.length; i++) {
        line.push(result[i].geometry.coordinates);
    }

    return createFlightPointsData(getPointsFromLineByStaticDistance(line), dataHeight);
}


//連線function
function createLineCoords(line, min_height, max_height) {

    var allCoords = [];
    for (var i = 0; i < line.length; i++) {
        var pointByDistance = getPointsFromLineByStaticDistance(line);
        var flightPoints = createFlightPointsDataByParabola(pointByDistance, min_height, max_height);
        allCoords = allCoords.concat(flightPoints);
    }
    return allCoords;
}


//連線function
// function createLineCoords(line) {

//     // 直接用經緯度設，注意經緯度前後位置是否變換
//     var line1 = [[120.94636765083033, 23.970582362040982], [ 121.0796410289517,24.005415921380088], 
//                 [121.13151450334395, 24.023235726536026]]; 
//     var line2 = [[120.94636765083033, 23.970582362040982], [ 121.00377818221675, 23.960154860591402]];
//     var line3 = [[120.94636765083033, 23.970582362040982], [ 120.91396944762806, 23.988389433794246]];


//     var lines = [line1, line2, line3];

//     var allCoords = [];
//     for (var i = 0; i < lines.length; i++) {
//         var pointByDistance = getPointsFromLineByStaticDistance(lines[i]);
//         var flightPoints = createFlightPointsData(pointByDistance, dataHeight);
//         allCoords = allCoords.concat(flightPoints);
//     }
//     return allCoords;
// }



function createStarCoords(center_coord, radius) {
    var point = turf.point([center_coord[1], center_coord[0]]);
    var distance = Math.sqrt((Math.pow(radius, 2) + Math.pow(radius, 2)));
    var bearings = [0, 45, 90, 135, 180, 225, 270, 315];
    var options = { units: 'kilometers' };
    var result = [];
    for (var i = 0; i < bearings.length; i++) {
        var destination = turf.destination(point, distance, bearings[i], options);
        result.push(destination);
    }
    var line1 = [result[0].geometry.coordinates, result[4].geometry.coordinates];
    var line2 = [result[1].geometry.coordinates, result[5].geometry.coordinates];
    var line3 = [result[2].geometry.coordinates, result[6].geometry.coordinates];
    var line4 = [result[3].geometry.coordinates, result[7].geometry.coordinates];

    var lines = [line1, line2, line3, line4];

    var allCoords = [];
    for (var i = 0; i < lines.length; i++) {
        var pointByDistance = getPointsFromLineByStaticDistance(lines[i]);
        var flightPoints = createFlightPointsData(pointByDistance, dataHeight);
        allCoords = allCoords.concat(flightPoints);
    }
    return allCoords;
}

function createFunnelCoords(center_coord, radius) {
    var point = turf.point([center_coord[1], center_coord[0]]);
    var distance = Math.sqrt((Math.pow(radius, 2) + Math.pow(radius, 2)));
    var bearings = [0, 45, 90, 135, 180, 225, 270, 315];
    var options = { units: 'kilometers' };
    var result = [];
    for (var i = 0; i < bearings.length; i++) {
        var destination = turf.destination(point, distance, bearings[i], options);
        result.push(destination);
    }
    var line1 = [result[0].geometry.coordinates, result[4].geometry.coordinates];
    var line2 = [result[0].geometry.coordinates, result[2].geometry.coordinates];
    var line3 = [result[2].geometry.coordinates, result[6].geometry.coordinates];
    var line4 = [result[4].geometry.coordinates, result[6].geometry.coordinates];

    var lines = [line1, line2, line3, line4];

    var allCoords = [];
    for (var i = 0; i < lines.length; i++) {
        var pointByDistance = getPointsFromLineByStaticDistance(lines[i]);
        var flightPoints = createFlightPointsData(pointByDistance, dataHeight);
        allCoords = allCoords.concat(flightPoints);
    }
    return allCoords;
}

function createCircleCoords(center_coord, radius) {
    points = [];
    radius = radius / 100;
    for (var i = 0; i < 360; i++) {
        x = center_coord[0] + (radius * Math.cos(degrees_to_radians(i)));
        y = center_coord[1] + (radius * Math.sin(degrees_to_radians(i)));
        points.push([y, x]);
    }
    var flightPoints = createFlightPointsData(points, dataHeight);
    return flightPoints;
}

function createSpringCoords(center_coord, radius, circle_count, min_height, max_height) {
    points = [];
    radius = radius / 100;
    for (var j = 0; j < circle_count; j++) {
        for (var i = 0; i < 360; i++) {
            x = center_coord[0] + (radius * Math.cos(degrees_to_radians(i)));
            y = center_coord[1] + (radius * Math.sin(degrees_to_radians(i)));
            points.push([y, x]);
        }
    }
    var flightPoints = createFlightPointsDataByHeightRange(points, circle_count, min_height, max_height);
    return flightPoints;
}

function createPyramidCoords(center_coord, radius, decreaseRadius, level, levelHeight, min_height) {
    var allCoords = [];
    for (var i = 0; i < level; i++) {
        var point = turf.point([center_coord[1], center_coord[0]]);
        var distance = Math.sqrt((Math.pow(radius - (i * (1 - decreaseRadius)), 2) + Math.pow(radius - (i * (1 - decreaseRadius)), 2)));
        var bearings = [45, 135, 225, 315];
        var options = { units: 'kilometers' };
        var result = [];
        for (var j = 0; j < bearings.length; j++) {
            var destination = turf.destination(point, distance, bearings[j], options);
            result.push(destination);
        }
        result.push(result[0]);  // 加入起點為最後一條線終點
        var lines = [];
        for (var j = 0; j < result.length; j++) {
            lines.push(result[j].geometry.coordinates);
        }
        var pointByDistance = getPointsFromLineByStaticDistance(lines);
        var flightPoints = createFlightPointsData(pointByDistance, min_height + (i * levelHeight));
        allCoords = allCoords.concat(flightPoints);
    }
    return allCoords;
}

//Tools
//獲得地理線段上每隔特定距離的每點座標
function getPointsFromLineByStaticDistance(line) {
    //lineString: 2個或以上的點組成的線
    var lineString = turf.lineString(line);
    //lineChunk: （lineString, 分割距離(預設單位:公里), 可選參數）
    var chunk = turf.lineChunk(lineString, 0.2, {});
    var new_data = [];
    for (var i = 0; i < chunk.features.length; i++) {
        new_data.push(chunk.features[i].geometry.coordinates[0]);
    }
    return new_data;
}

//角度轉弧度
function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}

//載入地圖
function loadMap() {
    //進行echarts設定，餵入之前定義好的常數-option
    chart.setOption(option, true);
    //從echarts取得mapbox的實體
    var map = chart.getModel().getComponent("mapbox3D")._mapbox;
    //地圖圖資載入完畢後，顯示在Mapbox上的3D建築物圖層。
    map.on('load', function () {
        var layers = map.getStyle().layers;
        var labelLayerId;
        for (var i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                labelLayerId = layers[i].id;
                break;
            }
        }
        map.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
                'fill-extrusion-color': '#8EAACB',
                'fill-extrusion-height': [
                    "interpolate", ["linear"],
                    ["zoom"],
                    15, 0,
                    15.05, ["get", "height"]
                ],
                'fill-extrusion-base': [
                    "interpolate", ["linear"],
                    ["zoom"],
                    15, 0,
                    15.05, ["get", "min_height"]
                ],
                'fill-extrusion-opacity': .6
            }
        }, labelLayerId);
    });
}