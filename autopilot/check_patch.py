#!/usr/bin/env python3
"""Fail closed when an automated patch changes protected application invariants."""
import pathlib, re, subprocess, sys
root=pathlib.Path(__file__).resolve().parents[1]
base=sys.argv[1] if len(sys.argv)>1 else 'HEAD'
allowed={'app.js','brain-worker.js'}
changed=subprocess.check_output(['git','diff','--name-only',base,'--'],cwd=root,text=True).splitlines()
if not changed or any(p not in allowed for p in changed):
    sys.exit('Rejected patch file list: '+repr(changed))
for p in changed:
    before=subprocess.run(['git','show',f'{base}:{p}'],cwd=root,text=True,capture_output=True)
    if before.returncode: sys.exit('New files not allowed: '+p)
    after=(root/p).read_text()
    if not after.strip():sys.exit('Empty source: '+p)
    # Detect high-risk newly introduced capabilities; not a substitute for a sandbox.
    diff=subprocess.check_output(['git','diff','--unified=0',base,'--',p],cwd=root,text=True)
    added='\n'.join(line[1:] for line in diff.splitlines() if line.startswith('+') and not line.startswith('+++'))
    for pattern in [r'\beval\s*\(',r'\bFunction\s*\(',r'\bdocument\.write\s*\(',r'\blocalStorage\.clear\s*\(',r'\bfetch\s*\(\s*[\'\"]https?://',r'\bimport\s*\(\s*[\'\"]https?://',r'\bserviceWorker\.register\s*\(']:
        if re.search(pattern,added,re.I):sys.exit('Manual review required: '+pattern)
print('Patch policy passed (static checks only).')
