package edu.amrita.campusnav.dto;

import edu.amrita.campusnav.model.MetricType;

public class RouteRequest {
    private String originId;
    private String destinationId;
    private MetricType metric = MetricType.DISTANCE;
    private String algorithm = "AStar"; // AStar or Dijkstra
    private boolean wheelchairOnly = false;
    private boolean returnAlternatives = false;

    public RouteRequest() {}

    public String getOriginId() { return originId; }
    public void setOriginId(String originId) { this.originId = originId; }

    public String getDestinationId() { return destinationId; }
    public void setDestinationId(String destinationId) { this.destinationId = destinationId; }

    public MetricType getMetric() { return metric; }
    public void setMetric(MetricType metric) { this.metric = metric; }

    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }

    public boolean isWheelchairOnly() { return wheelchairOnly; }
    public void setWheelchairOnly(boolean wheelchairOnly) { this.wheelchairOnly = wheelchairOnly; }

    public boolean isReturnAlternatives() { return returnAlternatives; }
    public void setReturnAlternatives(boolean returnAlternatives) { this.returnAlternatives = returnAlternatives; }
}
