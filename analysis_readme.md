### Plugging in custom script for instruction highlighting 

- Place your scripts inside the `cfgexplorer/scripts` directory.
- In the `analysis.json` file, add the scripts 

### For Instruction Highlighting

The script should output a list of instructions to be highlighted along with a distance metric for general gradient based highlighting. For single color highlighting, the distances can all be same. 

'''Example Output Format: 
[{ "instr_addr":"4006cf"
"dist":1},
{ "instr_addr":"400dec"
"dist":2},
.
.
.
]
'''

In the analysis.json file, under backtaint, update the language (i.e. python3, ruby etc.),
update the scriptpath to be "scripts/....", update the outfilename to be the name of the file output by the program (if exists).



