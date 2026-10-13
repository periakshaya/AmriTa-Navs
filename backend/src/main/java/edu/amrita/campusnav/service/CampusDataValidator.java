package edu.amrita.campusnav.service;

import edu.amrita.campusnav.dto.ValidationReport;
import edu.amrita.campusnav.model.CampusEdge;
import edu.amrita.campusnav.model.CampusVertex;

import java.util.*;

/**
 * Validates integrity of raw campus datasets before loading.
 */
public class CampusDataValidator {

    public static ValidationReport validate(List<CampusVertex> vertices, List<CampusEdge> edges) {
        ValidationReport report = new ValidationReport();
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        List<String> isolated = new ArrayList<>();

        if (vertices == null || vertices.isEmpty()) {
            errors.add("Dataset contains no vertices.");
            report.setValid(false);
            report.setErrors(errors);
            return report;
        }

        report.setVertexCount(vertices.size());
        report.setEdgeCount(edges != null ? edges.size() : 0);

        Map<String, CampusVertex> vertexMap = new HashMap<>();
        Set<String> duplicateVertexIds = new HashSet<>();

        for (CampusVertex v : vertices) {
            if (v.getId() == null || v.getId().trim().isEmpty()) {
                errors.add("Vertex found with empty or null ID: " + v.getName());
                continue;
            }
            if (vertexMap.containsKey(v.getId())) {
                duplicateVertexIds.add(v.getId());
            } else {
                vertexMap.put(v.getId(), v);
            }

            // Check coordinate ranges for Chennai region (Lat approx 13.0 to 13.5, Lon approx 79.8 to 80.4)
            if (v.getLatitude() < -90.0 || v.getLatitude() > 90.0 ||
                v.getLongitude() < -180.0 || v.getLongitude() > 180.0) {
                errors.add("Invalid GPS coordinates on vertex " + v.getId() + ": [" + v.getLatitude() + ", " + v.getLongitude() + "]");
            }
            if (v.getLatitude() < 13.0 || v.getLatitude() > 13.5 || v.getLongitude() < 79.8 || v.getLongitude() > 80.4) {
                warnings.add("Vertex " + v.getId() + " coordinate [" + v.getLatitude() + ", " + v.getLongitude() + "] falls outside typical Amrita Chennai bounding box.");
            }
        }

        if (!duplicateVertexIds.isEmpty()) {
            errors.add("Duplicate vertex IDs detected: " + duplicateVertexIds);
        }

        // Validate edges
        Set<String> edgeIds = new HashSet<>();
        Map<String, List<CampusEdge>> adj = new HashMap<>();
        for (String vid : vertexMap.keySet()) {
            adj.put(vid, new ArrayList<>());
        }

        if (edges != null) {
            for (CampusEdge e : edges) {
                if (e.getId() == null || e.getId().trim().isEmpty()) {
                    errors.add("Edge has missing or blank ID.");
                    continue;
                }
                if (edgeIds.contains(e.getId())) {
                    errors.add("Duplicate edge ID detected: " + e.getId());
                } else {
                    edgeIds.add(e.getId());
                }

                if (!vertexMap.containsKey(e.getSource())) {
                    errors.add("Edge " + e.getId() + " references unknown source vertex: " + e.getSource());
                }
                if (!vertexMap.containsKey(e.getDestination())) {
                    errors.add("Edge " + e.getId() + " references unknown destination vertex: " + e.getDestination());
                }

                if (e.getDistanceMeters() <= 0) {
                    errors.add("Edge " + e.getId() + " has non-positive distance weight: " + e.getDistanceMeters());
                }
                if (e.getEstimatedDurationSeconds() <= 0) {
                    errors.add("Edge " + e.getId() + " has non-positive duration weight: " + e.getEstimatedDurationSeconds());
                }

                // Check contradictory wheelchair accessibility
                if (e.isHasStairs() && e.isAccessible() && !e.isHasRamp()) {
                    warnings.add("Edge " + e.getId() + " is marked accessible but contains stairs without ramp.");
                }

                if (vertexMap.containsKey(e.getSource()) && vertexMap.containsKey(e.getDestination())) {
                    adj.get(e.getSource()).add(e);
                    if (e.isBidirectional()) {
                        CampusEdge reverse = new CampusEdge(e.getId() + "_REV", e.getDestination(), e.getSource(),
                                e.getDistanceMeters(), e.getEstimatedDurationSeconds(), e.getWalkability(),
                                e.getPathType(), e.isHasStairs(), e.isHasRamp(), e.isAccessible(), true, e.getInstruction());
                        adj.get(e.getDestination()).add(reverse);
                    }
                }
            }
        }

        // Check for isolated vertices (0 degrees)
        for (CampusVertex v : vertexMap.values()) {
            List<CampusEdge> out = adj.getOrDefault(v.getId(), Collections.emptyList());
            if (out.isEmpty()) {
                isolated.add(v.getId());
            }
        }

        if (!isolated.isEmpty()) {
            warnings.add("Detected " + isolated.size() + " isolated vertices with zero degree traversability: " + isolated);
        }

        List<Set<String>> components = BfsReachabilityChecker.findConnectedComponents(vertexMap, adj);
        report.setConnectedComponentsCount(components.size());
        if (components.size() > 1) {
            warnings.add("Campus graph is partitioned into " + components.size() + " disconnected components. Route searches between components will be unreachable.");
        }

        report.setIsolatedVertices(isolated);
        report.setErrors(errors);
        report.setWarnings(warnings);
        report.setValid(errors.isEmpty());

        return report;
    }
}
