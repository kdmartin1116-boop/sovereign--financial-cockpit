## History rewrite: removed `config/private_key.pem`

What I did:

- Created a backup branch `backup/private-key-before-purge` and pushed it to origin.
- Used `git-filter-repo` to remove the file `config/private_key.pem` from all commits in repository history.
- Restored the `origin` remote and force-pushed the rewritten `main` branch.

Important follow-ups for the team:

1. Rotate the compromised private key immediately. Do not reuse it.
2. Update any services, CI, or servers that used the key.
3. Inform collaborators; they should reclone the repository or reset their `main` branch:

```bash
git fetch origin
git checkout main
git reset --hard origin/main
```

Notes:
- The backup branch `backup/private-key-before-purge` contains the pre-rewrite history and is available on origin if needed.
- If you need a full removal from all mirrors or caches, follow provider-specific guidance.
