package edu.amrita.campusnav;

import edu.amrita.campusnav.model.*;
import edu.amrita.campusnav.service.CampusGraphService;
import edu.amrita.campusnav.service.DijkstraRouter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class DijkstraRouterTest {

    private CampusGraphService graphService;

    @BeforeEach
    public void setup() {
        graphService = new CampusGraphService();
        graphService.loadDefaultGraph();
    }

    @Test
    @DisplayName("Should find direct shortest route from Main Gate to North Plaza")
    public void testDirectShortestRoute() {
        PathResult result = graphService.computeRoute("GATE_MAIN", "PLAZA_NORTH", MetricType.DISTANCE, "Dijkstra", false);

        assertTrue(result.isFound(), "Path should be found");
        assertEquals(80.0, result.getTotalCost(), 0.01, "Expected direct distance of 80m");
        assertEquals(2, result.getPathVertices().size(), "Should contain exactly 2 vertices");
        assertEquals("GATE_MAIN", result.getPathVertices().get(0).getId());
        assertEquals("PLAZA_NORTH", result.getPathVertices().get(1).getId());
    }

    @Test
    @DisplayName("Should return 0 cost when origin equals destination")
    public void testOriginEqualsDestination() {
        PathResult result = graphService.computeRoute("LIBRARY_CENTRAL", "LIBRARY_CENTRAL", MetricType.DISTANCE, "Dijkstra", false);

        assertTrue(result.isFound());
        assertEquals(0.0, result.getTotalCost(), 0.001);
        assertEquals(1, result.getPathVertices().size());
        assertEquals("LIBRARY_CENTRAL", result.getPathVertices().get(0).getId());
    }

    @Test
    @DisplayName("Should find optimal route between distant campus locations")
    public void testOptimalMultiHopRoute() {
        PathResult result = graphService.computeRoute("GATE_MAIN", "CANTEEN_FOODCOURT", MetricType.DISTANCE, "Dijkstra", false);

        assertTrue(result.isFound());
        assertTrue(result.getTotalCost() > 0);
        assertTrue(result.getPathVertices().size() >= 4, "Should be multi-hop route across campus");
        assertEquals("GATE_MAIN", result.getPathVertices().get(0).getId());
        assertEquals("CANTEEN_FOODCOURT", result.getPathVertices().get(result.getPathVertices().size() - 1).getId());
    }

    @Test
    @DisplayName("Should report not found for isolated disconnected vertex")
    public void testDisconnectedVertex() {
        PathResult result = graphService.computeRoute("GATE_MAIN", "ISOLATED_MAINTENANCE_TOWER", MetricType.DISTANCE, "Dijkstra", false);

        assertFalse(result.isFound(), "Isolated tower must not be reachable");
        assertNotNull(result.getErrorMessage());
    }

    @Test
    @DisplayName("Should report error when origin or destination ID is invalid")
    public void testInvalidLocations() {
        PathResult result = graphService.computeRoute("NON_EXISTENT_ID", "CANTEEN_FOODCOURT", MetricType.DISTANCE, "Dijkstra", false);
        assertFalse(result.isFound());
        assertTrue(result.getErrorMessage().contains("Origin location not found"));

        PathResult result2 = graphService.computeRoute("GATE_MAIN", "INVALID_TARGET", MetricType.DISTANCE, "Dijkstra", false);
        assertFalse(result2.isFound());
        assertTrue(result2.getErrorMessage().contains("Destination location not found"));
    }

    @Test
    @DisplayName("Wheelchair accessible routing must avoid stair edges")
    public void testWheelchairAccessibleRouting() {
        // Path to AMPHITHEATRE uses stairs
        PathResult normal = graphService.computeRoute("JUNCTION_CENTRAL", "AMPHITHEATRE", MetricType.DISTANCE, "Dijkstra", false);
        assertTrue(normal.isFound());

        PathResult accessible = graphService.computeRoute("JUNCTION_CENTRAL", "AMPHITHEATRE", MetricType.DISTANCE, "Dijkstra", true);
        assertFalse(accessible.isFound(), "Amphitheatre has only stair access, so wheelchair search must exclude it");
    }
}
