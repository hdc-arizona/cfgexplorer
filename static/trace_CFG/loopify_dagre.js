// This module runs after loop detector has been run
// Uses the loopsObj to modify the dot file to show a semantic representation of loops
var loopify_dagre = (function(myExport){

	myExport = myExport || {};
	var modified_graph = null;
	//The dotFile that needs to be modified
	//dofFile 

	//loopsObj


	modifiedDotFile="";
	// To modify connecting edges when inside loops are collapsed/expanded
	var currRootLoop;
  	var updateCurrRootLoop;

  	var roots = [];
    var flipDir = true;
    var bgFillG = null;

  	// This module works with Interprocedural Control Flow Graph.
  	// It is different from the static version because loop analysis of static version has the 
  	// analysis of the whole program in one file. The analysis is broken down into functions.
  	// Static version doesn't have edges between functions. These are shown as call instructions.
  	// These aren't seen as control flow. They are inside the basic blocks.
  	// Dynamic version cannot distinguish functions beforehand (in some cases). Has these call edges as control flow edges.
  	// Loop analysis is not broken down into functions. 
  	// There are two options for loops:
  	// Loop either ignores these call edges and contains only those nodes that are part of the original function
  	// or loop has all these call edges and contains the nodes of all functions that were called by the loop. 


	myExport.init = function(){
		initVariables();
		modifyDotGraph();

	};

  myExport.addBackground = function(){
    renderBgFill();
  }

	function initVariables(){
		modifiedDotFile = "";
		currRootLoop = null;
  		updateCurrRootLoop = null;
  		roots = [];
    modified_graph = null;
    flipDir = true;
    bgFillG = null;

	}

	function modifyDotGraph(){
		
    modifiedDotFile = dotFile; 

    //Read the dotfile into the graph
    modified_graph = graphlibDot.parse(modifiedDotFile);

		//When working with new loop, toggle flipDir, and set updateCurrentRootLoop to true
    // when encountering a top level loop
    // flipDir = !flipDir;
  		// updateCurrRootLoop = true;

  		//Find the header, exitNode, latches, exiting, connectedToExit, and isDoWhile loop 

  		// var exitNode = -1; //These are the exit nodes of the loop. There may be many
  		//exitNodes instead of a single node.
		// var header = -1;	//This is a single node that is available in dynamic case
		// var latches = [];	// The latch are all the nodes that connect back to the header; They are part of the back edge
		// In the static analysis, all latches are combined into a single natural loop; But in dynamic ICFGs, every back edge forms a separate loop.
		// Even when both loops contain the same nodes, they are considered as separate loops
		// var exiting = [];	//The nodes that are labeled exiting nodes by static analysis
		// var connectedToExit=[];	// The nodes that are connected to exit; These are mostly header nodes. These are also nodes that are part of the break or exit statement.
		// var isDoWhile = false; // Handling port based edge routing for dowhile loops is different than while and for loops
		// var depth; // Also store depth

		//If node is latch, and also connectedToExit, it is a doWhile loop  
		
		//For dynamic, we only need to find exitNode, connectedToExit, depth, and isDoWhile

		//Go through the tree, record their depth,exitNode, connectedToExit, and isDoWhile

		//When rendering background, perform a breadth-first traversal i.e. 
		// start adding the background from roots.
		// Parents should be laid out before child.
		
		//Since this module is called before loopCollapser module, there is no "parentInterproc" field yet

		// When traversing the loop hierarchy, traverse using "parent" and "parentInterproc"
		// If parent is "" and parentInterproc is not defined or null, it means the loop is a root loop.
		// Otherwise, the loop is child of some other loop and hence possibly inside the parent loop.
		// Also update the children; Add a new field "childrenForLoopBg" and take into account parentInterproc.
		// Eventhough some inner loop is not inside the parent function of the outer loop, visually this inner loop might be inside the outerloop.
		// The BFS background fill strategy works even when the inner loop is not inside the outerloop visually. The outerloop background is
		// added before adding the inner loop background. This type of inner loop may not be inside outer loop visually because 
		// the inner loop's function is called by many different 
		// functions and hence the layout algorithm decides to place it centrally with respect to all other 
		// calling functions.

		// This module is executed before graph layout and before calling loopCollapser module.
		// This module returns a modified dotFile to the main module. And the main module will take care of the graph layout and hiding of invisible edges in the dot file. 
		// Invisible edges in the dot file are not made invisible by dagre. Therefore, this post-processing needs to be applied.
		// The graph that the main module will work with is the original graph. This modified graph might 
		// be required only when background filling needs to be reapplied. This is because 
		// the invisible edge is also part of the loop boundary. 

		createLoopTree();
		computeExitInfo();
		runModifier();

	}

	// Populates the "childrenForLoopBg" field
  	// populates the 'roots' array, and 'childrenForLoopBg' array for each of the loop 
    
  function createLoopTree(){
  	var node, parent;
  	for(var i = 0; i<loopsObj.length; i++) {
  		node = loopsObj[i];

      

  		if(node.parent != ""){
  			
  			parent = loopsObj[parseInt(node.parent)];  	

  			if(!("childrenForLoopBg" in parent)){
  				parent.childrenForLoopBg = [i];
  			} else {
  				parent.childrenForLoopBg.push(i);
  			}
  		}	else {
  			roots.push(i);
  		}

  	}
  }

  // This function computes exitNode, connectedToExit, depth, and isDoWhile
  function computeExitInfo(){

  	//Iterate through the roots 

  	// Loop through the successors of loop nodes and store all the nodes that are not
  	// part of the loop - These are exitNodes. Also store the connectedToExit nodes
	// Store the depth, and finally check if this loop's latch node is also connectedToExit;
	// If true, this is a doWhile loop
  	
  	for(var i=0; i<roots.length; i++){
  		var thisRoot = roots[i];
  		var depth = 0;
  		var exitNodes = [], connectedToExit = [], isDoWhile = false;
  		var thisRootObj = loopsObj[thisRoot];

  			//store the depth, exitNodes, connectedToExit, and isDoWhile
  			var thisRootNodes = thisRootObj.nodes;

  			for(var k=0; k<thisRootNodes.length; k++){
  				var thisNode = thisRootNodes[k];
          var successors = modified_graph.successors(thisNode);

          for(var l=0; l<successors.length; l++){
            var successor = successors[l];
            if(thisRootNodes.indexOf(successor) > -1){
              //This successor is inside the loop

            } else {
              //This successor is not inside the loop
              //This is an exit node
              if(exitNodes.indexOf(successor) == -1) {
                exitNodes.push(successor);
              }
              connectedToExit.push(thisNode);

            }

          }

  			}

        if(connectedToExit.indexOf(thisRootObj.backedge[0]) > -1){
          isDoWhile = true;
        }

        // Store these fields in the loopsObj
        thisRootObj.exitNodes = exitNodes;
        thisRootObj.connectedToExit = connectedToExit;
        thisRootObj.depth = depth;
        thisRootObj.isDoWhile = isDoWhile;

      if("childrenForLoopBg" in thisRootObj){

  			for (var j=0; j<thisRootObj.childrenForLoopBg.length; j++){
  				computeExitRecursive(thisRootObj.childrenForLoopBg[j], depth+1);
   			}
  		}

  	}
  }

  // This function recursively computes exit, depth etc.
  function computeExitRecursive(index, depth){

	  var exitNodes = [], connectedToExit = [], isDoWhile = false;
    var thisRootObj = loopsObj[index];

      //store the depth, exitNodes, connectedToExit, and isDoWhile
      var thisRootNodes = thisRootObj.nodes;

      for(var k=0; k<thisRootNodes.length; k++){
        var thisNode = thisRootNodes[k];
        var successors = modified_graph.successors(thisNode);

        for(var l=0; l<successors.length; l++){
          var successor = successors[l];
          if(thisRootNodes.indexOf(successor) > -1){
            //This successor is inside the loop

          } else {
            //This successor is not inside the loop
            //This is an exit node
            if(exitNodes.indexOf(successor) == -1) {
              exitNodes.push(successor);
            }
            connectedToExit.push(thisNode);

          }

        }

      }

      if(connectedToExit.indexOf(thisRootObj.backedge[0]) > -1){
        isDoWhile = true;
      }

      // Store these fields in the loopsObj
      thisRootObj.exitNodes = exitNodes;
      thisRootObj.connectedToExit = connectedToExit;
      thisRootObj.depth = depth;
      thisRootObj.isDoWhile = isDoWhile;

    if("childrenForLoopBg" in thisRootObj){

      for (var j=0; j<thisRootObj.childrenForLoopBg.length; j++){
        computeExitRecursive(thisRootObj.childrenForLoopBg[j], depth+1);
      }
    }
  }

  //This function iterates through all loops and adds invisible edges or modifies the ports of edges
  function runModifier(){

    var depth = 0;
    for(var k=0; k<roots.length; k++){
      flipDir = !flipDir;
      modifyRecursively(roots[k]);
    }

    myExport.modifiedDotFile = modifiedDotFile;


  }

  function modifyRecursively(index){

    //Process this loop; Then process its children

    var thisLoopObj = loopsObj[index];
    var latches = [thisLoopObj.backedge[0]];
    var header = thisLoopObj.backedge[1];
    var connectedToExit = thisLoopObj.connectedToExit;
    var isDoWhile = thisLoopObj.isDoWhile;

    var re = /\d+/i;
    //There can be multiple exit nodes. If so, use the one with the lowest instruction address. That will be closest exit from the loop. Confirm this.
    var exitNode = thisLoopObj.exitNodes[0];

    var temp = thisLoopObj.exitNodes;
    for(var i =1; i<temp.length; i++){

      if(parseInt(exitNode.match(re)[0]) > parseInt(temp[i].match(re)[0])){
          exitNode = temp[i];
      }
    }

    for(var i=0; i<latches.length; i++){
          addInvisEdge(latches[i], exitNode);
          var port = (i%2) ? "e":"w";
          if(flipDir) { if(port==="e") {port="w";} else {port="e";} }
          if(isDoWhile) { port = (i%2) ? "w":"e"; 
//            if(flipDir) { if(port==="e") {port="w";} else {port="e";} }
          }
          modifyEdge(latches[i], header, port);
    }

    for(var i=0; i < connectedToExit.length; i++){
          var port = "e";
          if(flipDir) { if(port==="e") {port="w";} else {port="e";} }
          if(isDoWhile && (latches.indexOf(connectedToExit[i]) > -1) ) {
            port = "w";
//            if(flipDir) { if(port==="e") {port="w";} else {port="e";} }
            modifyEdge(header, connectedToExit[i], port);
          } else {
            modifyEdge(connectedToExit[i], exitNode, port);
          }
    }
        
    if(isDoWhile){
      var predecessors = modified_graph.predecessors(latches[0]);
      for(var j=0; j<predecessors.length; j++){
        var temp = predecessors[j];
        var port = "w";
//            if(flipDir) { if(port==="e") {port="w";} else {port="e";} }
        modifyEdge( temp, latches[0], port);
      }
    }

    if("childrenForLoopBg" in thisLoopObj){
      for (var j=0; j<thisLoopObj.childrenForLoopBg.length; j++){
          modifyRecursively(thisLoopObj.childrenForLoopBg[j]);
      }
    }
 }

function renderBgFill(){

  // Add a g as a top child inside "svg"
  bgFillG = d3.select("#graphContainer g.zoom").append("g").attr("id", "bgFill");
  bgFillG.node().parentNode.insertBefore(bgFillG.node(), bgFillG.node().parentNode.firstChild);

  // for(var k=0; k<roots.length; k++){
  //     renderBgFillRecursive(roots[k]);
  // }


  var listToExplore = roots;

  while(listToExplore.length > 0){
    var index = listToExplore.shift();

    //This node visited; render the background
    renderBgFillIndividual(index, bgFillG);
    var thisLoopObj = loopsObj[index];

    if("childrenForLoopBg" in thisLoopObj){
      for(var j=0; j<thisLoopObj.childrenForLoopBg.length; j++){
        listToExplore.push(thisLoopObj.childrenForLoopBg[j]); 
      }
    }

  }


}

  function renderBgFillRecursive(index){
   
    // Add background filled path on the loop and its children
    // Add the loop index as the datum

    var re = /\d+/i;
    var loopObject = loopsObj[index];

    var header = loopObject.backedge[1];
    var exitNode = loopObject.exitNodes[0];

    var temp = loopObject.exitNodes;
    for(var i =1; i<temp.length; i++){

      if(parseInt(exitNode.match(re)[0]) > parseInt(temp[i].match(re)[0])){
          exitNode = temp[i];
      }
        
    }

    var latches = [loopObject.backedge[0]];
    var depth = loopObject.depth;
    var connectedToExit = loopObject.connectedToExit;

    //get the exiting edge
    var exitingEdge = modified_graph.outEdges(header, exitNode)[0];
    if(exitingEdge == null) {
      // find the node with smallest label connected to exitnodes

      var minExitingNode = connectedToExit[0];
      for(var j=1; j<connectedToExit.length; j++){

        if(parseInt(minExitingNode.match(re)[0]) > parseInt(connectedToExit[j].match(re)[0])){
          minExitingNode = connectedToExit[j];
        }
      }
      var temp = modified_graph.successors(minExitingNode);
      var temp_successor = temp[0];
      for(var l=1; l<temp.length; l++){
        if(parseInt(temp_successor.match(re)[0]) > parseInt(temp[l].match(re)[0])){
          temp_successor = temp[l];
        }
      }

      exitingEdge = modified_graph.outEdges(minExitingNode, temp_successor)[0];
    }

    //get the latching edge
    var latchingEdge = modified_graph.outEdges(latches[0], header)[0];

    // debugger;

    var dExit = edgesAll[exitingEdge].select("path").attr("d");
    var dLatch = edgesAll[latchingEdge].select("path").attr("d");
    
    // get the 1st point of dLatch
    var re = /\s*([M])\s*(-?\d+(\.\d+)*)\s*,\s*(-?\d+(\.\d+)*)/i;
    var res = dLatch.match(re);
    var px1 = Number(res[2]);
    var py1 = Number(res[4]);

    //get the 1st control point of dLatch
    re = /\s*C\s*(-?\d+(\.\d+)*)\s*,\s*(-?\d+(\.\d+)*)\s*,\s*(-?\d+(\.\d+)*)\s*,\s*(-?\d+(\.\d+)*)\s*,\s*(-?\d+(\.\d+)*)\s*,\s*(-?\d+(\.\d+)*)/i;
    res = dLatch.match(re);
    var c11x = Number(res[1]);
    var c11y = Number(res[3]);
    
    //reflect the 1st pt wrt c11
    var refx1 = c11x + (c11x - px1);
    var refy1 = c11y + (c11y - py1);

    //reflect c11
    var refc11x = refx1 + (refx1 - c11x);
    var refc11y = refy1 + (refy1 - c11y);

    //construct a d attr
    // var d = dExit + dLatch.replace(/M\s*(-?\d+(\.\d+)*)\s*,\s*(-?\d+(\.\d+)*)\s*C\s*(-?\d+(\.\d+)*)\s*,\s*(-?\d+(\.\d+)*)/i," S " + c11x + "," + c11y + " " +
      // refx1 + "," + refy1 + " C " + 
      // refc11x + "," + refc11y + " " )
      //  + " Z";

    var d = dExit + dLatch.replace(/M\s*(-?\d+(\.\d+)*)\s*,\s*(-?\d+(\.\d+)*)L(-?\d+(\.\d+)*),(-?\d+(\.\d+)*)\s*C\s*(-?\d+(\.\d+)*)\s*,\s*(-?\d+(\.\d+)*)/i," S " + px1 + "," + py1 + " " +
      px1 + "," + py1 + " C " + 
      c11x + "," + c11y + " " )
       + " Z";   

    // var d = constructBgCurve(index);
    // d = constructBgCurve(index);
    d = constructBgCurve(index, bgFillG);   

    bgFillG.append("path")
    .attr("fill", getBgColor(depth))
    .attr("stroke", "none")
    .attr("d", d)
    .datum(index);

    if("childrenForLoopBg" in loopObject){
      for (var j=0; j<loopObject.childrenForLoopBg.length; j++){
          renderBgFillRecursive(loopObject.childrenForLoopBg[j]);
      }
    }

}

function renderBgFillIndividual(index, bgFillG){

    var loopObject = loopsObj[index];
    var depth = loopObject.depth;

    var d = constructBgCurve(index, bgFillG);
    
    bgFillG.append("path")
    .attr("fill", getBgColor(depth))
    .attr("stroke", "none")
    .attr("d", d)
    .datum(index);

}


// This function constructs a cubic spline that is a closed path and is used 
// to fill background. All ideas suggested by Josh.
/****** Alternative 1 *************/
// Take the endpoints of nodes. Compute a convex hull on the points.
// Check if for every pair in the boundary, an edge exists. If it exists, use that edge.
// Otherwise create a straight line.

/****** Alternative 2 ************/
// Instead of taking just the endpoints of nodes for convex hull calculation, 
// also take the control points of the splines. These are in most cases nearby 
// the location of the fake nodes.

//Both these approaches can't provide non-convex boundary. 

/******* Alternative 3 ***********/
//Gift-Wrapping Algorithm
// Take the edges that rotate the least in anti-clockwise direction.
// Keep taking the edges until we reach the header of the loop.
// Might miss some nodes if there is an edge crossing. Edge crossing seems 
// to be linked to the computational complexity of determining non-convex
// bounding boxes. Not sure if the path doesn't go through the same node twice. 
// Can modify the algorithm to not repeat the nodes.

/******** Alternative 4 **********/
// In/Out Algotithm
// Take many different cycles that start and end in the header.
// Fill background for each and check if remaining nodes are inside the boundary.
// When no nodes on the outside, we are done.
// This may be slow and may require many iterations to cover all the points
// if the paths are chosen randomly. 
// Can use a certain no. of paths as threshold and use other approaches as fallback
// when threshold reached.
// Can choose paths smartly such as in the gift wrapping algorithm or find a longish path (not clear how to find longish path).




function constructBgCurve(index, bgFillG){
  
  // Get the four points of all polygon in the loop
  // This also works for dowhile loops
  // Compute the convex hull of points
  // Check if the nodes in the convex hull share an edge 
  // If they do share, use that edge
  // otherwise draw a straight line

  // To use an existing edge, if there is only one edge between the two nodes then use that edge.
  // Add the segment to connect it to the start and end point of the edge.
  // For this, determine the direction of the edge first. If necessary reverse the direction of edge to 
  // make it a counter-clockwise ordering (i.e. convex hull ordering). 
  // If there are two edges, then take the edge with the control point that is more to the right (following counter-clockwise orientation)

  var points = [];

  var loopObject = loopsObj[index];
  var thisNodes = loopObject.nodes;
  var depth = loopObject.depth;


  var header = loopObject.backedge[1];
  var tail = loopObject.backedge[0];

  // get the edgeId from the graph for the backedge
  var edgeId = modified_graph.outEdges(tail, header)[0];

  // get the edge from edgesAll
  var backedge = edgesAll[edgeId];
  var backedgeDattr = backedge.select("path").attr("d");

  // get the endpoints of the edge
  var first_re = /M(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/i;
  var last_re = /[\s\S]*L(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/i;

  var temp_match = backedgeDattr.match(first_re);
  var x1 = Number(temp_match[1]);
  var y1 = Number(temp_match[3]);

  var temp_match = backedgeDattr.match(last_re);
  var x2 = Number(temp_match[1]);
  var y2 = Number(temp_match[3]);

  for(var k = 0; k<thisNodes.length; k++){
    var thisNode = thisNodes[k];
    var thisPoints = getRectanglePoints(thisNode);
    Array.prototype.push.apply(points, thisPoints);
  }

  var hullPoints = convexHull(points);
  // d = "M10 10 L 90 90 "
  d = "M " + hullPoints[0].x + " " + hullPoints[0].y + " ";

  for(var i=1; i<hullPoints.length; i++){
  
        var point = hullPoints[i];
        d = d + " L " +  point.x + " " + point.y + " "; 
        
  };

  d += " Z";

  // create a path using the closest convex points to the two endpoints
  // close the path 

  var min_dist1 = getEuclideanDist(hullPoints[0].x, hullPoints[0].y, x1, y1);
  var min_index1 = 0;
  var min_dist2 = getEuclideanDist(hullPoints[0].x, hullPoints[0].y, x2, y2);
  var min_index2 = 0;

  for(var i=1; i<hullPoints.length; i++){

    var point = hullPoints[i];

    if(getEuclideanDist(point.x, point.y, x1, y1) < min_dist1){
      min_dist1 = getEuclideanDist(point.x, point.y, x1, y1);
      min_index1 = i;
    }

    if(getEuclideanDist(point.x, point.y, x2, y2) < min_dist2){
      min_dist2 = getEuclideanDist(point.x, point.y, x2, y2);
      min_index2 = i;
    }
  }

  var newbackedgeDattr = backedgeDattr;

  if(min_index2<=min_index1){

    for(var i = min_index2; i<= min_index1; i++){

      var point = hullPoints[i];
      newbackedgeDattr = newbackedgeDattr + " L " +  point.x + " " + point.y + " "; 
    }

  } else {
    for(var i = min_index2; i < hullPoints.length; i++ ){
      var point = hullPoints[i];
      newbackedgeDattr = newbackedgeDattr + " L " +  point.x + " " + point.y + " "; 
    }

    for(var i = 0; i<=min_index1; i++){
      var point = hullPoints[i];
      newbackedgeDattr = newbackedgeDattr + " L " +  point.x + " " + point.y + " "; 

    }

  }
  newbackedgeDattr += " Z";

  bgFillG.append("path")
    .attr("fill", getBgColor(depth))
    .attr("stroke", "none")
    .attr("d", newbackedgeDattr)
    .datum(index);


  return d;



  

}


function getEuclideanDist(x1, y1, x2, y2){
  return (x1-x2)*(x1-x2) +(y1-y2)*(y1-y2);
}

// Returns an array of points; Also returns the node that its part of in the field "nodeId"
// Returns the type/location in "type" field: Types are "topLeft", "topRight", "bottomLeft", "bottomRight".
function getRectanglePoints(nodeId){

  var thisNode = nodesAll[nodeId];  
  var translate = d3.transform(thisNode.attr("transform")).translate;

  var rect = thisNode.select("rect");

  var x = Number(rect.attr("x")) + translate[0];
  var y = Number(rect.attr("y")) + translate[1];
  var height = Number(rect.attr("height"));
  var width = Number(rect.attr("width"));

  //compute the four corner points
  var points = [];
  points.push({x: x, y: y, nodeId: nodeId, type: "topLeft" });
  points.push({x: x+width, y: y, nodeId: nodeId, type: "topRight" });
  points.push({x: x, y: y+height, nodeId: nodeId, type: "bottomLeft" });
  points.push({x: x+width, y: y+height, nodeId: nodeId, type: "bottomRight" });
 
  return points;

}



//TODO: Modify this color map to handle greater nesting level
function getBgColor(depth){
  // var colors = ['#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#084594'];
  var colors = ['#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#8c2d04'];

  return colors[(depth)%(colors.length)];

}

// u & v are firstInstrs
function addInvisEdge(u, v) {

  //  Node0x662800 -> Node0x662310[style=invis];
  
  // var str = nodesAll[u].nodeId + " -> " + nodesAll[v].nodeId + ";" ;
  var str = u + " -> " + v + "[style=invis];";
  modifiedDotFile = modifiedDotFile.slice(0, modifiedDotFile.lastIndexOf("}"));
  
  modifiedDotFile += str + "\n";
  modifiedDotFile += "}";

}

function modifyEdge(u, v, port){
  
  // lineString = lineString.replace(/(label="\{)(%\d+:)([\S\s]*)(\})/, "$1$2$4");
  // var re = new RegExp(nodesAll[u].nodeId + "(:[0-9a-zA-Z]+)?" + "\\s*->\\s*" + nodesAll[v].nodeId + "(:[0-9a-zA-Z]+)?");
  var re = new RegExp(u + "(:[0-9a-zA-Z]+)?" + "\\s*->\\s*" + v + "(:[0-9a-zA-Z]+)?");
  
  modifiedDotFile = modifiedDotFile.replace(re, u + ":" + port + " -> " + v + ":" + port);
  
}

  return myExport;

}({}));