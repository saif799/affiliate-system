import json
from pathlib import Path
from networkx.readwrite import json_graph
from graphify.cache import save_semantic_cache
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json

base = Path('graphify-out')

# 1. merge semantic chunks (real token counts from Agent usage)
toks = {'01': 84204, '02': 91598}
nodes, edges, hyper = [], [], []
tin = 0
for k, t in toks.items():
    d = json.loads((base / f'.graphify_chunk_{k}.json').read_text(encoding='utf-8'))
    nodes += d.get('nodes', [])
    edges += d.get('edges', [])
    hyper += d.get('hyperedges', [])
    tin += t
saved = save_semantic_cache(nodes, edges, hyper)

seen, dn = set(), []
for n in nodes:
    if n['id'] not in seen:
        seen.add(n['id']); dn.append(n)

# 2. merge AST + semantic -> extract
ast = json.loads((base / '.graphify_ast.json').read_text(encoding='utf-8'))
seen = {n['id'] for n in ast['nodes']}
mn = list(ast['nodes'])
for n in dn:
    if n['id'] not in seen:
        mn.append(n); seen.add(n['id'])
extract = {'nodes': mn, 'edges': ast['edges'] + edges, 'hyperedges': hyper,
           'input_tokens': tin, 'output_tokens': 0}
(base / '.graphify_extract.json').write_text(json.dumps(extract, ensure_ascii=False), encoding='utf-8')

# 3. merge into existing graph + prune deleted files
existing = json.loads((base / 'graph.json').read_text(encoding='utf-8'))
G = json_graph.node_link_graph(existing, edges='links')
Gnew = build_from_json(extract)
inc = json.loads((base / '.graphify_incremental.json').read_text(encoding='utf-8'))
deleted = set(inc.get('deleted_files', []))
pruned = 0
if deleted:
    rm = [n for n, d in G.nodes(data=True) if d.get('source_file') in deleted]
    G.remove_nodes_from(rm)
    pruned = len(rm)
G.update(Gnew)

# 4. cluster + analyze + write outputs (placeholder labels; relabeled next)
communities = cluster(G)
cohesion = score_all(G, communities)
gods = god_nodes(G)
surprises = surprising_connections(G, communities)
labels = {cid: 'Community ' + str(cid) for cid in communities}
questions = suggest_questions(G, communities, labels)
detection = {'total_files': inc.get('total_files', 0) or 0, 'total_words': 0,
             'needs_graph': True, 'warning': None, 'files': inc.get('files', {})}
report = generate(G, communities, cohesion, labels, gods, surprises, detection,
                  {'input': tin, 'output': 0}, '.', suggested_questions=questions)
(base / 'GRAPH_REPORT.md').write_text(report, encoding='utf-8')
to_json(G, communities, str(base / 'graph.json'))
analysis = {'communities': {str(k): v for k, v in communities.items()},
            'cohesion': {str(k): v for k, v in cohesion.items()},
            'gods': gods, 'surprises': surprises, 'questions': questions}
(base / '.graphify_analysis.json').write_text(json.dumps(analysis, ensure_ascii=False), encoding='utf-8')

print(f'pruned={pruned} nodes={G.number_of_nodes()} edges={G.number_of_edges()} '
      f'communities={len(communities)} cached={saved}')
