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


    //2.氣泡======================================================================
    var w = 850;
    var h = 600;
    var p = 70;

    var page = 1;
    var limit = 10;

    d3.select("div#bubble_div")
        .append("svg")
        .attr({
            id: "bubble_chart",
            width: w,
            height: h
        });

    page_data(page, limit, dataSet, "");

    var dataobj = {
        children: Data
    };

    var pack = d3.layout.pack()
        .padding(p)
        .size([w, h])
        .sort(function (a, b) {
            b.population - a.population;
        });

    var nodes = pack.nodes(dataobj);

    //    nodes = nodes.filter(function (d) {
    //        return d.parent;
    //    });

    var fScale = d3.scale.category20c();

    var selection = d3.select("svg#bubble_chart")
        .selectAll("circle")
        .data(nodes);
    selection.enter().append("circle");
    selection.exit().remove();

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
                //console.log(d.r);
                return d.r + 20;
            }, // 用 r 當半徑
            fill: function (d) {
                if (d.depth > 0) {
                    return fScale(d.COUNTYNAME);
                } else {
                    return "#fff";
                }
            },
            stroke: "#666"
        })
        .style({
            cursor: "pointer"
        })
        .on("click", function (d) {
            //console.log(d.COUNTYNAME);
            if (d.depth > 0) {
                d3.select("div#bubble_data>div.word>span.city")
                    .text(d.COUNTYNAME);

                d3.select("div#bubble_data>div.word>span.count")
                    .text(d.value + " 間");
            } else {
                d3.select("div#bubble_data>div.word>span.city")
                    .text("全國");

                d3.select("div#bubble_data>div.word>span.count")
                    .text(d.value + " 間");
            }
            page_data(page, limit, dataSet, d.COUNTYNAME);

            var posssss = $("#bubble_data").position();
            $("html,body").animate({
                scrollTop: (posssss.top)
            }, 500);
        });

    var selection_t = d3.select("svg#bubble_chart")
        .selectAll("text")
        .data(nodes);
    selection_t.enter().append("text");
    selection_t.exit().remove();

    d3.select("svg#bubble_chart")
        .selectAll("text")
        .attr({
            x: function (d) {
                return d.x;
            },
            y: function (d) {
                return d.y;
            },
            "text-anchor": "middle", // 文字水平置中
            //fill: "#fff"
        })
        .text(function (d) {
            if (d.depth > 0) {
                return d.COUNTYNAME;
            }
        });

    var selection_t2 = d3.select("svg#bubble_chart")
        .selectAll("text.value")
        .data(nodes);
    selection_t2.enter().append("text")
        .attr("class", "value");
    selection_t2.exit().remove();

    d3.select("svg#bubble_chart")
        .selectAll("text.value")
        .attr({
            x: function (d) {
                return d.x;
            },
            y: function (d) {
                return d.y + 19;
            },
            "text-anchor": "middle", // 文字水平置中
            //fill: "#fff"
        })
        .text(function (d) {
            if (d.depth > 0) {
                return d.value;
            }
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

function page_data(page, limit, dataSet, city) {

    //console.log(city);

    if (city) {
        var f_data = dataSet.filter(function (d) {
            return removeAllSpace(d.address).substring(0, 3) == city;
        });
    } else {
        var f_data = dataSet;
    }

    $("#bubble_data .table .tr.data-row").empty();

    for (var i = 0; i < limit; i++) {
        var new_tr = $("#bubble_data .table .tr:first").clone(true);
        var sn = (page - 1) * limit + i;
        $(new_tr).addClass("data-row");
        $(new_tr).find("div.sn").html(+sn + 1);
        $(new_tr).find("div.name").html(f_data[sn]["name"]);
        $(new_tr).find("div.tel").html(f_data[sn]["tel"]);
        $(new_tr).find("div.address").html(f_data[sn]["address"]);
        $("#bubble_data .table").append(new_tr);
        if ((+sn + 1) >= f_data.length) break;
    }

}

/* end==========================================================================================*/
