# SafeHome Privacy Policy

_Last updated: November 28, 2025_

## 1. What we collect

- Child location coordinates (latitude, longitude, optional speed/heading) with timestamps.
- Account metadata such as name, email, roles, and consent markers (`consentGiven`, `consentTextVersion`, `consentAt`).
- Parent-child links and audit logs that describe which parent accessed which child data.

## 2. Why we collect it

We only collect background location to share a child’s whereabouts with explicitly linked parents for personal safety. Location history is limited to the retention window (default 30 days) to investigate incidents, provide context, and generate exports requested by the family.

## 3. Who can see it

- The child always has visibility into their own data and can revoke consent at any time.
- Only parents with approved links can view their child’s current and recent locations.
- Limited SafeHome administrators may access audit logs solely for troubleshooting.

## 4. Retention

- Default retention is **30 days** for raw location history and can be tuned in the admin config.
- `LatestLocation` only stores the latest coordinate to power dashboards.
- Cleanup can be triggered manually or automated in production cron jobs.

## 5. Your rights

- **View**: Parents and children can review live and historical data in the dashboard.
- **Export**: Children can request a full JSON export of their history via `/me/export`.
- **Delete**: Children can delete their entire account and associated history at any time.
- **Revoke**: Children may revoke a parent’s link instantly, blocking future access.

## 6. Security basics

- Sessions rely on HTTP-only cookies with JWTs and CSRF headers for API calls.
- All production deployments must run behind HTTPS/TLS.
- Audit logs capture sensitive operations such as viewing, exporting, or deleting data.

By continuing to use SafeHome the child confirms they understand and accept how their location is shared and stored. Parents agree to respect their child’s privacy and only access data with consent. If you have questions, contact the SafeHome team before deploying the system in production.


