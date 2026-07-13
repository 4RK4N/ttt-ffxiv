-- Remove legacy sidecar keys left over from JSON-era storage (pre-merged panel rows).
-- Safe to run after migration; no-op if keys are already absent.

DELETE FROM module_tickets WHERE key = 'types';
