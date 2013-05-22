var width = 1000,
	height = 500;

var proj = d3.geo.mercator()
		.center([0, 0])
		.scale(180)
		.rotate([-10,0]);

var path = d3.geo.path()
		.projection(proj);

var zoom = d3.behavior.zoom()
    .translate(proj.translate())
    .scale(proj.scale())
    .scaleExtent([height*.33, 4 * height])
    .on("zoom", zoom);


var svg = d3.select("#map").append("svg")
		.attr("width", width)
		.attr("height", height)
		.call(zoom);

function zoom() {
	proj.translate(d3.event.translate).scale(d3.event.scale);
	svg.selectAll("path").attr("d", path);
	circles
  		.attr("cx", function(d){return proj([d.long, d.lat])[0];})
		.attr("cy", function(d){return proj([d.long, d.lat])[1];});
}

var borders = svg.append("g");

var impacts = svg.append("g");

var metorScale = d3.scale.pow().exponent(.5).domain([0, 1000, 10000, 56000, 23000000]);

var colorScale = d3.scale.linear().domain([1400, 1800, 1860, 1940, 2015]);

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6)
    .style("background", "rgba(250,250,250,.7)");

tooltip.append("img")
	.attr("id", "tooltipImg")
	.attr("height", 200)
	.attr("width", 200)
	.style("opacity", "1");

queue()
	.defer(d3.json, "worldTopo.json")
	.defer(d3.csv, "fell.csv")
	.defer(d3.json, "pics.json")
	.await(ready);

var metors;
function ready(error, topology, csv, pics){
	borders.selectAll("path")
		.data(topojson.object(topology, topology.objects.countries)
				.geometries)
	.enter()
		.append("path")
		.attr("d", path)
		.attr("class", "border")
	
	rawMetors = csv;

	metors = [];
	rawMetors.forEach(function(d){
		d.mass = +d.mass_g;
		d.year = +d.year;
		d.id = +d.cartodb_id;
		if (pics.indexOf(d.name + '.jpg') != -1){
			metors.push(d);
		}
	});
	metors.sort(function(a, b){return a.id - b.id;})

	metorScale
		.range([2.5, 3, 4, 5, 10]);

	colorScale
		.range(["#FFFF66", "#FFFF00", "#E68000", "#D94000", "#CC0000"]);

	circles = impacts.selectAll("circle")
		.data(metors).enter()
			.append("svg:a")
		    	.attr("xlink:href", function(d) { return d.database; })
		    	.attr("xlink:show", "new")
			.append("circle")
				.attr("cx", function(d){return proj([d.long, d.lat])[0];})
				.attr("cy", function(d){return proj([d.long, d.lat])[1];})
				.attr("r", 	function(d){return metorScale(d.mass);})
				.attr("id", function(d){return "id" + d.id;})
				.style("fill", function(d){return colorScale(d.year);	})
		.on("mouseover", function(d){
			d3.select(this)
				.attr("stroke", "black")
				.attr("stroke-width", 1)
				.attr("fill-opacity", 1);

			tooltip
			    .style("left", (d3.event.pageX + 5) + "px")
			    .style("top", (d3.event.pageY - 5) + "px")
			    .transition().duration(300)
			    .style("opacity", 1)
			    .style("display", "block")

			updateDetails(d);
			})
		.on("mouseout", function(d){
			d3.select(this)
				.attr("stroke", "")
				.attr("fill-opacity", function(d){return 1;})

			tooltip.transition().duration(700).style("opacity", 0);
		});

	lb = 1.370;
	metorsCF = crossfilter(metors),
		all = metorsCF.groupAll(),
		year = metorsCF.dimension(function(d){return d.year;}),
		years = year.group(function(d){return Math.floor(d/10)*10;}),
		mass = metorsCF.dimension(function(d){return d.mass}),
		masses = mass.group(function(d){ 
			var rv = Math.pow(lb, Math.floor(Math.log(d)/Math.log(lb)))
			return rv;}),
		type = metorsCF.dimension(function(d){return d.type_of_meteorite;}),
		types = type.group();

		cartoDbId = metorsCF.dimension(function(d){return d.id;});
		cartoDbIds = cartoDbId.group()

	var charts = [
		barChart()
				.dimension(year)
				.group(years)
			.x(d3.scale.linear()
				.domain([1490,2020])
				.rangeRound([-1, 20*24-5])),

		barChart()
				.dimension(mass)
				.group(masses)
			.x(d3.scale.log().base([lb])
				.domain([1,25000001])
				.rangeRound([0,20*24]))
	];

	var chart = d3.selectAll(".chart")
			.data(charts)
			.each(function(chart){chart.on("brush", renderAll).on("brushend", renderAll)});

	d3.selectAll("#total")
			.text(metorsCF.size());


	function render(method){
		d3.select(this).call(method);
	}


	lastFilterArray = [];
	metors.forEach(function(d, i){
		lastFilterArray[i] = 1;
	});

	function renderAll(){
		chart.each(render);

		var filterArray = cartoDbIds.all();
		filterArray.forEach(function(d, i){
			if (d.value != lastFilterArray[i]){
				lastFilterArray[i] = d.value;
				d3.select("#id" + d.key).transition().duration(500)
						.attr("r", d.value == 1 ? 2*metorScale(metors[i].mass) : 0)
					.transition().delay(550).duration(500)
						.attr("r", d.value == 1 ? metorScale(metors[i].mass) : 0);

			}
		})

		d3.select("#active").text(all.value());
	}

	window.reset = function(i){
		charts[i].filter(null);
		renderAll();
	}

	renderAll();
}


var printDetails = [
					{'var': 'name', 'print': 'Name'},
					{'var': 'type_of_meteorite', 'print': 'Type'},
					{'var': 'mass_g', 'print': 'Mass(g)'},
					{'var': 'year', 'print': 'Year'}];

function updateDetails(metor){
	var image = new Image();
	image.onload = function(){
		document.getElementById("tooltipImg").src = 'pictures/' + metor.cartodb_id + '.jpg';}
	image.src = 'pictures/' + metor.cartodb_id + '.jpg';

	tooltip.selectAll("div").remove();
	tooltip.selectAll("div").data(printDetails).enter()
		.append("div")
			.append('span')
				.text(function(d){return d.print + ": ";})				
				.attr("class", "boldDetail")
			.insert('span')
				.text(function(d){return metor[d.var];})
				.attr("class", "normalDetail");
}