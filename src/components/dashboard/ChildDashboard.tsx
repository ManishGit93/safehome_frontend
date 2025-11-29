"use client";

import { ArrowDownTrayIcon, CheckBadgeIcon, EnvelopeOpenIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastSentLocation, setLastSentLocation] = useState<{ lat: number; lng: number; time: string } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastSentTimeRef = useRef<number>(0);

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
   * Send location to backend
   * Tries multiple endpoint patterns to find the correct one
   */
  const sendLocationToBackend = useCallback(async (latitude: number, longitude: number, accuracy?: number) => {
    const locationData = {
      lat: latitude,
      lng: longitude,
      accuracy: accuracy || undefined,
      ts: new Date().toISOString(),
    };

    // Try common endpoint patterns
    const endpointsToTry = [
      "/api/location",
      "/api/location/ping",
      "/api/me/location",
      "/location/ping",
      "/location",
      "/me/location",
    ];

    let lastError: Error | null = null;

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
        setLocationError(null);
        return true; // Success
      } catch (error: any) {
        lastError = error;
        // Continue to next endpoint
      }
    }

    if (lastError) {
      console.error("Failed to send location to all endpoints:", lastError);
      setLocationError(`Failed to send location: ${lastError.message}`);
    }
    return false;
  }, []);

  /**
   * Start continuous location tracking
   */
  const startLocationTracking = useCallback(() => {
    if (!user?.consentGiven) {
      setLocationError("Please grant consent first to share your location");
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    // Stop any existing tracking
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsTracking(true);
    setLocationError(null);

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const now = Date.now();

        // Send location every 10 seconds (to avoid spamming the backend)
        if (now - lastSentTimeRef.current >= 10000) {
          lastSentTimeRef.current = now;
          sendLocationToBackend(latitude, longitude, accuracy || undefined).catch((err) => {
            console.error("Error sending location:", err);
          });
        }
      },
      (error) => {
        setIsTracking(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable location access in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred while getting location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000, // Accept cached position up to 5 seconds old
      }
    );
  }, [user?.consentGiven, sendLocationToBackend]);

  /**
   * Stop location tracking
   */
  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  /**
   * Automatically start tracking when consent is given
   */
  useEffect(() => {
    if (user?.consentGiven && watchIdRef.current === null) {
      // Small delay to ensure component is fully mounted and request permission
      const timer = setTimeout(() => {
        startLocationTracking();
      }, 1000);

      return () => {
        clearTimeout(timer);
        // Cleanup on unmount
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };
    }

    // Cleanup when consent is revoked
    if (!user?.consentGiven && watchIdRef.current !== null) {
      stopLocationTracking();
    }

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [user?.consentGiven, startLocationTracking, stopLocationTracking]);

  /**
   * Manual send location (for testing/debugging - can be removed in production)
   */
  const handleSendLocation = async () => {
    if (!user?.consentGiven) {
      setLocationError("Please grant consent first to share your location");
      return;
    }

    if (!user?.consentGiven) {
      setLocationError("Please grant consent first to share your location");
      return;
    }

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
      await sendLocationToBackend(latitude, longitude, accuracy || undefined);
    } catch (error: any) {
      console.error("Error sending location:", error);
      setLocationError(error.message || "Failed to send location");
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

      {/* Location Tracking Status Card */}
      {user?.consentGiven && (
        <Card className="border-blue-200 bg-blue-50">
          {/* <CardHeader>
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <CardTitle className="text-blue-900">Location Tracking</CardTitle>
                <CardDescription className="text-blue-700">
                  Your location is being tracked automatically and shared with approved parents.
                </CardDescription>
              </div>
              <Badge variant={isTracking ? "success" : "warning"} className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isTracking ? "bg-emerald-500" : "bg-amber-500"}`} />
                {isTracking ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader> */}
          <CardContent className="space-y-3">
            {/* {!isTracking && (
              <Button variant="primary" onClick={startLocationTracking} icon={<MapPinIcon className="h-4 w-4" />}>
                Start Location Tracking
              </Button>
            )} */}

            {/* {isTracking && (
              <Button variant="danger" onClick={stopLocationTracking} icon={<MapPinIcon className="h-4 w-4" />}>
                Stop Tracking
              </Button>
            )} */}

            {locationError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-900 mb-2">Error</p>
                <p className="text-sm text-red-700 mb-2">{locationError}</p>
                <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                  <p className="font-medium mb-1">Troubleshooting:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>Check your browser location permissions</li>
                    <li>Ensure location services are enabled on your device</li>
                    <li>Check browser console for detailed error messages</li>
                  </ul>
                </div>
              </div>
            )}

            {/* {lastSentLocation && !locationError && isTracking && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm font-medium text-green-900">✓ Location tracking active</p>
                <p className="text-xs text-green-700 mt-1">
                  Last update: Lat {lastSentLocation.lat.toFixed(6)}, Lng {lastSentLocation.lng.toFixed(6)}
                </p>
                <p className="text-xs text-green-700">Updated at: {lastSentLocation.time}</p>
                <p className="text-xs text-green-600 mt-2">
                  Location is sent to parents every 10 seconds automatically.
                </p>
              </div>
            )} */}

            {/* <div className="rounded-lg border border-blue-200 bg-white p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Location is tracked continuously while this page is open. Make sure location permissions are enabled.
                Parents will see your location update in real-time on their dashboard.
              </p>
            </div> */}
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


