// shape.js
// --- build once ---
let cubeBuffer = null;
let cubeVCount = 0;
function initCubeVertexBuffer(gl) {
  if (cubeBuffer) return;

  const verts = new Float32Array([
    // front
    -0.5,-0.5,0.5,  0.5,-0.5,0.5,  0.5,0.5,0.5,  -0.5,-0.5,0.5,  0.5,0.5,0.5,  -0.5,0.5,0.5,
    // right
     0.5,-0.5,0.5,  0.5,-0.5,-0.5, 0.5,0.5,-0.5,  0.5,-0.5,0.5,  0.5,0.5,-0.5, 0.5,0.5,0.5,
    // back
     0.5,-0.5,-0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,  0.5,-0.5,-0.5,-0.5,0.5,-0.5, 0.5,0.5,-0.5,
    // left
    -0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5,   -0.5,-0.5,-0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,
    // top
    -0.5,0.5,0.5,  0.5,0.5,0.5,  0.5,0.5,-0.5,  -0.5,0.5,0.5,  0.5,0.5,-0.5, -0.5,0.5,-0.5,
    // bottom
    -0.5,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5,-0.5,0.5,  -0.5,-0.5,-0.5, 0.5,-0.5,0.5, -0.5,-0.5,0.5
  ]);
  cubeVCount = verts.length/3;
  cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
}

// --- draw a cube using current a_Position & u_ModelMatrix ---
function drawCube(gl, u_ModelMatrix, M) {
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  const a_Pos = gl.getAttribLocation(gl.program,"a_Position");
  gl.vertexAttribPointer(a_Pos,3,gl.FLOAT,false,0,0);
  gl.enableVertexAttribArray(a_Pos);
  gl.uniformMatrix4fv(u_ModelMatrix,false,M.elements);
  gl.drawArrays(gl.TRIANGLES,0,cubeVCount);
}
