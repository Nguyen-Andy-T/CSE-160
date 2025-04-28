// asg2.js
"use strict";

// --- shaders ---
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

// --- globals ---
let canvas, gl;
let u_ModelMatrix, u_GlobalRotateMatrix, u_FragColor;
let g_globRotX = 0, g_globRotY = 0;
let g_upperLeg = 0, g_lowerLeg = 0, g_walkOn = false;
let g_headRot = 0;
// mouse‐drag state
let dragging = false, lastX = 0, lastY = 0;

// --- setup WebGL ---
function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) throw "WebGL init failed";
  gl.enable(gl.DEPTH_TEST);
}

function connectGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE))
    throw "Shader compile/link error";
  u_ModelMatrix        = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, "u_GlobalRotateMatrix");
  u_FragColor          = gl.getUniformLocation(gl.program, "u_FragColor");
}

// --- UI controls ---
function setupUI() {
  // Global rotation sliders
  document.getElementById("globalRotationSlider_x").oninput = e => {
    g_globRotX = +e.target.value;
    renderAll();
  };
  document.getElementById("globalRotationSlider_y").oninput = e => {
    g_globRotY = +e.target.value;
    renderAll();
  };

  // Leg joint sliders
  document.getElementById("legUpperSlider").oninput = e => {
    g_upperLeg = +e.target.value;
    renderAll();
  };
  document.getElementById("legLowerSlider").oninput = e => {
    g_lowerLeg = +e.target.value;
    renderAll();
  };
  document.getElementById("toggleWalkBtn").onclick = e => {
    g_walkOn = !g_walkOn;
    e.textContent = g_walkOn ? "Stop Walk" : "Start Walk";
  };

  // Head rotation slider
  document.getElementById("headRotationSlider").oninput = e => {
    g_headRot = +e.target.value;
    renderAll();
  };

  // Mouse drag for global rotation
  canvas.onmousedown = e => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  };
  canvas.onmouseup = () => {
    dragging = false;
  };
  canvas.onmousemove = e => {
    if (!dragging) return;
    const dx = e.clientX - lastX,
          dy = e.clientY - lastY;
    g_globRotY += dx * 0.5;
    g_globRotX += dy * 0.5;
    document.getElementById("globalRotationSlider_x").value = g_globRotX;
    document.getElementById("globalRotationSlider_y").value = g_globRotY;
    lastX = e.clientX;
    lastY = e.clientY;
    renderAll();
  };

  // Shift-click head poke
  canvas.onclick = e => {
    if (e.shiftKey) {
      g_headRot = 45;
      document.getElementById("headRotationSlider").value = 45;
      setTimeout(() => {
        g_headRot = 0;
        document.getElementById("headRotationSlider").value = 0;
        renderAll();
      }, 500);
    }
  };
}

// --- animation loop ---
let _t0 = performance.now();
function tick() {
  if (g_walkOn) {
    const t = (performance.now() - _t0) / 500;
    g_upperLeg = 30 * Math.sin(t);
    g_lowerLeg = 15 * Math.sin(t);
    document.getElementById("legUpperSlider").value = g_upperLeg;
    document.getElementById("legLowerSlider").value = g_lowerLeg;
  }
  renderAll();
  requestAnimationFrame(tick);
}

// --- render scene ---
function renderAll() {
  const tStart = performance.now();
  gl.clearColor(0.9, 0.9, 0.9, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Global rotation
  const G = new Matrix4()
    .rotate(g_globRotX, 1, 0, 0)
    .rotate(g_globRotY, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, G.elements);

  // Body (cephalothorax)
  gl.uniform4f(u_FragColor, 0.1, 0.1, 0.1, 1);
  const body = new Matrix4().scale(0.6, 0.2, 0.4);
  drawCube(gl, u_ModelMatrix, body);

  // Body eyes (red)
  gl.uniform4f(u_FragColor, 1, 0, 0, 1);
  [[-0.2, 0.15, 0.25], [0.2, 0.15, 0.25]].forEach(p =>
    drawCube(gl, u_ModelMatrix,
      new Matrix4(body).translate(...p).scale(0.05, 0.05, 0.05)
    )
  );

  // Abdomen
  gl.uniform4f(u_FragColor, 0.6, 0.3, 0.1, 1);
  const abdomen = new Matrix4()
    .translate(0, 0, -0.5)
    .scale(0.5, 0.25, 0.7);
  drawCube(gl, u_ModelMatrix, abdomen);

  // Head (enlarged)
  gl.uniform4f(u_FragColor, 0.6, 0.3, 0.1, 1);
  const head = new Matrix4(body)
    .translate(0, 0, 0.6)
    .rotate(g_headRot, 0, 1, 0)
    .scale(0.5, 0.5, 0.5);
  drawCube(gl, u_ModelMatrix, head);

  // Head eyes (enlarged)
  gl.uniform4f(u_FragColor, 1, 0, 1, 1);
  [[-0.1, 0.15, 0.6], [0.1, 0.15, 0.6]].forEach(p =>
    drawCube(gl, u_ModelMatrix,
      new Matrix4(head).translate(...p).scale(0.12, 0.1, 0.12)
    )
  );

  // Pedipalps
  gl.uniform4f(u_FragColor, 0.1, 0.1, 0.1, 1);
  [[-0.15, 0, 0.5], [0.15, 0, 0.5]].forEach(p => {
    const pal = new Matrix4(head)
      .translate(...p)
      .rotate(p[0] > 0 ? 30 : -30, 1, 0, 0)
      .translate(0, 0.1, 0)
      .scale(0.04, 0.15, 0.04);
    drawCube(gl, u_ModelMatrix, pal);
  });

  // Legs (3 segments)
  gl.uniform4f(u_FragColor, 0.1, 0.1, 0.1, 1);
  const legConfigs = [
    { pos: [-0.3, 0,  0.15], yaw:  45 },
    { pos: [-0.35,0,  0   ], yaw:  20 },
    { pos: [-0.35,0, -0.15], yaw: -20 },
    { pos: [-0.3, 0, -0.4 ], yaw: -45 },
    { pos: [ 0.3, 0,  0.15], yaw: -45 },
    { pos: [ 0.35,0,  0   ], yaw: -20 },
    { pos: [ 0.35,0, -0.15], yaw:  20 },
    { pos: [ 0.3, 0, -0.4 ], yaw:  45 },
  ];
  legConfigs.forEach(cfg => {
    const side = cfg.pos[0] > 0 ? -1 : 1;
    const U = new Matrix4()
      .translate(...cfg.pos)
      .rotate(cfg.yaw, 0, 1, 0)
      .translate(0, 0.15, 0)
      .rotate(side * g_upperLeg, 1, 0, 0)
      .translate(0, -0.15, 0)
      .scale(0.05, 0.3, 0.05);
    drawCube(gl, u_ModelMatrix, U);

    const M2 = new Matrix4(U)
      .translate(0, -1, 0)
      .rotate(side * g_lowerLeg, 1, 0, 0)
      .scale(1, 0.8, 1);
    drawCube(gl, u_ModelMatrix, M2);

    const T = new Matrix4(M2)
      .translate(0, -1, 0)
      .rotate(side * g_lowerLeg * 0.6, 1, 0, 0)
      .scale(1, 0.7, 1);
    drawCube(gl, u_ModelMatrix, T);
  });

  // Spinnerets
  gl.uniform4f(u_FragColor, 0.05, 0.05, 0.05, 1);
  [[-0.1, 0, -0.5], [0.1, 0, -0.5]].forEach(p =>
    drawCube(gl, u_ModelMatrix,
      new Matrix4(abdomen).translate(...p).scale(0.05, 0.05, 0.1)
    )
  );

  // Performance indicator
  const ms = performance.now() - tStart;
  document.getElementById("fpsCounter").textContent =
    `ms: ${ms.toFixed(1)}, fps: ${Math.floor(1000 / ms)}`;
}

// --- entrypoint ---
function main() {
  setupWebGL();
  connectGLSL();
  setupUI();
  initCubeVertexBuffer(gl);
  requestAnimationFrame(tick);
}
