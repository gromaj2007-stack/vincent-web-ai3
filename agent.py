#!/usr/bin/env python3
"""Constrained autonomous code maintenance. Requires OPENAI_API_KEY and a GitHub Actions runner."""
import json, os, pathlib, subprocess, sys, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[1]
ALLOWED = {'app.js', 'brain-worker.js'}
MAX_BYTES = 45000

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()

def ask_model(problem, sources):
    key = os.environ['OPENAI_API_KEY']
    instruction = ('You are a maintenance agent for a browser-based German voice assistant named Vincent. '
                   'Return ONLY a JSON object with keys path, content, explanation. '
                   'Modify exactly ONE existing file from the supplied files. '
                   'Preserve UI, memory keys, voice settings and all unrelated functionality. '
                   'Never introduce external scripts, dynamic code execution, credential handling, '
                   'telemetry, or modify security/update mechanisms. If unable to solve safely, '
                   'return {"path":"","content":"","explanation":"Cannot safely fix"}.')
    body = json.dumps({'model': os.environ.get('AUTOPILOT_MODEL','gpt-4.1-mini'),
        'messages':[{'role':'system','content':instruction},
                    {'role':'user','content':json.dumps({'problem':problem,'files':sources},ensure_ascii=False)}],
        'response_format':{'type':'json_object'},'temperature':0.1},ensure_ascii=False).encode()
    req = urllib.request.Request('https://api.openai.com/v1/chat/completions',data=body,
        headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'},method='POST')
    with urllib.request.urlopen(req, timeout=120) as resp:
        data=json.load(resp)
    return json.loads(data['choices'][0]['message']['content'])

def main():
    problem=os.environ.get('AUTOPILOT_TASK','').strip()
    if not problem: sys.exit('No AUTOPILOT_TASK supplied')
    sources={p:(ROOT/p).read_text(encoding='utf-8') for p in sorted(ALLOWED) if (ROOT/p).is_file()}
    if not sources: sys.exit('No eligible source files')
    result=ask_model(problem,sources)
    path=result.get('path','')
    if path not in sources: sys.exit('No eligible change proposed')
    content=result.get('content','')
    if not isinstance(content,str) or not content or len(content.encode())>MAX_BYTES:
        sys.exit('Invalid or oversized patch')
    if content==sources[path]: sys.exit('No changes')
    forbidden=('eval(', 'new Function(', 'document.write(', 'localStorage.clear(',
               'process.env', 'github_token', 'OPENAI_API_KEY')
    newly_added=[line[1:] for line in __import__('difflib').unified_diff(sources[path].splitlines(),content.splitlines()) if line.startswith('+') and not line.startswith('+++')]
    if any(term.lower() in '\n'.join(newly_added).lower() for term in forbidden):
        sys.exit('Forbidden code in proposed changes')
    (ROOT/path).write_text(content,encoding='utf-8')
    print('Proposed:',path,'\nReason:',str(result.get('explanation',''))[:500])
    print(git('diff','--stat'))
if __name__=='__main__': main()
