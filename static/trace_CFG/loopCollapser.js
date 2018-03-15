var loopCollapser = (function(myExport){

	// loopsObj
	var isLoopCollapsed = [];
	var isLoopShown = false;
	// stores the root loops i.e. not inside of any other loop
	var roots = [];

	//TODO: Store the collapsed loops separately
	// Need to find out what functions are collapsed

	myExport = myExport || {};

	myExport.init = function(){
	
		initVariables();
		loadLoops();
		d3.select("#showLoops")
        .on("click", function(){
        	if(!isLoopShown){
          		showLoops();
          		isLoopShown = true;
          		d3.select(this).attr("value", "Hide Loops");
      		}	else {
      			d3.selectAll("g.node.enter").select("rect").style("fill", "");
      			d3.selectAll("g.node.enter").attr("fill", "");
      			isLoopShown = false;
            d3.select(this).attr("value", "Show Loops");
      		}
        }
      );

	};
	
	// Inititializes all the variables
	// Also adds CSS class of backedge to backedges
	function initVariables(){
		isLoopCollapsed = [];
		roots = [];
		var backedge, edgeId;

		for(var i=0; i<loopsObj.length; i++){
			isLoopCollapsed[i] = false;


			backedge = loopsObj[i].backedge;
      		edgeId = g_function.outEdges(backedge[0], backedge[1])[0];

      		edgesAll[edgeId].classed("backedge", true);

		}
		isLoopShown = false;
	}

	// The main function that loads everything
	function loadLoops(){

		createLoopTree();
		makeFunctionLoopTree();
		// createListPanel();
		createFnLoopTreeWidget();

		d3.select("g.nodes").append("rect")
	      .attr("id", "loopBBox")
	      .style("display", "none");

	    //List all the loops on one of the bottom panel
		var div_loops = d3.select("#loopsView");
		
		/*** TODO: Comment out from here ***/
		/*
		div_loops.selectAll("p")
			.data(loopsObj).enter()
			.append("p")
			.text(function(d,i) {return "Loop " + i;})
			.on("dblclick", function(d,i){
				toggleLoop(i, d3.select(this));
			})
			.on("mouseover", function(d,i){
				var bbox = computeLoopBBox(i);

				d3.select("#loopBBox")
					.attr("x", bbox.left)
					.attr("y", bbox.top)
					.attr("width", bbox.right - bbox.left)
					.attr("height", bbox.bottom - bbox.top)
					.style("display", "unset");

				//Auto-Center to the loop on hover
				translateTo((bbox.left+bbox.right)/2.0, (bbox.top+bbox.bottom)/2.0);

				//Highlight all the nodes that belong
	            var loopNodes = loopsObj[i].nodes;
	            for(var i=0; i<loopNodes.length; i++){
	              nodesAll[loopNodes[i]].classed("highlight", true);
	            }

			})
			.on("mouseout", function(d,i){
				d3.select("#loopBBox").style("display", "none");

				//Unhighlight all the nodes that belong
	            var loopNodes = loopsObj[i].nodes;
	            for(var i=0; i<loopNodes.length; i++){
	              nodesAll[loopNodes[i]].classed("highlight", false);
	            }
			});
			*/
			/***** End comment here ******/
	}

	// double click handler for p element
	function dblClickHandlerP(i){
		toggleLoop(i, d3.select(this));
	}

	function mOverHandlerP(i){
		var bbox = computeLoopBBox(i);

		d3.select("#loopBBox")
			.attr("x", bbox.left)
			.attr("y", bbox.top)
			.attr("width", bbox.right - bbox.left)
			.attr("height", bbox.bottom - bbox.top)
			.style("display", "unset");

		//This is done by clickhandler			
		// //Auto-Center to the loop on hover
		// translateTo((bbox.left+bbox.right)/2.0, (bbox.top+bbox.bottom)/2.0);

		//Highlight all the nodes that belong
        var loopNodes = loopsObj[i].nodes;
        for(var i=0; i<loopNodes.length; i++){
          nodesAll[loopNodes[i]].classed("highlight", true);
        }
	}

	function clickHandlerP(i){
		var bbox = computeLoopBBox(i);

		//Auto-Center to the loop on hover
		translateTo((bbox.left+bbox.right)/2.0, (bbox.top+bbox.bottom)/2.0);

	}

	function mOutHandlerP(i){
		d3.select("#loopBBox").style("display", "none");

		//Unhighlight all the nodes that belong
        var loopNodes = loopsObj[i].nodes;
        for(var i=0; i<loopNodes.length; i++){
          nodesAll[loopNodes[i]].classed("highlight", false);
        }
	}

	// Toggles the loop given the loop index and the p element
	function toggleLoop(index, pElem){
		var loopObj = loopsObj[index];
		var loopNodes = loopObj.nodes;
		var backedge = loopObj.backedge;
		var header = backedge[1];
		var latch = backedge[0];

		if(isLoopCollapsed[index]){
			//This loop is collapsed; expand it

			for(var i=0; i<loopNodes.length; i++){

				var nodeId = loopNodes[i];
				var inEdges = g.inEdges(nodeId);
				var outEdges = g.outEdges(nodeId);

				for(var j=0; j<inEdges.length; j++){
					edgesAll[inEdges[j]].style("display", "unset");
					edgeLabelsAll[inEdges[j]].style("display", "unset");
				}

				for(var j=0; j<outEdges.length; j++){
					edgesAll[outEdges[j]].style("display", "unset");
					edgeLabelsAll[outEdges[j]].style("display", "unset");
				}
				nodesAll[nodeId].style("display", "unset");

			}

			hideNodeAndEdgesofLoop(index);

			pElem.classed("collapsed", false);
			//The loop is expanded now
			isLoopCollapsed[index] = false;

		} else {
			// This loop is expanded; collapse it

			for(var i=0; i<loopNodes.length; i++){

				var nodeId = loopNodes[i];
				var inEdges = g.inEdges(nodeId);
				var outEdges = g.outEdges(nodeId);

				for(var j=0; j<inEdges.length; j++) {
		            edgesAll[inEdges[j]].style("display", "none");
		            edgeLabelsAll[inEdges[j]].style("display", "none");
		        }
		          
		        for(var j=0; j<outEdges.length; j++) {
		           edgesAll[outEdges[j]].style("display", "none");
		           edgeLabelsAll[outEdges[j]].style("display", "none");
		        }
		        nodesAll[nodeId].style("display", "none");
			}

			if(loopsObj[index]["isRendered"] == undefined || loopsObj[index].isRendered==false)	{
				var grpbbox = computeLoopBBox(index);
				insertNodeAndEdgesofLoop(index, grpbbox);
				loopsObj[index]["isRendered"] = true;
			}	else {

				nodesAll["Loop" + index].style("display", "unset");
				for(var i=0; i<loopsObj[index]["edges"].length; i++){
					edgesAll[loopsObj[index]["edges"][i]].style("display", "unset");
            		edgeLabelsAll[loopsObj[index]["edges"][i]].style("display", "unset");
				}
			}
			pElem.classed("collapsed",true);
			isLoopCollapsed[index] = true;
		}
	}

	//This function is based on toggleFunction
	function toggleLoopNew(index, pElem){
			var strippedNodes = loopsObj[index].strippedNodes;

	    if(loopsObj[index].isCollapsed){
	        // Loop is collapsed, expand it
	      
	        loopsObj[index].isCollapsed = false;
	        pElem.classed("collapsed", false);
	        
	        var loopNode = "Loop" + index;
	        if(loopNode in nodesAll){
	          nodesAll[loopNode].style("display", "none");
	        }

	        var inEdges = g_function.inEdges(loopNode);
	        var outEdges = g_function.outEdges(loopNode);

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

	        unhideAndCreateViewRecursively(index);       

	    } else {
	        // Loop is expanded, collapse it

	        // Go through all the nodes in the loop and hide their nodes and edges
	        // if exist
	        for(var i = 0; i < strippedNodes.length; i++){
	                                
	          var nodeId = strippedNodes[i];
	          var inEdges = g_function.inEdges(nodeId);
	          var outEdges = g_function.outEdges(nodeId);

	          for(var j=0; j<inEdges.length; j++) {
	            // The loop is collapsed, so no edges that are incident to the loop nodes
	            // should be visible; hide them if they exist
	            if(inEdges[j] in edgesAll)  {
	              edgesAll[inEdges[j]].style("display", "none");
	              edgeLabelsAll[inEdges[j]].style("display", "none");
	            }
	          }
	          
	          for(var j=0; j<outEdges.length; j++) {
	            // The loop is collapsed, so no edges that are incident to the loop nodes
	            // should be visible; hide them if they exist
	            if(outEdges[j] in edgesAll)  {
	             edgesAll[outEdges[j]].style("display", "none");
	             edgeLabelsAll[outEdges[j]].style("display", "none");
	            }
	          }

	          nodesAll[nodeId].style("display", "none");
	        }

	        //Hide all the loopNodes that are still visible
	        hideLoopRecursive(index);
	                           
	        loopsObj[index].isCollapsed = true;
	        pElem.classed("collapsed", true);
	        unhideAndCreateViewRecursively(index);
	        
    	}
	}

	// compute the bounding box of the loop
	function computeLoopBBox(index) {

	    var bbox = {left:null, right:null, top:null, bottom:null};
	    var loopNodes = loopsObj[index].nodes;

	    for(var i = 0; i < loopNodes.length; i++){
	      var nodeId = loopNodes[i];
	      var node = nodesAll[nodeId];

	      var transformText = node.attr("transform");
	      var translate = d3.transform(transformText).translate; //returns [tx,ty]

	      var rect = node.select("rect");

	      var x = Number(rect.attr("x")) + translate[0];
	        var y = Number(rect.attr("y")) + translate[1];
	        var height = Number(rect.attr("height"));
	        var width = Number(rect.attr("width"));

	        if(bbox.left == null || x < bbox.left) bbox.left = x;
	        if (bbox.top == null || y < bbox.top) bbox.top = y;
	        if(bbox.right == null || (x+width) > bbox.right) bbox.right = x+width;
	        if(bbox.bottom == null || (y+height) > bbox.bottom) bbox.bottom = y+height;
	    }
    	return bbox;
  	}

  	// compute the bounding box of the loop using only the stripped nodes
	function computeLoopBBoxStripped(index) {

	    var bbox = {left:null, right:null, top:null, bottom:null};
	    var loopNodes = loopsObj[index].strippedNodes;


	    for(var i = 0; i < loopNodes.length; i++){
	      var nodeId = loopNodes[i];
	      var node = nodesAll[nodeId];

	      var transformText = node.attr("transform");
	      var translate = d3.transform(transformText).translate; //returns [tx,ty]

	      var rect = node.select("rect");

	      var x = Number(rect.attr("x")) + translate[0];
	        var y = Number(rect.attr("y")) + translate[1];
	        var height = Number(rect.attr("height"));
	        var width = Number(rect.attr("width"));

	        if(bbox.left == null || x < bbox.left) bbox.left = x;
	        if (bbox.top == null || y < bbox.top) bbox.top = y;
	        if(bbox.right == null || (x+width) > bbox.right) bbox.right = x+width;
	        if(bbox.bottom == null || (y+height) > bbox.bottom) bbox.bottom = y+height;
	    }
    	return bbox;
  	}

  	function insertNodeAndEdgesofLoop(index, grpbbox){

	    var cx = (grpbbox.left + grpbbox.right)/2.0;
	    var cy = (grpbbox.top + grpbbox.bottom)/2.0;

	    var nodes = d3.select("#graphContainer g.nodes");
	    var node = nodes.append("g").attr("class","loop node enter")
	      .attr("transform", "translate( " + cx + " , " + cy + " )")
	      .datum(index);

	    nodesAll["Loop" + index] = node;
	    
	    var rect = node.append("rect");

	    // TODO:add this node to graph g
	    // make a function  
	      
	    var innerg = node.append("g");
	    var text = innerg.append("text").attr("text-anchor", "left");
	    text.append("tspan").attr("dy", "1em").attr("x", 1)
	      .text("Loop" + index);

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
	  
	  var grpPredecessors = {};
	  var grpSuccessors = {};

	  var loopNodes = loopsObj[index].nodes;

	  for(var i = 0; i < loopNodes.length; i++){
	      var nodeId = loopNodes[i];
	  
	      var predecessors = g.predecessors(nodeId);
	      var successors = g.successors(nodeId);

	      for(var j=0; j<predecessors.length; j++) {

	          //if not part of the grp, add it in the grpPredecessors list
	          var isPartOfGrp = false;
	          for(var k=0; k<loopNodes.length; k++) {
	            
	            if(predecessors[j] === loopNodes[k]) {
	              isPartOfGrp = true;   
	            }
	          }
	          
	          if(!isPartOfGrp) {
	            //if not already in grppreds, add it
	            //add the edge label counts

	            // get the edge id corresponding to the pair of nodes
	            // get the edgeLabel based on the edge id
	            // parse the value to add it as a count
	            var edgeId = g.outEdges(predecessors[j], nodeId)[0];
	            var countStr = edgeLabelsAll[edgeId].select("tspan").text();
	            var count = Number(countStr.match(/ct\s*:\s*(\d+)/)[1]);
	            
	            if(!(predecessors[j] in grpPredecessors)) {
	              grpPredecessors[predecessors[j]] = count;
	            }
	            else {
	              grpPredecessors[predecessors[j]] += count;
	            }
	          }

	        }

	      for(var j=0; j<successors.length; j++) {

	          //if not part of the grp, add it in the grpSuccessors list
	          var isPartOfGrp = false;
	          for(var k=0; k<loopNodes.length; k++) {
	            
	            if(successors[j] === loopNodes[k]) {
	              isPartOfGrp = true;   
	            }
	          }
	          if(!isPartOfGrp) {
	            //if not already in grpsuccs, add it
	            //add the edge label counts

	            var edgeId = g.outEdges(nodeId, successors[j])[0];
	            var countStr = edgeLabelsAll[edgeId].select("tspan").text();
	            var count = Number(countStr.match(/ct\s*:\s*(\d+)/)[1]);
	            
	            if(!(successors[j] in grpSuccessors)) {
	              grpSuccessors[successors[j]] = count;
	            }
	            else {
	              grpSuccessors[successors[j]] += count;
	            }

	          }

	        }
	  	}

	    loopsObj[index]["predecessors"] = [];
	    loopsObj[index]["edges"] = [];
	    loopsObj[index]["successors"] = [];

	    // loop through grpPredecessors object
	    // for(var i=0; i< grpPredecessors.length; i++)  {
	    var i = 0;
	    for (var key in grpPredecessors) {
	      if (grpPredecessors.hasOwnProperty(key)) {  

	      var edges = d3.select("#graphContainer g.edgePaths");
	      var edgeId = "Loop" + index + "pe" + i;

	      var edge = edges.append("g").attr("class","loop edgePath enter")
	      .datum(edgeId);

	      var path = edge.append("path").attr("marker-end", "url(#arrowhead)");

	      var edgeLabel = d3.select("#graphContainer g.edgeLabels").append("g")
	        .attr("class", "loop edgeLabel enter")
	        .datum(edgeId);
	      
	      // Adds this to the list of edges with id such as Loop0pe1
	      edgesAll[edgeId] = edge;
	      edgeLabelsAll[edgeId] = edgeLabel;

	      loopsObj[index]["predecessors"].push(key);
	      loopsObj[index]["edges"].push(edgeId);
	    
	      drawEdge(nodesAll[key], nodesAll["Loop" + index], path);
	      drawEdgeLabel(nodesAll[key], nodesAll["Loop" + index], edgeLabel, grpPredecessors[key]);
	      // TODO: add this edge to graph g
	      // make a function

	      i++;
	      }
	    }

	    //loop through grpSuccessors object
	    // for(var i=0; i<grpSuccessors.length; i++) {
	    var i = 0;
	    for (var key in grpSuccessors)  {
	      if(grpSuccessors.hasOwnProperty(key)){

	      var edges = d3.select("#graphContainer g.edgePaths");
	      var edgeId = "Loop" + index + "se" + i;

	      var edge = edges.append("g").attr("class","loop edgePath enter")
	      .datum(edgeId);

	      var path = edge.append("path").attr("marker-end", "url(#arrowhead)");

	      var edgeLabel = d3.select("#graphContainer g.edgeLabels").append("g")
	        .attr("class", "loop edgeLabel enter")
	        .datum(edgeId);
	        
	      // Adds this to the list of edges with id such as Loop0se1
	      edgesAll[edgeId] = edge;
	      edgeLabelsAll[edgeId] = edgeLabel;
	    
	      loopsObj[index]["successors"].push(key);
	      loopsObj[index]["edges"].push(edgeId);

	      drawEdge(nodesAll["Loop" + index], nodesAll[key], path);
	      drawEdgeLabel(nodesAll["Loop" + index], nodesAll[key], edgeLabel, grpSuccessors[key]);
	      // TODO: add this edge to graph g
	      // make a function
	      i++;
	      }
	    }
  	}

  	function drawEdgeLabel(u, v, edgeLabel, count){

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

    edgeLabel.append("g")
      .attr("transform", "translate(" + cx + "," + cy + ")")
      .append("text").attr("text-anchor", "middle")
      .append("tspan").attr("dy", "1em").attr("x",0)
      .text(countStr);

  }

  function hideNodeAndEdgesofLoop(index){
    nodesAll["Loop" + index].style("display", "none");
    for(var i = 0; i < loopsObj[index]["edges"].length; i++) {
      edgesAll[loopsObj[index]["edges"][i]].style("display", "none");
      edgeLabelsAll[loopsObj[index]["edges"][i]].style("display", "none");      
    }
  }

  // Shows loop nodes in different colors; same as show cycles
  function showLoops(){
    var num_loops = loopsObj.length;

    for(var i=0; i<num_loops; i++) {
      var loop_nodes = loopsObj[i].nodes;
      
      for(var j=0; j<loop_nodes.length; j++) {
        
          nodesAll[loop_nodes[j]]
          .attr("fill", "white")
          .select("rect")
          .style("fill", function(d){
              return colores_g[i%colores_g.length];  
          });  
      }
    }
  }

  // Creates the nesting hierarchy of the loops
  // Note: Assumption is that loops are properly nested
  // populates the 'roots' array, and 'children' array for each of the loop 
  function createLoopTree(){
  	var node, parent, parentFn1, parentFn2;
  	//While traversing the hierarchy, break the chain of the loop tree if they belong to different function
  	for(var i = 0; i<loopsObj.length; i++) {
  		node = loopsObj[i];

  		if(node.parent != ""){
  			
  			//if the parentFn of parent loop is different from parentFn of this Loop
  			// make the parent field empty
  			// copy the parent to "parentInterproc" field 

  			header = node.backedge[1];
  			parentFn1 = g_function.node(header).parent;
			parent = loopsObj[parseInt(node.parent)];  	
			parentFn2 = g_function.node(parent.backedge[1]).parent;

			if(parentFn1 != parentFn2){
				node.parentInterproc = node.parent;
				node.parent = "";
				roots.push(i);
				continue;
			}		
  			
  			if(!("children" in parent)){
  				parent.children = [i];
  			} else {
  				parent.children.push(i);
  			}
  		}	else {
  			roots.push(i);
  		}

  	}
  }

  // Creates an unordered list to show the tree hierarchy
  // Starts with ul, then adds an li with p element for every loop
  // If the loop has children, adds a ul element and repeats the above steps
  function createListPanel(){
  	var div_loops = d3.select("#loopsView");
  	var rootView = div_loops.append("ul").classed("root", true);
  	for (var i=0; i<roots.length; i++){
  		//Traverse this rooted tree
  		var thisRoot = roots[i];
  		var thisRootView = rootView.append("li");
  		thisRootView.append("p")
  			.datum(thisRoot)
  			.text("Loop" + thisRoot)
  			.attr("id", "Loop" + thisRoot)
  			.on("dblclick", dblClickHandlerP)
  			.on("mouseover", mOverHandlerP)
  			.on("click", clickHandlerP)
  			.on("mouseout", mOutHandlerP);

  		if("children" in loopsObj[thisRoot]){
  			thisRootView = thisRootView.append("ul");
  			for (var j=0; j<loopsObj[thisRoot].children.length; j++){
  				addChildView(thisRootView, loopsObj[thisRoot].children[j]);
  			}
  		}
  	}
  }

  // This function recursively adds the children in the tree view
  function addChildView(rootView, index){

  	var thisView = rootView.append("li");
	thisView.append("p")
		.datum(index)
		.attr("id", "Loop" + index)
		.on("dblclick", dblClickHandlerP)
		.on("mouseover", mOverHandlerP)
		.on("click", clickHandlerP)
		.on("mouseout", mOutHandlerP)
		.text("Loop" + index);  	
	
	if("children" in loopsObj[index]){
  		thisView = thisView.append("ul");
  		for(var i=0; i < loopsObj[index].children.length; i++){
  			addChildView(thisView, loopsObj[index].children[i]);
  		}	
  	}
  }

  // This function makes the super tree containing function and loops
  // Fundamental Assumption: a function must fully contain some loop
  // If loop not fully contained, drop the interprocedural edges and drop the 
  // nodes that don't belong to the function
  // The super tree gives the hierarchical containment but is not concerned about
  // all the possible edges incident to super nodes
  // TODO: Think about caching the superedge computation after figuring out the
  // interaction handling using tree traversal.
  // NOTE: If the sets are allowed to not be properly nested, then no assumption can 
  // be made about the collapse state of any entity (function, loop, manual group etc.)
  // The nodes and edges for every structure needs to be generated everytime some entity's 
  // collapse state changes. It can be thought of like having checkbox next to each
  // entity to set its collapsed state. Go through the list of collapsed entities 
  // sequentially. Order doesn't matter since set union is invariant to order of the operand sets

  function makeFunctionLoopTree(){
  	var header, loopObj, parentFn, mySet;
  	// Sets the parent function for all loops; even non-root ones
  	for (var i=0; i<loopsObj.length; i++){
  		loopObj = loopsObj[i];
  		header = loopObj.backedge[1];
  		parentFn = g_function.node(header).parent;
  		loopObj["parentFn"] = parentFn; 


    	//Add this node to the graph
    	g_function.addNode("Loop" + i,{label:"Loop" + i, parent:parentFn});

    	// add a children field to the function; This contains loops that are direct children of the function
  		if(loopObj.parent == ""){
  			if("children" in functionsAll[parentFn]){
  				functionsAll[parentFn]["children"].push(i);
  			}	else {
  				functionsAll[parentFn]["children"] = [i];	
  			}
  		}
  		
  		// strip the loop of any nodes that don't belong in its parent Function
  		mySet = new Set(functionsAll[parentFn].nodes);
  		loopObj["strippedNodes"] = Array.from(mySet.intersection(new Set(loopObj.nodes)));

  		//TODO: Remember to use the strippedNodes instead of all nodes when handling interactions

  	}

  	// recurse through the loop tree
  	// Start with the leaves, set the parentLoop property for every node in the loop if not already set
  	// Use post order tree traversal
  	for(var i=0; i<roots.length; i++){
  		var thisRoot = roots[i];
  		addParentLoop(thisRoot);
  	}

  	// Assign null to parentLoop for all nodes that don't belong in any loop
  	var graph_nodes = g_function.nodes();
  	for(var i=0; i<graph_nodes.length; i++){
  		var thisNode = g_function.node(graph_nodes[i]);
  		if(thisNode.type=="basic"){
  			if(!("parentLoop" in thisNode)){
  				thisNode.parentLoop = null;
  			}
  		}
  	}

  	// NOTE: No need to populate the children of an entity
  	// Can be found by checking the parentLoop property of the nodes it contains; if it is null, then its direct parent is a function
  	// else compare the loop index with the parentLoop index to see if its direct parent is that loop

  }

  // This function recursively adds the parentLoop property for all nodes
  // Performs a post-order traversal to start with the leaves
  function addParentLoop(index){
  	var loopObj = loopsObj[index];
  	if("children" in loopObj){
  		for(var i=0; i<loopObj["children"].length; i++){
  			addParentLoop(loopObj["children"][i]);
  		}
  	}
  	var strippedNodes = loopObj.strippedNodes;
  	for(var i=0; i<strippedNodes.length; i++){
  		var thisNode = g_function.node(strippedNodes[i]);
  		if(!("parentLoop" in thisNode)){
  			thisNode["parentLoop"] = index;
  		}
  	}
  }

  // Shows the super tree containing the hierarchy of function and loops in this treeview
  // TODO: Apart from handling interactions using strippedNodes, the collapsing logic 
  // for the entire tree using tree traversal needs to be handled here.
  // Also need to add a mechanism of hiding the subtree when collapsed, and 
  // show it back again
  // Need to store that view also
  // TODO: need to check the equal loops - one loop collapsed means other collapsed as well
  // Need to couple them and change their state together or just show only one of them
  
  function createFnLoopTreeWidget(){
  	var div_loops = d3.select("#loopsView");
	var rootView = div_loops.append("ul").classed("root", true);
  	
	// loop through all the functions instead of root loops
	for (var key in functionsAll) {
  		if (functionsAll.hasOwnProperty(key)) {
    		var thisFunction = functionsAll[key];
    		var thisFunctionView = rootView.append("li");
    		thisFunctionView.append("p")
    			.datum({value:key, type: "function"})
    			.text(getFunctionName(key))
    			.attr("id", getFunctionName(key))
    			.on("dblclick", dblClickHandlerFnLoopP)
    			.on("mouseover", mOverHandlerFnLoopP)
    			.on("click", clickHandlerFnLoopP)
    			.on("mouseout", mOutHandlerFnLoopP);

    		if("children" in thisFunction){
    			thisFunctionView = thisFunctionView.append("ul");
    			for(var j=0; j<thisFunction.children.length; j++){
    				addChildLoopView(thisFunctionView, thisFunction.children[j]);
    			}
    		}
  		}
	}

  }

  // This function adds the functions and loops in a tree view
  function addChildLoopView(rootView, index){
  	var thisView = rootView.append("li");
	thisView.append("p")
		.datum({value:index, type:"loop"})
		.attr("id", "Loop" + index)
		.style("background-color", "#87cefa")
		.on("dblclick", dblClickHandlerFnLoopP)
		.on("mouseover", mOverHandlerFnLoopP)
		.on("click", clickHandlerFnLoopP)
		.on("mouseout", mOutHandlerFnLoopP)
		.text("Loop" + index);  	
	
	if("children" in loopsObj[index]){
  		thisView = thisView.append("ul");
  		for(var i=0; i < loopsObj[index].children.length; i++){
  			addChildView(thisView, loopsObj[index].children[i]);
  		}	
  	}
  }

  // This function handles mouseover over both the function and loop text
  // Need to check the type of element and call appropriate functions based on that
  // Highlights all the nodes and not only the stripped nodes
  function mOverHandlerFnLoopP(d){
  	var type = d.type;
  	var i = d.value;

  	if(type=="loop"){
  		var bbox = computeLoopBBox(i);

		d3.select("#loopBBox")
			.attr("x", bbox.left)
			.attr("y", bbox.top)
			.attr("width", bbox.right - bbox.left)
			.attr("height", bbox.bottom - bbox.top)
			.style("display", "unset");

		//This is done by click handler
		//Auto-Center to the loop on hover
		// translateTo((bbox.left+bbox.right)/2.0, (bbox.top+bbox.bottom)/2.0);

		//Highlight all the nodes that belong
        var loopNodes = loopsObj[i].nodes;
        for(var i=0; i<loopNodes.length; i++){
          nodesAll[loopNodes[i]].classed("highlight", true);
        }
    } else if(type=="function") {
    	var label = i;
        var bbox = computeFnBBox(label);

        d3.select("#FnBBox")
          .attr("x", bbox.left)
          .attr("y", bbox.top)
          .attr("width", bbox.right - bbox.left)
          .attr("height", bbox.bottom - bbox.top)
          .style("display", "unset");

        // This is done by clickhandler
        // Auto-Center to the function on hover
        // translateTo((bbox.left+bbox.right)/2.0, (bbox.top+bbox.bottom)/2.0);

        //Highlight all the nodes that belong
        var fnNodes = functionsAll[label].nodes;
        for(var i=0; i<fnNodes.length; i++){
          nodesAll[fnNodes[i]].classed("highlight", true);
        }

    }	
  }

  function clickHandlerFnLoopP(d){
  	var type = d.type;
  	var i = d.value;

  	if(type=="loop"){
  		var bbox = computeLoopBBox(i);
  		//Auto-Center to the loop on hover
		translateTo((bbox.left+bbox.right)/2.0, (bbox.top+bbox.bottom)/2.0);

  	}	else if(type=="function"){
  		var label = i;
        var bbox = computeFnBBox(label);

        //Auto-Center to the function on hover
        translateTo((bbox.left+bbox.right)/2.0, (bbox.top+bbox.bottom)/2.0);

  	}


  }

  // This function handles mouseout over both the function and loop text
  // Need to check the type of element and call appropriate functions based on that
  // Unhighlights all the nodes and not only the stripped nodes
  function mOutHandlerFnLoopP(d){

  	var type = d.type;
  	var i = d.value;

  	if(type=="loop"){
	  	d3.select("#loopBBox").style("display", "none");

		//Unhighlight all the nodes that belong
	    var loopNodes = loopsObj[i].nodes;
	    for(var i=0; i<loopNodes.length; i++){
	      nodesAll[loopNodes[i]].classed("highlight", false);
	    }
	} else if(type=="function"){
		var label = i;
        d3.select("#FnBBox").style("display", "none");
        //Unhighlight all the nodes that belong
        var fnNodes = functionsAll[label].nodes;
        for(var i=0; i<fnNodes.length; i++){
          nodesAll[fnNodes[i]].classed("highlight", false);
        }
	}    
  }

  // This function handles dblclick over both the function and loop text
  // Need to check the type of element and call appropriate functions based on that
  // Also need to collapse its parent "li" element so that its children are all invisible
  // Need to handle tree traversal and find out the children based on the two trees
  function dblClickHandlerFnLoopP(d){
  	var i = d.value;
  	var type = d.type;
  	if(type=="loop"){
  		//TODO: Move this to the toggleLoop
  		if(loopsObj[i].isCollapsed){
  			d3.select(this.parentNode).select("ul").style("display", "block");
  		}	else {
  			d3.select(this.parentNode).select("ul").style("display", "none");
  		}
  		toggleLoopNew(i, d3.select(this));
  		
  	} else if(type=="function"){
  		//TODO: Move this to the toggleFunction
  		if(functionsAll[i].isCollapsed){
  			d3.select(this.parentNode).select("ul").style("display", "block");
  		}	else {
  			d3.select(this.parentNode).select("ul").style("display", "none");
  		}
  		toggleFunction(i, d3.select(this));
  	}
  }

  // Modified form of toggleFunction from Function module; Handles the hierarchy between 
  // function and loops
  function toggleFunction(label, pElem){
  	
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

        insertNodeAndEdgesofFnNew(label);         

    } else {
        // FnGroup is expanded, collapse it

        // Go through all the nodes in the function and hide their nodes and edges
        // if exist
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

        //Hide all the loopNodes that are still visible
        var thisFunction = functionsAll[label];
        if("children" in thisFunction){
        	for (var k=0; k<thisFunction.children.length; k++){
        		hideLoopRecursive(thisFunction.children[k]);
        	}
        }
                           
        functionsAll[label].isCollapsed = true;
        pElem.classed("collapsed", true);
        insertNodeAndEdgesofFnNew(label);
        
    }

  }

  function hideLoopRecursive(index){
  	var thisLoop = loopsObj[index];
  	// If this loop is collapsed, don't traverse down the tree
  	// The inner loops are also collapsed

  	//TODO: When toggling loop, store its collapse state within the object, not in a separate array
  	
  	if(!(thisLoop.isCollapsed)){
  		//This loop is not collapsed. So, we can move onto its children.
	  	if("children" in thisLoop){
	  		for(var i=0; i<thisLoop.children.length; i++){
	  			hideLoopRecursive(thisLoop.children[i]);
	  		}
	  	}
	}	else {
		//This loop is collapsed; This means nothing inside this will be visible
		//hide this loop and its edges
		if(("Loop" + index) in nodesAll){
			//hide this loop
			nodesAll["Loop"+index].style("display", "none");
		  var nodeId = "Loop"+index;
		  var inEdges = g_function.inEdges(nodeId);
          var outEdges = g_function.outEdges(nodeId);

          for(var j=0; j<inEdges.length; j++) {
            if(inEdges[j] in edgesAll)  {
              edgesAll[inEdges[j]].style("display", "none");
              edgeLabelsAll[inEdges[j]].style("display", "none");
            }
          }
          
          for(var j=0; j<outEdges.length; j++) {
            if(outEdges[j] in edgesAll)  {
             edgesAll[outEdges[j]].style("display", "none");
             edgeLabelsAll[outEdges[j]].style("display", "none");
            }
          }


		}
	}
  }

  // This function is a modification of the same function on Function module
  // Handles the hierarchy between function and loops
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

  function insertNodeAndEdgesofFnNew(label){
  	// All the hiding has been handled; Only need to handle addition of edges and node
    var grpbbox = computeFnBBox(label);
    var fnNodes = functionsAll[label].nodes;

    //Create a temporary holder for computed edges; When the processing is complete, add this to the main graph
    //Create a place to store objects holding u,v,value
    var tempEdges = {};

    if(functionsAll[label].isCollapsed){
      // This function is collapsed; Add edges from/to the super node
      
      var nodeId = label;
      var node;
      
      if(!(nodeId in nodesAll)){
        node = addNodeView(nodeId, grpbbox, label);
      }

      // Update this to be at the center of the bbox
      // Don't need to update edges now because the edges are going to be updated next
      centerSuperNode(nodesAll[nodeId], grpbbox); 
      nodesAll[nodeId].style("display", "unset");

      
      //Compute all possible edges on the fly
      //Except for edges from/to functions which are precomputed
      for(var i = 0; i < fnNodes.length; i++){
      	var nodeId = fnNodes[i];
      	var inEdges = g_function.inEdges(nodeId);
      	var outEdges = g_function.outEdges(nodeId);
      	var parent, thisParent;
      	var currEdge;
		thisParent = g_function.node(nodeId).parent;
        var edge, edgeId, edgeLabel, edge_val;
        var topMost;
        var u,v;
		
		v = label;
		for(var j=0; j<inEdges.length; j++) {

            currEdge = g_function._strictGetEdge(inEdges[j]);
            
            //Work with only basic nodes
            if(!("type" in g_function.node(currEdge.u))  || g_function.node(currEdge.u).type != "basic"){
            	continue;
            }

            parent = g_function.node(currEdge.u).parent;
            // If both nodes belong to the same function, skip them
            if(parent==thisParent){
            	continue;
            }
            //get the topmost supernode that is collapsed that contains the incident node
            topMost = getTopCollapsed(currEdge.u);
            if(topMost.topMostNode != null){
            	
            	u = topMost.topMostNode;
            	
            	if(topMost.topMostType == "function"){

            		//TODO: Add the edge between the two functions
            		// No need to calculate the edges because function edges between all functions are pre-computed
            		// The assumption is that this inter-function node is already calculated
            		edgeId = g_function.inEdges(v, u)[0];
            		edge_val = g_function._strictGetEdge(edgeId).value;
            		setupAndUpdateEdge(edgeId, u, v, edge_val);

            	}	else {
            		// This is a loop
            		//TODO: Calculate the edge and store it in tempEdges
            		//Then on finishing this loop, add the edges to the graph as well as into the svg
            		var value = currEdge.value;
            		var vlabel = value.label;
            		var re = /ct:(\d+)/i;
            		var ct = parseInt(vlabel.match(re)[1]);
            		if(g_function.inEdges(v, u).length > 0){
            			// TODO: Redraw the edge between the two
            			// Edge is already calculated
            			edgeId = g_function.inEdges(v, u)[0];
            			edge_val = g_function._strictGetEdge(edgeId).value;
            			setupAndUpdateEdge(edgeId, u, v, edge_val);

            		} else if((u in tempEdges) && (v in tempEdges[u])){
            			//The edges between the two is being calculated now
            			var edge_val = tempEdges[u][v];
          				var edge_cnt = parseInt(edge_val.label.match(re)[1]);
          				ct += edge_cnt;

          				edge_val.label = "ct:" + ct;
          				tempEdges[u][v].label = edge_val.label;
            		} else {
            			// The edge calculation process is starting now
            			if(!(u in tempEdges)){
            				tempEdges[u] = {};
            			}
            			tempEdges[u][v] = value;
            		}
            	}
            }	else {
            	u = currEdge.u;

            	//This is a basic node
            	//TODO: Unhide the edge with the basic node
            	edgeId = g_function.inEdges(v, u)[0];
            	edge_val = g_function._strictGetEdge(edgeId).value;
            	setupAndUpdateEdge(edgeId, u, v, edge_val);
            }
        }

        //TODO: Do the same processing for outgoing edges
        u = label;
        for(var j=0; j<outEdges.length; j++) {
            currEdge = g_function._strictGetEdge(outEdges[j]);
            parent = g_function.node(currEdge.v).parent;

            //Work with only basic nodes
            if(!("type" in g_function.node(currEdge.v))  || g_function.node(currEdge.v).type != "basic"){
            	continue;
            }

            // If both nodes belong to the same function, skip them
            if(parent==thisParent){
            	continue;
            }
            //get the topmost supernode that is collapsed that contains the incident node
            topMost = getTopCollapsed(currEdge.v);
            if(topMost.topMostNode != null){
            	
            	v = topMost.topMostNode;
            	
            	if(topMost.topMostType == "function"){

            		//TODO: Add the edge between the two functions
            		// No need to calculate the edges because function edges between all functions are pre-computed
            		// The assumption is that this inter-function node is already calculated
            		edgeId = g_function.outEdges(u, v)[0];
            		edge_val = g_function._strictGetEdge(edgeId).value;
            		setupAndUpdateEdge(edgeId, u, v, edge_val);

            	}	else {
            		// This is a loop
            		//TODO: Calculate the edge and store it in tempEdges
            		//Then on finishing this loop, add the edges to the graph as well as into the svg
            		var value = currEdge.value;
            		var vlabel = value.label;
            		var re = /ct:(\d+)/i;
            		var ct = parseInt(vlabel.match(re)[1]);
            		if(g_function.outEdges(u, v).length > 0){
            			// TODO: Redraw the edge between the two
            			// Edge is already calculated
            			edgeId = g_function.outEdges(u, v)[0];
            			edge_val = g_function._strictGetEdge(edgeId).value;
            			setupAndUpdateEdge(edgeId, u, v, edge_val);

            		} else if((u in tempEdges) && (v in tempEdges[u])){
            			//The edges between the two is being calculated now
            			var edge_val = tempEdges[u][v];
          				var edge_cnt = parseInt(edge_val.label.match(re)[1]);
          				ct += edge_cnt;

          				edge_val.label = "ct:" + ct;
          				tempEdges[u][v].label = edge_val.label;
            		} else {
            			// The edge calculation process is starting now
            			if(!(u in tempEdges)){
            				tempEdges[u] = {};
            			}
            			tempEdges[u][v] = value;
            		}
            	}
            }	else {
            	v = currEdge.v;

            	//This is a basic node
            	//TODO: Unhide the edge with the basic node
            	edgeId = g_function.outEdges(u, v)[0];
            	edge_val = g_function._strictGetEdge(edgeId).value;
            	setupAndUpdateEdge(edgeId, u, v, edge_val);
            }
        }      

      }
     
    }

    else {
    	// This function is uncollapsed
    	// Construct the child views recursively

    	//********** Add code here *************/
    	
  	
  	for(var i=0; i<fnNodes.length; i++){
  		nodeId = fnNodes[i];
  		var thisGraphNode = g_function.node(nodeId);
  		if(thisGraphNode.parentLoop != null){
  			//skip those nodes which are part of any children super node
  			continue;
  		}

  		//unhide the node
  		nodesAll[nodeId].style("display", "unset"); 

  		//create the edges from/to these nodes
  		/************Started editing here *********/
  		
  		var inEdges = g_function.inEdges(nodeId);
      	var outEdges = g_function.outEdges(nodeId);
      	var currEdge;
		var edge, edgeId, edgeLabel, edge_val;
        var topMost;
        var u,v;
		
		v = nodeId;
		for(var j=0; j<inEdges.length; j++) {

            currEdge = g_function._strictGetEdge(inEdges[j]);
            
            //Work with only basic nodes
            if(!("type" in g_function.node(currEdge.u))  || g_function.node(currEdge.u).type != "basic"){
            	continue;
            }

            //get the topmost supernode that is collapsed that contains the incident node
            topMost = getTopCollapsed(currEdge.u);
            
            if(topMost.topMostNode != null){
            	u = topMost.topMostNode;
            	
            }	else {
            	u = currEdge.u;
            }
        	//Calculate the edge and store it in tempEdges
    		//Then on finishing this loop, add the edges to the graph as well as into the svg
    		var value = currEdge.value;
    		var vlabel = value.label;
    		var re = /ct:(\d+)/i;
    		var ct = parseInt(vlabel.match(re)[1]);
    		if(g_function.inEdges(v, u).length > 0){
    			// Redraw the edge between the two
    			// Edge is already calculated
    			edgeId = g_function.inEdges(v, u)[0];
    			edge_val = g_function._strictGetEdge(edgeId).value;
    			setupAndUpdateEdge(edgeId, u, v, edge_val);

    		} else if((u in tempEdges) && (v in tempEdges[u])){
    			//The edges between the two is being calculated now
    			var edge_val = tempEdges[u][v];
  				var edge_cnt = parseInt(edge_val.label.match(re)[1]);
  				ct += edge_cnt;

  				edge_val.label = "ct:" + ct;
  				tempEdges[u][v].label = edge_val.label;
    		} else {
    			// The edge calculation process is starting now
    			if(!(u in tempEdges)){
    				tempEdges[u] = {};
    			}
    			tempEdges[u][v] = value;
    		}
            	
        }
        

        //Do the same processing for outgoing edges
        u = nodeId;
        for(var j=0; j<outEdges.length; j++) {
            currEdge = g_function._strictGetEdge(outEdges[j]);
            
            //Work with only basic nodes
            if(!("type" in g_function.node(currEdge.v))  || g_function.node(currEdge.v).type != "basic"){
            	continue;
            }

            //get the topmost supernode that is collapsed that contains the incident node
            topMost = getTopCollapsed(currEdge.v);
            
            if(topMost.topMostNode != null){
            	v = topMost.topMostNode;
            }	else {
            	v = currEdge.v;
            }

            //Calculate the edge and store it in tempEdges
    		//Then on finishing this loop, add the edges to the graph as well as into the svg
    		var value = currEdge.value;
    		var vlabel = value.label;
    		var re = /ct:(\d+)/i;
    		var ct = parseInt(vlabel.match(re)[1]);
    		if(g_function.outEdges(u, v).length > 0){
    			// Redraw the edge between the two
    			// Edge is already calculated
    			edgeId = g_function.outEdges(u, v)[0];
    			edge_val = g_function._strictGetEdge(edgeId).value;
    			setupAndUpdateEdge(edgeId, u, v, edge_val);

    		} else if((u in tempEdges) && (v in tempEdges[u])){
    			//The edges between the two is being calculated now
    			var edge_val = tempEdges[u][v];
  				var edge_cnt = parseInt(edge_val.label.match(re)[1]);
  				ct += edge_cnt;

  				edge_val.label = "ct:" + ct;
  				tempEdges[u][v].label = edge_val.label;
    		} else {
    			// The edge calculation process is starting now
    			if(!(u in tempEdges)){
    				tempEdges[u] = {};
    			}
    			tempEdges[u][v] = value;
    		}


        }      

        /************Ended editing here *********/
  		
  	}
    	


    }

    //loop through the tempEdges object here
    //Add the edges to the graph and also create/redraw in the svg
    for( var u in tempEdges){
    	if (tempEdges.hasOwnProperty(u)) {
    		for(var v in tempEdges[u]){
    			if (tempEdges[u].hasOwnProperty(v)) {
    				g_function.addEdge(null, u, v, tempEdges[u][v]);
    				// Add the edge
    				edgeId = g_function.outEdges(u, v)[0];
    				setupAndUpdateEdge(edgeId, u, v, tempEdges[u][v]);

    			}
    		}
    	}
	}

	if("children" in functionsAll[label]){
	  	for(var j=0; j<functionsAll[label].children.length; j++){
	  		unhideAndCreateViewRecursively(functionsAll[label].children[j]);
	  	}
  	}

  }

  // This function creates all the edges incident to nodes that are its direct children that are of the type "basic"
  // Calls itself recursively to create children that are not of type "basic"
  function unhideAndCreateViewRecursively(index){
  	
  	//if this is collpsed, call unhideAndUpdateLoopBlock and stop recursion
  	if(loopsObj[index].isCollapsed){
  		unhideAndUpdateLoopBlock(index);
  		return;	
  	}

  	var label = "Loop" + index;
  	var nodeId = "Loop" + index;
  	var strippedNodes = loopsObj[index].strippedNodes;

  	//Create a temporary holder for computed edges; When the processing is complete, add this to the main graph
    //Create a place to store objects holding u,v,value
    var tempEdges = {};

  	for(var i=0; i<strippedNodes.length; i++){
  		nodeId = strippedNodes[i];
  		var thisGraphNode = g_function.node(nodeId);
  		if(thisGraphNode.parentLoop != index){
  			//skip those nodes which are part of any children super node
  			continue;
  		}

  		//unhide the node
  		nodesAll[nodeId].style("display", "unset"); 

  		//create the edges from/to these nodes
  		/************Started editing here *********/
  		
  		var inEdges = g_function.inEdges(nodeId);
      	var outEdges = g_function.outEdges(nodeId);
      	var currEdge;
		var edge, edgeId, edgeLabel, edge_val;
        var topMost;
        var u,v;
		
		v = nodeId;
		for(var j=0; j<inEdges.length; j++) {

            currEdge = g_function._strictGetEdge(inEdges[j]);
            
            //Work with only basic nodes
            if(!("type" in g_function.node(currEdge.u))  || g_function.node(currEdge.u).type != "basic"){
            	continue;
            }

            //get the topmost supernode that is collapsed that contains the incident node
            topMost = getTopCollapsed(currEdge.u);
            
            if(topMost.topMostNode != null){
            	u = topMost.topMostNode;
            	
            }	else {
            	u = currEdge.u;
            }
        	//Calculate the edge and store it in tempEdges
    		//Then on finishing this loop, add the edges to the graph as well as into the svg
    		var value = currEdge.value;
    		var vlabel = value.label;
    		var re = /ct:(\d+)/i;
    		var ct = parseInt(vlabel.match(re)[1]);
    		if(g_function.inEdges(v, u).length > 0){
    			// Redraw the edge between the two
    			// Edge is already calculated
    			edgeId = g_function.inEdges(v, u)[0];
    			edge_val = g_function._strictGetEdge(edgeId).value;
    			setupAndUpdateEdge(edgeId, u, v, edge_val);

    		} else if((u in tempEdges) && (v in tempEdges[u])){
    			//The edges between the two is being calculated now
    			var edge_val = tempEdges[u][v];
  				var edge_cnt = parseInt(edge_val.label.match(re)[1]);
  				ct += edge_cnt;

  				edge_val.label = "ct:" + ct;
  				tempEdges[u][v].label = edge_val.label;
    		} else {
    			// The edge calculation process is starting now
    			if(!(u in tempEdges)){
    				tempEdges[u] = {};
    			}
    			tempEdges[u][v] = value;
    		}
            	
        }
        

        //Do the same processing for outgoing edges
        u = nodeId;
        for(var j=0; j<outEdges.length; j++) {
            currEdge = g_function._strictGetEdge(outEdges[j]);
            
            //Work with only basic nodes
            if(!("type" in g_function.node(currEdge.v))  || g_function.node(currEdge.v).type != "basic"){
            	continue;
            }

            //get the topmost supernode that is collapsed that contains the incident node
            topMost = getTopCollapsed(currEdge.v);
            
            if(topMost.topMostNode != null){
            	v = topMost.topMostNode;
            }	else {
            	v = currEdge.v;
            }

            //Calculate the edge and store it in tempEdges
    		//Then on finishing this loop, add the edges to the graph as well as into the svg
    		var value = currEdge.value;
    		var vlabel = value.label;
    		var re = /ct:(\d+)/i;
    		var ct = parseInt(vlabel.match(re)[1]);
    		if(g_function.outEdges(u, v).length > 0){
    			// Redraw the edge between the two
    			// Edge is already calculated
    			edgeId = g_function.outEdges(u, v)[0];
    			edge_val = g_function._strictGetEdge(edgeId).value;
    			setupAndUpdateEdge(edgeId, u, v, edge_val);

    		} else if((u in tempEdges) && (v in tempEdges[u])){
    			//The edges between the two is being calculated now
    			var edge_val = tempEdges[u][v];
  				var edge_cnt = parseInt(edge_val.label.match(re)[1]);
  				ct += edge_cnt;

  				edge_val.label = "ct:" + ct;
  				tempEdges[u][v].label = edge_val.label;
    		} else {
    			// The edge calculation process is starting now
    			if(!(u in tempEdges)){
    				tempEdges[u] = {};
    			}
    			tempEdges[u][v] = value;
    		}


        }      

        /************Ended editing here *********/
  		
  	}

  	//loop through the tempEdges object here
    //Add the edges to the graph and also create/redraw in the svg
    for( var u in tempEdges){
    	if (tempEdges.hasOwnProperty(u)) {
    		for(var v in tempEdges[u]){
    			if (tempEdges[u].hasOwnProperty(v)) {
    				g_function.addEdge(null, u, v, tempEdges[u][v]);
    				// Add the edge
    				edgeId = g_function.outEdges(u, v)[0];
    				setupAndUpdateEdge(edgeId, u, v, tempEdges[u][v]);

    			}
    		}
    	}
	}

	if("children" in loopsObj[index]){
	  	for(var j=0; j<loopsObj[index].children.length; j++){
	  		//call it recursively on its children
	  		unhideAndCreateViewRecursively(loopsObj[index].children[j]);
	  	}
  	}

  }

  // This function unhides the supernode and creates and updates all edges incident to it
  // This function is called by the function unhideAndCreateViewRecursively when it reaches a super node 
  // that is collapsed
  function unhideAndUpdateLoopBlock(index){
  	  // This loop is collapsed; Add edges from/to the super node
      
      var nodeId = "Loop"+index;
      var label = "Loop" + index;
      var node;
      var strippedNodes = loopsObj[index].strippedNodes;
      var grpbbox = computeLoopBBoxStripped(index);
      //Create a temporary holder for computed edges; When the processing is complete, add this to the main graph
    //Create a place to store objects holding u,v,value
   	 var tempEdges = {};
      
      if(!(nodeId in nodesAll)){
      	//TODO: modify addNodeView; It uses drag function designed for function blocks
      	//It adds the class "function" to the node
      	//Also add trace highlighting when hovering on the node
      	//Also add the type of node to datum
      	//TODO: Also need to handle delete event
        node = addNodeView(nodeId, grpbbox, nodeId);
      }

      // Update this to be at the center of the bbox
      // Don't need to update edges now because the edges are going to be updated next
      
      centerSuperNode(nodesAll[nodeId], grpbbox); 
      nodesAll[nodeId].style("display", "unset");

      // Compute all possible edges on the fly
      // Except for edges from/to functions which are precomputed
      // Note: This logic can be modified to only calculate edges when no
      // edge pre-exists between the two entities
      for(var i = 0; i < strippedNodes.length; i++){
      	var nodeId = strippedNodes[i];
      	var inEdges = g_function.inEdges(nodeId);
      	var outEdges = g_function.outEdges(nodeId);
      	var currEdge;
		var edge, edgeId, edgeLabel, edge_val;
        var topMost;
        var u,v;
		
		v = label;
		for(var j=0; j<inEdges.length; j++) {

            currEdge = g_function._strictGetEdge(inEdges[j]);
            
            //Work with only basic nodes
            if(!("type" in g_function.node(currEdge.u))  || g_function.node(currEdge.u).type != "basic"){
            	continue;
            }

            //get the topmost supernode that is collapsed that contains the incident node
            //If it is equal to the current node, then skip
            topMost = getTopCollapsed(currEdge.u);
            if(topMost.topMostNode == label){
            	continue;
            }

            if(topMost.topMostNode != null){
            	u = topMost.topMostNode;
            	
            }	else {
            	u = currEdge.u;
            }
        	//Calculate the edge and store it in tempEdges
    		//Then on finishing this loop, add the edges to the graph as well as into the svg
    		var value = currEdge.value;
    		var vlabel = value.label;
    		var re = /ct:(\d+)/i;
    		var ct = parseInt(vlabel.match(re)[1]);
    		if(g_function.inEdges(v, u).length > 0){
    			// Redraw the edge between the two
    			// Edge is already calculated
    			edgeId = g_function.inEdges(v, u)[0];
    			edge_val = g_function._strictGetEdge(edgeId).value;

    			//TODO: The addEdgeView function adds the class "function" to edge; Remove this
    			setupAndUpdateEdge(edgeId, u, v, edge_val);

    		} else if((u in tempEdges) && (v in tempEdges[u])){
    			//The edges between the two is being calculated now
    			var edge_val = tempEdges[u][v];
  				var edge_cnt = parseInt(edge_val.label.match(re)[1]);
  				ct += edge_cnt;

  				edge_val.label = "ct:" + ct;
  				tempEdges[u][v].label = edge_val.label;
    		} else {
    			// The edge calculation process is starting now
    			if(!(u in tempEdges)){
    				tempEdges[u] = {};
    			}
    			tempEdges[u][v] = value;
    		}
            	
        }
        

        //Do the same processing for outgoing edges
        u = label;
        for(var j=0; j<outEdges.length; j++) {
            currEdge = g_function._strictGetEdge(outEdges[j]);
            
            //Work with only basic nodes
            if(!("type" in g_function.node(currEdge.v))  || g_function.node(currEdge.v).type != "basic"){
            	continue;
            }

            //get the topmost supernode that is collapsed that contains the incident node
            //If it is equal to the current node, then skip
            topMost = getTopCollapsed(currEdge.v);
            if(topMost.topMostNode == label){
            	continue;
            }

            if(topMost.topMostNode != null){
            	v = topMost.topMostNode;
            }	else {
            	v = currEdge.v;
            }

            //Calculate the edge and store it in tempEdges
    		//Then on finishing this loop, add the edges to the graph as well as into the svg
    		var value = currEdge.value;
    		var vlabel = value.label;
    		var re = /ct:(\d+)/i;
    		var ct = parseInt(vlabel.match(re)[1]);
    		if(g_function.outEdges(u, v).length > 0){
    			// Redraw the edge between the two
    			// Edge is already calculated
    			edgeId = g_function.outEdges(u, v)[0];
    			edge_val = g_function._strictGetEdge(edgeId).value;
    			setupAndUpdateEdge(edgeId, u, v, edge_val);

    		} else if((u in tempEdges) && (v in tempEdges[u])){
    			//The edges between the two is being calculated now
    			var edge_val = tempEdges[u][v];
  				var edge_cnt = parseInt(edge_val.label.match(re)[1]);
  				ct += edge_cnt;

  				edge_val.label = "ct:" + ct;
  				tempEdges[u][v].label = edge_val.label;
    		} else {
    			// The edge calculation process is starting now
    			if(!(u in tempEdges)){
    				tempEdges[u] = {};
    			}
    			tempEdges[u][v] = value;
    		}


        }      

      }

      //loop through the tempEdges object here
    //Add the edges to the graph and also create/redraw in the svg
    for( var u in tempEdges){
    	if (tempEdges.hasOwnProperty(u)) {
    		for(var v in tempEdges[u]){
    			if (tempEdges[u].hasOwnProperty(v)) {
    				g_function.addEdge(null, u, v, tempEdges[u][v]);
    				// Add the edge
    				edgeId = g_function.outEdges(u, v)[0];
    				setupAndUpdateEdge(edgeId, u, v, tempEdges[u][v]);

    			}
    		}
    	}
	}

  }

  //This function creates or updates i.e. redraws edges depending on whether it exists or not
  function setupAndUpdateEdge(edgeId, u, v, value){
  	  var edge = null, edgeLabel = null;
	  //Keep this edge; Add this edge or update this edge
	  if(!(edgeId in edgesAll)){
	    //add the edge
	    
	    edge = addEdgeView(edgeId);
	    // functionsAll[label]["edges"].push(edgeId);
	    edgeLabel = addEdgeLabelView(edgeId);
	   
	  }
	  if(!edge){
	    edge = edgesAll[edgeId];
	    edgeLabel = edgeLabelsAll[edgeId];
	  }
	  
	  drawEdgeandEdgeLabel(nodesAll[u], nodesAll[v], edge, edgeLabel, value.label);
	  edge.style("display", "unset");
	  edgeLabel.style("display", "unset");
  }

  // returns the topmost supernode that is collapsed that contains this node
  function getTopCollapsed(node){
  	var topMostNode = null;
  	var topMostType = null;
  	var thisGraphNode = g_function.node(node);
  	if("parentLoop" in thisGraphNode){
  		var parent = thisGraphNode.parentLoop;
  		while(parent != null && parent!= ""){
  			if(loopsObj[parent].isCollapsed){
  				topMostNode = "Loop"+parent;
  				topMostType = "loop";
  			}
  			parent = loopsObj[parent].parent;
  		}	
  	}
  	if(functionsAll[thisGraphNode.parent].isCollapsed){
  		topMostNode = thisGraphNode.parent;
  		topMostType = "function";
  	}

  	return {topMostNode: topMostNode, topMostType:topMostType};

  }

  return myExport;

}({}));