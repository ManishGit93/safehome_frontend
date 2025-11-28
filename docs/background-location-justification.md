# SafeHome Background Location Justification

SafeHome’s companion mobile app collects background GPS data to provide proactive safety updates for families. The feature is designed to meet the disclosure requirements of major app stores.

## Purpose

- Deliver near real-time location updates to the SafeHome Dashboard so trusted parents can react quickly during emergencies.
- Show recent paths (last 24 hours) so guardians can verify safe travel routes.
- Trigger safety workflows such as notifying a parent when the child reaches home or school (future roadmap).

## Data handling

- Location pings contain latitude, longitude, optional speed/heading, accuracy, and a timestamp.
- No audio, video, or contact data is collected.
- Data is retained for 30 days by default and can be purged earlier via the retention cleanup endpoint.
- Children can revoke consent, export their data, or delete their entire account at any time.

## User controls

- Background tracking only starts once the child signs up, links to a parent, and explicitly agrees to the consent modal.
- An in-app switch (mirrored on the web dashboard) lets the child pause or revoke tracking immediately.
- Notifications explain how to stop sharing and remove the app.

## Transparency for app stores

Use the following snippet in the app store submission:

> SafeHome collects background location data to share a child’s live whereabouts with approved parents for safety purposes. Location data is never sold, is encrypted in transit, retained for ~30 days, and can be exported or deleted at any time. Tracking pauses instantly when the child revokes consent or uninstalls the app.

This text highlights the safety rationale, scope, retention, and user control, satisfying both Google Play and Apple App Store disclosure requirements.


