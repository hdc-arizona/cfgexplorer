var fnManip = (function(myExport){

	myExport = myExport || {};

	// dotFile = null;

	functionsAll = {};
	var libraryFunctionsAll = {};
	var firstCodeAddress = null;
	var isRemoveLibraryFunction = false;

	var shiftDragStart = [];
	var shiftDragTranslate = [];
	var shiftDragScale = [];
	var isShiftDragStarted = false;

  // The graph that has all the edges between individual nodes and function blocks,
  // and between function blocks
  g_function = null;

  myExport.g_function = g_function;

	myExport.init = function(){
    //check if the dot file has subgraph or not
    //functions are encoded as subgraphs
    // Do not run the code if there are no functions

    if (!(new RegExp("subgraph").test(dotFile)) ){
      return;
    }
    initVariables();
    loadFunctionBlocks();  
  };

  function initVariables(){
    shiftDragStart = [];
    isShiftDragStarted = false;
    shiftDragTranslate = [];
    shiftDragScale = [];
    
    // dotFile = null;
    functionsAll = {};
    firstCodeAddress = null;
    isRemoveLibraryFunction = false;
    libraryFunctionsAll = {};

    g_function = null;
  }

  function loadFunctionBlocks(){

  	d3.select("g.nodes").append("rect")
      .attr("id", "FnBBox")
      .style("display", "none");

    // loop through the lines of dotFile
    // ignore the first statement "digraph G"
    // ignore any line starting with //
    var isInsideDiGraph = false;
    var isInsideFunction = false;
    
    //Be careful using this var num_function, this will not match if library fns are filtered out
    var num_function = 0;
    var fnLabel;
    var entryBlock;
    var exitBlock;
    var fnNodes = [];
    var isAllLibraryFunction = true;


    var lines = dotFile.split('\n');
    for (var line = 0; line < lines.length; line++){

      var lineString = lines[line].trim();
      
      if(/digraph/i.test(lineString))  {
        isInsideDiGraph = true;
        continue;   
      }

      if(lineString.substr(0,2) == "//"){
        continue;
        // ignore the comments
      }

      // if(/subgraph\s*\d+\s*{/i.test(lineString)) {
      if(/subgraph\s*[A-Z0-9_]+\s*{/i.test(lineString)) {
      // if(lineString.substr(-1,1) == "{"){
        
        num_function++;
        isInsideFunction = true;
        // fnLabel = lineString.match(/subgraph\s*(\d+)/i)[1];
        //Functions can now be any string
        fnLabel = lineString.match(/subgraph\s*([A-Z0-9_]+)/i)[1];
        fnLabel = "Fn" + fnLabel;

        entryBlock = null;
        exitBlock = null;
        fnNodes = [];
        isAllLibraryFunction = true;

        continue;
      }

      if(lineString.substr(0,1) == "}"){
        isInsideFunction = false;
        var fn = {};
        fn.label = fnLabel;
        fn.entry = entryBlock;
        fn.exit = exitBlock;
        fn.nodes = fnNodes;
        fn.isCollapsed = false;
        fn.isRendered = false;
        fn.isAllLibraryFunction = isAllLibraryFunction;
        fn.edges = [];
        
        if(!isAllLibraryFunction || !isRemoveLibraryFunction){
          functionsAll[fnLabel] = fn;
        } else {
          libraryFunctionsAll[fnLabel] = fn;
        }
        continue;
      }

      if(isInsideFunction){
        if(/shape=box/i.test(lineString)){
          // This is a node

          // Check if its an entry or exit block
          // i.e. Check if the label is empty
          // first empty block is entry, second empty block is exit 
          if(/label=""/i.test(lineString)){
            if(entryBlock == null){
              entryBlock = lineString.match(/([A-Z0-9]+)\s*\[/i)[1];
            } else if(exitBlock == null) {
              exitBlock = lineString.match(/([A-Z0-9]+)\s*\[/i)[1];
            }

          } else{

            if(firstCodeAddress == null){
              var match;
              firstCodeAddress = (match = lineString.match(/label="\\n([A-Z0-9]+)\s*(\d+)/i))? match[1]:null;
              // firstCodeAddress = lineString.match(/label="\n([A-Z0-9]+)\s*(\d+)/i)[1];
              
              // Hardcoded for debugging purpose
              // firstCodeAddress = "400cbb";
            }

            if(firstCodeAddress != null){
              var match;
              if((match = lineString.match(/label="\\n([A-Z0-9]+)\s*(\d+)/i)) && match[1].length == firstCodeAddress.length){
                // if("400cbb".length == firstCodeAddress.length){
                // For now, check if the number of hex digits in the code address space is different from library address space
                // If they are different, then this basic block is part of a library function

                isAllLibraryFunction = false;
              }
            }

          }

          var fnNodeId = lineString.match(/([A-Z0-9]+)\s*\[/i)[1];
          fnNodes.push(fnNodeId);
        }
      }

    }

    //Done looping through the file
    //Now time to filter out the library functions, Do it in a single pass
    if(isRemoveLibraryFunction) {
      removeLibraryFunctions();
    }

    // Pre compute all the edges between Fn super nodes and regular nodes
    createFunctionNodeandEdges();


    // List all the function groups on one of the bottom panel
    
    var div_fngrps = d3.select("#fnGrpView");
    // loop through all the function blocks
    for (var label in functionsAll) {
      if (functionsAll.hasOwnProperty(label)) {
        
        // div_fngrps.append("img")
        //   .attr("src", "assets/minus.png")
        //   .attr("width", 10)
        //   .attr("height", 10);
        // var lblText = label.slice(2);

        div_fngrps.append("p")
          // .text(lblText)
          .text(getFunctionName(label))
          .datum(label)
          .on("dblclick", dblClickHandlerFnP)
          .on("mouseover", function(d){
            var label = d;
            var bbox = computeFnBBox(label);

            d3.select("#FnBBox")
              .attr("x", bbox.left)
              .attr("y", bbox.top)
              .attr("width", bbox.right - bbox.left)
              .attr("height", bbox.bottom - bbox.top)
              .style("display", "unset");

            // Now done on click
            //Auto-Center to the function on hover
            // translateTo((bbox.left+bbox.right)/2.0, (bbox.top+bbox.bottom)/2.0);

            //Highlight all the nodes that belong
            var fnNodes = functionsAll[label].nodes;
            for(var i=0; i<fnNodes.length; i++){
              nodesAll[fnNodes[i]].classed("highlight", true);
            }

          })
          .on("mouseout", function(d){
            var label = d;
            d3.select("#FnBBox").style("display", "none");
            //Unhighlight all the nodes that belong
            var fnNodes = functionsAll[label].nodes;
            for(var i=0; i<fnNodes.length; i++){
              nodesAll[fnNodes[i]].classed("highlight", false);
            }

          })
          .on("click", function(d){
            var label = d;
            var bbox = computeFnBBox(label);

            //Auto-Center to the function on hover
            translateTo((bbox.left+bbox.right)/2.0, (bbox.top+bbox.bottom)/2.0);

          })
          ;
      }
    }

  }

  function removeLibraryFunctions(){

    // loop through the lines of dotFile
    // ignore the first statement "digraph G"
    // ignore any line starting with //
    var isInsideDiGraph = false;
    var isInsideFunction = false;
    
    var fnLabel;
    var isAllLibraryFunction = false;
    
    var lines = dotFile.split('\n');

    // Build new dot file without library functions here
    var tempFile = "";

    for (var line = 0; line < lines.length; line++){

      var lineString = lines[line].trim();
      
      if(/digraph/i.test(lineString))  {
        isInsideDiGraph = true;
        tempFile += lines[line] + "\n";
        continue;   
      }

      if(lineString.substr(0,2) == "//"){
        tempFile += lines[line] + "\n";
        continue;
        // ignore the comments
      }

      // if(/subgraph\s*\d+\s*{/i.test(lineString)) {
      if(/subgraph\s*[A-Z0-9_]+\s*{/i.test(lineString)) {
      // if(lineString.substr(-1,1) == "{"){
        
        isInsideFunction = true;
        // fnLabel = lineString.match(/subgraph\s*(\d+)/i)[1];
        //Functions can now be any string
        fnLabel = lineString.match(/subgraph\s*([A-Z0-9_]+)/i)[1];
        fnLabel = "Fn" + fnLabel;

        if(fnLabel in libraryFunctionsAll){
          isAllLibraryFunction = true;
        } else {
          isAllLibraryFunction = false;
        }

        if(!isAllLibraryFunction){
          tempFile += lines[line] + "\n";
        }
        continue;
      }

      if(lineString.substr(0,1) == "}"){
        isInsideFunction = false;
        
        if(!isAllLibraryFunction){
          tempFile += lines[line] + "\n";
        }
        continue;
      }

      if(isInsideFunction){
        // Skip the fn if its a library function
        if(!isAllLibraryFunction){
          tempFile += lines[line] + "\n";
        }
      }

    }

    //Finished looping through the file, update the dotfile
    dotFile = tempFile;

  }

  // This function toggles function blocks on dblclick. It is based on the previous function 'toggleFnGroup'
  // This function also takes care of the collapse/uncollapse state of other functions
  // when drawing its edges; The edge counts are already computed between function super nodes and other nodes
  // so no need to compute them again
  toggleFunction = function(label, pElem){
  // function toggleFunction(){
    
    var fnNodes = functionsAll[label].nodes;

    if(functionsAll[label].isCollapsed){
        // FnGroup is collapsed, expand it
      
        functionsAll[label].isCollapsed = false;
        pElem.classed("collapsed", false);
        
        var fnNode = label;
        if(fnNode in nodesAll){
          nodesAll[fnNode].style("display", "none");
        }

        var inEdges = g_function.inEdges(label);
        var outEdges = g_function.outEdges(label);

        for(var j=0; j<inEdges.length; j++){
          if(inEdges[j] in edgesAll){
            edgesAll[inEdges[j]].style("display", "none");
            edgeLabelsAll[inEdges[j]].style("display", "none");
          }
        } 

        for(var j=0; j<outEdges.length; j++){
          if(outEdges[j] in edgesAll){
            edgesAll[outEdges[j]].style("display", "none");
            edgeLabelsAll[outEdges[j]].style("display", "none");
          }
        }

        insertNodeAndEdgesofFn(label);         

    } else {
        // FnGroup is expanded, collapse it

        for(var i = 0; i < fnNodes.length; i++){
                                
          var nodeId = fnNodes[i];
          var inEdges = g_function.inEdges(nodeId);
          var outEdges = g_function.outEdges(nodeId);

          for(var j=0; j<inEdges.length; j++) {
            // The function is collapsed, so no edges that are incident to the function nodes
            // should be visible; hide them if they exist
            if(inEdges[j] in edgesAll)  {
              edgesAll[inEdges[j]].style("display", "none");
              edgeLabelsAll[inEdges[j]].style("display", "none");
            }
          }
          
          for(var j=0; j<outEdges.length; j++) {
            // The function is collapsed, so no edges that are incident to the function nodes
            // should be visible; hide them if they exist
            if(outEdges[j] in edgesAll)  {
             edgesAll[outEdges[j]].style("display", "none");
             edgeLabelsAll[outEdges[j]].style("display", "none");
            }
          }

          nodesAll[nodeId].style("display", "none");
        }
                           
        functionsAll[label].isCollapsed = true;
        insertNodeAndEdgesofFn(label);
        pElem.classed("collapsed", true);
    }

  };

  //This function handles arbitrary combination of collapse state of all the functions in CFG
  function insertNodeAndEdgesofFn(label){
    // All the hiding has been handled; Only need to handle addition of edges and node
    var grpbbox = computeFnBBox(label);
    var fnNodes = functionsAll[label].nodes;
    if(functionsAll[label].isCollapsed){
      // This function is collapsed; Add edges from/to the super node
      var nodeId = label;
      var inEdges = g_function.inEdges(nodeId);
      var outEdges = g_function.outEdges(nodeId);
      var node;
      var currEdge, parent;
      var edge,edgeId,edgeLabel;

      if(!(nodeId in nodesAll)){
        node = addNodeView(nodeId, grpbbox, label);
      }
      // Update this to be at the center of the bbox
      // Don't need to update edges now because the edges are going to be updated next
      centerSuperNode(nodesAll[nodeId], grpbbox); 
      nodesAll[nodeId].style("display", "unset");

      for(var j=0; j<inEdges.length; j++){
        currEdge = g_function._strictGetEdge(inEdges[j]);
        parent = g_function.node(currEdge.u).parent;
        // If the parent is null, then it is a function node
        // If it is function node, then the function must be collapsed to show this edge
        // else if it is a basic node, then the function must be expanded to show this edge
        if ((parent == null && functionsAll[currEdge.u].isCollapsed)
          || (parent!=null && !(functionsAll[parent].isCollapsed)))

        {
          edge = null, edgeId = null, edgeLabel = null;
          edgeId = inEdges[j];
          //Keep this edge; Add this edge or update this edge
          if(!(inEdges[j] in edgesAll)){
            //add the edge
            
            edge = addEdgeView(edgeId);
            functionsAll[label]["edges"].push(edgeId);
            edgeLabel = addEdgeLabelView(edgeId);
           
          }
          if(!edge){
            edge = edgesAll[edgeId];
            edgeLabel = edgeLabelsAll[edgeId];
          }
          var u = currEdge.u;
          // drawEdge(nodesAll[u], nodesAll[currEdge.v], edge);
          // drawEdgeLabelCount(nodesAll[u], nodesAll[currEdge.v], edgeLabel, currEdge.value.label);
          drawEdgeandEdgeLabel(nodesAll[u], nodesAll[currEdge.v],edge, edgeLabel, currEdge.value.label);
          edge.style("display", "unset");
          edgeLabel.style("display", "unset");
          
        }
      }
      for(var j=0; j<outEdges.length; j++){
        currEdge = g_function._strictGetEdge(outEdges[j]);
        parent = g_function.node(currEdge.v).parent;
        // If the parent is null, then it is a function node
        // If it is function node, then the function must be collapsed to show this edge
        // else if it is a basic node, then the function must be expanded to show this edge
        if ((parent == null && functionsAll[currEdge.v].isCollapsed)
          || (parent!=null && !(functionsAll[parent].isCollapsed)))

        {
          edge = null, edgeId=null, edgeLabel=null;
          edgeId = outEdges[j];
          //Keep this edge; Add this edge or update this edge
          if(!(outEdges[j] in edgesAll)){
            //add the edge
            
            edge = addEdgeView(edgeId);
            functionsAll[label]["edges"].push(edgeId);
            edgeLabel = addEdgeLabelView(edgeId);
            
          }
          if(!edge){
            edge = edgesAll[edgeId];
            edgeLabel = edgeLabelsAll[edgeId];
          }
          var v = currEdge.v;
          // drawEdge(nodesAll[currEdge.u], nodesAll[v], edge);
          // drawEdgeLabelCount(nodesAll[currEdge.u], nodesAll[v], edgeLabel, currEdge.value.label);  
          drawEdgeandEdgeLabel(nodesAll[currEdge.u], nodesAll[v], edge, edgeLabel, currEdge.value.label);  
          edge.style("display", "unset");
          edgeLabel.style("display", "unset");
        }
      }

    } else {
      // This function is expanded; Add edges from/to the basic nodes

      //Do not redraw edges which are part of the original graph
      //Because splines are better than straight line edges 

      for(var i = 0; i < fnNodes.length; i++){
          var nodeId = fnNodes[i];
          var inEdges = g_function.inEdges(nodeId);
          var outEdges = g_function.outEdges(nodeId);
          var currEdge;
          var parent, thisParent;
          thisParent = g_function.node(nodeId).parent;
          var edge, edgeId, edgeLabel;

		      nodesAll[nodeId].style("display", "unset");
          
          for(var j=0; j<inEdges.length; j++) {
            currEdge = g_function._strictGetEdge(inEdges[j]);
            parent = g_function.node(currEdge.u).parent;
            // If the parent is null, then it is a function node
            // If it is function node, then the function must be collapsed to show this edge
        	// else if it is a basic node, then the function must be expanded to show this edge
            if ((parent == null && functionsAll[currEdge.u].isCollapsed)
              || (parent!=null && !(functionsAll[parent].isCollapsed)))

            {
              edge = null, edgeId = null, edgeLabel=null;
              edgeId = inEdges[j];
              //Keep this edge; Add this edge or update this edge
              if(!(inEdges[j] in edgesAll)){
                //add the edge
                
                edge = addEdgeView(edgeId);
                functionsAll[label]["edges"].push(edgeId);
                edgeLabel = addEdgeLabelView(edgeId);
                
              }
              if(!edge){
                edge = edgesAll[edgeId];
                edgeLabel = edgeLabelsAll[edgeId];
              }
              var u = currEdge.u;
              
              if(parent == null || parent!=thisParent){
              	//This is an edge between super node and basic node
              	//refresh the edge
              	// drawEdge(nodesAll[u], nodesAll[currEdge.v], edge);
              	// drawEdgeLabelCount(nodesAll[u], nodesAll[currEdge.v], edgeLabel, currEdge.value.label);
                drawEdgeandEdgeLabel(nodesAll[u], nodesAll[currEdge.v], edge, edgeLabel, currEdge.value.label);
              }
              edge.style("display", "unset");
              edgeLabel.style("display", "unset");
              
            }
          }
          for(var j=0; j<outEdges.length; j++) {
            currEdge = g_function._strictGetEdge(outEdges[j]);
            parent = g_function.node(currEdge.v).parent;
            // If the parent is null, then it is a function node
            // If it is function node, then the function must be collapsed to show this edge
        	// else if it is a basic node, then the function must be expanded to show this edge
            if ((parent == null && functionsAll[currEdge.v].isCollapsed)
              || (parent!=null && !(functionsAll[parent].isCollapsed)))

            {
              edge = null, edgeId = null, edgeLabel = null;
              edgeId = outEdges[j];
              //Keep this edge; Add this edge or update this edge
              if(!(outEdges[j] in edgesAll)){
                //add the edge
                edge = addEdgeView(edgeId);
                functionsAll[label]["edges"].push(edgeId);
                edgeLabel = addEdgeLabelView(edgeId);
                
              }
              if(!edge){
                edge = edgesAll[edgeId];
                edgeLabel = edgeLabelsAll[edgeId];
              }
              var v = currEdge.v;
              if(parent == null || parent!=thisParent){
              	//This is an edge between super node and basic node
                // drawEdge(nodesAll[currEdge.u], nodesAll[v], edge);
              	// drawEdgeLabelCount(nodesAll[currEdge.u], nodesAll[v], edgeLabel, currEdge.value.label);  
                drawEdgeandEdgeLabel(nodesAll[currEdge.u], nodesAll[v], edge, edgeLabel, currEdge.value.label);
              }
              edge.style("display", "unset");
              edgeLabel.style("display", "unset");
            }
          }
          
        }
    }
  }

  // function centerSuperNode(node, grpbbox){
  centerSuperNode = function(node, grpbbox)	{
    var cx = (grpbbox.left + grpbbox.right)/2.0;
    var cy = (grpbbox.top + grpbbox.bottom)/2.0;
    node.attr("transform", "translate( " + cx + " , " + cy + " )");
  };

  // function addNodeView(nodeId, grpbbox, label){
  addNodeView = function(nodeId, grpbbox, label){
    
    var cx = (grpbbox.left + grpbbox.right)/2.0;
    var cy = (grpbbox.top + grpbbox.bottom)/2.0;
    var nodes = d3.select("#graphContainer g.nodes");
    var node = nodes.append("g").attr("class", "function node enter")
      .attr("transform", "translate( " + cx + " , " + cy + " )")
      .datum(label);
    nodesAll[nodeId] = node;

    var rect = node.append("rect");

    var innerg = node.append("g");
    var text = innerg.append("text").attr("text-anchor", "left");
    text.append("tspan").attr("dy", "1em").attr("x", 1)
      .text(label);

    var textbbox = text.node().getBBox(); 

    var rectbbox = {};
    rectbbox.width = textbbox.width;
    rectbbox.height = textbbox.height;

    if(rectbbox.width < 300) {
     rectbbox.width = 300;
    }
    if(rectbbox.height < 100)  {
      rectbbox.height  = 100;
    }

    innerg.attr("transform", "translate( " + (-textbbox.width/2.0) + " , " + (-textbbox.height/2.0) + ")"); 
  rect.attr("x", -(rectbbox.width/2.0 + 5))
    .attr("y", -(rectbbox.height/2.0 + 5))
    .attr("width", rectbbox.width + 10)
    .attr("height", rectbbox.height + 10)
    .attr("rx", 5)
    .attr("ry", 5);

    //TODO: Wire mouseover, mouseout, drag events etc.
    node.on("mouseover", mOverHndlrNode)
      .on("mouseout", mOutHndlrNode)
      .call(drag);
    return node;

  };

  // function addEdgeView(edgeId){
  addEdgeView = function(edgeId){  

    var edges = d3.select("#graphContainer g.edgePaths");
    var edge = edges.append("g").attr("class", "function edgePath enter")
      .datum(edgeId);
    var path = edge.append("path").attr("marker-end", "url(#arrowhead)");
    //TODO: Wire mouseover events etc.
    edgesAll[edgeId] = edge;
    edge.on("mouseover", mOverHndlrEdge)
      .on("mouseout", mOutHndlrEdge)
      .on("click", clickHndlrEdge);
    return edge;
  }

  // function addEdgeLabelView(edgeId){
  addEdgeLabelView = function(edgeId){  

    var edgeLabel = d3.select("#graphContainer g.edgeLabels").append("g")
      .attr("class", "function edgeLabel enter")
      .datum(edgeId);
    edgeLabel.append("g").append("text").attr("text-anchor", "middle")
      .append("tspan").attr("dy", "1em").attr("x",0);

    //TODO: Wire mouseover events etc.
    edgeLabelsAll[edgeId] = edgeLabel;
    return edgeLabel;
  }

  // Assume that the entry to and exit from a function is only through empty blocks in the start and end
  // Then no need to aggregate the counts of incoming and outgoing edges
  // They are already aggregated
  // Just preserve those edges
  // Preserve the entry block, exit block
  // Preserve any edges out of exit block
  // Edges from other functions to entry block will probably be outside the function
  // But still preserve it

  function collapseFnsInDotFile(){
    
    // loop through the lines of dotFile
    // ignore the first statement "digraph G"
    // ignore any line starting with //
    var isInsideDiGraph = false;
    var isInsideFunction = false;
    
    var fnLabel;
    var entryBlock;
    var exitBlock;
    var isCollapsed = false;
    
    //Use this to build a modified dot file
    var tempFile = "";

    var lines = dotFile.split('\n');
    
    for (var line = 0; line < lines.length; line++){

      var lineString = lines[line].trim();
      
      if(/digraph/i.test(lineString))  {
        isInsideDiGraph = true;
        tempFile += lines[line] + "\n";
        continue;   
      }

      if(lineString.substr(0,2) == "//"){
        tempFile += lines[line] + "\n";
        continue;
        // ignore the comments
      }

      // if(/subgraph\s*\d+\s*{/i.test(lineString)) {
      if(/subgraph\s*[A-Z0-9_]+\s*{/i.test(lineString)) {
      // if(lineString.substr(-1,1) == "{"){
        
        isInsideFunction = true;
        // fnLabel = lineString.match(/subgraph\s*(\d+)/i)[1];
        //Functions can now be any string
        fnLabel = lineString.match(/subgraph\s*([A-Z0-9_]+)/i)[1];
        fnLabel = "Fn"+fnLabel;

        entryBlock = functionsAll[fnLabel].entry;
        exitBlock = functionsAll[fnLabel].exit;
        isCollapsed = functionsAll[fnLabel].isCollapsed;
        
        tempFile += lines[line] + "\n";
        continue;
      }

      if(lineString.substr(0,1) == "}"){
        isInsideFunction = false;
        
        entryBlock = null;
        exitBlock = null;
        isCollapsed = false;

        tempFile += lines[line] + "\n";
        continue;
      }

      if(isInsideFunction){

        if(/shape=box/i.test(lineString)){
          // This is a node

          // If the label is empty, it is either entryblock or exit block, preserve it
          if(/label=""/i.test(lineString)){
              tempFile += lines[line] + "\n";
              continue;
          } else if(!isCollapsed)  {
            tempFile += lines[line] + "\n";
            continue;
          }

        } else if(/->/.test(lineString)){
          //This is an edge

          //If fn is not collapsed, preserve everything
          // else preserve only incoming and outgoing edges

          if(!isCollapsed){
            tempFile += lines[line] + "\n";
            
          } else {
            var re = /([A-Z0-9]+)(:[A-Z0-9]+)?\s*->\s*([A-Z0-9]+)(:[A-Z0-9]+)?/i;
            var res = lineString.match(re);
            var u = res[1];
            var v = res[3];

            if(u == exitBlock || v == entryblock){
              tempFile += lines[line] + "\n";  
            }

          }

        }

      }



    }
    // Finished looping through the dotfile
    // Update the dotfile

    dotFile = tempFile;

  }

  computeFnBBox = function(label){
  // function computeFnBBox(label) {

    var grpbbox = {left:null, right:null, top:null, bottom:null};
    var fnNodes = functionsAll[label].nodes;

    for(var i = 0; i < fnNodes.length; i++){
      var nodeId = fnNodes[i];
      var node = nodesAll[nodeId];

      var transformText = node.attr("transform");
      var translate = d3.transform(transformText).translate; //returns [tx,ty]

      var rect = node.select("rect");

      var x = Number(rect.attr("x")) + translate[0];
        var y = Number(rect.attr("y")) + translate[1];
        var height = Number(rect.attr("height"));
        var width = Number(rect.attr("width"));

        if(grpbbox.left == null || x < grpbbox.left) grpbbox.left = x;
        if (grpbbox.top == null || y < grpbbox.top) grpbbox.top = y;
        if(grpbbox.right == null || (x+width) > grpbbox.right) grpbbox.right = x+width;
        if(grpbbox.bottom == null || (y+height) > grpbbox.bottom) grpbbox.bottom = y+height;
    }
    return grpbbox;
  };

  // This function draws the label with the string input 'count'
  function drawEdgeLabelCount(u, v, edgeLabel, count){

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

    // get the center point
    // render edgeLabel at the center point

    var cx = ((x1 + width1/2.0) + (x2 + width2/2.0))/2.0;
    var cy = ((y1 + ht1/2.0) + (y2 + ht2/2.0))/2.0;

    edgeLabel.attr("transform", "translate(" + cx + "," + cy + ")")
      .select("tspan")
      .text(count);

  }


  // This function forms the label from the integer input 'count'
  function drawEdgeLabel(u, v, edgeLabel, count){

    //TODO: Change the logic of getting the center point
    //Instead of getting the center point, figure out the endpoints of the edge and get its center point
    //If the edge if curved, then need to get the center point along the surface of the curve
    //Integrate this with neato
    //Or figure out the points as exactly done when drawing edges and take the center point of it

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

    // get the center point
    // render edgeLabel at the center point

    var cx = ((x1 + width1/2.0) + (x2 + width2/2.0))/2.0;
    var cy = ((y1 + ht1/2.0) + (y2 + ht2/2.0))/2.0;

    var countStr = " ct:" + count;

    edgeLabel.attr("transform", "translate(" + cx + "," + cy + ")")
      .select("tspan")
      .text(countStr);

  }
  

  // This function populates Edges between function nodes and normal nodes as follows:
  // For every edge(u,v), check if the incident nodes belong to different functions
  // If so, add edge from u to Fv, Fu to v, Fu to Fv; While doing so, check for preexisting edges
  // By default, the graph is multigraph, so there will be no error when adding the same edge multiple times  
  // To check if there is an edge(u,v) call g.outEdges(u,v) or g.inEdges(v,u)
  // If the array length is 0, add the edge
  // If it 1, update edgeCount
  // If it is 2 or more, throw an error or silently ignore; This will only impact edge counts
  // Or alternatively, add the edgeCounts and delete all but the first edge
  function createFunctionNodeandEdges(){
    // Make a deepcopy of the original graph
    // Work on this copy
    g_function = g.copy();

    // Go through the functions; Add a node for each function in the graph
    // For every node in the function, add the parent info in the node object
    // Adjusted the naming of "Fn"+label when adding a node in the svg
    // Also replaced the calls to parent function of the graph by the use of parent property of the graph node object

    for(var label in functionsAll){
      if(functionsAll.hasOwnProperty(label))  {
        //Add this node to the graph
        g_function.addNode(label,{label:label, parent:null});

        var fnNodes = functionsAll[label].nodes;
        for (var i=0; i<fnNodes.length; i++){
          g_function.node(fnNodes[i]).parent = label;

          //Add the type "basic" to all the basic nodes
          g_function.node(fnNodes[i]).type = "basic";
        }

      }
    }
    
    // Iterate over original graph since we are modifying the copy
    g.eachEdge( function(id,u,v,value){

      if(g_function.node(u).parent == null || g_function.node(v).parent == null) {
        // One of the two nodes is function level node
        return;
      }
      if(g_function.node(u).parent != g_function.node(v).parent){
        //The nodes belong to different parents

        var parent_u = g_function.node(u).parent;
        var parent_v = g_function.node(v).parent;
        var re = /ct:(\d+)/i;

        //add edges (u,Fv), (Fu,v), (Fu,Fv)
        if(g_function.outEdges(u,parent_v).length>0){
          // (u,Fv) exists
          // update the count of the edge

          var label = value.label;
          var ct = parseInt(label.match(re)[1]);

          //get the count of super edge
          var edge_val = g_function.edge(g_function.outEdges(u,parent_v)[0]);
          var edge_cnt = parseInt(edge_val.label.match(re)[1]);
          ct += edge_cnt;

          edge_val.label = "ct:" + ct;

        } else {
          g_function.addEdge(null, u, parent_v, value);
        }

        //add edge (Fu,v)
        if(g_function.outEdges(parent_u,v).length>0){
          //(Fu,v) exists
          //update the edge count

          var label = value.label;
          var ct = parseInt(label.match(re)[1]);

          //get the count of super edge
          var edge_val = g_function.edge(g_function.outEdges(parent_u,v)[0]);
          var edge_cnt = parseInt(edge_val.label.match(re)[1]);
          ct += edge_cnt;

          edge_val.label = "ct:" + ct;

        } else {
          g_function.addEdge(null, parent_u, v, value);
        }

        // add edge (Fu, Fv)
        if(g_function.outEdges(parent_u,parent_v).length>0){
          //(Fu, Fv) exists
          //update the edge count

          var label = value.label;
          var ct = parseInt(label.match(re)[1]);

          //get the count of super edge
          var edge_val = g_function.edge(g_function.outEdges(parent_u,parent_v)[0]);
          var edge_cnt = parseInt(edge_val.label.match(re)[1]);
          ct += edge_cnt;

          edge_val.label = "ct:" + ct;

        } else {
          g_function.addEdge(null, parent_u, parent_v, value);
        }

      }
      
    }); 
  }

  // function mOverHndlrEdge(){
  mOverHndlrEdge = function(){  
    d3.select(this).classed("active", true);

    // d3.select(this).select("path").attr("stroke-width", "2.5");
    // d3.select(this).select("path").attr("stroke", "teal");  
  }

  // function mOutHndlrEdge(){
  mOutHndlrEdge = function(){
    
    d3.select(this).classed("active", false);

    // d3.select(this).select("path").attr("stroke-width", "1");
    // d3.select(this).select("path").attr("stroke","black");  
  }

  // function clickHndlrEdge(){
  clickHndlrEdge = function(){  
    var incidences = g_function._strictGetEdge(d3.select(this).datum());
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
  }

  // function mOverHndlrNode(){
  // TODO: Add linked highlighting to trace
  // Autoscroll to the first matching node
  // Highlight all matching trace blocks belonging to the entity, or just highlight
  // the blocks corresponding to the first constituent in the entity 
  mOverHndlrNode = function(){

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
   }

  // function mOutHndlrNode(){
  mOutHndlrNode = function(){  
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
    //TODO: Cache this d3 selection
    d3.select("#tooltip").classed("hidden", true);
    
  }

  var startX, startY, endX, endY;
  var fndrag_started = false;

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

        if(fndrag_started == false){
          fndrag_started = true;
          startX = d3.event.x;
          startY = d3.event.y;
        } 
        endX = d3.event.x;
        endY = d3.event.y; 
        d3.select(this).attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
        updateEdges(d3.select(this));
      })
     .on('dragend', function() { 

        if(!is_node_dragging_enabled){
          return;
        }

        fndrag_started = false;
         
        //translate all the nodes and edges that belong to this function
        var label = d3.select(this).datum();
        var fnNodes = functionsAll[label].nodes;
        var parent, parent1, thisGraphEdge, thisEdge, thisEdgeLabel;
        var theNode, transform, translateX, translateY;

        for(var i =0; i<fnNodes.length; i++){
          
          theNode = nodesAll[fnNodes[i]];
          transform = d3.transform(theNode.attr("transform"));
          translateX = transform.translate[0];
          translateY = transform.translate[1];
          

          translateX = translateX + (endX-startX);
          translateY = translateY + (endY-startY);
          theNode.attr("transform", "translate("+ translateX + "," + translateY + ")");

          var inEdges = g_function.inEdges(fnNodes[i]);
          var outEdges = g_function.outEdges(fnNodes[i]);
          for(var j=0; j<inEdges.length; j++){
            thisGraphEdge = g_function._strictGetEdge(inEdges[j]);
            parent = g_function.node(thisGraphEdge.u).parent;
            parent1 = g_function.node(thisGraphEdge.v).parent;
            if(parent==null || parent!=parent1){
              continue;
            }

            thisEdge = edgesAll[inEdges[j]];
            thisEdgeLabel = edgeLabelsAll[inEdges[j]];
            transform = d3.transform(thisEdge.attr("transform"));
            translateX = transform.translate[0];
            translateY = transform.translate[1]; 

            translateX = translateX + (endX-startX);
            translateY = translateY + (endY-startY);
            thisEdge.attr("transform", "translate("+ translateX + "," + translateY + ")");            

            transform = d3.transform(thisEdgeLabel.attr("transform"));
            translateX = transform.translate[0];
            translateY = transform.translate[1]; 
            translateX = translateX + (endX-startX);
            translateY = translateY + (endY-startY);
            thisEdgeLabel.attr("transform", "translate("+ translateX + "," + translateY + ")");
          }
        }
        updateEdges(d3.select(this));
     });

  // updateEdges when the node is moved
  function updateEdges(thisNode) {
    var g = g_function;
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
          
          if(!(edge_lbl in edgesAll)){
            continue;
          }
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
          if(!(edge_lbl in edgesAll)){
            continue;
          }
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

  // draws an edge between the nodes u & v; 
  // updates the path which is provided as input
  // updates the edgeLabel at the same time
  // function drawEdgeandEdgeLabel(u, v, edge, edgeLabel, count){
  drawEdgeandEdgeLabel = function(u, v, edge, edgeLabel, count){  

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

    var cx = (x1new + x2new)/2.0;
    var cy = (y1new + y2new)/2.0;

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


    edgeLabel.attr("transform", "translate(" + cx + "," + cy + ")")
      .select("tspan")
      .text(count);

  }

  // function getFunctionName(label){
  getFunctionName = function(label){  
    var fnNodes = functionsAll[label].nodes;
    var fnName = "";
    var res;
    for (var i =0; i<fnNodes.length; i++){
      var nodeLabel = g_function.node(fnNodes[i]).label;
      var res;
      if((res=nodeLabel.split("\\n")[0]) != ""){
        fnName = res;
        break;
      }
    }
    if(fnName==""){
      fnName=label;
    }
    return fnName;
  }

  function dblClickHandlerFnP(label){
    toggleFunction(label, d3.select(this));
  }

  function mOverHandlerFnP(d){

  }

  function mOutHandlerFnP(d){

  }

  return myExport;

}({}));