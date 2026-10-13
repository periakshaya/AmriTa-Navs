export type LocationType =
  | 'ENTRANCE'
  | 'ACADEMIC'
  | 'LABORATORY'
  | 'LIBRARY'
  | 'HOSTEL'
  | 'DINING'
  | 'SPORTS'
  | 'HEALTH'
  | 'AMENITY'
  | 'RESIDENCE'
  | 'TRANSIT'
  | 'LANDMARK'
  | 'WALKWAY_JUNCTION'
  | 'SERVICES';

export type MetricType = 'DISTANCE' | 'TIME';
export type AlgorithmType = 'AStar' | 'Dijkstra';
export type WalkabilityStatus = 'OPEN' | 'TEMPORARILY_CLOSED' | 'MAINTENANCE' | 'RESTRICTED';

export interface CampusVertex {
  id: string;
  name: string;
  type: LocationType;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  accessible: boolean;
  description: string;
}

export interface CampusEdge {
  id: string;
  source: string;
  destination: string;
  distanceMeters: number;
  estimatedDurationSeconds: number;
  walkability: WalkabilityStatus;
  pathType: string;
  hasStairs: boolean;
  hasRamp: boolean;
  accessible: boolean;
  bidirectional: boolean;
  instruction?: string;
}

export interface CampusDataset {
  campus: {
    name: string;
    institutionCode: string;
    location: string;
    center: {
      latitude: number;
      longitude: number;
    };
    bounds: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    };
    dataSource: string;
    dataNotice: string;
    version: string;
    walkingSpeedMps: number;
  };
  vertices: CampusVertex[];
  edges: CampusEdge[];
}

export interface RouteResponse {
  success: boolean;
  algorithm: string;
  metric: MetricType;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  pathVertices: CampusVertex[];
  pathEdges: CampusEdge[];
  geometryCoordinates: [number, number][]; // [lat, lng]
  turnByTurnInstructions: string[];
  nodesExpanded: number;
  edgesProcessed: number;
  executionTimeMs: number;
  errorMessage?: string;
  alternativeRoute?: RouteResponse;
}

export interface BenchmarkResult {
  originId: string;
  destinationId: string;
  metric: MetricType;
  iterations: number;
  dijkstraCost: number;
  dijkstraAvgTimeMicros: number;
  dijkstraNodesExpanded: number;
  dijkstraEdgesProcessed: number;
  dijkstraHopCount: number;
  aStarCost: number;
  aStarAvgTimeMicros: number;
  aStarNodesExpanded: number;
  aStarEdgesProcessed: number;
  aStarHopCount: number;
  costsMatch: boolean;
  nodeExpansionReductionPercent: number;
  conclusion: string;
}

export interface GraphStatistics {
  campusName: string;
  notice: string;
  centerLatitude: number;
  centerLongitude: number;
  vertexCount: number;
  edgeCount: number;
  activeClosuresCount: number;
  openEdges: number;
  closedEdges: number;
  connectedComponents: number;
}
