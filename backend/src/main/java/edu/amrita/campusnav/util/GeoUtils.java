package edu.amrita.campusnav.util;

/**
 * Geographic utility functions for Amrita Campus coordinates.
 * Includes Haversine distance, turn-by-turn bearing calculations,
 * and admissible heuristic calculations for A*.
 */
public final class GeoUtils {

    public static final double EARTH_RADIUS_METERS = 6371000.0;
    // Maximum plausible campus pedestrian walking speed for admissible time heuristic
    public static final double MAX_PEDESTRIAN_SPEED_MPS = 1.6;

    private GeoUtils() {}

    /**
     * Calculates the Great-Circle Haversine distance in metres between two GPS coordinates.
     */
    public static double haversineDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double rLat1 = Math.toRadians(lat1);
        double rLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0) +
                   Math.cos(rLat1) * Math.cos(rLat2) *
                   Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);
        double c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
        return EARTH_RADIUS_METERS * c;
    }

    /**
     * Calculates admissible A* heuristic distance:
     * - DISTANCE: straight line haversine distance (metres). Never overestimates.
     * - TIME: straight line distance divided by max walking speed (seconds). Never overestimates.
     */
    public static double admissibleHeuristic(double lat1, double lon1, double lat2, double lon2, boolean isTimeMetric) {
        double distMeters = haversineDistanceMeters(lat1, lon1, lat2, lon2);
        if (isTimeMetric) {
            return distMeters / MAX_PEDESTRIAN_SPEED_MPS;
        }
        return distMeters;
    }

    /**
     * Calculates the initial azimuth/bearing from point 1 to point 2 in degrees [0, 360).
     */
    public static double calculateBearingDegrees(double lat1, double lon1, double lat2, double lon2) {
        double φ1 = Math.toRadians(lat1);
        double φ2 = Math.toRadians(lat2);
        double Δλ = Math.toRadians(lon2 - lon1);

        double y = Math.sin(Δλ) * Math.cos(φ2);
        double x = Math.cos(φ1) * Math.sin(φ2) -
                   Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        double θ = Math.atan2(y, x);
        return (Math.toDegrees(θ) + 360.0) % 360.0;
    }

    /**
     * Determines relative turn instruction based on initial bearing and subsequent bearing.
     */
    public static String getTurnInstruction(double bearing1, double bearing2) {
        double diff = (bearing2 - bearing1 + 360.0) % 360.0;
        if (diff > 180.0) {
            diff -= 360.0;
        }

        if (Math.abs(diff) <= 25.0) {
            return "Continue straight";
        } else if (diff > 25.0 && diff <= 65.0) {
            return "Turn slight right";
        } else if (diff > 65.0 && diff <= 120.0) {
            return "Turn right";
        } else if (diff > 120.0) {
            return "Make a sharp right / U-turn";
        } else if (diff < -25.0 && diff >= -65.0) {
            return "Turn slight left";
        } else if (diff < -65.0 && diff >= -120.0) {
            return "Turn left";
        } else {
            return "Make a sharp left / U-turn";
        }
    }
}
