### Plugging in custom script for program analysis

- Place your scripts inside the 'cfgexplorer/scripts' directory.
- In the analysis.json file, update the fields for each type of analysis
- Two types of analysis are supported currently: Backtaint and Upward Exposed Read (UER) detection.

### Backtaint Analysis

Input: Takes as input an ASCII trace file, and the address to perform the taint on.
Output: Outputs an ordered list of addresses that are the taint of the instruction.

In the analysis.json file, under backtaint, update the language (i.e. python3, ruby etc.),
update the scriptpath to be "scripts/....", update the outfilename to be the name of the file output by the program (if exists).

### UER Detection
An Upward Exposed Read (UER) is the read which is not followed by writes within an iteration of a loop. It is computed with respect to loops. inUERs are the reads for which the writes are inside the loop. outUERs are the reads for which the writes are outside the loop.   


