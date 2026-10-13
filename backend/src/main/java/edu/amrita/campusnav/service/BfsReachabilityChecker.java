package edu.amrita.campusnav.service;

import edu.amrita.campusnav.model.CampusEdge;
import edu.amrita.campusnav.model.CampusVertex;

import java.util.*;

/**
 * BFS-based connectivity and reachability analyzer for Amrita campus pedestrian graph.
 * Used for:
 * 1. Validating graph integrity (identifying isolated components or dead ends).
 * 2. Unweighted hop-count reachability checks.
 * 3. Demonstrating in academic vivas why BFS is optimal only for unweighted graphs.
 */
public class BfsReachabilityChecker {

    public static Set<String> getReachableVertices(
            Map<String, List<CampusEdge>> adjacencyList,
            String startVertexId,
            boolean wheelchairOnly) {

        Set<String> visited = new HashSet<>();
        Queue<String> queue = new ArrayDeque<>();

        if (startVertexId == null) return visited;

        queue.add(startVertexId);
        visited.add(startVertexId);

        while (!queue.isEmpty()) {
            String curr = queue.poll();
            List<CampusEdge> neighbors = adjacencyList.getOrDefault(curr, Collections.emptyList());

            for (CampusEdge edge : neighbors) {
                if (!edge.isTraversable(wheelchairOnly)) {
                    continue;
                }
                String dest = edge.getDestination();
                if (!visited.contains(dest)) {
                    visited.add(dest);
                    queue.add(dest);
                }
            }
        }

        return visited;
    }

    public static List<Set<String>> findConnectedComponents(
            Map<String, CampusVertex> vertices,
            Map<String, List<CampusEdge>> adjacencyList) {

        List<Set<String>> components = new ArrayList<>();
        Set<String> unvisited = new HashSet<>(vertices.keySet());

        while (!unvisited.isEmpty()) {
            String start = unvisited.iterator().next();
            Set<String> component = getReachableVertices(adjacencyList, start, false);
            // In case of directed or disconnected, retain intersection
            component.retainAll(unvisited);
            if (component.isEmpty()) {
                component.add(start);
            }
            components.add(component);
            unvisited.removeAll(component);
        }

        return components;
    }
}
