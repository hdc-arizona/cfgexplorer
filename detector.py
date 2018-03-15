import re, string, fileinput, argparse, json, timeit, sys
import networkx as nwx
import multiprocessing as mp
from collections import namedtuple
from functools import reduce
from copy import copy

'''
Compute all dominators using O(n^2) algorithm
'''
def dominanators( graph, start ):
  # Universal set of nodes
  universal_set = set( graph.nodes() )
  # Set of nodes to iterate over
  iter_set = universal_set - set([start])

  # Initial set of dominator nodes
  # if not the start node, then n is dominated by the universal set
  # if the start node, then n is only dominated by n
  doms = {
    n: (
        copy( universal_set )
        if n != start
        else set( [start] )
       )
      for n in graph.nodes()
  }

  # Iterative algorithm
  changed = True
  while changed:
    changed = False
    for n in iter_set:
      # Union of n and ...
      new_doms = set([n]).union(
        # ... intersection of all current dominators of n's predecessors
        reduce(
          set.intersection,
          map(
            lambda pred: doms[pred],
            graph.predecessors( n )
          ),
          universal_set
        )
      )

      # if changed, changed true and set doms
      if new_doms != doms[n]:
        changed = True;
        doms[n] = new_doms

  return doms


'''
'Parse' dot file (by collecting edges) into a networkx graph object
'''
def parse_dot_to_graph( file_path ):
  # Regex to capture edges ("node_a -> node_b")
  # edge_rx = re.compile( r"^\s*(?P<src>[\w_][\w_\d]*)\s*\-\>\s*(?P<tgt>[\w_][\w_\d]*)\s*\[.*?label=\"\s*ct\s*:\s*(?P<count>\d+)\s*\".*\]\s*;\s*$" )
  # edge_rx = re.compile( r"^\s*(?P<src>[\w_][\w_\d]*)\s*\-\>\s*(?P<tgt>[\w_][\w_\d]*)" )
  edge_rx = re.compile( r"^\s*(?P<src>[\w_][\w_\d]*)(:[\w]*)?\s*\-\>\s*(?P<tgt>[\w_][\w_\d]*)(:[\w]*)?" )
  
  graph = nwx.DiGraph()

  # For each file
  for line in fileinput.input( file_path ):
    # Try and match edges
    match = edge_rx.match( line )
    if match != None:
      # Add edge in graph
      graph.add_node( match.group("src"), _name=match.group("src") )
      graph.add_node( match.group("tgt"), _name=match.group("tgt") )
      graph.add_edge( match.group("src"), match.group("tgt") )

      continue

  return graph


def parse_dot_for_last_instructions( file_path ):
  node_rx = re.compile( r"^\s*(?P<name>[\w_][\w_\d]*)\s*\[.*?label=\"(?P<label>.*)\".*\]\s*;\s*$" )
  instr_rx = re.compile( r"^(?P<addr>[a-fA-F\d]+):.*" )

  nodes = {}
  # For each file
  for line in fileinput.input( file_path ):
    # Try and match nodes
    match = node_rx.match( line )
    if match != None:
      instrs = list(
        map(
          lambda m: m.group("addr"),
          filter(
            lambda m: m != None,
            map(
              instr_rx.match,
              match.group("label").split("\\n")
            )
          )
        )
      )

      nodes[match.group("name")] = instrs[-1] if len( instrs ) > 0 else str(-1)
      continue

  return nodes

'''
Get roots (nodes with no incomming edges) of a graph
IF there are more than one roots, then create a superroot
and add edges from superroot to the roots
'''
def get_roots( graph ):
  roots = list(set( graph.nodes() ) - set( map( lambda twople: twople[1], graph.edges() ) ))
  if len(roots) > 1:
    graph.add_node("my_super_root", _name = "my_super_root")
    for r in roots:
      graph.add_edge("my_super_root", r)
      
  return list(set( graph.nodes() ) - set( map( lambda twople: twople[1], graph.edges() ) ))

'''
Compute the backedges of a graph, given already computed dominators
'''
def compute_backedges( graph, dominators ):
  return list(
    filter(
      lambda src_tgt: src_tgt[1] in dominators[src_tgt[0]],
      graph.edges()
    )
  )


'''
Collect list of loops.
Returns a list of dictionaries, each with two entries:
+ backedge: backedge that defines the loop
+ nodes: collection of nodes that compose the entire loop
'''

'''
compute_loops_from_backedges_WorkUnit
Type that wraps a work unit for the compute_loops_from_backedges task.
'''
compute_loops_from_backedges_WorkUnit = namedtuple( "compute_loops_from_backedges_WorkUnit", ["backedge", "graph", "dominanators"] )

def compute_loops_from_backedges( work_unit ):
  backedge = work_unit.backedge
  graph = work_unit.graph
  dominanators = work_unit.dominanators
  return {
    "backedge" : backedge,
    "nodes" :
        # Filter out nodes where the target of the backedge is not in its  dominator set
        list(filter(
          lambda node: backedge[1] in dominanators[node],
          getNodes(graph,backedge)
        ))
  }

def getNodes(graph, backedge):
  if backedge[0] == backedge[1]:
    return [backedge[0]]
  reverseGraph = graph.reverse()
  # remove the header
  reverseGraph.remove_node(backedge[1])
  nodeList = list(nwx.dfs_preorder_nodes(reverseGraph,backedge[0]))
  # nodeList = nwx.depth_first_search.dfs_tree(reverseGraph, backedge[0]).nodes()
  nodeList.append(backedge[1])
  return nodeList 

'''
Farms out work to a pool of tasks to collect loops
'''
def collect_loops( graph, backedges, dominanators, processes ):
  pool = mp.Pool(processes)
  return list(
    pool.map(
      compute_loops_from_backedges,
      map(
        lambda backedge: compute_loops_from_backedges_WorkUnit( backedge=backedge, graph=graph, dominanators=dominanators ),
        backedges
      )
    )
  )

def addParentInfo(loopsObj):
  loopsObj.sort(key=lambda x: len(x["nodes"]))
  for i in range(len(loopsObj)):
    loopsObj[i]["parent"] = ""
    for j in range(i+1, len(loopsObj)):
      header = loopsObj[i]["backedge"][1]
      if header in loopsObj[j]["nodes"]:
        if len(loopsObj[i]["nodes"]) == len(loopsObj[j]["nodes"]):
          if "equal" in loopsObj[i]:
            loopsObj[i]["equal"].append(j)
          else:
            loopsObj[i]["equal"] = [j]
        else:
          loopsObj[i]["parent"] = j
          break


def main(inp_args):
  parser = argparse.ArgumentParser( )
  parser.add_argument( 'file_path', type=str, nargs=1 )
  parser.add_argument( '-o', '--output', dest='output', type=str, nargs=1, default=None )
  parser.add_argument( '-v', '--verbose', dest='verbose', action='store_const', const=True, default=False )
  parser.add_argument( '-t', '--time', dest='time', action='store_const', const=True, default=False )
  parser.add_argument( '-i', '--collect_last_instructions', dest='last_instr', action='store_const', const=True, default=False)
  parser.add_argument( '-p', '--processes', dest='processes', type=int, nargs=1, default=[4] )
  args = parser.parse_args(inp_args)

  start = timeit.default_timer()
  if args.verbose or args.time:
    print( "Parsing DOT file" )

  graph = parse_dot_to_graph( args.file_path )

  if args.time:
    print( "elapsed {}s".format( timeit.default_timer() - start ) )
  if args.verbose:
    print( "\n".join( map( str, graph.nodes(data=True) )), "\n", graph.edges() )


  start = timeit.default_timer()
  if args.verbose or args.time:
    print( "Fining roots" )

  roots = get_roots( graph )

  if args.time:
    print( "elapsed {}s".format( timeit.default_timer() - start ) )

  assert len(roots) == 1, "Must have exactly one root to perform analysis: {}".format( str(roots) )
  root = roots[0]

  if args.verbose:
    print( root )


  start = timeit.default_timer()
  if args.verbose or args.time:
    print( "Computing dominanators" )

  dominanator_dict = dominanators( graph, root )

  if args.time:
    print( "elapsed {}s".format( timeit.default_timer() - start ) )
  if args.verbose:
    print(
      "\n".join(
        map(
          lambda key_value: "{}: {}".format( key_value[0], key_value[1] ),
          dominanator_dict.items()
        )
      )
    )


  start = timeit.default_timer()
  if args.verbose or args.time:
    print( "Computing backedges" )

  backedges = compute_backedges( graph, dominanator_dict )

  if args.time:
    print( "elapsed {}s".format( timeit.default_timer() - start ) )
  if args.verbose:
    print( "\n".join( map( lambda e: "{} -> {}".format( e[0], e[1] ), backedges ) ) )


  start = timeit.default_timer()
  if args.verbose or args.time:
    print( "Collecting loop nodes" )

  loops = collect_loops( graph, backedges, dominanator_dict, args.processes[0] )

  if args.time:
    print( "elapsed {}s".format( timeit.default_timer() - start ) )
  if args.verbose:
    print(
      "\n".join(
        map(
          lambda loop, id: "loop {}\n\tbackedge: {}\n\tnodes: {}".format( id, loop["backedge"], loop["nodes"] ),
          loops,
          range(len(loops))
        )
      )
    )

  if args.last_instr:
    start = timeit.default_timer()
    if args.verbose or args.time:
      print( "Collecting last instructions" )

    last_instr = parse_dot_for_last_instructions( args.file_path )
    for loop in loops:
      loop["last_instruction_address"] = last_instr[loop["backedge"][0]]

    if args.time:
      print( "elapsed {}s".format( timeit.default_timer() - start ) )
    if args.verbose:
      print( "\n".join( map( lambda node: "{}: {}".format( node[0], node[1] ), last_instr.items() ) ) )

  addParentInfo(loops)
  # Dump json representation of loops list
  if args.output != None:
    with open( args.output[0], 'w' ) as outputfile:
      json.dump( loops, outputfile )
  # else:
    # json.dump( loops, sys.stdout )

  return json.dumps(loops)


if __name__ == "__main__":
  import sys
  main(sys.argv[1:])
