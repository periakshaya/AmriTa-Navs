package edu.amrita.campusnav;

import edu.amrita.campusnav.dto.ValidationReport;
import edu.amrita.campusnav.model.*;
import edu.amrita.campusnav.service.CampusDataValidator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class CampusDataValidatorTest {

    @Test
    @DisplayName("Validator must detect duplicate vertex IDs")
    public void testDetectDuplicateVertices() {
        List<CampusVertex> vertices = List.of(
                new CampusVertex("V1", "Node 1", LocationType.ACADEMIC, 13.224, 80.025, 28, true, "Desc 1"),
                new CampusVertex("V1", "Node 1 Duplicate", LocationType.ACADEMIC, 13.225, 80.026, 28, true, "Desc 2")
        );
        List<CampusEdge> edges = List.of();

        ValidationReport report = CampusDataValidator.validate(vertices, edges);
        assertFalse(report.isValid());
        assertTrue(report.getErrors().stream().anyMatch(e -> e.contains("Duplicate vertex IDs")));
    }

    @Test
    @DisplayName("Validator must detect edges with invalid or negative distance weights")
    public void testDetectNegativeWeightEdge() {
        List<CampusVertex> vertices = List.of(
                new CampusVertex("V1", "Node 1", LocationType.ACADEMIC, 13.224, 80.025, 28, true, "Desc 1"),
                new CampusVertex("V2", "Node 2", LocationType.ACADEMIC, 13.225, 80.026, 28, true, "Desc 2")
        );
        List<CampusEdge> edges = List.of(
                new CampusEdge("E1", "V1", "V2", -15.0, 10.0, WalkabilityStatus.OPEN, "PAVED", false, true, true, true, "Walk")
        );

        ValidationReport report = CampusDataValidator.validate(vertices, edges);
        assertFalse(report.isValid());
        assertTrue(report.getErrors().stream().anyMatch(e -> e.contains("non-positive distance weight")));
    }

    @Test
    @DisplayName("Validator must identify isolated vertices")
    public void testDetectIsolatedVertex() {
        List<CampusVertex> vertices = List.of(
                new CampusVertex("V1", "Connected 1", LocationType.ACADEMIC, 13.224, 80.025, 28, true, "Desc"),
                new CampusVertex("V2", "Connected 2", LocationType.ACADEMIC, 13.225, 80.026, 28, true, "Desc"),
                new CampusVertex("V_ISOLATED", "Lonely Tower", LocationType.SERVICES, 13.221, 80.022, 28, false, "Desc")
        );
        List<CampusEdge> edges = List.of(
                new CampusEdge("E1", "V1", "V2", 50.0, 40.0, WalkabilityStatus.OPEN, "PAVED", false, true, true, true, "Walk")
        );

        ValidationReport report = CampusDataValidator.validate(vertices, edges);
        assertTrue(report.getIsolatedVertices().contains("V_ISOLATED"));
    }
}
