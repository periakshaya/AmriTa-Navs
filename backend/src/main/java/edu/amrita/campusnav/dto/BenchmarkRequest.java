package edu.amrita.campusnav.dto;

import edu.amrita.campusnav.model.MetricType;

public class BenchmarkRequest {
    private String originId;
    private String destinationId;
    private MetricType metric = MetricType.DISTANCE;
    private int iterations = 100;
    private boolean wheelchairOnly = false;

    public BenchmarkRequest() {}

    public String getOriginId() { return originId; }
    public void setOriginId(String originId) { this.originId = originId; }

    public String getDestinationId() { return destinationId; }
    public void setDestinationId(String destinationId) { this.destinationId = destinationId; }

    public MetricType getMetric() { return metric; }
    public void setMetric(MetricType metric) { this.metric = metric; }

    public int getIterations() { return iterations; }
    public void setIterations(int iterations) { this.iterations = iterations; }

    public boolean isWheelchairOnly() { return wheelchairOnly; }
    public void setWheelchairOnly(boolean wheelchairOnly) { this.wheelchairOnly = wheelchairOnly; }
}
