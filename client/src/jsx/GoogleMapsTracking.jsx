import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, Polyline } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const GoogleMapsTracking = ({ restaurantLocation, userLocation, orderStatus }) => {
  const [driverLocation, setDriverLocation] = useState(restaurantLocation);

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
    borderRadius: "16px",
    overflow: "hidden",
  };

  const center = {
    lat:
      (restaurantLocation?.latitude + userLocation?.latitude) / 2 ||
      17.385044,
    lng:
      (restaurantLocation?.longitude + userLocation?.longitude) / 2 ||
      78.486671,
  };

  // Simulate driver movement
  useEffect(() => {
    if (orderStatus !== "on-way") return;

    const interval = setInterval(() => {
      setDriverLocation((prev) => {
        if (!prev) return prev;
        return {
          latitude: prev.latitude + (Math.random() - 0.5) * 0.001,
          longitude: prev.longitude + (Math.random() - 0.5) * 0.001,
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [orderStatus]);

  const onLoad = useCallback(
    (mapInstance) => {
      if (!restaurantLocation || !userLocation) return;

      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({
        lat: restaurantLocation.latitude,
        lng: restaurantLocation.longitude,
      });
      bounds.extend({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      });

      mapInstance.fitBounds(bounds);
    },
    [restaurantLocation, userLocation]
  );

  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={["places"]}
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        onLoad={onLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Restaurant */}
        {restaurantLocation && (
          <Marker
            position={{
              lat: restaurantLocation.latitude,
              lng: restaurantLocation.longitude,
            }}
            title="Cloud Kitchen"
          />
        )}

        {/* Driver */}
        {orderStatus === "on-way" && driverLocation && (
          <Marker
            position={{
              lat: driverLocation.latitude,
              lng: driverLocation.longitude,
            }}
            title="Delivery Partner"
          />
        )}

        {/* User */}
        {userLocation && (
          <Marker
            position={{
              lat: userLocation.latitude,
              lng: userLocation.longitude,
            }}
            title="Your Home"
          />
        )}

        {/* Route */}
        {restaurantLocation && userLocation && (
          <Polyline
            path={[
              {
                lat: restaurantLocation.latitude,
                lng: restaurantLocation.longitude,
              },
              { lat: userLocation.latitude, lng: userLocation.longitude },
            ]}
            options={{
              strokeColor: "#ffd700",
              strokeOpacity: 0.7,
              strokeWeight: 3,
            }}
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapsTracking;
