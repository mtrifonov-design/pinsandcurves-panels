import Delaunator from 'delaunator';

const interior = [
  {x:-0.5, y:-0.2, psi: -0.3},
  {x: 0.3, y:-0.1, psi: -0.5},
  {x:-0.1, y: 0.4, psi:-0.2},
  {x: 0.5, y: 0.5, psi: -.4},
  {x:-0.6, y: 0.6, psi:-0.1}
];

// four boundary corners (fixed height 0)
const boundary = [
  {x:-1, y:-1, psi:-1, dir:true},
  {x: 1, y:-1, psi:-1, dir:true},
  {x: 1, y: 1, psi:-1, dir:true},
  {x:-1, y: 1, psi:-1, dir:true}
];

const MAX_ITERS = 100;
const TOL       = 1e-4;
let BODY_FORCE = -1;           // gravity load f_i = BODY_FORCE

/* ---------- 1. CORE LOGIC ------------------------------- */

function buildProblem(nodes, triangles) {
  const n = nodes.length;
  const A = Array.from({length:n}, _=>Array(n).fill(0));
  const f = Array(n).fill(BODY_FORCE);

  // --- assemble stiffness matrix (linear FEM, P1) ----------
  for (let t=0; t<triangles.length; t+=3) {
    const i = triangles[t], j = triangles[t+1], k = triangles[t+2];
    const Pi = nodes[i], Pj = nodes[j], Pk = nodes[k];

    // edge vectors
    const v0 = [Pj.x - Pi.x, Pj.y - Pi.y];
    const v1 = [Pk.x - Pi.x, Pk.y - Pi.y];

    const det = v0[0]*v1[1] - v0[1]*v1[0];
    const area = Math.abs(det) * 0.5;

    // gradients of basis fns: ∇φ_i etc.  (formulas for P1)
    const grad = [
      [(Pj.y - Pk.y)/(2*area), (Pk.x - Pj.x)/(2*area)], // ∇φ_i
      [(Pk.y - Pi.y)/(2*area), (Pi.x - Pk.x)/(2*area)], // ∇φ_j
      [(Pi.y - Pj.y)/(2*area), (Pj.x - Pi.x)/(2*area)]  // ∇φ_k
    ];
    const idx = [i,j,k];

    // local 3×3 contribution
    for (let a=0; a<3; ++a){
      for (let b=0; b<3; ++b){
        const val = area * (grad[a][0]*grad[b][0] + grad[a][1]*grad[b][1]);
        A[idx[a]][idx[b]] += val;
      }
    }

    // load vector: ∫ f φ_i ≈ f_i * area/3  (constant body force)
    for (let a=0; a<3; ++a){
      f[idx[a]] += BODY_FORCE * area / 3;
    }
  }
  return {A, f};
}

// Projected Gauss-Seidel
function solveObstacle(A, f, nodes) {
  const n = nodes.length;
  const u = Array(n).fill(0);          // start at zero sheet

  for (let it=0; it<MAX_ITERS; ++it) {
    let maxDiff = 0;

    for (let i=0; i<n; ++i) {
      if (nodes[i].dir) continue;      // Dirichlet nodes stay 0

      // Gauss-Seidel row relaxation
      let sum = 0;
      for (let j=0; j<n; ++j) if (j!==i) sum += A[i][j]*u[j];

      const uiTemp = (f[i] - sum) / A[i][i];
      const uiNew  = Math.max(uiTemp, nodes[i].psi);   // projection

      maxDiff = Math.max(maxDiff, Math.abs(uiNew - u[i]));
      u[i] = uiNew;
    }

    if (maxDiff < TOL) break;
  }
  return u;
}

// --- Build triangulation & solve once ----------------------
let nodes = boundary.concat(interior.map(p=>({...p, dir:false})));
let tri, heights;

function setupProblem() {
  const pts = nodes.map(p=>[p.x, p.y]);
  tri = Delaunator.from(pts).triangles;          // Uint32Array
  const {A, f} = buildProblem(nodes, tri);
  return solveObstacle(A, f, nodes);
}


interface ObstacleProblemParams {
    nodes: {x: number, y: number, psi: number, dir?: boolean}[];
    force: number;
}

type ObstacleProblemReturn = {x: number, y: number, height: number}[];



export default function obstacleProblem(p: ObstacleProblemParams) : ObstacleProblemReturn {
    // Update nodes with new parameters
    nodes = p.nodes.map(n => ({...n, dir: n.dir ?? false}));
    BODY_FORCE = p.force;

    // Rebuild triangulation and solve
    const heights = setupProblem();

    // Return heights at each node
    return nodes.map((n, i) => ({
        x: n.x,
        y: n.y,
        height: heights[i]
    }));

}