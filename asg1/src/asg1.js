// Based on ColoredPoint.js (c) 2012 matsuda, extended to meet assignment criteria.

//--------------------------------------------------------------------------
// Vertex and Fragment Shader Programs
//--------------------------------------------------------------------------

var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`;

var FSHADER_SOURCE = `
  precision mediump float; 
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

//--------------------------------------------------------------------------
// Global Variables
//--------------------------------------------------------------------------

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

// Shape type constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global variables for UI selections
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10;
let g_selectedType = POINT;
let g_circleSegments = 8;

// Global array to hold all shapes
var g_shapesList = [];

//--------------------------------------------------------------------------
// WebGL Setup Functions
//--------------------------------------------------------------------------

function setupWebGL() {
  // Retrieve <canvas> element and create a WebGL context.
  canvas = document.getElementById('webgl');
  // Use preserveDrawingBuffer to help with debugging (e.g., flickering issues).
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  // Set clear color to black.
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function connectVariablesToGLSL() {
  // Initialize shaders.
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }
  // Get the storage location of the attribute a_Position.
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  // Get storage location of the uniform u_FragColor.
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  // Get storage location of the uniform u_Size.
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

//--------------------------------------------------------------------------
// UI Setup Function
//--------------------------------------------------------------------------

function addActionsForHtmlUI(){
  document.getElementById('green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
  document.getElementById('red').onclick   = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
  document.getElementById('clearButton').onclick = function() { 
    g_shapesList = []; 
    renderAllShapes(); 
    // Stop the flashing sun if it is active.
    if (sunInterval) {
        clearInterval(sunInterval);
        sunInterval = null;
    }
};
  document.getElementById('pointButton').onclick = function() { g_selectedType = POINT; };
  
  document.getElementById('triButton').onclick = function() { g_selectedType = TRIANGLE; };
  document.getElementById('circleButton').onclick = function() { g_selectedType = CIRCLE; };
  document.getElementById('sunButton').onclick = function() {
    startFlashingSun();
};



  document.getElementById('redSlide').addEventListener('mouseup', function() { 
      g_selectedColor[0] = this.value / 100; 
  });
  document.getElementById('greenSlide').addEventListener('mouseup', function() { 
      g_selectedColor[1] = this.value / 100; 
  });
  document.getElementById('blueSlide').addEventListener('mouseup', function() { 
      g_selectedColor[2] = this.value / 100; 
  });
  
  // Slider event for brush/shape size
  document.getElementById('sizeSlide').addEventListener('mouseup', function() { 
      g_selectedSize = this.value; 
  });
  
  // Slider event for number of segments in circle
  document.getElementById('segSlide').addEventListener('mouseup', function() { 
      g_circleSegments = this.value; 
  });
}

//--------------------------------------------------------------------------
// Mouse and Coordinate Functions
//--------------------------------------------------------------------------

function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of mouse pointer
  var y = ev.clientY; // y coordinate of mouse pointer
  var rect = ev.target.getBoundingClientRect();
  x = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
  y = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);
  return [x, y];
}

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);
  let shape;
  
  if (g_selectedType === POINT) {
    shape = new Point();
  } else if (g_selectedType === TRIANGLE) {
    shape = new Triangle();
  } else if (g_selectedType === CIRCLE) {
    shape = new Circle();
    shape.segments = g_circleSegments;
  }
  
  shape.position = [x, y];
  shape.color = g_selectedColor.slice();
  shape.size = g_selectedSize;
  
  g_shapesList.push(shape);
  renderAllShapes();
}

//--------------------------------------------------------------------------
// Rendering Function
//--------------------------------------------------------------------------
function renderAllShapes() {
  var startTime = performance.now();
  gl.clear(gl.COLOR_BUFFER_BIT);
  var len = g_shapesList.length;
  for (var i = 0; i < g_shapesList.length; i++) {
    g_shapesList[i].render();
  }
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot"); 
}


function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

//--------------------------------------------------------------------------
// Shape Classes
//--------------------------------------------------------------------------

class Point{
  constructor(){
    this.type = 'point';
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

  render(){
      var xy = this.position;
      var rgba = this.color;
      var size = this.size;

      gl.disableVertexAttribArray(a_Position);
      gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      // Pass the size of a point to u_Size variable
      gl.uniform1f(u_Size, size);
      // Draw
      gl.drawArrays(gl.POINTS, 0, 1);

  }

}

class Triangle{
  constructor(){
    this.type = 'triangle';
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
    this.flipX = false;

  }

  render(){
      var xy = this.position;
      var rgba = this.color;
      var size = this.size;
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniform1f(u_Size, size);
      var d = this.size/200.0; 
      var d = this.size / 200.0;
      if (this.flipX) {
        drawTriangle([xy[0], xy[1], xy[0] - d, xy[1], xy[0], xy[1] + d]);
      } else {
        drawTriangle([xy[0], xy[1], xy[0] + d, xy[1], xy[0], xy[1] + d]);
      }

  }

}

function drawTriangle(vertices) {
  var n = 3;

  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

class Circle{
  constructor(){
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
    this.segments = 8;
  }

  render(){
      var xy = this.position;
      var rgba = this.color;
      var size = this.size;
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

      var d = this.size/200.0; 

      let angleStep=360/this.segments;
      for(var angle = 0; angle < 360; angle=angle+angleStep) {
        let centerPt= [xy[0], xy[1]];
        let angle1=angle;
        let angle2=angle+angleStep;
        let vec1=[Math.cos(angle1*Math.PI/180)*d, Math.sin(angle1*Math.PI/180)*d];
        let vec2=[Math.cos(angle2*Math.PI/180)*d, Math.sin(angle2*Math.PI/180)*d];
        let pt1 = [centerPt[0]+vec1[0], centerPt[1]+vec1[1]];
        let pt2 = [centerPt[0]+vec2[0], centerPt[1]+vec2[1]];

        drawTriangle( [xy[0], xy[1], pt1[0], pt1[1], pt2[0], pt2[1]] );
      }
    }
}

//--------------------------------------------------------------------------
// Flashing Sun Functions (AWESOMENESS FEATURE)
//--------------------------------------------------------------------------

// Global variables for sun flashing
let sunInterval = null;
let sunBrightness = 1.0; // brightness flicker 

function startFlashingSun() {
  if (sunInterval) clearInterval(sunInterval);
  sunInterval = setInterval(function() {
      sunBrightness = (sunBrightness === 1.0) ? 0.5 : 1.0;
      renderAllShapes();
      drawGrass();
      drawSun();
  }, 500);
}



function drawSun() {
  
  let sunCenter = [0, 0.3];
  let r = 0.40;
  let segments = 20;
  let vertices = [];
  
  // The first vertex is the center of the sun.
  vertices.push(sunCenter[0], sunCenter[1]);
  for (let i = 0; i <= segments; i++) {
      let angle = i * 2 * Math.PI / segments;
      let x = sunCenter[0] + r * Math.cos(angle);
      let y = sunCenter[1] + r * Math.sin(angle);
      vertices.push(x, y);
  }
  
  let color = [1.0 * sunBrightness, 1.0 * sunBrightness, 0.0, 1.0];

  // Create a buffer and draw the sun's center using a TRIANGLE_FAN.
  let vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, segments + 2);
  gl.deleteBuffer(vertexBuffer);
  
  let numRays = 20;
  let rayInner = r;
  let rayOuter = 0.50;
  let delta = (2 * Math.PI / numRays) * 0.3;
  for (let i = 0; i < numRays; i++) {
      let angle = i * 2 * Math.PI / numRays;
      let innerX = sunCenter[0] + rayInner * Math.cos(angle);
      let innerY = sunCenter[1] + rayInner * Math.sin(angle);
      // The outer point where the ray ends.
      let outerX = sunCenter[0] + rayOuter * Math.cos(angle);
      let outerY = sunCenter[1] + rayOuter * Math.sin(angle);
      // Second outer point with an angular offset.
      let outerX2 = sunCenter[0] + rayOuter * Math.cos(angle + delta);
      let outerY2 = sunCenter[1] + rayOuter * Math.sin(angle + delta);
      // Define vertices for a ray (as one triangle).
      let rayVertices = [
          innerX, innerY,
          outerX, outerY,
          outerX2, outerY2
      ];
      let rayBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, rayBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rayVertices), gl.STATIC_DRAW);
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
      gl.uniform4f(u_FragColor, 1.0 * sunBrightness, 1.0 * sunBrightness, 0.0, 1.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.deleteBuffer(rayBuffer);
  }
}
function drawGrass() {
  let vertices = [
      -1.0, -1.0,  // Bottom Left
       1.0, -1.0,  // Bottom Right
      -1.0, -0.5,  // Top Left
      -1.0, -0.5,  // Top Left
       1.0, -1.0,  // Bottom Right
       1.0, -0.5   // Top Right
  ];

  let vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.uniform4f(u_FragColor, 0.0, 0.8, 0.0, 1.0);  // Dark Green

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  gl.deleteBuffer(vertexBuffer);
}



//--------------------------------------------------------------------------
// Main Entry Point
//--------------------------------------------------------------------------

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { 
    if (ev.buttons === 1) { click(ev); } 
  };
  gl.clear(gl.COLOR_BUFFER_BIT);
}
