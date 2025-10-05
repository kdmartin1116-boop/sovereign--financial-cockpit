# Security and Secrets

This repository previously contained private keys and potentially sensitive information. Follow the steps below to ensure secrets are removed and rotated.

1) Remove secrets from repository (stop tracking)

Run locally (do NOT run filter-branch unless you understand history rewriting):

```powershell
# stop tracking the private key and add to .gitignore
git rm --cached config/private_key.pem
echo "config/private_key.pem" >> .gitignore
git add .gitignore
git commit -m "Remove private key from repository and add to .gitignore"
```

2) Rotate keys and secrets

- Immediately rotate any keys that were previously stored in the repository. Assume they are compromised.
- Provision new keys using your provider (SSH keys, API tokens, etc.).
- Store new secrets in a secure store (HashiCorp Vault, Azure Key Vault, AWS Secrets Manager, or GitHub Secrets for CI).

3) If you must purge the secret from git history (advanced and disruptive)

Only after coordinating with contributors and forming a backup, run:

```powershell
# WARNING: rewrites history and affects all branches and tags
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch config/private_key.pem" --prune-empty --tag-name-filter cat -- --all
# or use BFG Repo-Cleaner which is faster
```

4) CI and deployment

- Move secrets to CI environment secrets and access them via environment variables in workflows.
- Do not commit `.env` files; keep them in local development only and list them in `.gitignore`.

5) Reporting a security issue

If you discover a vulnerability, send an email to the project owner or open an issue labelled `security` in a private tracker.
