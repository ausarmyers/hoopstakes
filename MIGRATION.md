Migration plan: Functions → 2nd Gen (gcfv2) + Node 22

Goal
- Migrate Cloud Functions to 2nd Generation (gcfv2) and Node 22 after production launch.

Checklist
1. Update local code
   - Change `functions/package.json` `engines.node` => "22"
   - Upgrade `firebase-functions` to a 2nd-gen compatible major (follow Firebase docs)
   - Audit `firebase-admin` compatibility and update if needed
2. Update code patterns
   - Add `.runWith({ platform: 'gcfv2' })` or equivalent per-function where needed
   - Convert any 1st-gen specific APIs to 2nd-gen patterns (background triggers, eventarc)
3. CI / Build
   - Ensure Artifact Registry and Cloud Build APIs enabled
   - Update any build steps to use compatible Node 22 environment
   - Verify service account permissions (compute/build service accounts)
4. Staging validation
   - Deploy to a non-production Firebase project first
   - Smoke test callable and HTTP endpoints
   - Validate Pub/Sub, Scheduler, and storage triggers
5. Rollout
   - Schedule maintenance window for production migration
   - Deploy to production and monitor logs/metrics
   - Rollback plan: keep previous code and ability to redeploy gen1 if needed

Notes
- Some functions may require manual adjustments and cannot be auto-upgraded; test each function independently.
- Follow https://firebase.google.com/docs/functions/2nd-gen-upgrade for detailed guidance.
