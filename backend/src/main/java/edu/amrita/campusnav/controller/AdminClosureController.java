package edu.amrita.campusnav.controller;

import edu.amrita.campusnav.dto.ClosureRequest;
import edu.amrita.campusnav.model.WalkabilityStatus;
import edu.amrita.campusnav.service.CampusGraphService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminClosureController {

    private final CampusGraphService graphService;

    @Value("${campus.admin.api-key:amrita-admin-secure-2026}")
    private String configuredAdminKey;

    public AdminClosureController(CampusGraphService graphService) {
        this.graphService = graphService;
    }

    private boolean isAuthorized(String headerKey) {
        return headerKey != null && headerKey.equals(configuredAdminKey);
    }

    @GetMapping("/closures")
    public ResponseEntity<?> getActiveClosures(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        if (!isAuthorized(adminKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("error", "Unauthorized: Valid X-Admin-Key header required."));
        }
        return ResponseEntity.ok(graphService.getDynamicClosures());
    }

    @PostMapping("/closures")
    public ResponseEntity<?> updateEdgeClosure(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestBody ClosureRequest request) {

        if (!isAuthorized(adminKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("error", "Unauthorized: Valid X-Admin-Key header required."));
        }

        if (request.getEdgeId() == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "edgeId is required."));
        }

        WalkabilityStatus status = request.getStatus() != null ? request.getStatus() : WalkabilityStatus.TEMPORARILY_CLOSED;
        boolean updated = graphService.setEdgeClosure(request.getEdgeId(), status);

        if (!updated) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Edge not found: " + request.getEdgeId()));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Edge " + request.getEdgeId() + " status updated to " + status,
                "edgeId", request.getEdgeId(),
                "status", status
        ));
    }

    @DeleteMapping("/closures/{edgeId}")
    public ResponseEntity<?> reopenEdge(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable String edgeId) {

        if (!isAuthorized(adminKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("error", "Unauthorized: Valid X-Admin-Key header required."));
        }

        boolean reopened = graphService.reopenEdge(edgeId);
        if (!reopened) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Edge not found: " + edgeId));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Edge " + edgeId + " has been reopened for pedestrian transit.",
                "edgeId", edgeId,
                "status", WalkabilityStatus.OPEN
        ));
    }
}
