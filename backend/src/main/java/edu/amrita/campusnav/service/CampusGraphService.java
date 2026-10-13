package edu.amrita.campusnav.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.amrita.campusnav.dto.ValidationReport;
import edu.amrita.campusnav.model.*;
import edu.amrita.campusnav.util.GeoUtils;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Main stateful campus graph service.
 * Maintains Adjacency List graph representation, vertex indexes, and dynamic closure tracking.
 */
@Service
public class CampusGraphService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, CampusVertex> vertices = new ConcurrentHashMap<>();
    private final Map<String, CampusEdge> originalEdges = new ConcurrentHashMap<>();
    private final Map<String, List<CampusEdge>> adjacencyList = new ConcurrentHashMap<>();
    private final Map<String, WalkabilityStatus> dynamicClosures = new ConcurrentHashMap<>();

    private String campusName = "Amrita Vishwa Vidyapeetham, Chennai Campus";
    private String campusNotice = "DEMO DATA: Calibrated pre-survey model.";
    private double centerLat = 13.2245;
    private double centerLng = 80.0260;

    @PostConstruct
    public void initialize() {
        loadDefaultGraph();
    }

    public synchronized void loadDefaultGraph() {
        try {
            ClassPathResource resource = new ClassPathResource("data/amrita-chennai-campus.json");
            try (InputStream is = resource.getInputStream()) {
                loadFromJson(is);
            }
        } catch (Exception e) {
            System.err.println("Failed to load default campus JSON: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public synchronized ValidationReport loadFromJson(InputStream inputStream) throws Exception {
        JsonNode root = objectMapper.readTree(inputStream);
        if (root.has("campus")) {
            JsonNode campus = root.get("campus");
            if (campus.has("name")) this.campusName = campus.get("name").asText();
            if (campus.has("dataNotice")) this.campusNotice = campus.get("dataNotice").asText();
            if (campus.has("center")) {
                this.centerLat = campus.get("center").get("latitude").asDouble();
                this.centerLng = campus.get("center").get("longitude").asDouble();
            }
        }

        List<CampusVertex> vertexList = new ArrayList<>();
        if (root.has("vertices")) {
            for (JsonNode vNode : root.get("vertices")) {
                CampusVertex v = objectMapper.treeToValue(vNode, CampusVertex.class);
                vertexList.add(v);
            }
        }

        List<CampusEdge> edgeList = new ArrayList<>();
        if (root.has("edges")) {
            for (JsonNode eNode : root.get("edges")) {
                CampusEdge e = objectMapper.treeToValue(eNode, CampusEdge.class);
                edgeList.add(e);
            }
        }

        ValidationReport report = CampusDataValidator.validate(vertexList, edgeList);

        if (report.isValid() || !vertexList.isEmpty()) {
            this.vertices.clear();
            this.originalEdges.clear();
            this.adjacencyList.clear();
            this.dynamicClosures.clear();

            for (CampusVertex v : vertexList) {
                this.vertices.put(v.getId(), v);
                this.adjacencyList.put(v.getId(), new ArrayList<>());
            }

            for (CampusEdge e : edgeList) {
                this.originalEdges.put(e.getId(), e);
                addEdgeToAdjacency(e);
            }
        }

        return report;
    }

    private void addEdgeToAdjacency(CampusEdge e) {
        if (!vertices.containsKey(e.getSource()) || !vertices.containsKey(e.getDestination())) {
            return;
        }

        WalkabilityStatus currentStatus = dynamicClosures.getOrDefault(e.getId(), e.getWalkability());
        CampusEdge forward = new CampusEdge(e.getId(), e.getSource(), e.getDestination(),
                e.getDistanceMeters(), e.getEstimatedDurationSeconds(), currentStatus,
                e.getPathType(), e.isHasStairs(), e.isHasRamp(), e.isAccessible(),
                e.isBidirectional(), e.getInstruction());

        adjacencyList.get(e.getSource()).add(forward);

        if (e.isBidirectional()) {
            CampusEdge backward = new CampusEdge(e.getId() + "_REV", e.getDestination(), e.getSource(),
                    e.getDistanceMeters(), e.getEstimatedDurationSeconds(), currentStatus,
                    e.getPathType(), e.isHasStairs(), e.isHasRamp(), e.isAccessible(),
                    true, e.getInstruction());
            adjacencyList.get(e.getDestination()).add(backward);
        }
    }

    private synchronized void rebuildAdjacencyList() {
        adjacencyList.clear();
        for (String vid : vertices.keySet()) {
            adjacencyList.put(vid, new ArrayList<>());
        }
        for (CampusEdge e : originalEdges.values()) {
            addEdgeToAdjacency(e);
        }
    }

    // Dynamic Graph Updates (Closure management)
    public synchronized boolean setEdgeClosure(String edgeId, WalkabilityStatus status) {
        if (!originalEdges.containsKey(edgeId)) {
            return false;
        }
        if (status == WalkabilityStatus.OPEN) {
            dynamicClosures.remove(edgeId);
        } else {
            dynamicClosures.put(edgeId, status);
        }
        rebuildAdjacencyList();
        return true;
    }

    public synchronized boolean reopenEdge(String edgeId) {
        if (!originalEdges.containsKey(edgeId)) {
            return false;
        }
        dynamicClosures.remove(edgeId);
        rebuildAdjacencyList();
        return true;
    }

    public Map<String, WalkabilityStatus> getDynamicClosures() {
        return Collections.unmodifiableMap(dynamicClosures);
    }

    // Shortest path routing
    public PathResult computeRoute(String originId, String destinationId, MetricType metric,
                                  String algorithm, boolean wheelchairOnly) {
        if ("AStar".equalsIgnoreCase(algorithm) || "A*".equalsIgnoreCase(algorithm)) {
            return AStarRouter.findShortestPath(vertices, adjacencyList, originId, destinationId, metric, wheelchairOnly);
        } else {
            return DijkstraRouter.findShortestPath(vertices, adjacencyList, originId, destinationId, metric, wheelchairOnly);
        }
    }

    // Nearest facility search (Multi-source Dijkstra)
    public CampusVertex findNearestFacility(String originId, LocationType type, MetricType metric, boolean wheelchairOnly) {
        if (!vertices.containsKey(originId)) return null;

        Map<String, Double> dist = new HashMap<>();
        PriorityQueue<Map.Entry<String, Double>> pq = new PriorityQueue<>(Comparator.comparingDouble(Map.Entry::getValue));
        Set<String> visited = new HashSet<>();

        for (String id : vertices.keySet()) dist.put(id, Double.POSITIVE_INFINITY);
        dist.put(originId, 0.0);
        pq.add(new AbstractMap.SimpleEntry<>(originId, 0.0));

        while (!pq.isEmpty()) {
            Map.Entry<String, Double> current = pq.poll();
            String u = current.getKey();
            if (visited.contains(u)) continue;
            visited.add(u);

            if (!u.equals(originId) && vertices.get(u).getType() == type) {
                return vertices.get(u);
            }

            for (CampusEdge edge : adjacencyList.getOrDefault(u, Collections.emptyList())) {
                if (!edge.isTraversable(wheelchairOnly)) continue;
                String v = edge.getDestination();
                double weight = edge.getWeight(metric);
                double newDist = dist.get(u) + weight;
                if (newDist < dist.get(v)) {
                    dist.put(v, newDist);
                    pq.add(new AbstractMap.SimpleEntry<>(v, newDist));
                }
            }
        }
        return null;
    }

    // Nearest vertex to GPS coordinates (within maxSnapDistanceMeters)
    public CampusVertex snapGpsToVertex(double lat, double lng, double maxSnapDistanceMeters) {
        CampusVertex nearest = null;
        double minDistance = Double.MAX_VALUE;

        for (CampusVertex v : vertices.values()) {
            double d = GeoUtils.haversineDistanceMeters(lat, lng, v.getLatitude(), v.getLongitude());
            if (d < minDistance) {
                minDistance = d;
                nearest = v;
            }
        }

        if (minDistance <= maxSnapDistanceMeters) {
            return nearest;
        }
        return null;
    }

    public List<CampusVertex> getAllVertices() {
        return new ArrayList<>(vertices.values());
    }

    public List<CampusEdge> getAllEdges() {
        return new ArrayList<>(originalEdges.values());
    }

    public CampusVertex getVertex(String id) {
        return vertices.get(id);
    }

    public CampusEdge getEdge(String id) {
        return originalEdges.get(id);
    }

    public List<CampusVertex> searchVertices(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllVertices();
        }
        String q = query.toLowerCase().trim();
        return vertices.values().stream()
                .filter(v -> v.getName().toLowerCase().contains(q) ||
                             v.getId().toLowerCase().contains(q) ||
                             v.getType().name().toLowerCase().contains(q) ||
                             (v.getDescription() != null && v.getDescription().toLowerCase().contains(q)))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getGraphStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("campusName", campusName);
        stats.put("notice", campusNotice);
        stats.put("centerLatitude", centerLat);
        stats.put("centerLongitude", centerLng);
        stats.put("vertexCount", vertices.size());
        stats.put("edgeCount", originalEdges.size());
        stats.put("activeClosuresCount", dynamicClosures.size());

        int openEdges = 0;
        int closedEdges = 0;
        for (CampusEdge e : originalEdges.values()) {
            WalkabilityStatus status = dynamicClosures.getOrDefault(e.getId(), e.getWalkability());
            if (status == WalkabilityStatus.OPEN) openEdges++;
            else closedEdges++;
        }
        stats.put("openEdges", openEdges);
        stats.put("closedEdges", closedEdges);

        List<Set<String>> components = BfsReachabilityChecker.findConnectedComponents(vertices, adjacencyList);
        stats.put("connectedComponents", components.size());
        return stats;
    }
}
