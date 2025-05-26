// Circle.js 

class Circle {
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
      
      // Circle properties
      this.segments = 36; // Number of triangles to approximate the circle
      this.radius = 0.5;  // Default radius
      
      // Initialize vertex and UV data
      this.generateVertices();
      this.generateUVs();
  }
  

  generateVertices() {
      const numVertices = this.segments * 3; // 3 vertices per triangle
      this.vertices = new Float32Array(numVertices * 3); // 3 coordinates per vertex
      
      // Center of the circle at (0,0,0)
      const centerX = 0;
      const centerY = 0;
      const centerZ = 0;
      
      for (let i = 0; i < this.segments; i++) {
          // Calculate angles for current and next segment
          const angle1 = (i / this.segments) * Math.PI * 2;
          const angle2 = ((i + 1) / this.segments) * Math.PI * 2;
          
          // Calculate points on the circle (in XY plane, Z=0)
          const x1 = this.radius * Math.cos(angle1);
          const y1 = this.radius * Math.sin(angle1);
          
          const x2 = this.radius * Math.cos(angle2);
          const y2 = this.radius * Math.sin(angle2);
          
          // Set triangle vertices (center, point1, point2)
          const vertexIndex = i * 9; // 9 values per triangle (3 vertices * 3 coordinates)
          
          // Center point
          this.vertices[vertexIndex] = centerX;
          this.vertices[vertexIndex + 1] = centerY;
          this.vertices[vertexIndex + 2] = centerZ;
          
          // First point on the circle
          this.vertices[vertexIndex + 3] = x1;
          this.vertices[vertexIndex + 4] = y1;
          this.vertices[vertexIndex + 5] = centerZ;
          
          // Second point on the circle
          this.vertices[vertexIndex + 6] = x2;
          this.vertices[vertexIndex + 7] = y2;
          this.vertices[vertexIndex + 8] = centerZ;
      }
  }
  
  /**
   * Generates the UV coordinates for texture mapping
   * Maps to the same vertex order as the vertices
   */
  generateUVs() {
      const numVertices = this.segments * 3; // 3 vertices per triangle
      this.uvs = new Float32Array(numVertices * 2); // 2 coordinates per vertex
      
      for (let i = 0; i < this.segments; i++) {
          // Calculate angles for current and next segment
          const angle1 = (i / this.segments) * Math.PI * 2;
          const angle2 = ((i + 1) / this.segments) * Math.PI * 2;
          
          // Calculate UV coordinates
          // Center is at (0.5, 0.5), edges map to unit circle positions
          const u1 = 0.5 + 0.5 * Math.cos(angle1);
          const v1 = 0.5 + 0.5 * Math.sin(angle1);
          
          const u2 = 0.5 + 0.5 * Math.cos(angle2);
          const v2 = 0.5 + 0.5 * Math.sin(angle2);
          
          // Set triangle UVs
          const uvIndex = i * 6; // 6 values per triangle (3 vertices * 2 coordinates)
          
          // Center UV
          this.uvs[uvIndex] = 0.5;
          this.uvs[uvIndex + 1] = 0.5;
          
          // First point UV
          this.uvs[uvIndex + 2] = u1;
          this.uvs[uvIndex + 3] = v1;
          
          // Second point UV
          this.uvs[uvIndex + 4] = u2;
          this.uvs[uvIndex + 5] = v2;
      }
  }
  

  setSegments(segments) {
      if (segments >= 3) {
          this.segments = segments;
          this.generateVertices();
          this.generateUVs();
      } else {
          console.error('Circle must have at least 3 segments');
      }
  }
  
  /**
   * Sets the radius of the circle
   * @param {number} radius - Radius of the circle
   */
  setRadius(radius) {
      if (radius > 0) {
          this.radius = radius;
          this.generateVertices();
          // UV coordinates don't depend on radius, so no need to regenerate them
      } else {
          console.error('Circle radius must be positive');
      }
  }
  
  /**
   * Renders the circle with the current transformations,
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
      
      // Draw the circle as a series of triangles
      gl.drawArrays(gl.TRIANGLES, 0, this.segments * 3);
  }
}