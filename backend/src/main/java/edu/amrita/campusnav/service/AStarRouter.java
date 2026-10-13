package edu.amrita.campusnav.service;

import edu.amrita.campusnav.model.CampusEdge;
import edu.amrita.campusnav.model.CampusVertex;
import edu.amrita.campusnav.model.MetricType;
import edu.amrita.campusnav.model.PathResult;
import edu.amrita.campusnav.util.GeoUtils;

import java.util.*;

/**
 * Educational, transparent PriorityQueue implementation of A* Search for Amrita Campus navigation.
 * Heuristic Function h(u):
 *   - DISTANCE metric: Straight-line Haversine distance in metres between vertex u and destination.
 *     Admissibility: By the triangle inequality on a spherical manifold, straight-line distance <= walking path distance.
 *     Consistency: h(u) <= c(u, v) + h(v) holds because Euclidean/spherical distance satisfies metric triangle inequality.
 *   - TIME metric: Straight-line Haversine distance divided by MAX_PEDESTRIAN_SPEED_MPS (1.6 m/s).
 *     Admissibility: Walking time = distance / speed. Since actual speed <= max speed,
 *     straight_line / max_speed <= actual_path / actual_speed = path_time.
 */
public class AStarRouter {

    private static class AStarRecord implements Comparable<AStarRecord> {
        final String vertexId;
        final double fScore;
        final double gScore;

        AStarRecord(String vertexId, double fScore, double gScore) {
            this.vertexId = vertexId;
            this.fScore = fScore;
            this.gScore = gScore;
        }

        @Override
        public int compareTo(AStarRecord other) {
            int cmp = Double.compare(this.fScore, other.fScore);
            if (cmp == 0) {
                // Tie-breaker: prioritize lower heuristic (closer to target) or higher gScore
                return Double.compare(other.gScore, this.gScore);
            }
            return cmp;
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
            return PathResult.notFound("A*", metric, "Origin location not found: " + originId, 0, 0, System.nanoTime() - startTime);
        }
        if (!vertices.containsKey(destinationId)) {
            return PathResult.notFound("A*", metric, "Destination location not found: " + destinationId, 0, 0, System.nanoTime() - startTime);
        }

        if (originId.equals(destinationId)) {
            CampusVertex v = vertices.get(originId);
            List<String> instructions = Collections.singletonList("You are already at " + v.getName());
            return new PathResult(true, "A*", metric, 0.0, 0.0, 0.0,
                    Collections.singletonList(v), Collections.emptyList(), instructions,
                    1, 0, System.nanoTime() - startTime, null);
        }

        CampusVertex targetVertex = vertices.get(destinationId);
        boolean isTime = (metric == MetricType.TIME);

        Map<String, Double> gScore = new HashMap<>();
        Map<String, String> predecessorNode = new HashMap<>();
        Map<String, CampusEdge> predecessorEdge = new HashMap<>();
        Set<String> closedSet = new HashSet<>();
        PriorityQueue<AStarRecord> openSet = new PriorityQueue<>();

        for (String id : vertices.keySet()) {
            gScore.put(id, Double.POSITIVE_INFINITY);
        }

        gScore.put(originId, 0.0);
        CampusVertex originVertex = vertices.get(originId);
        double initialH = GeoUtils.admissibleHeuristic(
                originVertex.getLatitude(), originVertex.getLongitude(),
                targetVertex.getLatitude(), targetVertex.getLongitude(),
                isTime
        );

        openSet.add(new AStarRecord(originId, initialH, 0.0));

        int nodesExpanded = 0;
        int edgesProcessed = 0;

        while (!openSet.isEmpty()) {
            AStarRecord current = openSet.poll();
            String u = current.vertexId;

            // Stale entry check: if we already finalized u with a lower or equal gScore
            if (closedSet.contains(u)) {
                continue;
            }

            closedSet.add(u);
            nodesExpanded++;

            if (u.equals(destinationId)) {
                break;
            }

            List<CampusEdge> outgoing = adjacencyList.getOrDefault(u, Collections.emptyList());
            for (CampusEdge edge : outgoing) {
                if (!edge.isTraversable(wheelchairOnly)) {
                    continue;
                }

                String v = edge.getDestination();
                if (closedSet.contains(v)) {
                    continue;
                }

                double weight = edge.getWeight(metric);
                if (weight < 0) {
                    throw new IllegalArgumentException("A* does not support negative edge weights: " + weight);
                }

                edgesProcessed++;
                double tentativeG = gScore.get(u) + weight;

                if (tentativeG < gScore.getOrDefault(v, Double.POSITIVE_INFINITY)) {
                    gScore.put(v, tentativeG);
                    predecessorNode.put(v, u);
                    predecessorEdge.put(v, edge);

                    CampusVertex nextVertex = vertices.get(v);
                    double h = GeoUtils.admissibleHeuristic(
                            nextVertex.getLatitude(), nextVertex.getLongitude(),
                            targetVertex.getLatitude(), targetVertex.getLongitude(),
                            isTime
                    );
                    double f = tentativeG + h;
                    openSet.add(new AStarRecord(v, f, tentativeG));
                }
            }
        }

        long executionTime = System.nanoTime() - startTime;

        if (!closedSet.contains(destinationId) || gScore.get(destinationId) == Double.POSITIVE_INFINITY) {
            return PathResult.notFound("A*", metric,
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

        instructions.addAll(DijkstraRouter.generateTurnInstructions(pathVertices, pathEdges));

        return new PathResult(true, "A*", metric, gScore.get(destinationId),
                totalDistMeters, totalDurationSec, pathVertices, pathEdges, instructions,
                nodesExpanded, edgesProcessed, executionTime, null);
    }
}
