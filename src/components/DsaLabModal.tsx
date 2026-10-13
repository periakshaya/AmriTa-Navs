import React, { useState, useEffect } from 'react';
import { CampusVertex, MetricType, BenchmarkResult } from '../types/campus';
import {
  Sparkles,
  BarChart3,
  Code2,
  CheckCircle2,
  Play,
  FileText,
  HelpCircle,
  X,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';

interface DsaLabModalProps {
  vertices: CampusVertex[];
  onClose: () => void;
}

export const DsaLabModal: React.FC<DsaLabModalProps> = ({ vertices, onClose }) => {
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'junit' | 'javaCode' | 'report' | 'viva'>('benchmarks');
  const [originId, setOriginId] = useState<string>('GATE_MAIN');
  const [destId, setDestId] = useState<string>('CANTEEN_FOODCOURT');
  const [metric, setMetric] = useState<MetricType>('DISTANCE');
  const [iterations, setIterations] = useState<number>(50);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);

  // JUnit Test Execution State
  const [junitRunning, setJunitRunning] = useState(false);
  const [junitOutput, setJunitOutput] = useState<string | null>(null);
  const [junitPassed, setJunitPassed] = useState<boolean | null>(null);

  // Java Code State
  const [javaFiles, setJavaFiles] = useState<{ path: string; name: string; content: string }[]>([]);
  const [selectedJavaFile, setSelectedJavaFile] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/system/java-sources')
      .then((res) => res.json())
      .then((data) => {
        const combined = [...(data.mainSources || []), ...(data.testSources || [])];
        if (data.pomXml) {
          combined.unshift({ path: 'pom.xml', name: 'pom.xml', content: data.pomXml });
        }
        setJavaFiles(combined);
        if (combined.length > 0) {
          const defaultFile = combined.find((f) => f.name === 'AStarRouter.java') || combined[0];
          setSelectedJavaFile(defaultFile.path);
        }
      })
      .catch((err) => console.error('Failed to load Java sources:', err));
  }, []);

  const runBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await fetch('/api/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originId,
          destinationId: destId,
          metric,
          iterations,
        }),
      });
      const data = await res.json();
      setBenchmarkResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setBenchmarking(false);
    }
  };

  const runJunitTests = async () => {
    setJunitRunning(true);
    setJunitOutput('Executing `mvn -f backend/pom.xml test` on Java 17 Spring Boot runtime...\n');
    try {
      const res = await fetch('/api/system/run-junit', { method: 'POST' });
      const data = await res.json();
      setJunitOutput(data.output || 'No output returned');
      setJunitPassed(data.success);
    } catch (err: any) {
      setJunitOutput('Error invoking test runner: ' + err.message);
      setJunitPassed(false);
    } finally {
      setJunitRunning(false);
    }
  };

  const selectedFileObj = javaFiles.find((f) => f.path === selectedJavaFile);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header & Tab Navigation */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600/30 border border-sky-500/60 flex items-center justify-center text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">DSA Capstone Diagnostics & Evaluation Lab</h2>
              <p className="text-[11px] text-slate-400">Amrita Vishwa Vidyapeetham, Chennai · Graph Algorithms</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('benchmarks')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'benchmarks' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Benchmark Suite
              </button>
              <button
                onClick={() => setActiveTab('junit')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'junit' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                JUnit 5 Tests
              </button>
              <button
                onClick={() => setActiveTab('javaCode')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'javaCode' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Java 17 Source Code
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'report' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Academic Report
              </button>
              <button
                onClick={() => setActiveTab('viva')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'viva' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Viva Q&A
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {/* TAB 1: BENCHMARKS */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-5">
              {/* Controls */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-4">
                <div className="font-bold text-slate-200">
                  Run Empirical Side-by-Side Algorithm Benchmark
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Origin Vertex</label>
                    <select
                      value={originId}
                      onChange={(e) => setOriginId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                    >
                      {vertices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Destination Vertex</label>
                    <select
                      value={destId}
                      onChange={(e) => setDestId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                    >
                      {vertices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Cost Metric</label>
                    <select
                      value={metric}
                      onChange={(e) => setMetric(e.target.value as MetricType)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                    >
                      <option value="DISTANCE">Shortest Distance (metres)</option>
                      <option value="TIME">Fastest Time (seconds)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Iterations</label>
                    <select
                      value={iterations}
                      onChange={(e) => setIterations(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                    >
                      <option value="25">25 iterations</option>
                      <option value="50">50 iterations</option>
                      <option value="100">100 iterations</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={runBenchmark}
                  disabled={benchmarking}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-sky-600/30 flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{benchmarking ? 'Benchmarking in Progress...' : 'Execute Benchmark'}</span>
                </button>
              </div>

              {/* Benchmark Results Display */}
              {benchmarkResult && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      benchmarkResult.costsMatch
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                        : 'bg-red-950/40 border-red-800 text-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{benchmarkResult.conclusion}</span>
                    </div>
                    <div className="font-mono text-[11px]">
                      Optimal Cost: {benchmarkResult.dijkstraCost.toFixed(1)} {metric === 'TIME' ? 's' : 'm'}
                    </div>
                  </div>

                  {/* Side-by-Side Comparison Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dijkstra Card */}
                    <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-100 text-sm">Dijkstra's Algorithm</div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                          Uniform Baseline
                        </span>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-700/80">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Path Cost:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {benchmarkResult.dijkstraCost.toFixed(2)} {metric === 'TIME' ? 's' : 'm'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Nodes Expanded:</span>
                          <span className="font-mono font-bold text-amber-300">
                            {benchmarkResult.dijkstraNodesExpanded} nodes
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Edges Processed:</span>
                          <span className="font-mono text-slate-200">
                            {benchmarkResult.dijkstraEdgesProcessed}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Avg Execution Time:</span>
                          <span className="font-mono text-slate-200">
                            {benchmarkResult.dijkstraAvgTimeMicros.toFixed(1)} µs
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Path Hops:</span>
                          <span className="font-mono text-slate-200">
                            {benchmarkResult.dijkstraHopCount} edges
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* A* Card */}
                    <div className="p-4 bg-slate-800/80 rounded-2xl border border-sky-500/50 shadow-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sky-400 text-sm">A* Search (Haversine Heuristic)</div>
                        <span className="text-[10px] font-mono text-sky-300 bg-sky-950 px-2 py-0.5 rounded">
                          Goal-Directed
                        </span>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-700/80">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Path Cost:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {benchmarkResult.aStarCost.toFixed(2)} {metric === 'TIME' ? 's' : 'm'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Nodes Expanded:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {benchmarkResult.aStarNodesExpanded} nodes
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Edges Processed:</span>
                          <span className="font-mono text-slate-200">
                            {benchmarkResult.aStarEdgesProcessed}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Avg Execution Time:</span>
                          <span className="font-mono text-slate-200">
                            {benchmarkResult.aStarAvgTimeMicros.toFixed(1)} µs
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Pruning Efficiency:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {benchmarkResult.nodeExpansionReductionPercent.toFixed(1)}% fewer expansions
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: JUNIT 5 TESTS */}
          {activeTab === 'junit' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-200">Automated Java JUnit 5 Test Suite</div>
                  <p className="text-[11px] text-slate-400">
                    Runs 14 verified unit & equivalence test suites across Dijkstra, A*, Closures, and Graph Validator.
                  </p>
                </div>
                <button
                  onClick={runJunitTests}
                  disabled={junitRunning}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{junitRunning ? 'Running Maven Tests...' : 'Run All 14 JUnit Tests'}</span>
                </button>
              </div>

              {junitPassed !== null && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 font-bold ${
                    junitPassed
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/60 border-red-800 text-red-300'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>
                    {junitPassed
                      ? 'BUILD SUCCESS: 14 of 14 JUnit 5 tests passed with 0 failures and 0 errors.'
                      : 'BUILD FAILED: Tests encountered errors.'}
                  </span>
                </div>
              )}

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-300 h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {junitOutput ||
                  'Click "Run All 14 JUnit Tests" above to execute `mvn test` directly on the Java 17 backend and stream terminal results.'}
              </div>
            </div>
          )}

          {/* TAB 3: JAVA SOURCE INSPECTOR */}
          {activeTab === 'javaCode' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
              {/* File List */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1 h-96 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-400 mb-2 px-2 uppercase tracking-wider">
                  Project Files
                </div>
                {javaFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedJavaFile(file.path)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate transition-colors ${
                      selectedJavaFile === file.path
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {file.name}
                  </button>
                ))}
              </div>

              {/* Code Viewer */}
              <div className="md:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col h-96 overflow-hidden">
                <div className="text-xs font-mono text-sky-400 pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>{selectedFileObj?.path || 'No file selected'}</span>
                  <span className="text-slate-500 text-[10px]">Java 17 / Spring Boot</span>
                </div>
                <pre className="flex-1 overflow-y-auto mt-2 font-mono text-[11px] text-slate-300 whitespace-pre leading-relaxed select-text">
                  {selectedFileObj?.content || '// Select a file on the left to inspect its source code.'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: ACADEMIC CAPSTONE REPORT */}
          {activeTab === 'report' && (
            <div className="space-y-5 text-slate-300 max-w-4xl mx-auto leading-relaxed">
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/60">
                <h3 className="text-base font-bold text-white mb-1">
                  Amrita Campus Pedestrian Routing — DSA Capstone Academic Report
                </h3>
                <p className="text-xs text-sky-400">
                  Amrita Vishwa Vidyapeetham, Chennai Campus · Department of Computer Science & Engineering
                </p>
              </div>

              <div className="space-y-4">
                <section className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-sky-400">1.</span> Graph Representation & Space Complexity
                  </h4>
                  <p>
                    The pedestrian network is modeled as a weighted directed graph G = (V, E), represented using
                    an <strong>Adjacency List</strong> (Map&lt;String, List&lt;CampusEdge&gt;&gt;).
                    Compared to an adjacency matrix requiring O(|V|²) space, the adjacency list requires
                    O(|V| + |E|) space, which is optimal for planar, sparse pedestrian walkways where the
                    average vertex degree d_avg ≈ 2.6 &lt;&lt; |V|.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-sky-400">2.</span> Dijkstra's Algorithm Correctness & Complexity
                  </h4>
                  <p>
                    Dijkstra's algorithm is implemented with a binary min-heap (PriorityQueue) maintaining non-negative
                    edge weights (w(u, v) &ge; 0). At each iteration, the unvisited vertex with minimal tentative
                    distance is extracted. By induction on visited set size, distances are guaranteed optimal upon extraction.
                    Time complexity is O((|V| + |E|) log |V|) and space complexity is O(|V|).
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-sky-400">3.</span> A* Heuristic Admissibility & Consistency
                  </h4>
                  <p>
                    A* guides search exploration using an evaluation function f(u) = g(u) + h(u).
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Distance Metric (h_dist):</strong> Great-Circle Haversine straight-line distance
                      between GPS coordinates. By the triangle inequality on a spherical surface, straight-line distance
                      is strictly &le; ground walkway path distance, ensuring h(u) &le; h*(u) (Admissible) and
                      h(u) &le; c(u, v) + h(v) (Monotonic / Consistent).
                    </li>
                    <li>
                      <strong>Time Metric (h_time):</strong> Straight-line distance scaled by upper-bound pedestrian
                      velocity v_max = 1.6 m/s: h_time(u) = h_dist(u) / 1.6. Because human walking speed
                      never exceeds v_max, estimated time never overestimates true travel duration.
                    </li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-sky-400">4.</span> Why Breadth-First Search (BFS) is Inadequate
                  </h4>
                  <p>
                    BFS explores level by level, finding paths with the <em>minimum number of edges (hops)</em>. In real
                    campus networks, an unpaved detour with 2 long segments (e.g. 2 × 300m = 600m)
                    would be incorrectly preferred over a direct route having 3 short segments (3 × 40m = 120m).
                    BFS is strictly valid only when all edge weights are uniform (w = 1).
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 5: VIVA QUESTIONS & ANSWERS */}
          {activeTab === 'viva' && (
            <div className="space-y-4 max-w-4xl mx-auto text-slate-300">
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/60 mb-4">
                <h3 className="text-base font-bold text-white mb-1">
                  Capstone Viva Voce Defence & Faculty Interview Guide
                </h3>
                <p className="text-xs text-sky-400">
                  Key conceptual questions, rigorous mathematical proofs, and architectural justifications.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="font-bold text-sky-300 text-xs mb-1">
                    Q1: How do you mathematically guarantee that A* finds the optimal shortest path?
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    A: By ensuring the heuristic function $h(u)$ is <strong>admissible</strong> ($h(u) \le h^*(u)$, never
                    overestimating true cost) and <strong>consistent</strong> ($h(u) \le c(u, v) + h(v)$). We prove this
                    using the Haversine great-circle distance between GPS coordinates: because the straight line is the
                    geodesic shortest line between two points on the sphere, no physical pedestrian walkway can be shorter
                    than the Haversine distance.
                  </p>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="font-bold text-sky-300 text-xs mb-1">
                    Q2: When would Dijkstra outperform A*?
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    A: Dijkstra outperforms A* in multi-target or one-to-all scenarios (e.g., finding the nearest water
                    cooler or ATM from a given point), because Dijkstra radiates uniformly. Furthermore, on dense graphs
                    where the heuristic evaluates poorly or when trigonometric computation overhead ($atan2$, $\sin$, $\cos$)
                    exceeds priority queue extraction savings, Dijkstra has lower constant factors.
                  </p>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="font-bold text-sky-300 text-xs mb-1">
                    Q3: How does your dynamic edge closure mechanism work without re-indexing all coordinates?
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    A: We maintain an immutable copy of the original graph edges alongside a thread-safe
                    $dynamicClosures$ map. When an administrator marks a path closed, the adjacency list skips edges
                    having non-OPEN statuses during traversal. Reopening an edge restores its original traversability
                    without modifying node geometry.
                  </p>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="font-bold text-sky-300 text-xs mb-1">
                    Q4: How is GPS noise handled when snapping a user to the graph?
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    A: Raw browser geolocation has an accuracy radius of 10–30m. We implement a confidence threshold:
                    positions farther than 350m from campus bounds are not automatically snapped. For nearby coordinates,
                    we snap to the nearest walkable vertex and maintain a 25m off-route tolerance before triggering an
                    automatic re-computation to avoid thrashing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
