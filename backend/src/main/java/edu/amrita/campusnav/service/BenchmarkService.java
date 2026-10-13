package edu.amrita.campusnav.service;

import edu.amrita.campusnav.dto.BenchmarkRequest;
import edu.amrita.campusnav.dto.BenchmarkResult;
import edu.amrita.campusnav.model.PathResult;
import org.springframework.stereotype.Service;

/**
 * Executes empirical DSA benchmarks comparing Dijkstra vs A* on the active campus graph.
 * Records exact nanos, nodes expanded, processed edges, and validates cost parity.
 */
@Service
public class BenchmarkService {

    private final CampusGraphService graphService;

    public BenchmarkService(CampusGraphService graphService) {
        this.graphService = graphService;
    }

    public BenchmarkResult runBenchmark(BenchmarkRequest request) {
        String origin = request.getOriginId();
        String destination = request.getDestinationId();
        int iterations = Math.max(10, Math.min(request.getIterations(), 500));

        // Warm up JIT compiler
        for (int i = 0; i < 20; i++) {
            graphService.computeRoute(origin, destination, request.getMetric(), "Dijkstra", request.isWheelchairOnly());
            graphService.computeRoute(origin, destination, request.getMetric(), "A*", request.isWheelchairOnly());
        }

        // Measure Dijkstra
        long totalDijkstraNanos = 0;
        PathResult dijkstraResult = null;
        for (int i = 0; i < iterations; i++) {
            long t0 = System.nanoTime();
            dijkstraResult = graphService.computeRoute(origin, destination, request.getMetric(), "Dijkstra", request.isWheelchairOnly());
            totalDijkstraNanos += (System.nanoTime() - t0);
        }

        // Measure A*
        long totalAStarNanos = 0;
        PathResult aStarResult = null;
        for (int i = 0; i < iterations; i++) {
            long t0 = System.nanoTime();
            aStarResult = graphService.computeRoute(origin, destination, request.getMetric(), "A*", request.isWheelchairOnly());
            totalAStarNanos += (System.nanoTime() - t0);
        }

        BenchmarkResult result = new BenchmarkResult();
        result.setOriginId(origin);
        result.setDestinationId(destination);
        result.setMetric(request.getMetric());
        result.setIterations(iterations);

        if (dijkstraResult != null) {
            result.setDijkstraCost(dijkstraResult.getTotalCost());
            result.setDijkstraAvgTimeMicros((totalDijkstraNanos / (double) iterations) / 1000.0);
            result.setDijkstraNodesExpanded(dijkstraResult.getNodesExpanded());
            result.setDijkstraEdgesProcessed(dijkstraResult.getEdgesProcessed());
            result.setDijkstraHopCount(dijkstraResult.getPathVertices().size() > 0 ? dijkstraResult.getPathVertices().size() - 1 : 0);
        }

        if (aStarResult != null) {
            result.setAStarCost(aStarResult.getTotalCost());
            result.setAStarAvgTimeMicros((totalAStarNanos / (double) iterations) / 1000.0);
            result.setAStarNodesExpanded(aStarResult.getNodesExpanded());
            result.setAStarEdgesProcessed(aStarResult.getEdgesProcessed());
            result.setAStarHopCount(aStarResult.getPathVertices().size() > 0 ? aStarResult.getPathVertices().size() - 1 : 0);
        }

        boolean costsMatch = Math.abs(result.getDijkstraCost() - result.getAStarCost()) < 1e-4;
        result.setCostsMatch(costsMatch);

        double reduction = 0.0;
        if (result.getDijkstraNodesExpanded() > 0) {
            reduction = ((double) (result.getDijkstraNodesExpanded() - result.getAStarNodesExpanded()) / result.getDijkstraNodesExpanded()) * 100.0;
        }
        result.setNodeExpansionReductionPercent(reduction);

        StringBuilder sb = new StringBuilder();
        if (costsMatch) {
            sb.append("Both algorithms found identical optimal path cost (").append(String.format("%.1f", result.getDijkstraCost())).append("). ");
            if (reduction > 0) {
                sb.append("A* guided search pruned ").append(String.format("%.1f%%", reduction)).append(" of node expansions using the Haversine heuristic.");
            } else if (reduction == 0) {
                sb.append("A* and Dijkstra visited the same number of nodes for this topology.");
            } else {
                sb.append("Heuristic overhead resulted in comparable search exploration.");
            }
        } else {
            sb.append("Warning: Cost discrepancy detected. Check heuristic consistency.");
        }
        result.setConclusion(sb.toString());

        return result;
    }
}
