### Plugging in custom script for instruction highlighting 

- Place your scripts inside the `cfgexplorer/scripts` directory.
- In the `analysis.json` file, add the scripts 

### For Instruction Highlighting

The script should output a list of instructions to be highlighted along with a distance metric for general gradient based highlighting. For single color highlighting, the distances can all be same. 

```Example Output Format: 
[{ "instr_addr":"4006cf"
"dist":1},
{ "instr_addr":"400dec"
"dist":2},
.
.
.
]
```

In the `analysis.json` file, inside `scripts`, add the scripts.
For each script,
* Enter the `type`. Currently the only type available is `instrHighlight` which higlights the instruction in both CFG and the trace (if available)
* Enter the `language` (as you would call it from a UNIX command line for e.g. `python3`, `ruby` etc.),
* Enter the `scriptpath`to be the path of the analysis script for eg. `scripts/taint.py`
* Enter the `outfilename` to be the name of the file output by the program.



