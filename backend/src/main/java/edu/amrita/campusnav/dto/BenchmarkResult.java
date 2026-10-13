package edu.amrita.campusnav.dto;

import edu.amrita.campusnav.model.MetricType;

public class BenchmarkResult {
    private String originId;
    private String destinationId;
    private MetricType metric;
    private int iterations;

    // Dijkstra stats
    private double dijkstraCost;
    private double dijkstraAvgTimeMicros;
    private int dijkstraNodesExpanded;
    private int dijkstraEdgesProcessed;
    private int dijkstraHopCount;

    // A* stats
    private double aStarCost;
    private double aStarAvgTimeMicros;
    private int aStarNodesExpanded;
    private int aStarEdgesProcessed;
    private int aStarHopCount;

    // Comparison analysis
    private boolean costsMatch;
    private double nodeExpansionReductionPercent;
    private String conclusion;

    public BenchmarkResult() {}

    public String getOriginId() { return originId; }
    public void setOriginId(String originId) { this.originId = originId; }

    public String getDestinationId() { return destinationId; }
    public void setDestinationId(String destinationId) { this.destinationId = destinationId; }

    public MetricType getMetric() { return metric; }
    public void setMetric(MetricType metric) { this.metric = metric; }

    public int getIterations() { return iterations; }
    public void setIterations(int iterations) { this.iterations = iterations; }

    public double getDijkstraCost() { return dijkstraCost; }
    public void setDijkstraCost(double dijkstraCost) { this.dijkstraCost = dijkstraCost; }

    public double getDijkstraAvgTimeMicros() { return dijkstraAvgTimeMicros; }
    public void setDijkstraAvgTimeMicros(double dijkstraAvgTimeMicros) { this.dijkstraAvgTimeMicros = dijkstraAvgTimeMicros; }

    public int getDijkstraNodesExpanded() { return dijkstraNodesExpanded; }
    public void setDijkstraNodesExpanded(int dijkstraNodesExpanded) { this.dijkstraNodesExpanded = dijkstraNodesExpanded; }

    public int getDijkstraEdgesProcessed() { return dijkstraEdgesProcessed; }
    public void setDijkstraEdgesProcessed(int dijkstraEdgesProcessed) { this.dijkstraEdgesProcessed = dijkstraEdgesProcessed; }

    public int getDijkstraHopCount() { return dijkstraHopCount; }
    public void setDijkstraHopCount(int dijkstraHopCount) { this.dijkstraHopCount = dijkstraHopCount; }

    public double getAStarCost() { return aStarCost; }
    public void setAStarCost(double aStarCost) { this.aStarCost = aStarCost; }

    public double getAStarAvgTimeMicros() { return aStarAvgTimeMicros; }
    public void setAStarAvgTimeMicros(double aStarAvgTimeMicros) { this.aStarAvgTimeMicros = aStarAvgTimeMicros; }

    public int getAStarNodesExpanded() { return aStarNodesExpanded; }
    public void setAStarNodesExpanded(int aStarNodesExpanded) { this.aStarNodesExpanded = aStarNodesExpanded; }

    public int getAStarEdgesProcessed() { return aStarEdgesProcessed; }
    public void setAStarEdgesProcessed(int aStarEdgesProcessed) { this.aStarEdgesProcessed = aStarEdgesProcessed; }

    public int getAStarHopCount() { return aStarHopCount; }
    public void setAStarHopCount(int aStarHopCount) { this.aStarHopCount = aStarHopCount; }

    public boolean isCostsMatch() { return costsMatch; }
    public void setCostsMatch(boolean costsMatch) { this.costsMatch = costsMatch; }

    public double getNodeExpansionReductionPercent() { return nodeExpansionReductionPercent; }
    public void setNodeExpansionReductionPercent(double nodeExpansionReductionPercent) { this.nodeExpansionReductionPercent = nodeExpansionReductionPercent; }

    public String getConclusion() { return conclusion; }
    public void setConclusion(String conclusion) { this.conclusion = conclusion; }
}
