package edu.amrita.campusnav.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Objects;

/**
 * Represents a node/landmark/junction in the Amrita Chennai campus graph.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CampusVertex {
    private String id;
    private String name;
    private LocationType type;
    private double latitude;
    private double longitude;
    private double elevationMeters;
    private boolean accessible;
    private String description;

    public CampusVertex() {}

    public CampusVertex(String id, String name, LocationType type, double latitude, double longitude,
                        double elevationMeters, boolean accessible, String description) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.latitude = latitude;
        this.longitude = longitude;
        this.elevationMeters = elevationMeters;
        this.accessible = accessible;
        this.description = description;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocationType getType() { return type; }
    public void setType(LocationType type) { this.type = type; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public double getElevationMeters() { return elevationMeters; }
    public void setElevationMeters(double elevationMeters) { this.elevationMeters = elevationMeters; }

    public boolean isAccessible() { return accessible; }
    public void setAccessible(boolean accessible) { this.accessible = accessible; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CampusVertex that = (CampusVertex) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "CampusVertex{" + "id='" + id + '\'' + ", name='" + name + '\'' + ", type=" + type + '}';
    }
}
