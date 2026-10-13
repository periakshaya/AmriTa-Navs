package edu.amrita.campusnav;

import edu.amrita.campusnav.model.*;
import edu.amrita.campusnav.service.CampusGraphService;
import edu.amrita.campusnav.util.GeoUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class AStarRouterTest {

    private CampusGraphService graphService;

    @BeforeEach
    public void setup() {
        graphService = new CampusGraphService();
        graphService.loadDefaultGraph();
    }

    @Test
    @DisplayName("A* should find path between Gate and Library")
    public void testAStarGateToLibrary() {
        PathResult result = graphService.computeRoute("GATE_MAIN", "LIBRARY_CENTRAL", MetricType.DISTANCE, "A*", false);

        assertTrue(result.isFound());
        assertEquals("A*", result.getAlgorithm());
        assertTrue(result.getTotalCost() > 0);
        assertTrue(result.getNodesExpanded() > 0);
        assertEquals("GATE_MAIN", result.getPathVertices().get(0).getId());
        assertEquals("LIBRARY_CENTRAL", result.getPathVertices().get(result.getPathVertices().size() - 1).getId());
    }

    @Test
    @DisplayName("Admissible Haversine Heuristic must never overestimate true ground distance")
    public void testHeuristicAdmissibility() {
        CampusVertex v1 = graphService.getVertex("GATE_MAIN");
        CampusVertex v2 = graphService.getVertex("GATE_SOUTH");

        double hDist = GeoUtils.admissibleHeuristic(v1.getLatitude(), v1.getLongitude(), v2.getLatitude(), v2.getLongitude(), false);

        PathResult shortest = graphService.computeRoute("GATE_MAIN", "GATE_SOUTH", MetricType.DISTANCE, "Dijkstra", false);
        assertTrue(shortest.isFound());

        assertTrue(hDist <= shortest.getTotalCost() + 1e-4,
                "Heuristic h (" + hDist + "m) must be <= shortest path cost (" + shortest.getTotalCost() + "m)");
    }

    @Test
    @DisplayName("A* should optimize for time metric in seconds")
    public void testAStarTimeMetric() {
        PathResult resultDist = graphService.computeRoute("BLOCK_ARYABHATA", "GROUND_OUTDOOR", MetricType.DISTANCE, "A*", false);
        PathResult resultTime = graphService.computeRoute("BLOCK_ARYABHATA", "GROUND_OUTDOOR", MetricType.TIME, "A*", false);

        assertTrue(resultDist.isFound());
        assertTrue(resultTime.isFound());
        assertEquals(MetricType.TIME, resultTime.getMetric());
        assertTrue(resultTime.getTotalDurationSeconds() > 0);
    }
}
