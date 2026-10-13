package edu.amrita.campusnav.model;

import java.util.Collections;
import java.util.List;

/**
 * Result returned by graph shortest-path routing algorithms.
 */
public class PathResult {
    private final boolean found;
    private final String algorithm;
    private final MetricType metric;
    private final double totalCost;
    private final double totalDistanceMeters;
    private final double totalDurationSeconds;
    private final List<CampusVertex> pathVertices;
    private final List<CampusEdge> pathEdges;
    private final List<String> instructions;
    private final int nodesExpanded;
    private final int edgesProcessed;
    private final long executionTimeNanos;
    private final String errorMessage;

    public PathResult(boolean found, String algorithm, MetricType metric, double totalCost,
                      double totalDistanceMeters, double totalDurationSeconds,
                      List<CampusVertex> pathVertices, List<CampusEdge> pathEdges,
                      List<String> instructions, int nodesExpanded, int edgesProcessed,
                      long executionTimeNanos, String errorMessage) {
        this.found = found;
        this.algorithm = algorithm;
        this.metric = metric;
        this.totalCost = totalCost;
        this.totalDistanceMeters = totalDistanceMeters;
        this.totalDurationSeconds = totalDurationSeconds;
        this.pathVertices = pathVertices != null ? pathVertices : Collections.emptyList();
        this.pathEdges = pathEdges != null ? pathEdges : Collections.emptyList();
        this.instructions = instructions != null ? instructions : Collections.emptyList();
        this.nodesExpanded = nodesExpanded;
        this.edgesProcessed = edgesProcessed;
        this.executionTimeNanos = executionTimeNanos;
        this.errorMessage = errorMessage;
    }

    public static PathResult notFound(String algorithm, MetricType metric, String error,
                                     int nodesExpanded, int edgesProcessed, long nanos) {
        return new PathResult(false, algorithm, metric, 0.0, 0.0, 0.0,
                Collections.emptyList(), Collections.emptyList(), Collections.emptyList(),
                nodesExpanded, edgesProcessed, nanos, error);
    }

    public boolean isFound() { return found; }
    public String getAlgorithm() { return algorithm; }
    public MetricType getMetric() { return metric; }
    public double getTotalCost() { return totalCost; }
    public double getTotalDistanceMeters() { return totalDistanceMeters; }
    public double getTotalDurationSeconds() { return totalDurationSeconds; }
    public List<CampusVertex> getPathVertices() { return pathVertices; }
    public List<CampusEdge> getPathEdges() { return pathEdges; }
    public List<String> getInstructions() { return instructions; }
    public int getNodesExpanded() { return nodesExpanded; }
    public int getEdgesProcessed() { return edgesProcessed; }
    public long getExecutionTimeNanos() { return executionTimeNanos; }
    public double getExecutionTimeMs() { return executionTimeNanos / 1_000_000.0; }
    public String getErrorMessage() { return errorMessage; }
}
