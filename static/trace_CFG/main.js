//TODO: Make it the mainModule
//expose public variables and functions inside this nameSpace
// window.onload = function() {
  
  // Colors to depict different cycles
  // Bluish colors are removed since gradient also uses blue color
  var colores_g = [ "#dc3912", "#ff9900", "#109618", "#990099", 
    "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#994499",
    "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262"];

  // dict for all nodes, edges, and edgelabels
  // keys are Id of the svg g elements, values are the g elements
  
  nodesAll = {}; 
  edgesAll = {};
  edgeLabelsAll = {}; 

  // keys are nodeId and values are the array of p elements that are instances of the node/CFG block
  var nodeToTextGroups = {};

  // Dict that stores start and end address of all the CFG basic blocks with at least one instruction
  // key: nodeId, value: object with keys - startAddr and endAddr
  var nodesEndAddress = {};

  // key: startAddr, value - nodeId; for fast lookup of basic block corresponding to a block of trace
  var startAddrNode = {};

  // Modify these data structures to array of objects
  // Each object contains the array of nodes, collapse state,
  // id, name etc.

  //array of text block p elements in the sequence of the trace text
  var textBlocksArray = [];
  //array of offset object of the text blocks on the trace. Each object has keys p: d3 selection of p element, start:startOffset, end: endOffset
  //Used to auto-highlight the nodes on the graph when the user scrolls to the right
  var textBlocksOffset = [];

  var last_known_scroll_position = 0;  // to check if the previous scroll position was same; scroll events tend to be fired very fast
                                      // and are thus computationally intensive if not throttled 
  var ticking = false;  // to control/throttle the scroll auto-highlighting
  var last_known_panel_height = 0;

  var nodeGroups = [];   // Array of groups of nodes
  var isNodeGrpCollapsed = [];  // Stores the collapsed/non-collapsed state of these groups
  var nodeIdforGrp = []; //Stores the node id for each of these group if chosen by user 
                                  // Might also need to add new edges into the graph itself
                                  // Will change how we highlight codeview on the right 
                                  // Either collapse the corresponding blocks on the right side and change their linkage to the left side
                                  // OR Highlight everything on right side thats in the group on the left
  var nodeGroupMeta = [];   // Stores the group name for now
  var nodeGroupsArray = []; // Array of group of nodes  
  var currentTempGrp = [];  // Used as temporary storage while creating new groups

  var currentNode;    // Used to highlight the node when hovered or active, also used to delete the active node  
  var currentText;    // Used to highlight the text when hovered or active
  g = null;  // The main graph 
  var graph_to_display = null;

  var traceText; // The trace file
  var codes = []; // The array of blocks forming the text on the right side
  var currNodeHighlight = null; // used for highlighting individual node on hover
  var cycles; // stores cycles on the graph
  var currTextHighlight = []; // used for highlighting the text blocks on the right
  var isBrushEnabled = false; // turn brushing on/off: Brushing does not 
                              // work well with other panning and zooming interactions.
                              // It is disabled by default.

  var isTooltipEnabled = true; //Turns tooltip on/off: the tooltip that shows code when hovering over a node in the graph 

  var brushInitialized = false;
  var mouseOverColor = "white";
  var mouseOverGFill = "black";

  //The nodes mark the start and end points to be displayed at the CFG using trace sequence
  var currStartTextNode = null;
  var currEndTextNode = null;
  // The indexes record the index of the nodes in the textBlocksArray
  var currStartTextIndex = -1;
  var currEndTextIndex = -1;
  // The prev indexes track the previous marked text blocks
  var prevStartTextIndex = -1, prevEndTextIndex = -1;

  var rtDragStart = []; // Fast Dragging by right clicking or shift clicking; Right click not suitable for this purpose.
  var rtDragTranslate = [];
  var rtDragScale = [];
  var isRtDragStarted = false;

  var isCycleShown = false;

  var isTraceSupplied = false;

  var isHoverOnLeftPanel=false;

  //This variable stores whether the node's weighted degrees are encoded on the graph with color
  var isTripCountShown = true;

  //This variable stores whether the loop's boundary is enabled
  var isLoopBoundaryShown = true;

  //The list of all the currently tainted list of addresses
  var taintOutputList = [];

  // The list of all the currently and previously highlighted elements due to taint
  var prev_matched_tspans_graphs = [];
  var prev_matched_span_traces = [];
  var matched_tspans_graphs = [];
  var matched_span_traces = [];
  var match_list = {};

  is_node_dragging_enabled = false;

  var zoom = null;

  dotFile = null;
  loopsObj = null;
 
  // Load the dot file and trace file
  var f_dot = document.getElementById('fi_dot');
  var f_trace = document.getElementById('fi_trace')
  var fr = new FileReader();
  var fr1 = new FileReader();
  
  var default_file = "cfg.main.dot"; 

  var analysis_params = [];

  // Split(['#container', '#annotations'], {
  //       direction: 'vertical',
  //       sizes: [75, 25],
  //   });
  // Split(['#an1', '#an2', "#an3", "#an4"]);
  Split(['#left', '#right']);

    // Started navbar logic here
      /* Set the width of the side navigation to 250px */
    function openNav() {
        document.getElementById("mySidenav").style.width = "250px";
    }

    /* Set the width of the side navigation to 0 */
    function closeNav() {
        document.getElementById("mySidenav").style.width = "0";
    }

    // populate the dropdown list using the analysis.json file when initializing
    d3.json("../static/analysis.json", function(data) {
      analysis_params = data;
      console.log(analysis_params);

       d3.select("#analysisSelector")
          .selectAll("option")
          .data(analysis_params.scripts)
          .enter()
          .append("option")
          .attr("value", function(d) { return d.id; })
          .text(function(d) { return d.name; });


    });

    d3.select("#mydropbtn")
      .on("click", function(){

        //Toggle the visibility
        var div = d3.select(".dropdown-content");

        if(div.style("display") == "none"){
          div.style("display", "block");
        } else {
          div.style("display", "none");
        }

        // div.style("display", "block");

    });

    d3.select("#encodingKeyHelpbtn")
      .on("click", function(){

        //Toggle the visibility
        var div = d3.select("#encodingKeyContainer");

        if(div.style("display") == "none"){
          div.style("display", "block");
        } else {
          div.style("display", "none");
        }

    }); 

      d3.select("#closeMenu").on("click", function(){
       d3.select(".dropdown-content").style("display", "none");
      });

    
  d3.selectAll(".sidenavHolderDiv h4")
    .on("click", function(){
      // get the sibling div
      // toggle the visibility

      var tempDiv = d3.select(this.parentNode).select("div");
      
      if(tempDiv.classed("hidden")){
        tempDiv.classed("hidden", false);
      } else {
        tempDiv.classed("hidden", true);
      }

    });
  // Ended navbar logic here



  //Initialize Analysis Highlighting
  d3.select("#doTaint")
        .on("click", function(){

       // alert("The backtaint and UERDetector libraries are not public and are not available. We are in the process of developing an interface to let you plug your analysis scripts. You can try these analysis in the demo site.");
       // return;

       // console.log(analysis_params);  

      // Get the type of analysis
      var sel = d3.select("#analysisSelector").node();
      var analysisType = sel.options[sel.selectedIndex].value;

      // if(analysisType == "allUERs" || 
      //   analysisType == "inUERs" ||
      //   analysisType == "outUERs"
      //   ){

      //   clearPrevHighlight();
      //   highlightUERs(analysisType);
      //   return;
      // }


		  // Remove previous taints
        for(var i=0; i<matched_tspans_graphs.length; i++){

          // matched_tspans_graphs[i].classed("taint", false);  
          
          // matched_tspans_graphs[i].rect.classed("taint", false);
          matched_tspans_graphs[i].rect.style("fill", "none");
          
          matched_tspans_graphs[i].tspan.classed("taint", false);

        }

        matched_tspans_graphs = [];

        // Remove taint on the trace
        // Use match_list  

        var textToHighlight = [];

        for (var nodeId in match_list) {
          if (match_list.hasOwnProperty(nodeId)) {

            if(isTraceSupplied){
              if(nodeId in nodeToTextGroups){
                textToHighlight = nodeToTextGroups[nodeId];
              }
            }

            // if(textToHighlight.length > 0){
            //   // var replaceStr = textToHighlight[0].text();
            //   // var replaceStr = replaceStr.replace("<span class = 'taint'>", '');
            //   // replaceStr = replaceStr.replace("</span>", '');

            //   var replaceStr = textToHighlight[0].node().innerHTML;
            //   replaceStr = replaceStr.replace(/<span[\s\S]*['"]>/ ,"");
            //   replaceStr = replaceStr.replace(/\n<\/span>/ ,"");

            // }

            if(textToHighlight.length > 0){
                var replaceStr = textToHighlight[0].text();
            }

            for(var i = 0; i<textToHighlight.length; i++){
              textToHighlight[i].text(replaceStr);
            }

          }
        }

        match_list = {};

        
        //Tainting is implemented on trace
        if(isTraceSupplied){
          var taintAddress = d3.select("#taintAddress").node().value.trim();
          // if address not empty
          if(taintAddress != ""){
            //Gather the tracetext and send it along with the address for tainting information

            //Construct the request object
            // var taintRequest = {trace: traceText, address: taintAddress};

            // Construct the request object along with the script parameters
            var taintRequest = {trace: traceText, address: taintAddress}; 

            // console.log(taintRequest);
            // console.log(analysis_params);  

            // Find the highlight script with the given id in analysis_params
            var scripts = analysis_params.scripts;
            for(var i=0; i<scripts.length; i++){
              if(scripts[i].id == analysisType){
                if(scripts[i].type == "instrHighlight" ){
                  taintRequest.scriptpath = scripts[i].scriptpath;
                  taintRequest.language = scripts[i].language;
                  taintRequest.outfilename = scripts[i].outfilename;
                } else {
                  return;
                }
                break;
              }
            }         

            // console.log(taintRequest);

            // Send request for taint information
            d3.xhr("../getBackTaint/")
            .header("Content-Type", "application/json")
            .post(JSON.stringify(taintRequest),
              function(err, result){
                // console.log("Response: ", result.responseText);

                var taintOutput = result.responseText;
                if(taintOutput.split("i:")[1] == null){
                	return;
                }

                taintOutputList = taintOutput.split("i:")[1].trim().split(/\s+/);

                // If the list of address is non-empty, then 
                if(taintOutputList.length>0){

                  //Update the max and value of the slider here
                  d3.select("#myTaintSlider").property("max", taintOutputList.length);
                  d3.select("#myTaintSlider").property("value", taintOutputList.length);
                  
                  d3.select("#sliderOutput").text(taintOutputList.length);

                	
                	var colorScale = d3.scale.linear()
                  .domain([0, taintOutputList.length - 1])
                  
                  // .range(["#8856a7", "#efedf5"])
                  // Make the color scale darker so that white text works
                  .range(["#8856a7", "#c0a5d1"])
                  .interpolate(d3.interpolateHcl);


                  // Go through the original graph, make a list of all the nodes with
                  // all the matching addresses contained in it,
                  // For the matching nodes, search through all the tspan elements
                  // If the tspan contains a matching address, then highlight it and add it to the list of modified tspans,
                  // Lookup the corresponding blocks in the trace
                  // Clear any existing spans (by giving them a class if the gradient is not needed),
                  // and then apply span on new elements.

                  // d3.selectAll("#graphContainer g.nodes tspan").each()

                  var graph_nodes = g.nodes();
                  match_list = {};
                  matched_tspans_graphs = [];

                  //Since an address only occurs in a CFG once, once an address is matched in some node, it 
                  // need not be considered in any other node.
                  // Here a boolean array the size of original address array keeps track of matched addresses
                  // A duplicate array with addresses sorted alphabetically is used so that earlier addresses are checked first
                  // If the address space is different, then in addition to alphabetical sorting it also needs to take into account variable length
                  // But within the same node, the order of addresses is probably in sorted order with just alphabetical sort
                  // if library code and regular code is not interleaved in the same node
                  
                  // An alternative way to creating a boolean array to track matched addresses is to delete elements from the duplicate array and that keeps on 
                  // decreasing the number of array accesses. Array should be traversed in reverse order if we want to use splice to delete elments from an array and
                  // still go through all the elements of an array.

                  var is_matched_index = new Array(taintOutputList.length).fill(false);
                  
                  /********* Don't sort the addresses ************/
                  /********* Use the original list and use the order in it ****/
                  // var sorted_addresses = taintOutputList.slice(0).sort();
                  var sorted_addresses = taintOutputList;
                  

                  var matched_count = taintOutputList.length;
                  // Since we work with sorted addresses, the addresses will be sorted in the match_list as well.

                  for(var i = 0; i<graph_nodes.length; i++){
                  
                      var nodeId = graph_nodes[i];
                      var node = g.node(nodeId);
                      var label = node.label;
                    
                      for(var k=0; k<is_matched_index.length; k++){

                      	if(is_matched_index[k]) {
                          continue;
                        }
                        var re = new RegExp(sorted_addresses[k], 'i');
                        // var re = new RegExp("\\b" + sorted_addresses[k] + "\\b", 'i');

                        if(re.test(label)){

                          console.log("match");

                          if(match_list[nodeId] == null){
                            match_list[nodeId] = [];
                          }
                          match_list[nodeId].push(k);
                          // If using the alternative approach, need to store the address itself since index 
                          // keeps on changing on every iteration of outer loop.

                          is_matched_index[k] = true;
                          matched_count--;

                          console.log(matched_count);

                        }  


                      }

                      // If using alternative approach, need to delete matched nodes here; Use splice to remove elements without
                      // creating any gaps

                      if(matched_count==0){
                      	break;
                      }

                  }

                  console.log(match_list);
                  console.log(taintOutputList);
                  console.log(sorted_addresses);

                  // Match list computed; Now apply highligting and store them
                  // Remove highlighting on previous matches
                  for (var nodeId in match_list) {
                    if (match_list.hasOwnProperty(nodeId)) {
                        
                      // We have the nodeId and we have the corresponding blocks in the traces 

                      var matched_addresses = match_list[nodeId];

                      var thisbbox = nodesAll[nodeId].select("text").node().getBBox();
                      var hasFunctionName = false;
                      if(nodesAll[nodeId].select("tspan").text().trim() != ""){
                        hasFunctionName = true;
                      }

                      //Find them in the tspans
                      nodesAll[nodeId].selectAll("tspan").each(function(d, i){
                        
                      	var text = d3.select(this).text();

                        // Check the matched addresses
                        for(var k = 0; k<matched_addresses.length; k++){
                          var re = new RegExp(sorted_addresses[matched_addresses[k]], 'i');
                          // var re = new RegExp("\\b" + sorted_addresses[matched_addresses[k]] + "\\b", 'i');

                          if(re.test(text)){
                            // Highlight it
                            // Add it to the list

                            // d3.select(this).style("fill", "white");
                            d3.select(this).classed("taint", true);

                            // d3.select(this).style("fill", colorScale(k));
                            

                            // var thisbbox = this.getBBox();
                            

                            // var y = thisClientRect.height*(i-1);
                            
                            var y = (i-1)*13 + 1;

                            if(hasFunctionName){
                              y = (i)*13 + 1;  
                            }

                            var x = 0;
                            var height = 14;
                            var width = thisbbox.width;

                            var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                            rect.setAttribute("x", x);
                            rect.setAttribute("y", y);
                            rect.setAttribute("width", width);
                            rect.setAttribute("height", height);


                            // rect = nodesAll[nodeId].node().insertBefore(rect, this);
                            rect = nodesAll[nodeId].select("g").node().insertBefore(rect, nodesAll[nodeId].select("text").node());

                            rect = d3.select(rect);
                            rect.style("fill", colorScale(matched_addresses[k]))
                            .style("stroke", "none");

                            // rect.classed("taint", true);

                            // var rect = nodesAll[nodeId].select("g").append("rect")
                            // 	.attr("x", x)
                            // 	.attr("y", y)
                            // 	.attr("width", width)
                            // 	.attr("height", height)
                            // 	.classed("taint", true);

                            matched_tspans_graphs.push({rect: rect, tspan: d3.select(this)});
							                // matched_tspans_graphs.push(d3.select(this));
	
                            break;
                          
                          }

                        }


                      });



                      var textToHighlight = [];

                      // Highlight the trace text
                      
                      // Go through the lines;
                      // If the line contains a matching address, Put a span element in the line
                      // i.e Replace the text with <span>line</span>
                      // Prepare the array and join the array using "\n"

                      // Trace Backtaint Highlighting
                      if(isTraceSupplied){
                        if(nodeId in nodeToTextGroups){
                          textToHighlight = nodeToTextGroups[nodeId];
                        }
                      } 

                      // Previous highlighting removed at the start

                      // Start with any textblock and prepare the text to replace
                      // Then replace it in all instances
                      if(textToHighlight.length > 0){
                        var lines = textToHighlight[0].text().split('\n');

                        for(var l=0; l<lines.length; l++){
                          var line = lines[l];
                          for(var k=0; k<matched_addresses.length; k++){
                            var thisAddress = sorted_addresses[matched_addresses[k]];
                            var re = new RegExp("\\b" + thisAddress + "\\b", 'i');

                            if(re.test(line)){
                              // lines[l] = line.replace(re, "<span class = 'taint'>" + thisAddress + "</span>");
                              // lines[l] = "<span class = 'taint'>" + line + "</span>";

                              var color = colorScale(matched_addresses[k]);

                              

                              lines[l] = "<span style = 'background-color: " + color + " ; " 
                              + "color: white; "
                              + "'>" + line + "</span>";


                              break;
                            }


                          }
                        }

                        var textContent = lines.join("\n");
                        textContent = textContent.replace(/\n<\/span>/ ,"</span>");

                      }

                      
                      for(var i=0; i < textToHighlight.length; i++){
                        
                        // textToHighlight[i].classed("highlight", true);
                        // textToHighlight[i].text(textContent);
                        textToHighlight[i].node().innerHTML = textContent;

                        // replaceStr = textToHighlight[i].node().innerHTML;
                        // replaceStr = replaceStr.replace(/\n<\/span>/ ,"</span>");

                        // textToHighlight[i].node().innerHTML = replaceStr;
                      
                      }

                      

                    }
                  }




                }


              });

          }
        }

  });


  // This function cleans any previous highlights of any type
  function clearPrevHighlight(){

  }

  // This function highlights the sets of instructions returned by UERDetector code
  // The returned value is a JSON object with the following format:
  // { nodeId1:[[instruction address, location in the instruction ], [], ....],
  //   nodeId2: [[]], 
  //   ....
  //   nodeIdn:[[]]
  //  }



function highlightUERs(UERtype){

      // Remove previous highlights
      // Copy the results over to match_list

      // Remove previous highlights
        for(var i=0; i<matched_tspans_graphs.length; i++){

          // matched_tspans_graphs[i].classed("taint", false);  
          // matched_tspans_graphs[i].rect.classed("taint", false);

          matched_tspans_graphs[i].rect.style("fill", "none");
          matched_tspans_graphs[i].tspan.classed("taint", false);

        }

        matched_tspans_graphs = [];

        // Remove highlight on the trace
        // Use match_list  

        var textToHighlight = [];

          for (var nodeId in match_list) {
            if (match_list.hasOwnProperty(nodeId)) {

              if(isTraceSupplied){
                if(nodeId in nodeToTextGroups){
                  textToHighlight = nodeToTextGroups[nodeId];
                }
              }

              // if(textToHighlight.length > 0){
              //   // var replaceStr = textToHighlight[0].text();
              //   // var replaceStr = replaceStr.replace("<span class = 'taint'>", '');
              //   // replaceStr = replaceStr.replace("</span>", '');

              //   var replaceStr = textToHighlight[0].node().innerHTML;
              //   // replaceStr = replaceStr.replace(/<span[\s\S]*['"]>/gi ,"");
              //   // replaceStr = replaceStr.replace(/<span[\s\S]*>/gi ,"");

              //   replaceStr = replaceStr.replace(/<span class = ['"]taint['"]>/gi ,"");
                
              //   replaceStr = replaceStr.replace(/\n<\/span>/gi ,"");
              //   replaceStr = replaceStr.replace(/<\/span>/gi ,"");

              // }

              if(textToHighlight.length > 0){
                var replaceStr = textToHighlight[0].text();
              }

              for(var i = 0; i<textToHighlight.length; i++){
                // textToHighlight[i].text(replaceStr);
                // textToHighlight[i].node().innerHTML = replaceStr;

                textToHighlight[i].text(replaceStr);

              }

            }
          }

          match_list = {};


            //UER Detection is performed using dotfiles
            // send the dotfile to the service

            //Construct the request object
            var UERRequest = {dotfile: dotFile, UERtype: UERtype};

            // Send request for UER information
            d3.xhr("../getUERs/")
            .header("Content-Type", "application/json")
            .post(JSON.stringify(UERRequest),
              function(err, result){
                // console.log("Response: ", result.responseText);

                UEROutput = JSON.parse(result.responseText);
                // console.log(UEROutput);
                // match_list = UEROutput;

                  // For the nodes in the result, search through all the tspan elements
                  // If the tspan contains a matching address, then highlight it and add it to the list of modified tspans,
                  // Lookup the corresponding blocks in the trace
                  
                  // d3.selectAll("#graphContainer g.nodes tspan").each()

                  matched_tspans_graphs = [];
                  // match_list = {};
                  match_list = UEROutput;


                  // Apply highligting and store the highlighted tspans
                  for (var nodeId in UEROutput) {
                    if (UEROutput.hasOwnProperty(nodeId)) {
                        
                      // We have the nodeId and we have the corresponding blocks in the traces 

                      var matched_addresses = UEROutput[nodeId];

                      // var thisbbox = nodesAll[nodeId].select("text").node().getBBox();
                      
                      var hasFunctionName = false;
                      if(nodesAll[nodeId].select("tspan").text().trim() != ""){
                        hasFunctionName = true;
                      }

                      //Find them in the tspans
                      nodesAll[nodeId].selectAll("tspan").each(function(d, i){
                        
                        var text = d3.select(this).text();

                        // Check the matched addresses
                        // This is an array of array.
                        // The inner array has two elements:
                        // First element is the instruction address
                        // Second element is the portion of instruction that is UER

                        for(var k = 0; k<matched_addresses.length; k++){
                          var re = new RegExp(matched_addresses[k][0], 'i');
                          
                          if(re.test(text)){
                            re = new RegExp(escapeRegExp(matched_addresses[k][1]), 'i');

                            // Highlight it
                            // Add it to the list

                            // d3.select(this).style("fill", "white");
                            
                            // d3.select(this).classed("taint", true);
                            
                            // d3.select(this).style("fill", colorScale(k));
                            
                            var y = (i-1)*13 + 1;

                            if(hasFunctionName){
                              y = (i)*13 + 1;  
                            }

                            // Modify the width and x-coordinate of the bbox based on the starting index of text-match
                            // in the instruction and the length of the text
                            // Use matched_addresses[k][1] as the text
                            
                            var unitWidth=8;
                            var findIndex =  text.search(re);
                            var x = findIndex*unitWidth-3;

                            var height = 14;
                            var width = (matched_addresses[k][1].length)*unitWidth;

                            var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                            rect.setAttribute("x", x);
                            rect.setAttribute("y", y);
                            rect.setAttribute("width", width);
                            rect.setAttribute("height", height);

                            // rect = nodesAll[nodeId].node().insertBefore(rect, this);
                            rect = nodesAll[nodeId].select("g").node().insertBefore(rect, nodesAll[nodeId].select("text").node());

                            rect = d3.select(rect);
                            rect.style("fill", "#d1b5e5")
                            .style("stroke", "none");

                            // rect.classed("taint", true);

                            // var rect = nodesAll[nodeId].select("g").append("rect")
                            //  .attr("x", x)
                            //  .attr("y", y)
                            //  .attr("width", width)
                            //  .attr("height", height)
                            //  .classed("taint", true);

                            matched_tspans_graphs.push({rect: rect, tspan: d3.select(this)});
                              // matched_tspans_graphs.push(d3.select(this));
  
                            // break;
                          
                          }

                        }


                      });

                      var textToHighlight = [];

                      // Highlight the trace text
                      
                      // Go through the lines;
                      // If the line contains a matching address, Put a span element in the line
                      // i.e Replace the text with <span>matched_portion</span>
                      // Prepare the array and join the array using "\n"

                      // Trace Backtaint Highlighting
                      if(isTraceSupplied){
                        if(nodeId in nodeToTextGroups){
                          textToHighlight = nodeToTextGroups[nodeId];
                        }
                      } 

                      // Previous highlighting removed at the start

                      // Start with any textblock and prepare the text to replace
                      // Then replace it in all instances
                      if(textToHighlight.length > 0){

                        var lines = textToHighlight[0].text().split('\n');

                        for(var l=0; l<lines.length; l++){
                          var line = lines[l];

                          for(var k=0; k<matched_addresses.length; k++){
                            var thisAddress = matched_addresses[k][0];
                            // var re = new RegExp("\\b" + thisAddress + "\\b", 'i');
                            var re = new RegExp(thisAddress, 'i');

                            if(re.test(line)){

                              // if((nodeId == "B13") && l==9){
                              //   debugger;
                              // }

                              // re = new RegExp("\\b" + escapeRegExp(matched_addresses[k][1]) + "\\b", 'i');
                              re = new RegExp(escapeRegExp(matched_addresses[k][1]), 'i');

                              lines[l] = lines[l].replace(re, "<span class = 'taint'>" + matched_addresses[k][1] + "</span>");
                              // lines[l] = "<span class = 'taint'>" + line + "</span>";

                              // var color = "#8856a7";

                              // lines[l] = "<span style = 'background-color: " + color + " ; " 
                              // + "color: white; "
                              // + "'>" + line + "</span>";

                              // break;
                            }

                          }
                        }

                        var textContent = lines.join("\n");
                        textContent = textContent.replace(/\n<\/span>/ ,"</span>");

                      }

                      
                      for(var i=0; i < textToHighlight.length; i++){
                        
                        // textToHighlight[i].classed("highlight", true);
                        // textToHighlight[i].text(textContent);
                        textToHighlight[i].node().innerHTML = textContent;

                        // replaceStr = textToHighlight[i].node().innerHTML;
                        // replaceStr = replaceStr.replace(/\n<\/span>/ ,"</span>");

                        // textToHighlight[i].node().innerHTML = replaceStr;
                      
                      }

                      

                    }
                  }


              });

}



  function updateTaint(num_disp_addr) {

    console.log("Value is " + num_disp_addr);

    if(taintOutputList.length>0){

            // Remove previous taints
        for(var i=0; i<matched_tspans_graphs.length; i++){

          // matched_tspans_graphs[i].classed("taint", false);  
          
          // matched_tspans_graphs[i].rect.classed("taint", false);
          matched_tspans_graphs[i].rect.style("fill", "none");
          
          matched_tspans_graphs[i].tspan.classed("taint", false);

        }

        matched_tspans_graphs = [];

        // Remove taint on the trace
        // Use match_list  

        var textToHighlight = [];

        for (var nodeId in match_list) {
          if (match_list.hasOwnProperty(nodeId)) {

            if(isTraceSupplied){
              if(nodeId in nodeToTextGroups){
                textToHighlight = nodeToTextGroups[nodeId];
              }
            }

            // if(textToHighlight.length > 0){
            //   // var replaceStr = textToHighlight[0].text();
            //   // var replaceStr = replaceStr.replace("<span class = 'taint'>", '');
            //   // replaceStr = replaceStr.replace("</span>", '');

            //   var replaceStr = textToHighlight[0].node().innerHTML;
            //   replaceStr = replaceStr.replace(/<span[\s\S]*['"]>/ ,"");
            //   replaceStr = replaceStr.replace(/\n<\/span>/ ,"");

            // }

            if(textToHighlight.length > 0){
                var replaceStr = textToHighlight[0].text();
            }

            for(var i = 0; i<textToHighlight.length; i++){
              textToHighlight[i].text(replaceStr);
            }

          }
        }

        match_list = {};

        console.log("Cleared everything");

      var colorScale = d3.scale.linear()
              .domain([0, num_disp_addr - 1])
              
              // .range(["#8856a7", "#efedf5"])
              // Make the color scale darker so that white text works
              .range(["#8856a7", "#c0a5d1"])
              .interpolate(d3.interpolateHcl);


              // Go through the original graph, make a list of all the nodes with
              // all the matching addresses contained in it,
              // For the matching nodes, search through all the tspan elements
              // If the tspan contains a matching address, then highlight it and add it to the list of modified tspans,
              // Lookup the corresponding blocks in the trace
              // Clear any existing spans (by giving them a class if the gradient is not needed),
              // and then apply span on new elements.

              // d3.selectAll("#graphContainer g.nodes tspan").each()

              var graph_nodes = g.nodes();
              match_list = {};
              matched_tspans_graphs = [];

              //Since an address only occurs in a CFG once, once an address is matched in some node, it 
              // need not be considered in any other node.
              // Here a boolean array the size of original address array keeps track of matched addresses
              // A duplicate array with addresses sorted alphabetically is used so that earlier addresses are checked first
              // If the address space is different, then in addition to alphabetical sorting it also needs to take into account variable length
              // But within the same node, the order of addresses is probably in sorted order with just alphabetical sort
              // if library code and regular code is not interleaved in the same node
              
              // An alternative way to creating a boolean array to track matched addresses is to delete elements from the duplicate array and that keeps on 
              // decreasing the number of array accesses. Array should be traversed in reverse order if we want to use splice to delete elments from an array and
              // still go through all the elements of an array.

              var is_matched_index = new Array(num_disp_addr).fill(false);
              
              // Don't sort the addresses //
              // Use the original list and use the order in it //
              // var sorted_addresses = taintOutputList.slice(0).sort();
              var sorted_addresses = taintOutputList.slice(0,num_disp_addr);
              

              var matched_count = num_disp_addr;
              // Since we work with sorted addresses, the addresses will be sorted in the match_list as well.

              for(var i = 0; i<graph_nodes.length; i++){
              
                  var nodeId = graph_nodes[i];
                  var node = g.node(nodeId);
                  var label = node.label;
                
                  for(var k=0; k<is_matched_index.length; k++){

                    if(is_matched_index[k]) {
                      continue;
                    }
                    var re = new RegExp(sorted_addresses[k], 'i');
                    // var re = new RegExp("\\b" + sorted_addresses[k] + "\\b", 'i');

                    if(re.test(label)){

                      console.log("match");

                      if(match_list[nodeId] == null){
                        match_list[nodeId] = [];
                      }
                      match_list[nodeId].push(k);
                      // If using the alternative approach, need to store the address itself since index 
                      // keeps on changing on every iteration of outer loop.

                      is_matched_index[k] = true;
                      matched_count--;

                      console.log(matched_count);

                    }  


                  }

                  // If using alternative approach, need to delete matched nodes here; Use splice to remove elements without
                  // creating any gaps

                  if(matched_count==0){
                    break;
                  }

              }

              console.log(match_list);
              console.log(taintOutputList);
              console.log(sorted_addresses);

              // Match list computed; Now apply highligting and store them
              // Remove highlighting on previous matches
              for (var nodeId in match_list) {
                if (match_list.hasOwnProperty(nodeId)) {
                    
                  // We have the nodeId and we have the corresponding blocks in the traces 

                  var matched_addresses = match_list[nodeId];

                  var thisbbox = nodesAll[nodeId].select("text").node().getBBox();
                  var hasFunctionName = false;
                  if(nodesAll[nodeId].select("tspan").text().trim() != ""){
                    hasFunctionName = true;
                  }

                  //Find them in the tspans
                  nodesAll[nodeId].selectAll("tspan").each(function(d, i){
                    
                    var text = d3.select(this).text();

                    // Check the matched addresses
                    for(var k = 0; k<matched_addresses.length; k++){
                      var re = new RegExp(sorted_addresses[matched_addresses[k]], 'i');
                      // var re = new RegExp("\\b" + sorted_addresses[matched_addresses[k]] + "\\b", 'i');

                      if(re.test(text)){
                        // Highlight it
                        // Add it to the list

                        // d3.select(this).style("fill", "white");
                        d3.select(this).classed("taint", true);

                        // d3.select(this).style("fill", colorScale(k));
                        

                        // var thisbbox = this.getBBox();
                        

                        // var y = thisClientRect.height*(i-1);
                        
                        var y = (i-1)*13 + 1;

                        if(hasFunctionName){
                          y = (i)*13 + 1;  
                        }

                        var x = 0;
                        var height = 14;
                        var width = thisbbox.width;

                        var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                        rect.setAttribute("x", x);
                        rect.setAttribute("y", y);
                        rect.setAttribute("width", width);
                        rect.setAttribute("height", height);


                        // rect = nodesAll[nodeId].node().insertBefore(rect, this);
                        rect = nodesAll[nodeId].select("g").node().insertBefore(rect, nodesAll[nodeId].select("text").node());

                        rect = d3.select(rect);
                        rect.style("fill", colorScale(matched_addresses[k]))
                        .style("stroke", "none");

                        // rect.classed("taint", true);

                        // var rect = nodesAll[nodeId].select("g").append("rect")
                        //  .attr("x", x)
                        //  .attr("y", y)
                        //  .attr("width", width)
                        //  .attr("height", height)
                        //  .classed("taint", true);

                        matched_tspans_graphs.push({rect: rect, tspan: d3.select(this)});
                          // matched_tspans_graphs.push(d3.select(this));

                          console.log("Taint Highlighted on graph");

                        break;
                      
                      }

                    }


                  });


                  

                  var textToHighlight = [];

                  // Highlight the trace text
                  
                  // Go through the lines;
                  // If the line contains a matching address, Put a span element in the line
                  // i.e Replace the text with <span>line</span>
                  // Prepare the array and join the array using "\n"

                  // Trace Backtaint Highlighting
                  if(isTraceSupplied){
                    if(nodeId in nodeToTextGroups){
                      textToHighlight = nodeToTextGroups[nodeId];
                    }
                  } 

                  // Previous highlighting removed at the start

                  // Start with any textblock and prepare the text to replace
                  // Then replace it in all instances
                  if(textToHighlight.length > 0){
                    var lines = textToHighlight[0].text().split('\n');

                    for(var l=0; l<lines.length; l++){
                      var line = lines[l];
                      for(var k=0; k<matched_addresses.length; k++){
                        var thisAddress = sorted_addresses[matched_addresses[k]];
                        var re = new RegExp("\\b" + thisAddress + "\\b", 'i');

                        if(re.test(line)){
                          // lines[l] = line.replace(re, "<span class = 'taint'>" + thisAddress + "</span>");
                          // lines[l] = "<span class = 'taint'>" + line + "</span>";

                          var color = colorScale(matched_addresses[k]);

                          

                          lines[l] = "<span style = 'background-color: " + color + " ; " 
                          + "color: white; "
                          + "'>" + line + "</span>";


                          break;
                        }


                      }
                    }

                    var textContent = lines.join("\n");
                    textContent = textContent.replace(/\n<\/span>/ ,"</span>");

                  }

                  
                  for(var i=0; i < textToHighlight.length; i++){
                    
                    // textToHighlight[i].classed("highlight", true);
                    // textToHighlight[i].text(textContent);
                    textToHighlight[i].node().innerHTML = textContent;

                    // replaceStr = textToHighlight[i].node().innerHTML;
                    // replaceStr = replaceStr.replace(/\n<\/span>/ ,"</span>");

                    // textToHighlight[i].node().innerHTML = replaceStr;
                  
                  }

                  console.log("Taint Highlighted on trace");

                  

                }
              }

            

    }
}



  d3.select("#myTaintSlider").on("input", function(){
    var value = this.value;
    d3.select("#sliderOutput").text(value);
  
    updateTaint(value);
    
  
  });


  d3.select("#loadFile")
        .on("click", function(){
          loadFile();
        }
      );

  // loads the dot and trace files one after the other
  // If trace file is not supplied, works with only the CFG
  function loadFile(){
    d3.select("#loading").classed("hidden", false);
    initialize();
    if(f_dot.files[0] == undefined){
    
      // No inputs provided
    
    } else {

      if(f_trace.files[0] == undefined){
        //No trace provided
        
        isTraceSupplied = false;
        fr.readAsText(f_dot.files[0]);
        fr.onloadend=function(){
          dotFile = this.result;
          dotFile = dotFile.replace(/\\l/g, "\n");

          g = graphlibDot.parse(dotFile);
          
          // Send request for loop information; load when ready
          d3.xhr("../findLoops/")
            .header("Content-Type", "text/plain")
            .post(dotFile,
              function(err, result){
                // console.log("Response: ", result.responseText);
                loopsObj = JSON.parse(result.responseText);
                
                loopify_dagre.init();
                var modifiedDotFile = loopify_dagre.modifiedDotFile;
                // console.log(modifiedDotFile);
                graph_to_display = graphlibDot.parse(modifiedDotFile);


                showGraph(isTraceSupplied);
                loopify_dagre.addBackground();

                fnManip.init();
                loopCollapser.init();
              });

          d3.select("#loading").classed("hidden", true);    

        }

      } else {

        isTraceSupplied = true;
        fr.readAsText(f_dot.files[0]);
        fr.onloadend=function(){
          dotFile = this.result;
          dotFile = dotFile.replace(/\\l/g, "\n");

          g = graphlibDot.parse(dotFile);

          fr1.readAsText(f_trace.files[0]);
          fr1.onloadend = function(){
            traceText = this.result;

            
            // Send request for loop information; load when ready
            d3.xhr("../findLoops/")
            .header("Content-Type", "text/plain")
            .post(dotFile,
              function(err, result){
                // console.log("Response: ", result.responseText);
                
                loopsObj = JSON.parse(result.responseText);
                loopify_dagre.init();
                var modifiedDotFile = loopify_dagre.modifiedDotFile;
                graph_to_display = graphlibDot.parse(modifiedDotFile);

                showGraph(isTraceSupplied);
                loopify_dagre.addBackground();

                fnManip.init();
                loopCollapser.init();

                setupTrace();
                // showGradient();
                // applyGradient(0,10);

                d3.select("#animate")
                .on("click", function(){
                  animateTracePath(currStartTextIndex, currEndTextIndex, prevStartTextIndex, prevEndTextIndex);
                });

              });

            d3.select("#loading").classed("hidden", true);

          }
        }
        
      }
    }
  }

  // Reset on loading new files
  function initialize() {
    currentNode = null;
    g = null;
    codes = [];
    currNodeHighlight = null;
    cycles = null;
    currTextHighlight = [];
    isBrushEnabled = false;
    isTooltipEnabled = true;
    brushInitialized = false;
    mouseOverColor = "white";
    mouseOverGFill = "black";
    rtDragStart = [];
    isRtDragStarted = false;
    rtDragTranslate = [];
    rtDragScale = [];
    
    traceText = "";
    nodesEndAddress = {};
    startAddrNode = {};
    nodeToTextGroups = {};
    textBlocksArray = [];

    currStartTextNode = null;
    currEndTextNode = null;
    currStartTextIndex = -1;
    currEndTextIndex = -1;
    prevStartTextIndex = -1;
    prevEndTextIndex = -1;

    textBlocksOffset = [];
    last_known_scroll_position = 0;
    ticking = false;
    last_known_panel_height = 0;

    isCycleShown = false;
    isTraceSupplied = true;

    dotFile = null;
    loopsObj = null;

    zoom = null;
    isHoverOnLeftPanel=false;

    isTripCountShown = true;
    isLoopBoundaryShown = true;

    graph_to_display = null;

    taintOutputList = [];
    prev_matched_tspans_graphs = [];
    prev_matched_span_traces = [];
    matched_tspans_graphs = [];
    matched_span_traces = [];

    match_list = {};

    is_node_dragging_enabled = false;

    // analysis_params = [];
  
  }

  // populate the dicts with nodes, edges, and edgelabels
  function fillNodesandEdges(){

    // compute the degrees of the node i.e. sum of indegrees or sum of outdegrees
    var re = /ct:(\d+)/i;
    var max_deg = 1, max_ct = 1;
    
    var graph_nodes = g.nodes();
    for(var i=0; i<graph_nodes.length; i++){
      var nodeId = graph_nodes[i];
      //Work with only the basic nodes not the function nodes
      if(g.children(nodeId).length == 0){
        //This is a basic node; Compute the degree
        var outEdges = g.outEdges(nodeId);
        var deg = 0;

        for(var j=0; j<outEdges.length; j++){
          // get the count from the edges and sum them 
          // store the degree in the graph's node object
          var label = g.edge(outEdges[j]).label;
          // Check if count is present  
          if(re.test(label)){
            var temp_ct = parseInt(label.match(re)[1]); 
            if(temp_ct > max_ct){
              max_ct = temp_ct;
            }
            deg += temp_ct;
          }
        }

        if(deg>max_deg){
          max_deg = deg;
        }
        g.node(nodeId)["degree"] = deg; 
      }
    }
    
    degreeScale = d3.scale.linear()
      .domain([0,Math.log10(max_deg)])
      .range(["#faf0e6", "#ff7f00"])
      .interpolate(d3.interpolateHcl);

    degreeBorderFillScale = d3.scale.linear()
      .domain([0,Math.log10(max_deg)])
      .range(["#f78a62", "#ad2e00"])
      .interpolate(d3.interpolateHcl);

    degreeBorderScale = d3.scale.linear()
      .domain([0,Math.log10(max_deg)])
      .range([3, 15]);

    var edgeCountScale = d3.scale.linear()
      .domain([0, Math.log10(max_ct)])
      .range([1.5, 6]);

    d3.selectAll("g.node.enter")
  		.each(function(d) { 
  			nodesAll[d] = d3.select(this);
        if(g.node(d).style=="dashed") {
            nodesAll[d].classed("dashed", true);
          }

          if("degree" in g.node(d)){
            var deg = g.node(d).degree;

            // Change this fill property to stroke property
            // nodesAll[d].select("rect").style("fill", degreeScale(Math.log10(deg)));

            // Change this stroke-width property to stroke property i.e. border fill instead of background fill
            nodesAll[d].select("rect").style("stroke-width", degreeBorderScale(Math.log10(deg)));

            // nodesAll[d].select("rect").style("stroke-width", 15);
            // nodesAll[d].select("rect").style("stroke", degreeBorderFillScale(Math.log10(deg)));

          }

  		 });	

  	// var def_stroke_width = parseFloat(d3.select("g.edgePath.enter").style("stroke-width"));

  	d3.selectAll("g.edgePath.enter")
  		.each(function(d){

  			if(!(g.hasEdge(d))){
          d3.select(this).remove(); 
          return;
        }

        edgesAll[d] = d3.select(this);

        if(g.edge(d).style=="dashed") {
            edgesAll[d].classed("dashed", true);
        }

        //Encode the edge count with edge width
        //get the edge count
        var label = g.edge(d).label;
          
        // Check if count is present  
        if(re.test(label)){
          var ct = parseInt(label.match(re)[1]);
          ct = Math.log10(ct);

          // if(ct<0) {ct = 0;}
          // ct = ct*def_stroke_width + def_stroke_width;
          // edgesAll[d].style("stroke-width", ct+"px");

          edgesAll[d].style("stroke-width", edgeCountScale(ct)+"px");

        }

  		});	

  	d3.selectAll("g.edgeLabel.enter")
  		.each(function(d){
        if(!(g.hasEdge(d))){
          d3.select(this).remove(); 
          return;
        }

  			edgeLabelsAll[d] = d3.select(this);
  		});	

  }

  // draws an edge between the nodes u & v; 
  // updates the path which is provided as input
  function drawEdge(u, v, edge){

    var path = edge.select("path");
    var rect1 = u.select("rect");
    var uTransformText = u.attr("transform");
    var uTranslate = d3.transform(uTransformText).translate;  //returns [tx,ty]

    var rect2 = v.select("rect");
    var vTransformText = v.attr("transform");
    var vTranslate = d3.transform(vTransformText).translate;  //returns [tx,ty]

    var x1 = Number(rect1.attr("x")) + uTranslate[0];
    var y1 = Number(rect1.attr("y")) + uTranslate[1];
    var ht1 = Number(rect1.attr("height"));
    var width1 = Number(rect1.attr("width"));
  
    var x2 = Number(rect2.attr("x")) + vTranslate[0];
    var y2 = Number(rect2.attr("y")) + vTranslate[1];
    var ht2 = Number(rect2.attr("height"));
    var width2 = Number(rect2.attr("width"));

    var x1new, x2new, y1new, y2new;
                
    if((y1+ht1) < y2) {
      y1new = y1+ht1;
      x1new = x1 + width1/2.0;
      x2new = x2 + width2/2.0;
      y2new = y2;
    } else if (y1 > (y2+ht2)){
      y1new = y1;
      x1new = x1 + width1/2.0;
      y2new = y2 + ht2;
      x2new = x2 + width2/2.0;
    } else if (x1 > (x2+width2)) {
      y1new = y1 + ht1/2.0;
      x1new = x1;
      y2new = y2+ht2/2.0;
      x2new = x2 + width2;
    } else {

      y1new = y1+ht1/2.0;
      x1new = x1 + width1;
      y2new = y2+ht2/2.0;
      x2new = x2;  
    }           

    //Adjust it to take the translation of the edge into account
    var edgeTranslate = d3.transform(edge.attr("transform")).translate;
    x1new = x1new - edgeTranslate[0];
    y1new = y1new - edgeTranslate[1];
    x2new = x2new - edgeTranslate[0];
    y2new = y2new - edgeTranslate[1];

    // handle the self edges
    if (u.datum()===v.datum()){
      // console.log("Self loop point reached");
      path.attr("d", createSelfLoop(x1new, y1new));
    } else {
      path.attr("d", "M " + x1new + " , " + y1new + 
      " L " + x2new + " , " + y2new );
    }
  }

  function createSelfLoop(x, y){
    // console.log("Generating self loop");
    // return "M " + x + ", " + y + " L " + (x-10) + ", " + (y-4) + " C " + (x-20) 
    // + ", " + (y-6) + ", " + (x-40) +", " + (y-15) + ", " + (x-49) + ", " 
    // + (y-8) +" C "+ (x-59) + ", " + (y-1) + ", " + (x-59) + ", " + (y+21)
    // + ", " + (x-59) + ", " + (y+43) + " C " + (x-59) + ", " + (y+65) + ", "
    // + (x-59) + ", " + (y+87) + ", " + (x-49) + ", " + (y-94) + " C " + (x-40) 
    // + ", " + (y+102) + ", " + (x-20) + ", " + (y+94) + ", " + (x-10) + ", " + 
    // y+90 + " L " + x + ", " + (y+87);

    return "M " + x + ", " + y + " L " + (x+50) +", " + (y+70)
    + " L " + (x+150) + ", " + (y+70) + " L " + (x+150) +", " 
    + (y-70) + " L " + (x+50) + ", " + (y-70) + " L " + x + ", " + y;

  }

  // computes the bounding box of a group of nodes
  // Input index is the id of the group
  // Returns a bounding box with left, top, right, and bottom attributes
  function computeBoundingBox(index) {

    var grpbbox = {left:null, right:null, top:null, bottom:null};

  	for(var i = 0; i < nodeGroups[index].length; i++){
  		var nodeId = nodeGroups[index][i];
  		var node = nodesAll[nodeId];

  		var transformText = node.attr("transform");
  		var translate = d3.transform(transformText).translate; //returns [tx,ty]

  		var rect = node.select("rect");

  		var x = Number(rect.attr("x")) + translate[0];
        var y = Number(rect.attr("y")) + translate[1];
        var height = Number(rect.attr("height"));
        var width = Number(rect.attr("width"));

        if(grpbbox.left === null || x < grpbbox.left) grpbbox.left = x;
        if (grpbbox.top === null || y < grpbbox.top) grpbbox.top = y;
        if(grpbbox.right === null || (x+width) > grpbbox.right) grpbbox.right = x+width;
        if(grpbbox.bottom === null || (y+height) > grpbbox.bottom) grpbbox.bottom = y+height;

  	}
    
    //code to test bounding box 
    // d3.select("#graphContainer g").append("rect")
    //   .attr("x", grpbbox.left)
    //   .attr("y", grpbbox.top)
    //   .attr("width", grpbbox.right - grpbbox. left)
    //   .attr("height", grpbbox.bottom - grpbbox.top)
    //   .attr("fill", "red");
  	return grpbbox;

  }

  // Inserts the node and edges between a group's meta node and its neighbors
  // index is the Id of the group
  // grpbbox is an object containing the left, top, right and bottom attributes
  function insertNodeAndEdgesofGrp(index, grpbbox){


  	var cx = (grpbbox.left + grpbbox.right)/2.0;
  	var cy = (grpbbox.top + grpbbox.bottom)/2.0;

  	var nodes = d3.select("#graphContainer g.nodes");
  	var node = nodes.append("g").attr("class","group node enter")
  		.attr("transform", "translate( " + cx + " , " + cy + " )")
  		.datum(index);

  	nodesAll[index] = node;
  	
    var rect = node.append("rect");

  	// TODO:add this node to graph g
  	// make a function 	
  		
  	
  	var innerg = node.append("g");
  	var text = innerg.append("text").attr("text-anchor", "left");
  	text.append("tspan").attr("dy", "1em").attr("x", 1)
  		.text(nodeGroupMeta[index]);

  	var textbbox = text.node().getBBox();	

    var rectbbox = {};
    rectbbox.width = textbbox.width;
    rectbbox.height = textbbox.height;

    if(rectbbox.width < 40) {
     rectbbox.width = 40;
    }
    if(rectbbox.height < 30)  {
      rectbbox.height  = 30;
    }

  	innerg.attr("transform", "translate( " + (-textbbox.width/2.0) + " , " + (-textbbox.height/2.0) + ")"); 

  	// Code to get the bounding box of text
  	// To produce an enclosing rect
 	//  var test = document.getElementById("test");
	// test.innerHTML = nodeGroupMeta[index];
	// // test.style.fontSize = fontSize;
	// var height = (test.clientHeight + 1) + "px";
	// var width = (test.clientWidth + 1) + "px";

	rect.attr("x", -(rectbbox.width/2.0 + 5))
		.attr("y", -(rectbbox.height/2.0 + 5))
		.attr("width", rectbbox.width + 10)
		.attr("height", rectbbox.height + 10)
		.attr("rx", 5)
		.attr("ry", 5);
		
	// find and draw all edges connecting nodes inside groups with nodes outside 	
  
	var grpPredecessors = [];
	var grpSuccessors = [];

  for(var i = 0; i < nodeGroups[index].length; i++){
  		var nodeId = nodeGroups[index][i];
	
  		var predecessors = g.predecessors(nodeId);
      var successors = g.successors(nodeId);

      for(var j=0; j<predecessors.length; j++) {

        	//if not part of the grp, add it in the grpPredecessors list
        	var isPartOfGrp = false;
        	for(var k=0; k<nodeGroups[index].length; k++) {
        		
        		if(predecessors[j] === nodeGroups[index][k]) {
        			isPartOfGrp = true;		
        		}
        	}
        	if(!isPartOfGrp) {
        		//if not already in grppreds, add it
        		var isAdded = false;
        		for(var l=0; l<grpPredecessors.length; l++)	{
        			if(predecessors[j] === grpPredecessors[l])	{
        				isAdded = true;
        			}
        		}

        		if(!isAdded)	{
        			grpPredecessors.push(predecessors[j]);
        		}
        	}

        }

      for(var j=0; j<successors.length; j++) {

        	//if not part of the grp, add it in the grpSuccessors list
        	var isPartOfGrp = false;
        	for(var k=0; k<nodeGroups[index].length; k++) {
        		
        		if(successors[j] === nodeGroups[index][k]) {
        			isPartOfGrp = true;		
        		}
        	}
        	if(!isPartOfGrp) {
        		//if not already in grpsuccs, add it
        		var isAdded = false;
        		for(var l=0; l<grpSuccessors.length; l++)	{
        			if(successors[j] === grpSuccessors[l])	{
        				isAdded = true;
        			}
        		}

        		if(!isAdded)	{
        			grpSuccessors.push(successors[j]);
        		}
        	}

        }
        

  }
    nodeGroupsArray[index]["predecessors"] = [];
    nodeGroupsArray[index]["edges"] = [];
    nodeGroupsArray[index]["successors"] = [];

  	for(var i=0; i< grpPredecessors.length; i++)	{

  		var edges = d3.select("#graphContainer g.edgePaths");
  		var edgeId = "g" + index + "pe" + i;

      var edge = edges.append("g").attr("class","group edgePath enter")
  		.datum(edgeId);

  		var path = edge.append("path").attr("marker-end", "url(#arrowhead)");
  		
      // Adds this to the list of edges with id such as g0e1
  		edgesAll[edgeId] = edge;

      nodeGroupsArray[index]["predecessors"].push(grpPredecessors[i]);
      nodeGroupsArray[index]["edges"].push(edgeId);
  	
      drawEdge(nodesAll[grpPredecessors[i]], nodesAll[index], edge);

      // TODO:add this edge to graph g
  		// make a function
      // add edgeLabel; need to aggregate the counts


  	}
  	for(var i=0; i<grpSuccessors.length; i++)	{

      var edges = d3.select("#graphContainer g.edgePaths");
      var edgeId = "g" + index + "se" + i;

      var edge = edges.append("g").attr("class","group edgePath enter")
      .datum(edgeId);

      var path = edge.append("path").attr("marker-end", "url(#arrowhead)");
        
      // Adds this to the list of edges with id such as g0e1
      edgesAll[edgeId] = edge;
    
      nodeGroupsArray[index]["successors"].push(grpSuccessors[i]);
      nodeGroupsArray[index]["edges"].push(edgeId);

      drawEdge(nodesAll[index], nodesAll[grpSuccessors[i]], edge);

  		// TODO: add this edge to graph g
      // make a function
      // add edgeLabel; need to aggregate the counts

  	}
    
  }

  // hides the node and edges of the group of nodes
  // index identifies the group
  function hideNodeAndEdgesofGrp(index){

    nodesAll[index].style("display", "none");
    for(var i = 0; i < nodeGroupsArray[index]["edges"].length; i++) {
      edgesAll[nodeGroupsArray[index]["edges"][i]].style("display", "none");
    }

  }

  // updateEdges when the node is moved
  function updateEdges(thisNode) {
        var nodeId = thisNode.datum();
        var tempNodeId;
        rect = thisNode.select("rect");
        // var inEdges = g.inEdges(nodeId);
        // var outEdges = g.outEdges(nodeId);
        
        var predecessors = g.predecessors(nodeId);
        var successors = g.successors(nodeId);

        // g.setNode(1);
        // g.setNode(2, "lb2");
        // g.setEdge("t1", "t2", "eb1");
        // console.log(g.node(nodeId));
        // console.log(g.edge({v:nodeId, w:successors[0]}));

        
            if(predecessors.length != 0)  {
              for(var i=0; i<predecessors.length; i++){
                
                // get the edge between the nodes
                // get the x, y, ht, width of object & predecessor
                // update the attribute of path with new start and end coordinates
                
                var edge_lbl = g.inEdges(nodeId, predecessors[i])[0];
                
                var edge = edgesAll[edge_lbl];
                var path = edge.select("path"); 
                
                var transformText = thisNode.attr("transform");
                var translate = d3.transform(transformText).translate;  //returns [0,-25]
                
                var x2 = Number(rect.attr("x")) + translate[0];
                var y2 = Number(rect.attr("y")) + translate[1];
                var ht2 = Number(rect.attr("height"));
                var width2 = Number(rect.attr("width"));

                var rect2, x1, y1, ht1, width1, translate2;

                rect2 = nodesAll[predecessors[i]].select("rect");
                tempNodeId = predecessors[i];
                var transformText = nodesAll[predecessors[i]].attr("transform");
                translate2 = d3.transform(transformText).translate;
                
                x1 = Number(rect2.attr("x")) + translate2[0];
                y1 = Number(rect2.attr("y")) + translate2[1];
                ht1 = Number(rect2.attr("height"));
                width1 = Number(rect2.attr("width"));  

                var x1new, x2new, y1new, y2new;           

                if((y1+ht1) < y2) {
                  y1new = y1+ht1;
                  x1new = x1 + width1/2.0;
                  x2new = x2 + width2/2.0;
                  y2new = y2;
                } else if (y1 > (y2+ht2)){
                  y1new = y1;
                  x1new = x1 + width1/2.0;
                  y2new = y2 + ht2;
                  x2new = x2 + width2/2.0;
                } else if (x1 > (x2+width2)) {
                  y1new = y1 + ht1/2.0;
                  x1new = x1;
                  y2new = y2+ht2/2.0;
                  x2new = x2 + width2;
                } else {

                  y1new = y1+ht1/2.0;
                  x1new = x1 + width1;
                  y2new = y2+ht2/2.0;
                  x2new = x2;  
                }           

                var cx = (x1new+x2new)/2.0;
                var cy = (y1new+y2new)/2.0;

                //Adjust it to take the translation of the edge into account
                var edgeTranslate = d3.transform(edge.attr("transform")).translate;
                x1new = x1new - edgeTranslate[0];
                y1new = y1new - edgeTranslate[1];
                x2new = x2new - edgeTranslate[0];
                y2new = y2new - edgeTranslate[1];

                // handle the self edges
                if (nodeId===tempNodeId){
                  // console.log("Self loop point reached");
                  path.attr("d", createSelfLoop(x1new, y1new));
                } else {
                    path.attr("d", "M " + x1new + " , " + y1new + 
                    " L " + x2new + " , " + y2new );
                }

                //Update the edgeLabel if there is one
                if(edgeLabelsAll[edge_lbl] == undefined || edgeLabelsAll[edge_lbl] == null){
                  //No edge label
                } else {
                  var edgeLabel = edgeLabelsAll[edge_lbl];
                  // Translate it to the midpoint
                  edgeLabel.attr("transform", "translate(" + cx +  ", " + cy + ")");
                }
                
              }
            }

            if(successors.length != 0)  {
              for(var i=0; i<successors.length; i++){
                
                var edge_lbl = g.outEdges(nodeId, successors[i])[0];
                var edge = edgesAll[edge_lbl];
                var path = edge.select("path");

                var transformText = thisNode.attr("transform");
                var translate = d3.transform(transformText).translate;  //returns [0,-25]

                var x1 = Number(rect.attr("x")) + translate[0];
                var y1 = Number(rect.attr("y")) + translate[1];
                var ht1 = Number(rect.attr("height"));
                var width1 = Number(rect.attr("width"));

                var rect2, x2, y2, ht2, width2, translate2;

                rect2 = nodesAll[successors[i]].select("rect");
                tempNodeId = successors[i];
                var transformText = nodesAll[successors[i]].attr("transform");
                translate2 = d3.transform(transformText).translate;
                
                x2 = Number(rect2.attr("x")) + translate2[0];
                y2 = Number(rect2.attr("y")) + translate2[1];
                ht2 = Number(rect2.attr("height"));
                width2 = Number(rect2.attr("width"));  

                var x1new, x2new, y1new, y2new;
                
                if((y1+ht1) < y2) {
                  y1new = y1+ht1;
                  x1new = x1 + width1/2.0;
                  x2new = x2 + width2/2.0;
                  y2new = y2;
                } else if (y1 > (y2+ht2)){
                  y1new = y1;
                  x1new = x1 + width1/2.0;
                  y2new = y2 + ht2;
                  x2new = x2 + width2/2.0;
                } else if (x1 > (x2+width2)) {
                  y1new = y1 + ht1/2.0;
                  x1new = x1;
                  y2new = y2+ht2/2.0;
                  x2new = x2 + width2;
                } else {

                  y1new = y1+ht1/2.0;
                  x1new = x1 + width1;
                  y2new = y2+ht2/2.0;
                  x2new = x2;  
                }        

                var cx = (x1new+x2new)/2.0;
                var cy = (y1new+y2new)/2.0;

                //Adjust it to take the translation of the edge into account
                var edgeTranslate = d3.transform(edge.attr("transform")).translate;
                x1new = x1new - edgeTranslate[0];
                y1new = y1new - edgeTranslate[1];
                x2new = x2new - edgeTranslate[0];
                y2new = y2new - edgeTranslate[1];   

                // handle the self edges
                if (nodeId===tempNodeId){
                  // console.log("Self loop point reached");
                  path.attr("d", createSelfLoop(x1new, y1new));
                } else {
                  path.attr("d", "M " + x1new + " , " + y1new + 
                    " L " + x2new + " , " + y2new );
                }

                //Update the edgeLabel if there is one
                if(edgeLabelsAll[edge_lbl] == undefined || edgeLabelsAll[edge_lbl] == null){
                  //No edge label
                } else {
                  var edgeLabel = edgeLabelsAll[edge_lbl];
                  // Translate it to the midpoint
                  edgeLabel.attr("transform", "translate(" + cx +  ", " + cy + ")");
                }

              }
            }
  }

  // The main function that sets up the graph, initializes all variables and 
  // sets up event listeners
  function showGraph(isTraceSupplied) {

    var svg = d3.select("#graphContainer");
    var inner = d3.select("#graphContainer g");

    // Render the graphlib object using d3.
    var renderer = new dagreD3.Renderer();
    // renderer.run(g, d3.select("#graphContainer g"));

    //Render the modified file (output from loopified code) i.e. the file with invisible edges, ports etc.
    renderer.run(graph_to_display, d3.select("#graphContainer g"));

    // Collapse all nodes by default
    // d3.selectAll("#graphContainer g.node.enter")
    // .each(function(d) { 
        
    //     var thisNode = d3.select(this);
        
    //     var tspans = thisNode.selectAll("tspan");
    //     var rect = thisNode.select("rect");
        
    //     tspans.style("display", "none");
    //     thisNode.select("tspan")
    //         .style("display", "unset");
        
    //     rect.attr("width", "100");
    //     rect.attr("height", "40");
    //     updateEdges(thisNode);    
    // });  


    // Optional - resize the SVG element based on the contents.
    var bbox = svg.node().getBBox();  // getBBox gives the bounding box of the enclosed 
                                      // elements. Its width and height can be set to a different value.

    // svg.node().style.width = "100%";
    // svg.node().style.height = "100%"; 

	  fillNodesandEdges();

    var graph_svg_width = bbox.width;
    var initialScale = parseInt(svg.style("width"), 10) / graph_svg_width;
    
	 // Set up zoom support
    zoom = d3.behavior.zoom().on("zoom", function() {
      inner.attr("transform", "translate(" + d3.event.translate + ")" +
                                  "scale(" + d3.event.scale + ")");
    });
    
    svg.call(zoom).on("dblclick.zoom", null);
       

	zoom
      // .translate([0 , 20])
      .scale(initialScale)
      .event(svg);
  
  var nodes = svg.selectAll("g.node.enter");
  var brush = svg.append("g")
      .attr("class", "brush");

  d3.select("#left").on("mouseover", function(){
    isHoverOnLeftPanel = true;
  })
  .on("mouseout", function(){
    isHoverOnLeftPanel = false;
  })

  d3.select("#enableTooltip").on("change", function(){
    isTooltipEnabled = this.checked;
  });

  d3.select("#enableNodeDrag").on("change", function(){
    is_node_dragging_enabled = this.checked;
  });  

  d3.select("#countEncoding").on("change", function(){
    isTripCountShown = this.checked;

    if(isTripCountShown){
      //enable 
          d3.selectAll("g.node.enter")
      .each(function(d) { 
        nodesAll[d] = d3.select(this);
        
          if("degree" in g.node(d)){
            var deg = g.node(d).degree;
            
            // Change the fill to stroke property
            // nodesAll[d].select("rect").style("fill", degreeScale(Math.log10(deg)));

            nodesAll[d].select("rect").style("stroke-width", degreeBorderScale(Math.log10(deg)));

          }

       });

    } else {
      //disable 
          d3.selectAll("g.node.enter")
      .each(function(d) { 
        nodesAll[d] = d3.select(this);
        
          if("degree" in g.node(d)){
            // var deg = g.node(d).degree;

            // Change this property from fill to stroke-width
            // nodesAll[d].select("rect").style("fill", "");

            nodesAll[d].select("rect").style("stroke-width", "");

          }

       });

    }

  });

  d3.select("#loopBgFill").on("change", function(){
     isLoopBoundaryShown = this.checked;

     if(isLoopBoundaryShown){
        //remove bgFill
        // d3.select("#bgFill").remove();
        // loopify_dagre.addBackground();

        d3.select("#bgFill").style("display", "unset");

        
     }  else {

        d3.select("#bgFill").style("display", "none");
     }

  });

  //enable or disable brush using checkbox
  d3.select("#enableBrush").on("change", function() {
    
    isBrushEnabled = this.checked;

    if(isBrushEnabled && !brushInitialized ) {

      svg.call(zoom).on("dblclick.zoom", null)
        .on("mousedown.zoom", null)
        .on("touchstart.zoom", null)
        .on("touchmove.zoom", null)
        .on("touchend.zoom", null);

      brush.call(d3.svg.brush()
        .x(d3.scale.identity().domain([0, parseInt(svg.node().style.width, 10)]))
        .y(d3.scale.identity().domain([0, parseInt(svg.node().style.height, 10)]))
        .on("brush", function() {
        })
        .on("brushend", function() {

          var extent = d3.event.target.extent();
          currentTempGrp = [];
            
          nodes.classed("selected", function(d) {
            var rect = d3.select(this).select("rect");

            // use axis-aligned rectangle collision code
            // return extent[0][0] <= d.x && d.x < extent[1][0]
           //      && extent[0][1] <= d.y && d.y < extent[1][1];

            var transformText = d3.select(this).attr("transform");
            var translate = d3.transform(transformText).translate;  //returns [tx,ty]

           var x = Number(rect.attr("x")) + translate[0];
           var y = Number(rect.attr("y")) + translate[1];
           var height = Number(rect.attr("height"));
           var width = Number(rect.attr("width"));

           transformText = inner.attr("transform");
           var scale = d3.transform(transformText).scale;
           var translate2 = d3.transform(transformText).translate;

           // console.log(typeof scale[0]);

           x = x*scale[0] + translate2[0];
           y = y*scale[0] + translate2[1]; 
           width = width*scale[0];
           height = height*scale[0]; 

           if(x < extent[1][0]  && x + width > extent[0][0] 
              && y < extent[1][1] && y + height > extent[0][1]) {

              // console.log(d);
              currentTempGrp.push(d3.select(this).datum()); 
              return true;
            }
            
          return false;

          });
        }));
    } else if(isBrushEnabled){

      svg.call(zoom).on("dblclick.zoom", null)
        .on("mousedown.zoom", null)
        .on("touchstart.zoom", null)
        .on("touchmove.zoom", null)
        .on("touchend.zoom", null);

      brush.classed("invisible", false);

    } else {
      svg.call(zoom).on("dblclick.zoom", null);
      brush.classed("invisible", true);
    }
  }); 

	d3.select("#save")
    .on("click", function(){
        var bbox = svg.node().getBBox();
        var text = '<!--?xml version="1.0" encoding="UTF-8" standalone="no"?-->\n';
        // text += '<?xml-stylesheet href="style.css" type="text/css"?>\n';
        text += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
        text += '<svg id="graphContainer"' + ' width="' + parseInt(bbox.width) + 'px" height="' + parseInt(bbox.height) + 'px" viewBox="0 0 '
          + bbox.width + ' ' + bbox.height + '"'
          + ' xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' ;
        
        //Embed the CSS here
        text+= '<defs>\n<style type="text/css"><![CDATA[';

        //get the CSS 
        d3.text("../static/trace_CFG/style.css", function(error, strCSS) {
          if (error) throw error;
          text+= strCSS;
          text+= ']]></style>\n</defs>';

          text += svg.node().innerHTML;
          text += "</svg>";
          saveTextAsFile(text); 
        });

        

    });    
    
    d3.select("#showCycles")
        .on("click", function(){
        	if(!isCycleShown){
          		showCycles();
          		isCycleShown = true;
          		d3.select(this).attr("value", "Hide Cycles");
      		}	else {
      			d3.selectAll("g.node.enter").select("rect").style("fill", "");
      			d3.selectAll("g.node.enter").attr("fill", "");
      			isCycleShown = false;
            d3.select(this).attr("value", "Show Cycles");
      		}
        }
      );

    /* Disabled this feature, Will collapse instead */
      // $("g.node.enter").click(function(){
      //           $(this).find("tspan").toggle(); 
      //       });  

    // If trace is supplied, find the trace text instead of the CFG text
    // Setup highlighting and linking code to link to trace blocks instead of CFG blocks if trace supplied
    // getCodefromGraph(); 
    if(!isTraceSupplied){
      getCodefromGraph();
    } 

    d3.select("body")
    	.on("keydown", function(){
    		if( d3.event.keyCode == 8)	{
    			// console.log("Delete key Pressed");

          if(isBrushEnabled)  {
            return;
          }

    			if(currentNode)	{
    				d3.select(currentNode)
    					.style("display", "none");
            var nodeId = d3.select(currentNode).datum();
            var inEdges = g.inEdges(nodeId);
            var outEdges = g.outEdges(nodeId);
            if(inEdges.length != 0 || outEdges.length != 0) {
              d3.selectAll("g.edgePath.enter")
                .filter(function(d){
                  for(var i=0; i<inEdges.length; i++){
                    if(inEdges[i] === d){
                      return true;
                    }
                  }
                  for(var i=0; i<outEdges.length; i++){
                    if(outEdges[i] === d){
                      return true;
                    }
                  }
                  return false;    
                })
                .style("display", "none");
                
            }
    			}
    		} 

    		else if(d3.event.keyCode == 71) { //Pressed key 'g'
          		
          		if(currentTempGrp.length > 1){

                // console.log(currentTempGrp);
                
            		nodeGroups.push(currentTempGrp);
            		var grpName = prompt("Give a name for the group", nodeGroups.length);
            		nodeGroupMeta.push(grpName);
            		var index = nodeGroups.length - 1;
            		isNodeGrpCollapsed.push(false);
                nodeGroupsArray[index] = {};

            		var div_nodegrps = d3.select("#nodeGrpView");
            		div_nodegrps.append("p")
            			.text(grpName)
            			.datum(index)
            			.on("dblclick", function(){
            				
		                    var index = d3.select(this).datum();

		                    if(isNodeGrpCollapsed[index] === true)	{
		            					// uncollapse


                    for(var i = 0; i < nodeGroups[index].length; i++){
                                
                                var nodeId = nodeGroups[index][i];
                                // console.log(nodeId);
                                var inEdges = g.inEdges(nodeId);
                                var outEdges = g.outEdges(nodeId);

                                for(var j=0; j<inEdges.length; j++) {
                                  edgesAll[inEdges[j]].style("display", "unset");
                                }
                                for(var j=0; j<outEdges.length; j++) {
                                  edgesAll[outEdges[j]].style("display", "unset");
                                }

                                nodesAll[nodeId].style("display", "unset");
                                

                          }

                                // unhideAllNodesandEdges(index);
                                
                                hideNodeAndEdgesofGrp(index);
    


		            					// alert("Will unCollapse");
		            					isNodeGrpCollapsed[index] = false;
		            		}	else {
		            					
                          

                          

		                      	// collapse
			    					for(var i = 0; i < nodeGroups[index].length; i++){
				                        
				                        var nodeId = nodeGroups[index][i];
				                        // console.log(nodeId);
				                        var inEdges = g.inEdges(nodeId);
				                        var outEdges = g.outEdges(nodeId);

				                        for(var j=0; j<inEdges.length; j++) {
				                          edgesAll[inEdges[j]].style("display", "none");
				                        }
				                        for(var j=0; j<outEdges.length; j++) {
				                          edgesAll[outEdges[j]].style("display", "none");
				                        }

                                nodesAll[nodeId].style("display", "none");
				                        

		                      }

                                // hideAllNodesandEdges(index);
                                
                              if(!("isRendered" in nodeGroupsArray[index]) ||  nodeGroupsArray[index]["isRendered"] === false)  {
                                  grpbbox = computeBoundingBox(index);
                                  insertNodeAndEdgesofGrp(index, grpbbox);
                                  nodeGroupsArray[index]["isRendered"] = true;
                              } else {

                                nodesAll[index].style("display", "unset");
                                for (var i = 0; i < nodeGroupsArray[index]["edges"].length; i++){
                                  edgesAll[nodeGroupsArray[index]["edges"][i]].style("display", "unset");
                                }

                              }
		                      // alert("Will collapse");
		            					isNodeGrpCollapsed[index] = true;
		            		}
            		});


          		}
        	} 	
    	});

    var drag = d3.behavior.drag()  
     .on('dragstart', function() { 

      if(!is_node_dragging_enabled){
          return;
      }

     //Do Something 
      d3.event.sourceEvent.stopPropagation();
        // console.log("Event not propagated");
        
     })
     .on('drag', function() { 

        if(!is_node_dragging_enabled){
          return;
        }

        d3.select(this).attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
        updateEdges(d3.select(this));
                             })
     .on('dragend', function() { 

        if(!is_node_dragging_enabled){
          return;
        }
        updateEdges(d3.select(this)); 
     });


     var rtClickdrag = d3.behavior.drag()  
     .on('dragstart', function() { 

        // If right click was detected
        if(d3.event.sourceEvent.button == 2){
          

          console.log("Right click detected");
          // debugger;
          d3.event.sourceEvent.preventDefault();

          rtDragStart[0] = d3.event.sourceEvent.x;
          rtDragStart[1] = d3.event.sourceEvent.y;
          var rtDragTransform = d3.transform(d3.select(this).select("g").attr("transform"));  
          rtDragTranslate = rtDragTransform.translate;
          rtDragScale = rtDragTransform.scale;
          isRtDragStarted = true;

          

      }       
     })
     .on('drag', function() { 
        if(isRtDragStarted){
          d3.select(this).select("g").attr("transform", "translate(" + ((d3.event.x - rtDragStart[0])*3 + rtDragTranslate[0]) + "," 
            + ((d3.event.y - rtDragStart[1])*3 + rtDragTranslate[1]) + ") scale (" + rtDragScale[0] + ")");  
        }
        
     })
     .on('dragend', function() { 
         isRtDragStarted = false;
     });

     // d3.select("#graphContainer").on("contextmenu", function(){})
     // .call(rtClickdrag);


    d3.selectAll("g.edgePath.enter")
      .on("mouseover", function(){


        // d3.select(this).select("path").attr("stroke-width", "2.5");
        // d3.select(this).select("path").attr("stroke", "teal");  
        
        d3.select(this).classed("active", true);

      })
      .on("click", function(){
        
        var incidences = g._strictGetEdge(d3.select(this).datum());
        var u = incidences.u;
        var v = incidences.v;
        
        var clickPt = d3.mouse(this);     

        var uTransform = nodesAll[u].attr("transform");
        var vTransform = nodesAll[v].attr("transform");

        var ut = []
        var vt = [];
        
        if(d3.transform(uTransform).translate[0] > d3.transform(vTransform).translate[0]){
          ut[0] = clickPt[0] + 30;
          vt[0] = clickPt[0] - 30;  
        } else {
          ut[0] = clickPt[0] - 30;
          vt[0] = clickPt[0] + 30;
        }

        if(d3.transform(uTransform).translate[1] > d3.transform(vTransform).translate[1]){
          ut[1] = clickPt[1] + 30;
          vt[1] = clickPt[1] - 30;  
        } else {
          ut[1] = clickPt[1] - 30;
          vt[1] = clickPt[1] + 30;
        }        

        nodesAll[u].transition().duration(500)
        .ease("exp-out")
        .attr("transform", "translate(" + ut[0] + "," + ut[1] + ")");
        
        nodesAll[u].transition().duration(250).delay(1000)
        .ease("exp-in")
        .attr("transform", uTransform);

        nodesAll[v].transition().duration(500)
        .ease("exp-out")
        .attr("transform", "translate(" + vt[0] + "," + vt[1] + ")");
        
        nodesAll[v].transition().duration(250).delay(1000)
        .ease("exp-in")
        .attr("transform", vTransform);

      })
      .on("mouseout", function(){
        // d3.select(this).select("path").attr("stroke-width", "1");
        // d3.select(this).select("path").attr("stroke","black");  

        d3.select(this).classed("active", false);

    });

      
    d3.selectAll("g.node.enter")
      // .on("click", function()){
      // 		currentNode = this;
      // })	

      /*
      .on("dblclick", function(){

        // d3.event.sourceEvent.stopPropagation();   
    		
        var tspans = d3.select(this).selectAll("tspan");
    		var rect = d3.select(this).select("rect");
        var thisNode = d3.select(this);
    		var height = rect.node().getBBox().height;
    		// console.log(height);

    		num_lines = tspans.size();
    		// console.log(num_lines);	

    		tspans.style("display", "none");
    		d3.select(this).select("tspan")
            .style("display", "unset");
    		
    		rect.attr("height", "40");

        updateEdges(thisNode);

    		

      })
      */

      .on("mouseover", function(){

        if(isBrushEnabled)  {
          return;
        }
        var thisNode = d3.select(this);
        mouseOverGFill = thisNode.attr("fill");
        var rect = thisNode.select("rect");
        mouseOverColor = rect.style("fill");

        // thisNode.attr("fill", "white");
        // rect.style("fill", "teal");
        
        thisNode.classed("active", true);

        currentNode = this;
        var nodeId = thisNode.datum(); 

        var textToHighlight = [];

        // Linked Highlighting
        if(isTraceSupplied){
          if(nodeId in nodeToTextGroups){
            textToHighlight = nodeToTextGroups[nodeId];
          }
        } else {
          if(nodeId in nodeToTextGroups){
            textToHighlight = nodeToTextGroups[nodeId];
          } else {
            textToHighlight = d3.selectAll("#text_code p")
              .filter(function(d) {
                return nodeId === d;
              });
          }

        }
        
        for(var i=0; i<currTextHighlight.length; i++){
          // d3.select(currTextHighlight[i]).style("border-style", "none");
          d3.select(currTextHighlight[i]).classed("highlight", false); 
        }

        currTextHighlight = [];

        for(var i=0; i < textToHighlight.length; i++){
          currTextHighlight.push(textToHighlight[i].node());
          // textToHighlight[i].style("border-color", "teal")
          //   .style("border-style", "solid")
          //   .style("border-width", "2px");

          textToHighlight[i].classed("highlight", true);
          if(i==0){
            //Scroll to the first matching block
            d3.select("#right").node().scrollTop = textToHighlight[i].node().offsetTop;
          }

        }
         
         if(isTooltipEnabled){

            //Get the mouse event's x/y values relative to the containing div
            var pos = [0,0];
            pos = d3.mouse(d3.select("#left").node());
            var xPosition = pos[0];	
            var yPosition = pos[1];

            var text = "";
            thisNode.selectAll("text tspan").each(function(){
              text+=d3.select(this).text() + "<br/>";
            });

            var width = rect.node().getBBox().width;

            //Update the tooltip position and value
            d3.select("#tooltip")
              .style("left", xPosition + "px")
              .style("top", yPosition + "px")
              .style("width", function(){return (width*1.25) + "px"})
              .select("#value")
              .node().innerHTML = text;
              // .text(text);

            //Show the tooltip
            d3.select("#tooltip").classed("hidden", false);
          }

      })
      .on("mouseout", function(){

        if(isBrushEnabled)  {
          return;
        }

        // d3.select(this).attr("fill", mouseOverGFill);  
        // d3.select(this).select("rect").style("fill", mouseOverColor);
        d3.select(this).classed("active", false);

        // for(var i = 0; i<currTextHighlight.length; i++){
        //         d3.select(currTextHighlight[i]).style("border-style", "none");
        //         d3.select(currTextHighlight[i]).classed("highlight", false);
        // }

        // currTextHighlight = [];
        currentNode = null;
        
        //Hide the tooltip
        d3.select("#tooltip").classed("hidden", true);

      })
    .call(drag);

    // setupHighlight();
      
  }

  /*
  function setupHighlight(){
    $('#text_code').mouseup(function(e) {
        var selection = getSelected();
        if(selection && (selection = new String(selection).replace(/^\s+|\s+$/g,''))) {
   
          // alert(selection);

          var posX = $(this).offset().left,
            posY = $(this).offset().top;
          // alert((e.pageX - posX) + ' , ' + (e.pageY - posY));

          countlines(e.pageX - posX, e.pageY - posY);
          
        }
      });
    
  }

  function getSelected() {
    if(window.getSelection) { return window.getSelection(); }
    else if(document.getSelection) { return document.getSelection(); }
    else {
      var selection = document.selection && document.selection.createRange();
      if(selection.text) { return selection.text; }
      return false;
    }
    return false;
  }

  function countlines(rel_posX, rel_posY){
    pre_element = document.getElementById('text_code');
    height = pre_element.offsetHeight;
    console.log(height);
    //lineHeight = parseInt(element.style.lineHeight);

    //lineHeight = document.defaultView.getComputedStyle(document.getElementById('right'), null).getPropertyValue("lineHeight");

    textContent = pre_element.textContent;
    lines = textContent.split(/\r\n|\r|\n/).length

    // console.log(lineHeight);
    // lines = height / lineHeight;
    
    // alert("Lines: " + lines);

    // rel_posX, rel_posY are relative to the div#right element

    // alert(rel_posY + ", " +  height);
    alert( "Line No: " + Math.ceil( rel_posY / height * lines));
    
    var gnode = $("g.node.enter rect")[0];
    console.log(gnode);
    // gnode.setAttribute("style", "color:#FFF; background-color:#DF3D82;");  
    gnode.style.fill = "#DF3D82";  
  }

*/

  // Sets up trace
  // Works on the traceText global variable
  // Sets up markers by matching the first address of the CFG basic block with the address on the line of trace
  // A CFG contains an instruction in only one of the basic blocks.
  // Scan through the trace, add start when encountering the first addr of one of the basic blocks
  // End marker when the ending address arrives
  // For the next line, repeat the process
  function setupTrace(){

    // console.log(g);

    var nodes = g.nodes();
    var num_nodes = nodes.length;

    // loop through all the nodes and setup dicts of firstAddress and lastAddress with the nodeIds
    for(var i=0; i<num_nodes; i++)  {
      var nodeId = nodes[i];
      var label = g.node(nodeId).label;
      // console.log(label);
      var temp = label.split('\\n');
      if(temp.length > 1){
        var firstAddr = temp[1].split(':')[0];
        var lastAddr = temp[temp.length-1].split(':')[0];
        // console.log(firstInstr + " : " + lastInstr);

        // Create an entry in the dict of node addresses
        nodesEndAddress[nodeId] = {startAddr: firstAddr, endAddr: lastAddr};
        // Also create an entry in the dict of start addresses for fast lookup of node with the start Address in the trace
        startAddrNode[firstAddr] = nodeId;
      }
    }
  
    // loop through the trace file and add it to the array of trace instruction block
    // Make p elements for every such block
    
    var documentFragment = document.createDocumentFragment();
    documentFragment = d3.select(documentFragment);

    var traceLines = traceText.split("\n");
    var num_lines = traceLines.length;
    // console.log(num_lines);

    var instrs = [];
    var isBlockStarted = false;
    var currStartAddr = "";
    var currEndAddr = "";
    var currLine = "";
    var currAddr = "";
    var tempSplit = [];
    var currNodeId = "";
    var currCodeBlock = "";
    var currInstr = {};
    var isNonMatch = false;

    var codeBlocks = [];

    for(var i=0; i<num_lines; i++) {
      currLine = traceLines[i];
      if(currLine.split(' ').length < 2){
        currCodeBlock += currLine + "\n";
        continue;
      }
      currAddr = currLine.split(' ')[1];
      // console.log(currAddr);

      if(!isBlockStarted){

        currNodeId = startAddrNode[currAddr];
        
        if(currNodeId == undefined){
          if(isNonMatch){
            currCodeBlock += currLine + "\n";
          } else {
            currCodeBlock = currLine + "\n";
          }
          isNonMatch = true;
          continue;
        } else if(isNonMatch){
          isNonMatch = false;
          //TODO:add the node here
          // This is the text block which has no matching node in CFG
          // Currently, the tool ignores these text
          // Adding them to the right with other text blocks may introduce some errors in the
          // autoscrolling logic
          // Need to make sure nothing breaks if this is added as one of the p blocks
          // Currently, the assumption is that no matter where the user has scrolled, we can find at least one corresponding node in the CFG
          // and apply the gradient
          // Also the index of the p block is closely tied to code block array, text block array, text block offset array etc.
        }


        currInstr = {nodeId: currNodeId};
        
        currStartAddr = nodesEndAddress[currNodeId].startAddr;
        currEndAddr = nodesEndAddress[currNodeId].endAddr;

        // Reset the code block
        currCodeBlock = "";
        isBlockStarted = true;
      }

      currCodeBlock += currLine + "\n";

      if(currAddr === currEndAddr){
        // add the code block to the docFragment
        isBlockStarted = false;
        // currInstr.codeBlock = currCodeBlock;
        codeBlocks.push(currCodeBlock);

        instrs.push(currInstr);
        if (!(currNodeId in nodeToTextGroups)) {
          nodeToTextGroups[currNodeId] = [];
        }

        //documentFragment makes the custom styling not possible. So, although its more efficient, do it the normal way instead using enter selection in d3.
        
        // nodeToTextGroups[currNodeId].push(documentFragment.append("p").datum(currInstr).text(currCodeBlock));

        // var elem = documentFragment.append("p").datum(currInstr).text(currCodeBlock);
        // nodeToTextGroups[currNodeId].push(elem);
        // textBlocksArray.push(elem);
      } 
    }
    

    // console.log(documentFragment.node());
    // d3.select("#graphContainer").style("display", "none");	// Reduces reflow i.e. repeated rendering during the appending of document fragment to the right div
    // d3.select("#text_code").node().appendChild(documentFragment.node());
    // d3.select("#graphContainer").style("display", "unset");

    d3.select("#text_code")
      .selectAll("p")
      .data(instrs)
      .enter()
      .append("p")
      .text(function(d, i){
        return codeBlocks[i];
      });

    d3.selectAll("#text_code p")
      .each(function(d,i){
          var thisNode = d3.select(this);
          textBlocksArray[i] = thisNode;
          nodeToTextGroups[d.nodeId].push(thisNode);
          textBlocksOffset.push({p:thisNode, start:this.offsetTop, end: this.offsetTop + this.clientHeight});
      })
      .on("mouseover", function(d){

        // Get the associated nodeID
        var nodeId = d.nodeId;  
        
        // d3.select(currNodeHighlight).select("rect").style("fill", "white"); 
        d3.select(currNodeHighlight).classed("highlight", false);

        currNodeHighlight = nodesAll[nodeId].node();
        // d3.select(currNodeHighlight).select("rect").style("fill", "teal");
        d3.select(currNodeHighlight).classed("highlight", true);

        d3.select(this).classed("active", true);
        currentText = this;

      })
      .on("mouseout", function(d){

        d3.select(this).classed("active", false);  
        
        //Get the nodeId
        var nodeId = d.nodeId;
        if(currNodeHighlight){
          // d3.select(currNodeHighlight).select("rect").style("fill", "white");
          // d3.select(currNodeHighlight).classed("highlight", false);
        }
        // currNodeHighlight = null;
        currentText = null;

      })
      /*
      .on("click", function(d, i){
        d3.select(currStartTextNode).classed("start", false);
        currStartTextNode = this;
        prevStartTextIndex = currStartTextIndex;
        prevEndTextIndex = currEndTextIndex;

        currStartTextIndex = i;
        d3.select(this).classed("start", true);
        applyGradient(currStartTextIndex, currEndTextIndex, prevStartTextIndex, prevEndTextIndex);

      })
      .on("dblclick", function(d,i){
        d3.select(currEndTextNode).classed("end", false);
        currEndTextNode = this;
        prevStartTextIndex = currStartTextIndex;
        prevEndTextIndex = currEndTextIndex;

        currEndTextIndex = i;
        d3.select(this).classed("end", true);
        applyGradient(currStartTextIndex, currEndTextIndex, prevStartTextIndex, prevEndTextIndex);

      })
      */
      .on("click", function(d){
        if(d.nodeId in nodesAll){
          // scrollToNode(nodesAll[d.nodeId]);
        }
      });

      var divRight = d3.select("#right");
      last_known_scroll_position = divRight.node().scrollTop;
      last_known_panel_height = divRight.node().offsetHeight;

      autoHighlightOnScroll(last_known_scroll_position, 
        last_known_panel_height);

      divRight
        .on("scroll", function() {
        last_known_scroll_position = this.scrollTop;
        last_known_panel_height = this.offsetHeight;
        // console.log(this.scrollTop + " scrolled");

        if(!ticking)  {
          window.requestAnimationFrame(function(){
            autoHighlightOnScroll(last_known_scroll_position, last_known_panel_height);
            // console.log("Rendered on scroll " + last_known_scroll_position);
            ticking = false;
          });
        }
        ticking = true;
      });


  }

  function showGradient(){
    var bar = d3.select("#gradient");

    var colorScale = d3.scale.linear()
    .domain([0,150])
    // .range(["#deebf7", "#3182bd"])

    // Tone down the gradient

    .range(["#deebf7", "#70aad3"])
    .interpolate(d3.interpolateHcl);

    var data = d3.range(0,148,5);

    bar.selectAll("div").data(data)
      .enter().append("div").style("width", "5px")
      .style("height", "100%")
      .style("position", "absolute")
      .style("left", function(d){ return d + "px"})
      .style("background-color", function(d){return colorScale(d)});

  }

  // Applies gradient: a = starting index of the textblock, b = ending index of the textblock
  // prev_a & prev_b are used to clear the previous coloring
  function applyGradient(a,b, prev_a, prev_b){
    var color;

    var colorScale = d3.scale.linear()
    .domain([a,b])
    // .range(["#deebf7", "#3182bd"])
    .range(["#deebf7", "#70aad3"])
    .interpolate(d3.interpolateHcl);

    for(var i = prev_a; i<=prev_b; i++){
      if(i >= 0 && i < textBlocksArray.length){
        nodesAll[textBlocksArray[i].datum().nodeId].select("rect").style("fill", "");
        textBlocksArray[i].style("background-color", "");
      }
    }

    for(var i = a; i<=b; i++){
      if(i >= 0 && i < textBlocksArray.length){
        color = colorScale(i);
        nodesAll[textBlocksArray[i].datum().nodeId].select("rect").style("fill", color);
        textBlocksArray[i].style("background-color", color);
      }
    }

    var u,v; 
    var edge;
    for (var i=prev_a+1; i<=prev_b; i++){
      if(i>0 && i<textBlocksArray.length){
        u = textBlocksArray[i-1].datum().nodeId;
        v = textBlocksArray[i].datum().nodeId;

        edge = g.outEdges(u,v)[0];
        if(edge === undefined){
          continue;
        }
        edgesAll[edge].classed("highlight", false);
        edgeLabelsAll[edge].classed("highlight", false);
      }
    }

    for (var i=a+1; i<=b; i++){
      if(i>0 && i<textBlocksArray.length){
        u = textBlocksArray[i-1].datum().nodeId;
        v = textBlocksArray[i].datum().nodeId;

        edge = g.outEdges(u,v)[0];
        if(edge === undefined){
          continue;
        }
        edgesAll[edge].classed("highlight", true);
        edgeLabelsAll[edge].classed("highlight", true);
      }
    }

    // Disable animation for autoscroll highlighting
    // animateTracePath(a,b, prev_a, prev_b);

  }

  function animateTracePath(a,b, prev_a, prev_b){
    
    if(a<0 || b < 0 || a >= textBlocksArray.length || b >= textBlocksArray.length){
      return;
    }

    var colorScale = d3.scale.linear()
    .domain([a,b])
    // .range(["#deebf7", "#3182bd"])
    .range(["#deebf7", "#70aad3"])
    .interpolate(d3.interpolateHcl);

    //cancel previous transitions
    for(var i=prev_a; i<=prev_b; i++){
      if(i>=0 && i<textBlocksArray.length){
        textBlocksArray[i].transition().duration(0).style("background-color", "");
        var rect = nodesAll[textBlocksArray[i].datum().nodeId].select("rect");
        rect.transition().duration(0).style("fill", "");
      } 
    }

    textBlocksArray.slice(a,b+1).forEach(function(block, index){
        setTimeout(function(){
            // var blockColor = block.style("background-color");
            var rect = nodesAll[block.datum().nodeId].select("rect");
            var nodeColor = colorScale(a+index);
            // block.transition().duration(250).style("background-color", "#f1b3a7").transition().style("background-color", "");
            block.transition().duration(250).style("background-color", "#f1b3a7").transition().style("background-color", nodeColor);
            rect.transition().duration(250).style("fill", "#f1b3a7").transition().style("fill", nodeColor);
        },
        500 * index);
    })
    
    // Sample staggered animation in d3
    // d3.selectAll("#text_code p")
    //   .filter(function(d,i){
    //     return i >=a && i <=b;
    //   })
    //   .style("background-color", "blue")
    //   .transition()
    //   .duration(1000)
    //   .delay(function(d,i){return i*2000;})
    //   .style("background-color", "orange");

  }

  function interpolateSearch(arr, value, key){

     var lo = 0;
     var hi = arr.length - 1;
     var mid = -1;
     // var comparisons = 1;      
     var index = -1;

     while(1) {

        if(lo>=hi || arr[lo].key == arr[hi].key){
          
          break;
        }
        // console.log("Comparison:" + comparisons);
        // console.log(lo + " : " + arr[lo].key );
        // console.log(hi + " : " + arr[hi].key );
        // comparisons++;

        // probe the mid point 
        mid = lo + Math.floor(((hi - lo) / (arr[hi].key - arr[lo].key)) * (value - arr[lo].key));
        // console.log("mid = " + mid);

        // value found 
        if(arr[mid].key == value) {
           index = mid;
           break;
        } else {
           if(arr[mid].key < value) {
              // if value is larger, value is in upper half 
              lo = mid + 1;
           } else {
              // if value is smaller, value is in lower half 
              hi = mid - 1;
           }
        }               
     }
     
     // console.log("Total comparisons: " + --comparisons);
     return index;

  }


  function autoHighlightOnScroll(scrollTop, panelSize){

        //Search the textblocks that are in the current view
        //Those textblocks that are within the range: [scrollTop, scrollTop+offsetHeight] 
        // i.e. bottom end greater than top end of the view
        // and top end less than bottom end of the view

        //TODO:Use interpolation search instead, use currentStartIndex as midpoint
        var foundStart = false;
        
        prevStartTextIndex = currStartTextIndex;
        prevEndTextIndex = currEndTextIndex;

        var num_blocks = textBlocksOffset.length;
        var i=0;
        for(; i<num_blocks; i++){
          if(textBlocksOffset[i].end >= scrollTop )  {
            if(textBlocksOffset[i].start <= scrollTop+panelSize){
              if(!foundStart){
                currStartTextIndex = i;
                currStartTextNode = textBlocksOffset[i].p;
                foundStart = true;
              }
              
            } else {
              break;
            }
          }
        }
        
        //TODO: This can be zero; Make it 1 to avoid out of bounds array indexing. Check if it causes other problems.
        // Making it non zero does not fix the problem.
        // if(i==0){
        //   i = 1;
        // }
        
        currEndTextIndex = i-1;
        currEndTextNode = textBlocksOffset[i-1].p;
        
        applyGradient(currStartTextIndex, currEndTextIndex, prevStartTextIndex, prevEndTextIndex);

        scrollToNode(nodesAll[textBlocksArray[currStartTextIndex].datum().nodeId]);

        // Update currStartTextIndex, currEndTextIndex
        // prevStartTextIndex = currStartTextIndex;
        // prevEndTextIndex = currEndTextIndex;
        // currStartTextIndex = i;
        // currEndTextIndex = i;
        // currStartTextNode = this;
        // currEndTextNode = this;
        // applyGradient(currStartTextIndex, currEndTextIndex, prevStartTextIndex, prevEndTextIndex);

  }

  // If trace text not supplied, switches to CFG-only mode
  // Extracts text from CFG, sorts it and places it in the right panel
  // Wires up linked highlighting
  // TODO:Add linked scrolling to trace and non-trace version
  function getCodefromGraph(){
    var nodes = g.nodes();
    var num_nodes = nodes.length;
    for (var i=0; i<num_nodes; i++)  {
      var nodeId = nodes[i];
      var label = g.node(nodeId).label;
      label = label.trim();
      label = label.replace(/^{|}$/g, '');
      label = label.replace(/\\n/g, "\n");
      
      // Handle both the static and dynamic trace
      // Static trace has a format like "{%1:\n....}""
      // Dynamic trace has a format like "\n401233f:push dl....\n"
      // Dyn trace does not contain '%', may contain ':'

      // var firstInstr = label.substring(0, label.indexOf("\n"));
      var firstInstr = label.split('\n', 1)[0];
      
      // firstInstr = firstInstr.substring(firstInstr.indexOf("%") + 1, firstInstr.indexOf(":"));
      firstInstr = firstInstr.split(':', 1)[0];
      firstInstr = firstInstr.substring(firstInstr.indexOf("%") + 1);

      var code = {};
      code['nodeId'] = nodeId;
      code['label'] = label;
      code['firstInstr'] = firstInstr;
      codes[i] = code;

    }    
    
    // sort the codeblocks based on the addresses or labels
    codes.sort(function(a,b){
      return a.firstInstr - b.firstInstr; 
    });

    d3.select("#text_code")
      .selectAll("p")
      .data(codes)
      .enter()
      .append("p")
      .text(function(d){
        return d.label;
      });

    d3.select("#text_code")
      .selectAll("p")
      .each(function(d){
        nodeToTextGroups[d.nodeId] = [d3.select(this)];
      })
      .on("mouseover", function(d){

        // Get the associated nodeID
        var nodeId = d.nodeId;  
        
        // d3.select(currNodeHighlight).select("rect").style("fill", "white"); 
        d3.select(currNodeHighlight).classed("highlight", false);

        if (nodeId in nodesAll) {
          currNodeHighlight = nodesAll[nodeId].node();
          
        } else {
          currNodeHighlight = null;
        }
        // d3.select(currNodeHighlight).select("rect").style("fill", "teal");
        d3.select(currNodeHighlight).classed("highlight", true);

        d3.select(this).classed("active", true);
        currentText = this;

      })
      .on("mouseout", function(d){

        d3.select(this).classed("active", false);  
        
        //Get the nodeId
        var nodeId = d.nodeId;
        if(currNodeHighlight){
          // d3.select(currNodeHighlight).select("rect").style("fill", "white");
          // d3.select(currNodeHighlight).classed("highlight", false);
        }
        // currNodeHighlight = null;
        currentText = null;

      })
      .on("click", function(d){
        if(d.nodeId in nodesAll){
          scrollToNode(nodesAll[d.nodeId]);
        }
      }); 

  }

  // Shows cycle nodes in different colors
  function showCycles(){
    var cycles = graphlib.alg.findCycles(g);
    // console.log(cycles);
    var num_cycles = cycles.length;

    for(var i=0; i<num_cycles; i++) {
      var loop_size = cycles[i].length;
      // console.log(loop_size);
    
      for(var j=0; j<loop_size; j++) {
        
          nodesAll[cycles[i][j]]
          .attr("fill", "white")
          .select("rect")
          .style("fill", function(d){
              return colores_g[i%colores_g.length];  
          });  
      }
    }
  }

  function scrollToNode(node){

    if(isHoverOnLeftPanel){
      return;
    }

    var svg = d3.select("#graphContainer");
    var inner = svg.select("g");
    var transform = d3.transform(inner.attr("transform"));
    var scale = transform.scale[0];
    var translateX = transform.translate[0];
    var translateY = transform.translate[1];

    var svgWidth = svg.node().clientWidth;
    var svgHeight = svg.node().clientHeight;

    var nodeTransform = d3.transform(node.attr("transform"));
    var nodetX = nodeTransform.translate[0];
    var nodetY = nodeTransform.translate[1];

    var rect = node.select("rect");
    nodetX += +rect.attr("x");
    nodetY += +rect.attr("y");

    nodetX *= -scale;
    nodetY *= -scale;

    nodetX += svgWidth/2.0;
    nodetY += svgHeight/8.0;  // Shift it an eighth of the height down instead of half the height of panel

    // inner.attr("transform", "translate("+ nodetX + "," + nodetY + ") scale(" + scale + ")");
    zoom
      .translate([nodetX , nodetY])
      .event(svg);

  }

  function saveTextAsFile(textToSave) {
    var textToSaveAsBlob = new Blob([textToSave], {type:"text/plain"});
    var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    var fileNameToSaveAs = "outfile.svg";
 
    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
 
    downloadLink.click();
  }

  function destroyClickedElement(event) {
    document.body.removeChild(event.target);
  }

  // Translate to the given point
  function translateTo(cx, cy){

    var svg = d3.select("#graphContainer");
    var inner = svg.select("g");
    var transform = d3.transform(inner.attr("transform"));
    var scale = transform.scale[0];
    var translateX = transform.translate[0];
    var translateY = transform.translate[1];

    var svgWidth = svg.node().clientWidth;
    var svgHeight = svg.node().clientHeight;

    
    var tX = -cx*scale;
    var tY = -cy*scale;

    tX += svgWidth/2.0;
    tY += svgHeight/2.0; 

    // inner.attr("transform", "translate("+ tX + "," + tY + ") scale(" + scale + ")");
    zoom
      .translate([tX , tY])
      .event(svg);

  }

  Set.prototype.intersection = function(setB) {
    var intersection = new Set();
    for (var elem of setB) {
        if (this.has(elem)) {
            intersection.add(elem);
        }
    }
    return intersection;
  }

  function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }


  
// }