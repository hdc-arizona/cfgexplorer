### Readme

This is a public repository for CFGExplorer project. 

<p align="center">
  <img src="screenshots/CFGExplorer-teaser.svg.png" height=300 />
  &nbsp;
  <img src="screenshots/LoopBackgroundHighlightingBigGraph.png" height=300 />
</p>

[Click here](https://github.com/hdc-arizona/cfgexplorer/tree/develop/screenshots) for more screenshots.

## Usage notes:
* Works best with Google Chrome browser. Firefox sometimes mis-centers the graph.
* For large graphs (~1K nodes), the layout takes some time. The browser may pop up a warning saying the script is unresponsive. Please allow the script to continue. We are working on moving this layout server-side to avoid this issue.

## Requirements/Assumptions on Data Format:

### CFG
* CFG should be given as a .dot file. The instructions should be inside the 'label' field with one instruction per line. 
* This is a sample node `'B108 [shape=box, style=solid, label="main\n400590: mov dword ptr [rbp-0x68], 0xffffff9c 1 0\n400597: mov dword ptr [rbp-0x64], 0x0 1 0"];'`
* The label can start with a newline followed by instructions or it can optionally start with the function name i.e. the function the node belongs to. In the above example, the node belongs to the function main.
* The edge count should be inside the 'label' field of the edge and is optional. 
* This is a sample edge `'B108 -> B113 [style=solid, color="black", label=" ct:1"];'`

### Trace
* Trace should be in ASCII format. It should contain one assembly instruction per line. The second column should contain the instruction address. 
* This is an example line of trace `'0 400460 max _start 31 ed xor ebp, ebp R:RBP=0000000000000000 R:RBP=0000000000000000 W:RBP=0000000000000000 W:GFLAGS=0000000000000246'`
* In the example, second column contains the instruction address 400460. This is used to match the trace with the corresponding node in the CFG.

### BackTainting
* The backtainting feature requires the trace.
* The only thing it relies on is the operand values given last. It looks for the R:, W:, MR, and MR strings to identify these operands. As a result, these need to be in the same format, and need to list all affects that particular function has.

### LoopFinding
* For loopfinding, the current requirement is that the CFG should have exactly one source node (i.e. the node with no incoming edges and one or more outgoing edges).

### Starting the flask server
```
export FLASK_APP=looper.py
python3 -m flask run
```

This runs the webapp on the following address:

`localhost:5000/tracevis/`

### Plugging in custom instruction highlighting script
[Click here](https://github.com/hdc-arizona/cfgexplorer/blob/develop/analysis_readme.md) for details.

### More Usage notes

* This software works best when used with latest version of Google Chrome.

* When loading new dataset, make sure the webpage is refreshed so that there is no data in memory from the previous dataset.

* When some source files such as .html, .css, .js files are changed, perform a hard reload to clear browser’s cache. This can be done in chrome by holding down Ctrl and clicking the Reload button. 

* In some occasion when assets such as .png, .jpg files etc. are changed, hard reload won’t work. Clear the browser’s cache explicitly and then reload the webpage. In chrome, this can be done by going to the “History” tab and go to “Clear Browsing Data” and choose “Cached images and files”.

* When running the webpage on localhost, the flask server needs to be restarted whenever new code is pulled from github. Press Ctrl+c to stop the server and "python3 -m flask run" to restart it. This is because flask server caches the html file while its running.

### Licence

LGPLv2. [Click here](https://github.com/hdc-arizona/cfgexplorer/blob/develop/LICENSE) for more details. 

### Publications

Please cite:

Sabin Devkota and Katherine E. Isaacs. "CFGExplorer: Designing a Visual Control Flow Analytics System around Basic Program Analysis Operations." To appear in Computer Graphics Forum (EuroVis Proceedings). 2018.
