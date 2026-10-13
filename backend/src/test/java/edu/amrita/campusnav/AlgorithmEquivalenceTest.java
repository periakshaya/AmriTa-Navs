package edu.amrita.campusnav;

import edu.amrita.campusnav.model.CampusVertex;
import edu.amrita.campusnav.model.MetricType;
import edu.amrita.campusnav.model.PathResult;
import edu.amrita.campusnav.service.CampusGraphService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class AlgorithmEquivalenceTest {

    private CampusGraphService graphService;

    @BeforeEach
    public void setup() {
        graphService = new CampusGraphService();
        graphService.loadDefaultGraph();
    }

    @Test
    @DisplayName("Dijkstra and A* must return identical optimal costs for all key campus OD pairs")
    public void testOptimalCostEquivalenceAcrossPairs() {
        String[][] pairs = {
                {"GATE_MAIN", "CANTEEN_FOODCOURT"},
                {"GATE_MAIN", "HOSTEL_BOYS_A"},
                {"GATE_MAIN", "GROUND_OUTDOOR"},
                {"BLOCK_ADMIN", "LIBRARY_CENTRAL"},
                {"BLOCK_ARYABHATA", "SPORTS_INDOOR"},
                {"BUS_BAY", "HOSTEL_GIRLS"},
                {"LAB_COMPUTING", "AUDITORIUM"},
                {"HOSTEL_BOYS_B", "GATE_MAIN"}
        };

        for (String[] pair : pairs) {
            String origin = pair[0];
            String destination = pair[1];

            // Test DISTANCE metric
            PathResult dijkstraDist = graphService.computeRoute(origin, destination, MetricType.DISTANCE, "Dijkstra", false);
            PathResult aStarDist = graphService.computeRoute(origin, destination, MetricType.DISTANCE, "A*", false);

            assertTrue(dijkstraDist.isFound(), "Dijkstra must find path for " + origin + " -> " + destination);
            assertTrue(aStarDist.isFound(), "A* must find path for " + origin + " -> " + destination);

            assertEquals(dijkstraDist.getTotalCost(), aStarDist.getTotalCost(), 0.01,
                    "Optimal distance must match exactly for " + origin + " -> " + destination);

            // Test TIME metric
            PathResult dijkstraTime = graphService.computeRoute(origin, destination, MetricType.TIME, "Dijkstra", false);
            PathResult aStarTime = graphService.computeRoute(origin, destination, MetricType.TIME, "A*", false);

            assertEquals(dijkstraTime.getTotalCost(), aStarTime.getTotalCost(), 0.01,
                    "Optimal time must match exactly for " + origin + " -> " + destination);
        }
    }
}
