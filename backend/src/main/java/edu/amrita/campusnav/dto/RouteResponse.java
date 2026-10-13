package edu.amrita.campusnav.dto;

import edu.amrita.campusnav.model.CampusEdge;
import edu.amrita.campusnav.model.CampusVertex;
import edu.amrita.campusnav.model.MetricType;

import java.util.List;

public class RouteResponse {
    private boolean success;
    private String algorithm;
    private MetricType metric;
    private double totalDistanceMeters;
    private double totalDurationSeconds;
    private List<CampusVertex> pathVertices;
    private List<CampusEdge> pathEdges;
    private List<double[]> geometryCoordinates; // [[lat, lng], [lat, lng], ...]
    private List<String> turnByTurnInstructions;
    private int nodesExpanded;
    private int edgesProcessed;
    private double executionTimeMs;
    private String errorMessage;
    private RouteResponse alternativeRoute;

    public RouteResponse() {}

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }

    public MetricType getMetric() { return metric; }
    public void setMetric(MetricType metric) { this.metric = metric; }

    public double getTotalDistanceMeters() { return totalDistanceMeters; }
    public void setTotalDistanceMeters(double totalDistanceMeters) { this.totalDistanceMeters = totalDistanceMeters; }

    public double getTotalDurationSeconds() { return totalDurationSeconds; }
    public void setTotalDurationSeconds(double totalDurationSeconds) { this.totalDurationSeconds = totalDurationSeconds; }

    public List<CampusVertex> getPathVertices() { return pathVertices; }
    public void setPathVertices(List<CampusVertex> pathVertices) { this.pathVertices = pathVertices; }

    public List<CampusEdge> getPathEdges() { return pathEdges; }
    public void setPathEdges(List<CampusEdge> pathEdges) { this.pathEdges = pathEdges; }

    public List<double[]> getGeometryCoordinates() { return geometryCoordinates; }
    public void setGeometryCoordinates(List<double[]> geometryCoordinates) { this.geometryCoordinates = geometryCoordinates; }

    public List<String> getTurnByTurnInstructions() { return turnByTurnInstructions; }
    public void setTurnByTurnInstructions(List<String> turnByTurnInstructions) { this.turnByTurnInstructions = turnByTurnInstructions; }

    public int getNodesExpanded() { return nodesExpanded; }
    public void setNodesExpanded(int nodesExpanded) { this.nodesExpanded = nodesExpanded; }

    public int getEdgesProcessed() { return edgesProcessed; }
    public void setEdgesProcessed(int edgesProcessed) { this.edgesProcessed = edgesProcessed; }

    public double getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(double executionTimeMs) { this.executionTimeMs = executionTimeMs; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public RouteResponse getAlternativeRoute() { return alternativeRoute; }
    public void setAlternativeRoute(RouteResponse alternativeRoute) { this.alternativeRoute = alternativeRoute; }
}
