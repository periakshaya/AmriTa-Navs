package edu.amrita.campusnav.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Objects;

/**
 * Represents a walkable pedestrian segment between two campus vertices.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CampusEdge {
    private String id;
    private String source;
    private String destination;
    private double distanceMeters;
    private double estimatedDurationSeconds;
    private WalkabilityStatus walkability;
    private String pathType; // PAVED_WALKWAY, COVERED_CORRIDOR, STAIRS, RAMP
    private boolean hasStairs;
    private boolean hasRamp;
    private boolean accessible;
    private boolean bidirectional;
    private String instruction;

    public CampusEdge() {
        this.walkability = WalkabilityStatus.OPEN;
        this.bidirectional = true;
    }

    public CampusEdge(String id, String source, String destination, double distanceMeters,
                      double estimatedDurationSeconds, WalkabilityStatus walkability,
                      String pathType, boolean hasStairs, boolean hasRamp,
                      boolean accessible, boolean bidirectional, String instruction) {
        this.id = id;
        this.source = source;
        this.destination = destination;
        this.distanceMeters = distanceMeters;
        this.estimatedDurationSeconds = estimatedDurationSeconds;
        this.walkability = walkability != null ? walkability : WalkabilityStatus.OPEN;
        this.pathType = pathType;
        this.hasStairs = hasStairs;
        this.hasRamp = hasRamp;
        this.accessible = accessible;
        this.bidirectional = bidirectional;
        this.instruction = instruction;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public double getDistanceMeters() { return distanceMeters; }
    public void setDistanceMeters(double distanceMeters) { this.distanceMeters = distanceMeters; }

    public double getEstimatedDurationSeconds() { return estimatedDurationSeconds; }
    public void setEstimatedDurationSeconds(double estimatedDurationSeconds) { this.estimatedDurationSeconds = estimatedDurationSeconds; }

    public WalkabilityStatus getWalkability() { return walkability; }
    public void setWalkability(WalkabilityStatus walkability) { this.walkability = walkability; }

    public String getPathType() { return pathType; }
    public void setPathType(String pathType) { this.pathType = pathType; }

    public boolean isHasStairs() { return hasStairs; }
    public void setHasStairs(boolean hasStairs) { this.hasStairs = hasStairs; }

    public boolean isHasRamp() { return hasRamp; }
    public void setHasRamp(boolean hasRamp) { this.hasRamp = hasRamp; }

    public boolean isAccessible() { return accessible; }
    public void setAccessible(boolean accessible) { this.accessible = accessible; }

    public boolean isBidirectional() { return bidirectional; }
    public void setBidirectional(boolean bidirectional) { this.bidirectional = bidirectional; }

    public String getInstruction() { return instruction; }
    public void setInstruction(String instruction) { this.instruction = instruction; }

    public boolean isTraversable(boolean wheelchairOnly) {
        if (walkability != WalkabilityStatus.OPEN) {
            return false;
        }
        if (wheelchairOnly && (!accessible || hasStairs)) {
            return false;
        }
        return true;
    }

    public double getWeight(MetricType metric) {
        if (metric == MetricType.TIME) {
            return estimatedDurationSeconds;
        }
        return distanceMeters;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CampusEdge that = (CampusEdge) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
