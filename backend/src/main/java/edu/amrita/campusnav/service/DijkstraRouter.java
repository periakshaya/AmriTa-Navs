package edu.amrita.campusnav.service;

import edu.amrita.campusnav.model.CampusEdge;
import edu.amrita.campusnav.model.CampusVertex;
import edu.amrita.campusnav.model.MetricType;
import edu.amrita.campusnav.model.PathResult;
import edu.amrita.campusnav.util.GeoUtils;

import java.util.*;

/**
 * Educational, transparent PriorityQueue implementation of Dijkstra's Single-Source
 * Shortest Path algorithm for Amrita Campus navigation.
 */
public class DijkstraRouter {

    private static class NodeRecord implements Comparable<NodeRecord> {
        final String vertexId;
        final double distance;

        NodeRecord(String vertexId, double distance) {
            this.vertexId = vertexId;
            this.distance = distance;
        }

        @Override
        public int compareTo(NodeRecord other) {
            return Double.compare(this.distance, other.distance);
        }
    }

    public static PathResult findShortestPath(
            Map<String, CampusVertex> vertices,
            Map<String, List<CampusEdge>> adjacencyList,
            String originId,
            String destinationId,
            MetricType metric,
            boolean wheelchairOnly) {

        long startTime = System.nanoTime();

        if (!vertices.containsKey(originId)) {
            return PathResult.notFound("Dijkstra", metric, "Origin location not found: " + originId, 0, 0, System.nanoTime() - startTime);
        }
        if (!vertices.containsKey(destinationId)) {
            return PathResult.notFound("Dijkstra", metric, "Destination location not found: " + destinationId, 0, 0, System.nanoTime() - startTime);
        }

        // Trivial case: origin equals destination
        if (originId.equals(destinationId)) {
            CampusVertex v = vertices.get(originId);
            List<String> instructions = Collections.singletonList("You are already at " + v.getName());
            return new PathResult(true, "Dijkstra", metric, 0.0, 0.0, 0.0,
                    Collections.singletonList(v), Collections.emptyList(), instructions,
                    1, 0, System.nanoTime() - startTime, null);
        }

        Map<String, Double> dist = new HashMap<>();
        Map<String, String> predecessorNode = new HashMap<>();
        Map<String, CampusEdge> predecessorEdge = new HashMap<>();
        Set<String> visited = new HashSet<>();
        PriorityQueue<NodeRecord> pq = new PriorityQueue<>();

        // Initialize distances
        for (String id : vertices.keySet()) {
            dist.put(id, Double.POSITIVE_INFINITY);
        }
        dist.put(originId, 0.0);
        pq.add(new NodeRecord(originId, 0.0));

        int nodesExpanded = 0;
        int edgesProcessed = 0;

        while (!pq.isEmpty()) {
            NodeRecord current = pq.poll();
            String u = current.vertexId;

            // Stale entry check in PriorityQueue
            if (visited.contains(u)) {
                continue;
            }
            visited.add(u);
            nodesExpanded++;

            if (u.equals(destinationId)) {
                break;
            }

            List<CampusEdge> outgoing = adjacencyList.getOrDefault(u, Collections.emptyList());
            for (CampusEdge edge : outgoing) {
                // Check traversability (closures, stairs for wheelchair, etc.)
                if (!edge.isTraversable(wheelchairOnly)) {
                    continue;
                }

                String v = edge.getDestination();
                double weight = edge.getWeight(metric);
                if (weight < 0) {
                    throw new IllegalArgumentException("Dijkstra does not support negative edge weights: " + weight);
                }

                edgesProcessed++;
                double newDist = dist.get(u) + weight;
                if (newDist < dist.getOrDefault(v, Double.POSITIVE_INFINITY)) {
                    dist.put(v, newDist);
                    predecessorNode.put(v, u);
                    predecessorEdge.put(v, edge);
                    pq.add(new NodeRecord(v, newDist));
                }
            }
        }

        long executionTime = System.nanoTime() - startTime;

        if (!visited.contains(destinationId) || dist.get(destinationId) == Double.POSITIVE_INFINITY) {
            return PathResult.notFound("Dijkstra", metric,
                    "Destination is currently unreachable from origin (no open connected path found).",
                    nodesExpanded, edgesProcessed, executionTime);
        }

        // Reconstruct path
        LinkedList<CampusVertex> pathVertices = new LinkedList<>();
        LinkedList<CampusEdge> pathEdges = new LinkedList<>();
        LinkedList<String> instructions = new LinkedList<>();

        String curr = destinationId;
        double totalDistMeters = 0.0;
        double totalDurationSec = 0.0;

        while (curr != null) {
            pathVertices.addFirst(vertices.get(curr));
            CampusEdge inEdge = predecessorEdge.get(curr);
            if (inEdge != null) {
                pathEdges.addFirst(inEdge);
                totalDistMeters += inEdge.getDistanceMeters();
                totalDurationSec += inEdge.getEstimatedDurationSeconds();
                curr = predecessorNode.get(curr);
            } else {
                break;
            }
        }

        // Build turn-by-turn navigation instructions
        instructions.addAll(generateTurnInstructions(pathVertices, pathEdges));

        return new PathResult(true, "Dijkstra", metric, dist.get(destinationId),
                totalDistMeters, totalDurationSec, pathVertices, pathEdges, instructions,
                nodesExpanded, edgesProcessed, executionTime, null);
    }

    public static List<String> generateTurnInstructions(List<CampusVertex> vertices, List<CampusEdge> edges) {
        List<String> list = new ArrayList<>();
        if (vertices.isEmpty()) return list;
        if (vertices.size() == 1) {
            list.add("You have reached " + vertices.get(0).getName());
            return list;
        }

        list.add("Start at " + vertices.get(0).getName() + " and begin walking toward " + vertices.get(1).getName());

        for (int i = 0; i < edges.size(); i++) {
            CampusEdge e = edges.get(i);
            CampusVertex vCurr = vertices.get(i);
            CampusVertex vNext = vertices.get(i + 1);

            String stepText;
            if (e.getInstruction() != null && !e.getInstruction().trim().isEmpty()) {
                stepText = e.getInstruction();
            } else {
                stepText = "Walk " + Math.round(e.getDistanceMeters()) + "m along " + e.getPathType().replace('_', ' ').toLowerCase() + " to " + vNext.getName();
            }

            if (i > 0) {
                CampusVertex vPrev = vertices.get(i - 1);
                double bearing1 = GeoUtils.calculateBearingDegrees(vPrev.getLatitude(), vPrev.getLongitude(), vCurr.getLatitude(), vCurr.getLongitude());
                double bearing2 = GeoUtils.calculateBearingDegrees(vCurr.getLatitude(), vCurr.getLongitude(), vNext.getLatitude(), vNext.getLongitude());
                String turn = GeoUtils.getTurnInstruction(bearing1, bearing2);
                list.add(turn + ": " + stepText + " (" + Math.round(e.getDistanceMeters()) + " m, ~" + Math.round(e.getEstimatedDurationSeconds()) + " s)");
            } else {
                list.add(stepText + " (" + Math.round(e.getDistanceMeters()) + " m, ~" + Math.round(e.getEstimatedDurationSeconds()) + " s)");
            }
        }

        list.add("Arrive at your destination: " + vertices.get(vertices.size() - 1).getName());
        return list;
    }
}
