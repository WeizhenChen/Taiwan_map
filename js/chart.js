/* 圖表3(地圖) start==========================================================================================*/

var population = new Array();

for (var i = 0, len = popData.length; i < len; i += 1) {
    population[popData[i].COUNTYNAME] = popData[i].population;
}

topo = topojson.feature(map_data, map_data.objects.layer1);
prj = d3.geo.mercator().center([120.767705, 24.424612]).scale(10000).translate([500, 195]);
path = d3.geo.path().projection(prj);

for (var i = 0, len = topo.features.length; i < len; i += 1) {
    topo.features[i].properties.value = population[topo.features[i].properties.name]
}

colorMap = d3.scale.linear()
    .domain([min, max])
    .range(['#FFC78E', '#BB5E00']);

locks = d3.select("svg#map")
    .selectAll("path")
    .data(topo.features)
    .enter()
    .append("path")
    .attr("fill", function (d) {
        return colorMap(d.properties.value);
    })
    .attr("d", path)
    .attr("id", function (d) {
        return "T" + d.properties.COUNTYSN;
    })
    .on("mouseover", function (select) {
        d3.select("svg#map")
            .selectAll("path")
            .attr("fill", function (d) {
                return d.properties.COUNTYSN === select.properties.COUNTYSN ? "#00AEAE" : colorMap(d.properties.value);
            });
        d3.select("#map_explanation")
            .style("visibility", "");
        d3.select("#map_num_text")
            .text(thousand(select.properties.value));
        d3.select("#city_name")
            .text(select.properties.name);
    })
    .on("mouseout", function (select) {
        d3.select("svg#map")
            .selectAll("path")
            .attr("fill", function (d) {
                return colorMap(d.properties.value);
            });
        d3.select("#map_explanation")
            .style("visibility", "hidden");
    });

//連江縣 and 金門縣移到一起~
d3.select("#T09007001").attr("transform", "translate(-55,210)");
d3.select("#T09020001").attr("transform", "translate(225,-28)");

var legendWidth = 30,
    legendHeight = 350;

var defs = d3.select('svg#mp_legend').append("defs");
var coloursYGB = ['#FFC78E', '#BB5E00'];

//Create color gradient
var colorScaleYGB = d3.scale.linear()
    .domain([min, max])
    .range(['#FFC78E', '#BB5E00'])
    .interpolate(d3.interpolateHcl);

defs.append("linearGradient")
    .attr("id", "gradient-ygb-colors")
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "0%")
    .attr("y2", "0%")
    .selectAll("stop")
    .data(coloursYGB)
    .enter().append("stop")
    .attr("offset", function (d, i) {
        return i / (coloursYGB.length - 1);
    })
    .attr("stop-color", function (d) {
        return d;
    });

//Color Legend container
var legendsvg = d3.select('svg#mp_legend').append("g")
    .attr("class", "legendWrapper")
    .attr("transform", "translate(730,30)");

//Draw the Rectangle
legendsvg.append("rect")
    .attr("class", "legendRect")
    .attr("x", -legendWidth / 2)
    .attr("y", 10)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "none");

//Set scale for x-axis
var yScale = d3.scale.linear()
    .range([legendHeight, 0])
    .domain([min, max]);

//Define x-axis
var yAxis = d3.svg.axis()
    .orient("right")
    .ticks(5) //Set rough # of ticks
    .scale(yScale);

//Set up X axis
legendsvg.append("g")
    .attr("class", "axis") //Assign "axis" class
    .attr("transform", "translate(15,0)")
    .call(yAxis);

d3.select('svg#mp_legend').select(".legendRect")
    .style("fill", "url(#gradient-ygb-colors)")
    .attr("rx", "5")
    .attr("ry", "5");

function thousand( number ){
		var num = number+"";
		var pattern = /(-?\d+)(\d{3})/;
		while( pattern.test(num) ){
				num = num.replace(pattern,"$1,$2");
		}
		return num;
}

/* 圖表3(地圖) end==========================================================================================*/
