// Triangle.js 

class Triangle {
  constructor() {
      // Vertex coordinates and buffer
      this.vertices = null;
      this.vertexBuffer = null;
      
      // UV coordinates and buffer for texturing
      this.uvs = null;
      this.uvBuffer = null;
      
      // Color and texture properties
      this.color = [1.0, 1.0, 1.0, 1.0]; // Default white color
      this.textureNum = -2; // Default to solid color (-2), -1 for UV visualization
      
      // Transformation properties
      this.matrix = new Matrix4(); // Model matrix for transformations
      
      // Initialize vertex and UV data
      this.generateVertices();
      this.generateUVs();
  }
  
  /**
   * Generates the vertex positions for a single triangle
   * Creates 3 vertices in counter-clockwise order (front-facing)
   */
  generateVertices() {
      // Default triangle in XY plane (Z = 0)
      // prettier-ignore
      this.vertices = new Float32Array([
          0.0, 0.5, 0.0,     // Top vertex
          -0.5, -0.5, 0.0,   // Bottom-left vertex
          0.5, -0.5, 0.0     // Bottom-right vertex
      ]);
  }
  

  generateUVs() {
      // prettier-ignore
      this.uvs = new Float32Array([
          0.5, 1.0,   // Top vertex
          0.0, 0.0,   // Bottom-left vertex
          1.0, 0.0    // Bottom-right vertex
      ]);
  }
  
  /**
   * Renders the triangle with the current transformations,
   * color/texture settings, and camera view
   */
  render() {
      // Send the model matrix to the shader
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      
      // Set the texture type
      gl.uniform1i(u_whichTexture, this.textureNum);
      
      // Set the color (used when texture is not applied or for blending)
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
      
      // Create vertex buffer if it doesn't exist yet
      if (!this.vertexBuffer) {
          this.vertexBuffer = gl.createBuffer();
          if (!this.vertexBuffer) {
              console.log('Failed to create vertex buffer object');
              return;
          }
      }
      
      // Bind and send vertex data
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
      
      // Create UV buffer if it doesn't exist yet
      if (!this.uvBuffer) {
          this.uvBuffer = gl.createBuffer();
          if (!this.uvBuffer) {
              console.log('Failed to create UV buffer object');
              return;
          }
      }
      
      // Bind and send UV data
      gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
      gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_UV);
      
      // Draw the triangle
      gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  
  /**
   * Sets custom vertices for the triangle
   * @param {Float32Array} vertices - Array of 9 values (3 vertices × 3 coordinates)
   */
  setVertices(vertices) {
      if (vertices.length === 9) {
          this.vertices = vertices;
      } else {
          console.error('Triangle vertices must have exactly 9 values (3 vertices)');
      }
  }
  
  setUVs(uvs) {
      if (uvs.length === 6) {
          this.uvs = uvs;
      } else {
          console.error('Triangle UVs must have exactly 6 values (3 vertices)');
      }
  }
}