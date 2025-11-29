"use client";

import { ArrowDownTrayIcon, CheckBadgeIcon, EnvelopeOpenIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import useSWR from "swr";
import { apiFetch, swrFetcher } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useAuth";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { PageHeader } from "../ui/page-header";

interface LinkResponse {
  links: Array<{
    _id: string;
    parentId: { _id: string; name: string; email: string };
    status: string;
  }>;
}

export const ChildDashboard = () => {
  const { user } = useAuth();
  const acceptedQuery = useSWR<LinkResponse>("/links/child", swrFetcher);
  const pendingQuery = useSWR<LinkResponse>("/links/pending", swrFetcher);
  const [sendingLocation, setSendingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastSentLocation, setLastSentLocation] = useState<{ lat: number; lng: number; time: string } | null>(null);

  const respondToLink = async (endpoint: "/links/accept" | "/links/decline", linkId: string) => {
    await apiFetch(endpoint, { method: "POST", body: { linkId } });
    await Promise.all([acceptedQuery.mutate(), pendingQuery.mutate()]);
  };

  const handleExport = async () => {
    const payload = await apiFetch<string>("/me/export", { method: "POST" });
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "safehome-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Send current location to backend
   * This is a testing/debugging feature - in production, location should come from mobile app
   */
  const handleSendLocation = async () => {
    if (!user?.consentGiven) {
      setLocationError("Please grant consent first to share your location");
      return;
    }

    setSendingLocation(true);
    setLocationError(null);

    try {
      // Get current location from browser
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported by your browser"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error("Location permission denied. Please enable location access in your browser settings."));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error("Location information is unavailable."));
                break;
              case error.TIMEOUT:
                reject(new Error("Location request timed out."));
                break;
              default:
                reject(new Error("An unknown error occurred while getting location."));
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;

      const locationData = {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy || undefined,
        ts: new Date().toISOString(),
      };

      // Try common endpoint patterns - adjust based on your backend API
      const endpointsToTry = [
        "/api/location",
        "/api/location/ping",
        "/api/me/location",
        "/location/ping",
        "/location",
        "/me/location",
      ];

      let lastError: Error | null = null;
      let success = false;

      for (const endpoint of endpointsToTry) {
        try {
          await apiFetch(endpoint, {
            method: "POST",
            body: locationData,
          });

          setLastSentLocation({
            lat: latitude,
            lng: longitude,
            time: new Date().toLocaleString(),
          });
          success = true;
          break; // Success! Exit the loop
        } catch (error: any) {
          lastError = error;
          console.log(`Tried ${endpoint}, got error:`, error.message);
          // Continue to next endpoint
        }
      }

      if (!success && lastError) {
        throw new Error(
          `Failed to send location. Tried endpoints: ${endpointsToTry.join(", ")}. ` +
            `Last error: ${lastError.message}. ` +
            `Please check your backend API documentation for the correct location endpoint.`
        );
      }
    } catch (error: any) {
      console.error("Error sending location:", error);
      setLocationError(error.message || "Failed to send location");
    } finally {
      setSendingLocation(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My space"
        title={`Hi ${user?.name ?? ""}, you're in control`}
        subtitle="You decide who can see your location and for how long."
      />

      <Card className="border-brand/10 bg-gradient-to-r from-brand-muted to-white">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckBadgeIcon className="h-4 w-4 text-brand" />
              Consent status
            </div>
            <CardTitle>{user?.consentGiven ? "Consent active" : "Awaiting approval"}</CardTitle>
            <CardDescription>
              {user?.consentGiven
                ? `Granted on ${user.consentAt ? new Date(user.consentAt).toLocaleString() : "—"}`
                : "Review the privacy notice above to enable tracking."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="sm" onClick={handleExport} icon={<ArrowDownTrayIcon className="h-4 w-4" />}>
              Export my data
            </Button>
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/my-privacy")}>
              Privacy controls
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Location Testing Card - for debugging/testing */}
      {user?.consentGiven && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-blue-900">Send Test Location</CardTitle>
                <CardDescription className="text-blue-700">
                  For testing: Send your current browser location to the backend. In production, location comes from the mobile app.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="primary"
              onClick={handleSendLocation}
              disabled={sendingLocation}
              icon={<MapPinIcon className="h-4 w-4" />}
            >
              {sendingLocation ? "Sending location..." : "Send My Current Location"}
            </Button>

            {locationError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-900 mb-2">Error</p>
                <p className="text-sm text-red-700 mb-2">{locationError}</p>
                <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                  <p className="font-medium mb-1">Troubleshooting:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>Check your backend API documentation for the correct location endpoint</li>
                    <li>Common patterns: <code className="bg-red-200 px-1 rounded">/api/location</code>, <code className="bg-red-200 px-1 rounded">/location/ping</code>, <code className="bg-red-200 px-1 rounded">/api/me/location</code></li>
                    <li>Ensure the backend has a POST endpoint for receiving location data</li>
                    <li>Check browser console for detailed error messages</li>
                  </ul>
                </div>
              </div>
            )}

            {lastSentLocation && !locationError && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm font-medium text-green-900">✓ Location sent successfully</p>
                <p className="text-xs text-green-700 mt-1">
                  Lat: {lastSentLocation.lat.toFixed(6)}, Lng: {lastSentLocation.lng.toFixed(6)}
                </p>
                <p className="text-xs text-green-700">Sent at: {lastSentLocation.time}</p>
                <p className="text-xs text-green-600 mt-2">
                  Parents should see this location on their dashboard within a few seconds.
                </p>
              </div>
            )}

            <div className="rounded-lg border border-blue-200 bg-white p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> This uses your browser's location. Make sure location permissions are enabled.
                The parent dashboard will update automatically when location is received.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Linked parents</CardTitle>
            <CardDescription>Only the parents you approve will see your updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {acceptedQuery.data?.links.length ? (
              acceptedQuery.data.links.map((link) => (
                <div key={link._id} className="rounded-2xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{link.parentId.name}</p>
                      <p className="text-sm text-slate-500">{link.parentId.email}</p>
                    </div>
                    <Badge>Approved</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No approved parents yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <EnvelopeOpenIcon className="h-5 w-5 text-accent" />
              <div>
                <CardTitle>Pending requests</CardTitle>
                <CardDescription>Accept when you’re ready, or decline if you don’t recognize them.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingQuery.data?.links.length ? (
              pendingQuery.data.links.map((link) => (
                <div key={link._id} className="rounded-2xl border border-slate-100 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{link.parentId.name}</p>
                    <p className="text-sm text-slate-500">{link.parentId.email}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => respondToLink("/links/accept", link._id)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => respondToLink("/links/decline", link._id)}>
                      Decline
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No pending requests right now.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


