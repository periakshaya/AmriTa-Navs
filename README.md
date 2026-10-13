# Amrita Campus Navigator — DSA Capstone Project
**Amrita Vishwa Vidyapeetham, Chennai Campus (Vengal, Thiruvallur District, Tamil Nadu, India)**

A complete, production-grade pedestrian routing and navigation system built as a Data Structures & Algorithms (DSA) Capstone. Calculates optimal pedestrian routes across verified campus locations using self-implemented graph algorithms with educational transparency and a Google Maps-inspired interactive Leaflet interface.

---

## 1. Architecture Overview & Tech Stack

```
                          ┌─────────────────────────────────────┐
                          │    Frontend (Leaflet + React + TS)  │
                          │   • Interactive Map & Tile Layers   │
                          │   • GPS / Walk Simulation Engine    │
                          │   • Turn-by-Turn Navigation HUD     │
                          │   • DSA Lab & Empirical Benchmarks  │
                          └──────────────────┬──────────────────┘
                                             │ HTTP REST / JSON
                                             ▼
                          ┌─────────────────────────────────────┐
                          │   Full-Stack Gateway / Server.ts    │
                          │   • Express REST Controller         │
                          │   • JIT Graph Execution Engine      │
                          │   • Live JUnit Test Invoker         │
                          └──────────────────┬──────────────────┘
                                             │
                                             ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                 Backend: Java 17 + Spring Boot + Maven                      │
  │                                                                             │
  │  • Graph: Adjacency List (Map<String, List<CampusEdge>>)                    │
  │  • Algorithms:                                                              │
  │      - DijkstraRouter: PriorityQueue<NodeRecord>, non-negative weights      │
  │      - AStarRouter: f(u)=g(u)+h(u) with Admissible Haversine Heuristic      │
  │      - BfsReachabilityChecker: Component connectivity & isolated node audit │
  │      - Dynamic Closures: Non-destructive walkability state toggling         │
  │  • Testing: 14 JUnit 5 test suites (Equivalence, Validation, Detours)       │
  └─────────────────────────────────────────────────────────────────────────────┘
```

- **Backend:** Java 17, Spring Boot 3.2.5, Maven 3.8.7.
- **Algorithms:** PriorityQueue-based Dijkstra's Algorithm, A* Search (admissible & monotonic Great-Circle Haversine lower bound), BFS reachability.
- **Frontend:** Leaflet 1.9, OpenStreetMap tiles, Tailwind CSS, Lucide icons, Motion.
- **Data:** Version-controlled JSON dataset (`amrita-chennai-campus.json`) with 28 vertices and 37 calibrated pedestrian edges.

---

## 2. Directory Structure

```
├── backend/                                  # Java 17 Spring Boot Backend
│   ├── pom.xml                               # Maven project descriptor & plugins
│   └── src/
│       ├── main/
│       │   ├── java/edu/amrita/campusnav/
│       │   │   ├── CampusNavigationApplication.java
│       │   │   ├── controller/
│       │   │   │   ├── CampusController.java      # GET /api/locations, POST /api/routes, etc.
│       │   │   │   └── AdminClosureController.java # X-Admin-Key protected closure endpoints
│       │   │   ├── dto/
│       │   │   │   ├── RouteRequest.java, RouteResponse.java
│       │   │   │   ├── BenchmarkRequest.java, BenchmarkResult.java
│       │   │   │   ├── ClosureRequest.java, ValidationReport.java
│       │   │   ├── model/
│       │   │   │   ├── CampusVertex.java, CampusEdge.java
│       │   │   │   ├── LocationType.java, MetricType.java, WalkabilityStatus.java
│       │   │   │   └── PathResult.java
│       │   │   ├── service/
│       │   │   │   ├── CampusGraphService.java    # Stateful graph & dynamic closure manager
│       │   │   │   ├── DijkstraRouter.java        # O((V+E) log V) Dijkstra implementation
│       │   │   │   ├── AStarRouter.java           # Admissible A* with Haversine heuristic
│       │   │   │   ├── BfsReachabilityChecker.java # Graph connected components & reachability
│       │   │   │   ├── BenchmarkService.java      # Empirical execution timing & node comparison
│       │   │   │   └── CampusDataValidator.java   # Dataset schema & negative-weight auditor
│       │   │   └── util/
│       │   │       └── GeoUtils.java              # Haversine formula & turn bearings
│       │   └── resources/
│       │       ├── application.properties
│       │       └── data/
│       │           └── amrita-chennai-campus.json # Verified campus graph dataset
│       └── test/java/edu/amrita/campusnav/
│           ├── DijkstraRouterTest.java            # 6 tests (direct, multi-hop, stairs, etc.)
│           ├── AStarRouterTest.java               # 3 tests (heuristic admissibility, time metric)
│           ├── AlgorithmEquivalenceTest.java      # Verifies Dijkstra & A* return identical cost
│           ├── DynamicClosureTest.java            # Edge closure & automated detour verification
│           └── CampusDataValidatorTest.java       # Duplicate IDs & negative-weight validations
├── src/                                      # Interactive Web Application
│   ├── components/
│   │   ├── CampusMap.tsx                      # Leaflet map, polyline paths, user GPS pulse
│   │   ├── RouteSidebar.tsx                   # Search autocomplete, metric toggles, directions
│   │   ├── NavigationBanner.tsx               # Active turn-by-turn HUD & simulation walker
│   │   ├── AdminClosureModal.tsx              # Maintenance closure manager with API key
│   │   ├── DsaLabModal.tsx                    # Benchmark suite, JUnit test runner, Java code inspector
│   │   ├── CampusDirectoryModal.tsx           # Category browser for all 28 campus landmarks
│   │   └── DataValidationModal.tsx            # Schema audit and GPS surveying documentation
│   ├── data/
│   │   └── amrita-chennai-campus.json         # Campus dataset mirror
│   ├── services/
│   │   └── graphEngine.ts                     # In-browser JIT graph engine with identical algorithms
│   ├── types/
│   │   └── campus.ts                          # Shared TypeScript types
│   ├── App.tsx                                # Main application controller
│   └── index.css                              # Tailwind CSS & map layers
├── server.ts                                  # Full-stack dev/prod server mounting REST API & Vite
├── package.json
└── tsconfig.json
```

---

## 3. Core Graph & Shortest-Path Implementations

### A. Adjacency List Representation
- Vertices are indexed in a hash map `Map<String, CampusVertex>` for $\mathcal{O}(1)$ lookups.
- Directed and bidirectional edges are stored in `Map<String, List<CampusEdge>>`.
- Space complexity is $\mathcal{O}(|V| + |E|)$.

### B. Dijkstra's Algorithm (`DijkstraRouter.java`)
- Min-priority queue: `PriorityQueue<NodeRecord>` prioritized by tentative distance.
- Strictly validates non-negative edge weights ($w \ge 0$).
- Tracks `predecessorNode` and `predecessorEdge` to reconstruct optimal route vertices and generate bearing-based turn instructions.

### C. A* Search (`AStarRouter.java`)
- Evaluation function: $f(u) = g(u) + h(u)$.
- **Distance Metric:** Great-circle Haversine straight-line distance:
  $$h_{dist}(u) = 2 R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1\cos\phi_2\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
  Because straight-line geodesic distance is the physical lower bound for any ground path, $h(u) \le h^*(u)$ is **strictly admissible** and **monotonic/consistent**.
- **Time Metric:** Scaled lower bound using upper-bound pedestrian velocity $v_{max} = 1.6\text{ m/s}$:
  $$h_{time}(u) = \frac{h_{dist}(u)}{v_{max}}$$
  Guaranteed never to overestimate the true travel time in seconds.

### D. Dynamic Closures
- The administrator can flag any edge as `TEMPORARILY_CLOSED` or `MAINTENANCE`.
- Traversal checks `edge.isTraversable(wheelchairOnly)` at runtime.
- Preserves the original edge weights and geometries so reopenings are lossless.

---

## 4. REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/locations` | Returns all 28 campus vertices with GPS coordinates and metadata. |
| `GET` | `/api/locations/search?q=` | Search locations by name, department, or keyword. |
| `GET` | `/api/locations/{id}` | Retrieve single campus vertex by ID. |
| `GET` | `/api/edges` | Returns all pedestrian edge connections. |
| `POST` | `/api/routes` | Computes optimal route given `{originId, destinationId, metric, algorithm, wheelchairOnly}`. |
| `GET` | `/api/nearest` | Multi-source Dijkstra to locate nearest facility of a given `LocationType`. |
| `GET` | `/api/graph/statistics` | Active graph size, component count, and closures. |
| `POST` | `/api/benchmarks` | Runs side-by-side benchmark between Dijkstra and A*. |
| `GET` | `/api/admin/closures` | List active closures (Requires `X-Admin-Key` header). |
| `POST` | `/api/admin/closures` | Set temporary closure on an edge (Requires `X-Admin-Key` header). |
| `DELETE` | `/api/admin/closures/{edgeId}` | Reopen a closed edge (Requires `X-Admin-Key` header). |
| `POST` | `/api/system/run-junit` | Executes `mvn test` and returns terminal output. |
| `GET` | `/api/system/java-sources` | Returns all Java source files and pom.xml for academic code inspection. |

---

## 5. How to Run Locally

### Running the Web Application
```bash
# 1. Install dependencies
npm install

# 2. Start full-stack application on port 3000
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Java Backend with Maven
```bash
# 1. Navigate to backend directory
cd backend

# 2. Compile and run all 14 JUnit 5 tests
mvn test

# 3. Start Spring Boot standalone service (Port 8080)
mvn spring-boot:run
```

---

## 6. Testing & Verification Summary

The project includes 14 comprehensive automated JUnit 5 tests in `backend/src/test/java/edu/amrita/campusnav/`:

1. `DijkstraRouterTest`:
   - `testDirectShortestRoute`: Gate 1 to North Plaza direct edge cost (80m).
   - `testOriginEqualsDestination`: 0 cost identity handling.
   - `testOptimalMultiHopRoute`: Multi-hop path finding across campus.
   - `testDisconnectedVertex`: Unreachable node handling.
   - `testInvalidLocations`: Graceful error responses for non-existent IDs.
   - `testWheelchairAccessibleRouting`: Excludes stair edges for wheelchair queries.
2. `AStarRouterTest`:
   - `testAStarGateToLibrary`: Optimal path calculation.
   - `testHeuristicAdmissibility`: Verifies $h(u) \le \text{dist}^*(u)$.
   - `testAStarTimeMetric`: Correct derivation of duration in seconds.
3. `AlgorithmEquivalenceTest`:
   - `testOptimalCostEquivalenceAcrossPairs`: Proves Dijkstra and A* return identical path costs across 8 diverse campus OD pairs for both distance and time metrics.
4. `DynamicClosureTest`:
   - `testDynamicClosureAndReroute`: Dynamic closure forces detour, reopening restores direct path.
5. `CampusDataValidatorTest`:
   - `testDetectDuplicateVertices`: Detects duplicate IDs.
   - `testDetectNegativeWeightEdge`: Rejects negative edge weights.
   - `testDetectIsolatedVertex`: Detects disconnected 0-degree vertices.

---

## 7. Capstone Viva Q&A Guide

**Q1: Why is A* with Haversine heuristic guaranteed to find the optimal shortest path?**
*Answer:* A* is guaranteed optimal if the heuristic $h(u)$ is admissible and consistent. Because straight-line distance on a sphere (Haversine formula) is the geodesic lower bound, no physical walking path can be shorter than the straight-line distance between two coordinates. Hence $h(u) \le h^*(u)$.

**Q2: Why not use Breadth-First Search (BFS) for campus navigation?**
*Answer:* BFS finds the minimum number of edge hops, ignoring edge weights. In a campus graph, a path with 2 long edges (e.g., $2 \times 250\text{m} = 500\text{m}$) would be chosen by BFS over a path with 3 short edges ($3 \times 40\text{m} = 120\text{m}$), producing suboptimal routes. BFS is only optimal when all edge weights are uniform ($w = 1$).

**Q3: How are temporary closures handled in the graph?**
*Answer:* The application implements non-destructive dynamic edge filtering. Original graph topology and geometry remain untouched in an immutable registry while an active closure set tracks restricted edges. During priority queue relaxation, traversability is verified in $\mathcal{O}(1)$ time.
