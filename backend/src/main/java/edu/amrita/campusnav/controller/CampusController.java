package edu.amrita.campusnav.controller;

import edu.amrita.campusnav.dto.*;
import edu.amrita.campusnav.model.*;
import edu.amrita.campusnav.service.BenchmarkService;
import edu.amrita.campusnav.service.CampusGraphService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CampusController {

    private final CampusGraphService graphService;
    private final BenchmarkService benchmarkService;

    public CampusController(CampusGraphService graphService, BenchmarkService benchmarkService) {
        this.graphService = graphService;
        this.benchmarkService = benchmarkService;
    }

    @GetMapping("/locations")
    public List<CampusVertex> getAllLocations() {
        return graphService.getAllVertices();
    }

    @GetMapping("/locations/search")
    public List<CampusVertex> searchLocations(@RequestParam(value = "q", required = false) String query) {
        return graphService.searchVertices(query);
    }

    @GetMapping("/locations/{id}")
    public ResponseEntity<CampusVertex> getLocationById(@PathVariable String id) {
        CampusVertex vertex = graphService.getVertex(id);
        if (vertex == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(vertex);
    }

    @GetMapping("/edges")
    public List<CampusEdge> getAllEdges() {
        return graphService.getAllEdges();
    }

    @PostMapping("/routes")
    public ResponseEntity<RouteResponse> calculateRoute(@RequestBody RouteRequest request) {
        if (request.getOriginId() == null || request.getDestinationId() == null) {
            RouteResponse err = new RouteResponse();
            err.setSuccess(false);
            err.setErrorMessage("Both originId and destinationId are required.");
            return ResponseEntity.badRequest().body(err);
        }

        String algo = request.getAlgorithm() != null ? request.getAlgorithm() : "AStar";
        MetricType metric = request.getMetric() != null ? request.getMetric() : MetricType.DISTANCE;

        PathResult result = graphService.computeRoute(
                request.getOriginId(), request.getDestinationId(),
                metric, algo, request.isWheelchairOnly()
        );

        RouteResponse response = mapToResponse(result);

        // Calculate alternative route if requested (e.g., using alternative metric or algorithm)
        if (request.isReturnAlternatives() && result.isFound()) {
            MetricType altMetric = (metric == MetricType.DISTANCE) ? MetricType.TIME : MetricType.DISTANCE;
            PathResult altResult = graphService.computeRoute(
                    request.getOriginId(), request.getDestinationId(),
                    altMetric, algo, request.isWheelchairOnly()
            );
            if (altResult.isFound()) {
                response.setAlternativeRoute(mapToResponse(altResult));
            }
        }

        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/nearest")
    public ResponseEntity<?> findNearest(@RequestParam String originId,
                                        @RequestParam LocationType type,
                                        @RequestParam(defaultValue = "DISTANCE") MetricType metric,
                                        @RequestParam(defaultValue = "false") boolean wheelchairOnly) {
        CampusVertex nearest = graphService.findNearestFacility(originId, type, metric, wheelchairOnly);
        if (nearest == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "No reachable facility of type " + type + " found."));
        }
        return ResponseEntity.ok(nearest);
    }

    @GetMapping("/graph/statistics")
    public Map<String, Object> getStatistics() {
        return graphService.getGraphStatistics();
    }

    @PostMapping("/benchmarks")
    public ResponseEntity<BenchmarkResult> runBenchmark(@RequestBody BenchmarkRequest request) {
        if (request.getOriginId() == null || request.getDestinationId() == null) {
            return ResponseEntity.badRequest().build();
        }
        BenchmarkResult result = benchmarkService.runBenchmark(request);
        return ResponseEntity.ok(result);
    }

    private RouteResponse mapToResponse(PathResult result) {
        RouteResponse resp = new RouteResponse();
        resp.setSuccess(result.isFound());
        resp.setAlgorithm(result.getAlgorithm());
        resp.setMetric(result.getMetric());
        resp.setTotalDistanceMeters(result.getTotalDistanceMeters());
        resp.setTotalDurationSeconds(result.getTotalDurationSeconds());
        resp.setPathVertices(result.getPathVertices());
        resp.setPathEdges(result.getPathEdges());
        resp.setTurnByTurnInstructions(result.getInstructions());
        resp.setNodesExpanded(result.getNodesExpanded());
        resp.setEdgesProcessed(result.getEdgesProcessed());
        resp.setExecutionTimeMs(result.getExecutionTimeMs());
        resp.setErrorMessage(result.getErrorMessage());

        List<double[]> coords = new ArrayList<>();
        for (CampusVertex v : result.getPathVertices()) {
            coords.add(new double[]{v.getLatitude(), v.getLongitude()});
        }
        resp.setGeometryCoordinates(coords);

        return resp;
    }
}
