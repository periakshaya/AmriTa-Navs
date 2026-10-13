package edu.amrita.campusnav;

import edu.amrita.campusnav.model.MetricType;
import edu.amrita.campusnav.model.PathResult;
import edu.amrita.campusnav.model.WalkabilityStatus;
import edu.amrita.campusnav.service.CampusGraphService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class DynamicClosureTest {

    private CampusGraphService graphService;

    @BeforeEach
    public void setup() {
        graphService = new CampusGraphService();
        graphService.loadDefaultGraph();
    }

    @Test
    @DisplayName("Closing an edge should force rerouting along an alternate open path")
    public void testDynamicClosureAndReroute() {
        // Initial route from GATE_MAIN to BUS_BAY uses direct edge E_GATE_TO_BUSBAY (90m)
        PathResult initial = graphService.computeRoute("GATE_MAIN", "BUS_BAY", MetricType.DISTANCE, "Dijkstra", false);
        assertTrue(initial.isFound());
        assertEquals(90.0, initial.getTotalCost(), 0.01);

        // Dynamically close direct edge E_GATE_TO_BUSBAY
        boolean closed = graphService.setEdgeClosure("E_GATE_TO_BUSBAY", WalkabilityStatus.TEMPORARILY_CLOSED);
        assertTrue(closed);

        // Recompute route: should now detour through PLAZA_NORTH (80m + 110m = 190m)
        PathResult rerouted = graphService.computeRoute("GATE_MAIN", "BUS_BAY", MetricType.DISTANCE, "Dijkstra", false);
        assertTrue(rerouted.isFound());
        assertEquals(190.0, rerouted.getTotalCost(), 0.01, "Route must take alternate open detour");
        assertEquals(3, rerouted.getPathVertices().size());
        assertEquals("PLAZA_NORTH", rerouted.getPathVertices().get(1).getId());

        // Reopen edge
        boolean reopened = graphService.reopenEdge("E_GATE_TO_BUSBAY");
        assertTrue(reopened);

        // Route should revert to original 90m
        PathResult reverted = graphService.computeRoute("GATE_MAIN", "BUS_BAY", MetricType.DISTANCE, "Dijkstra", false);
        assertTrue(reverted.isFound());
        assertEquals(90.0, reverted.getTotalCost(), 0.01);
    }
}
