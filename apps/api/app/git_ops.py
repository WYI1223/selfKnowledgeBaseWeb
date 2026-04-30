"""Git operations on the repo root. Wave 1: minimal commit-on-write helper.

Wave 4 + Phase 2b agent_bridge will call commit_path() after page writes.
"""
from __future__ import annotations

from pathlib import Path

from git import Actor, Repo

REPO_ROOT = Path(__file__).resolve().parents[3]


def commit_path(rel_path: str, message: str, author: str = "skb-api") -> str:
    repo = Repo(REPO_ROOT)
    repo.index.add([str(REPO_ROOT / rel_path)])
    actor = Actor(author, "skb-api@local")
    commit = repo.index.commit(message, author=actor, committer=actor)
    return commit.hexsha
