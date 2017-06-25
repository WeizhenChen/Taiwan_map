/* start==========================================================================================*/

d3.csv("isbnpub.csv", function (dataSet) {

    var city_arr = [];
    var count_arr = [];

    dataSet.forEach(function (d) {
        var city = removeAllSpace(d.address).substring(0, 3);
        if (city_arr.indexOf(city) < 0) {
            city_arr.push(city);
            count_arr[city_arr.indexOf(city)] = 1;
        } else {
            count_arr[city_arr.indexOf(city)]++;
        }
    });

    var Data = [];

    city_arr.forEach(function (d, i) {
        Data[i] = {
            "COUNTYNAME": d,
            "population": count_arr[i],
            "value": count_arr[i]
        };
    });

    var topo = topojson.feature(map_data, map_data.objects.layer1);
    var prj = d3.geo.mercator().center([120.767705, 24.424612]).scale(10000).translate([500, 195]);
    var path = d3.geo.path().projection(prj);

    for (var i = 0; i < topo.features.length; i++) {
        if (count_arr[city_arr.indexOf(topo.features[i].properties.name)]) {
            topo.features[i].properties.value = count_arr[city_arr.indexOf(topo.features[i].properties.name)];
        }
    }

    d3.select("div#map_div")
        .append("svg")
        .attr({
            id: "map"
        });

    var coloursYGB = ['#FFDDAA', '#BB5E00'];

    var colorMap = d3.scale.linear()
        .domain([0, d3.max(Data, function (d) {
            return d.population
        })])
        .range(coloursYGB);

    var locks = d3.select("svg#map")
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
            d3.select("path#T" + select.properties.COUNTYSN)
                .attr("fill", "#00AEAE");

            d3.select("#map_explanation")
                .style("visibility", "");

            d3.select("#map_num_text")
                .text(thousand(select.properties.value));

            d3.select("#city_name")
                .text(select.properties.name);
        })
        .on("mouseout", function (select) {
            d3.select("path#T" + select.properties.COUNTYSN)
                .attr("fill", colorMap(select.properties.value));

            d3.select("#map_explanation")
                .style("visibility", "hidden");
        });

    //連江縣 and 金門縣移到一起~
    d3.select("#T09007001").attr("transform", "translate(-55,210)");
    d3.select("#T09020001").attr("transform", "translate(225,-28)");

    var legendWidth = 30,
        legendHeight = 350;

    d3.select("div#mp_sidebar")
        .append("svg")
        .attr({
            id: "mp_legend"
        });

    var defs = d3.select('svg#mp_legend').append("defs");

    var colorScaleYGB = d3.scale.linear()
        .domain([0, d3.max(Data, function (d) {
            return d.population
        })])
        .range(coloursYGB)
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

    var legendsvg = d3.select('svg#mp_legend').append("g")
        .attr("class", "legendWrapper")
        .attr("transform", "translate(730,30)");

    legendsvg.append("rect")
        .attr("class", "legendRect")
        .attr("x", -legendWidth / 2)
        .attr("y", 10)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "none");

    var yScale = d3.scale.linear()
        .domain([0, d3.max(Data, function (d) {
            return d.population
        })])
        .range([legendHeight, 0]);

    var yAxis = d3.svg.axis()
        .orient("right")
        .ticks(8)
        .scale(yScale);

    legendsvg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(15,0)")
        .call(yAxis);

    d3.select('svg#mp_legend')
        .select(".legendRect")
        .style("fill", "url(#gradient-ygb-colors)")
        .attr("rx", "5")
        .attr("ry", "5");


    //2.======================================================================
    var w = 850;
    var h = 700;
    var p = 10;

    d3.select("div.data_block_2")
        .append("svg")
        .attr({
            id: "bubble_chart"
        });

    console.log(Data);

    //TODO-2.先依縣市，再依癌症類別劃分
    var nested_dataSet = d3.nest()
        .key(function (d) {
            return d.COUNTYNAME;
        })
        .entries(Data);

    //console.log(nested_dataSet);

    var root = {
        values: nested_dataSet
    };

    //console.log(root);

    var packed_dataSet = d3.layout.pack()
        .size([w, h])
        .padding(p)
        .children(
            function (d) {
                return d.values;
            }
        )
        .nodes(root);

    //console.log(packed_dataSet);

    //TODO-7.如何把最外的大圓去掉？
    /*packed_dataSet = packed_dataSet.filter(function (d) {
        return d.depth > 0;
    })*/

    var selection = d3.select("svg#bubble_chart")
        .selectAll("circle")
        .data(packed_dataSet);
    selection.enter().append("circle");
    selection.exit().remove();

    var fScale = d3.scale.category20();

    d3.select("svg#bubble_chart")
        .selectAll("circle")
        .attr({
            cx: function (d) {
                return d.x;
            }, // 用 x,y 當圓心
            cy: function (d) {
                return d.y;
            },
            r: function (d) {
                return d.r;
            }, // 用 r 當半徑
            fill: function (d) {
                //if (d.depth < 2) {
                    //return "#eee";
                //} else {
                    return fScale(d.category);
                //}
            }, //TODO-5.依癌症別填不同色，需注意各節點具有欄位
            stroke: "#666", // 邊框畫深灰色
        });

});

function thousand(number) {
    var num = number + "";
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(num)) {
        num = num.replace(pattern, "$1,$2");
    }
    return num;
}

/* end==========================================================================================*/
