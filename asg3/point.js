// Point.js - 

class Point {
  constructor() {
      // Vertex coordinates and buffer
      this.vertex = new Float32Array([0.0, 0.0, 0.0]); // Default at origin
      this.vertexBuffer = null;
      
      // Color property
      this.color = [1.0, 1.0, 1.0, 1.0]; // Default white color
      
      // Point size property
      this.size = 5.0; // Default point size in pixels
      
      // Transformation properties
      this.matrix = new Matrix4(); // Model matrix for transformations
  }
  
  /**
   * Sets the position of the point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   */
  setPosition(x, y, z) {
      this.vertex = new Float32Array([x, y, z]);
  }
  
  /**
   * Renders the point with the current transformations and color
   */
  render() {
      // Send the model matrix to the shader
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      
      // Set the texture type to solid color mode
      gl.uniform1i(u_whichTexture, -2); // Using solid color
      
      // Set the color
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
      gl.bufferData(gl.ARRAY_BUFFER, this.vertex, gl.STATIC_DRAW);
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
      
      // Set point size
      gl.vertexAttrib1f(a_PointSize, this.size);
      
      // Draw the point
      gl.drawArrays(gl.POINTS, 0, 1);
  }
  
  /**
   * Creates a transformed point based on the model matrix
   * Useful for getting the screen position of a point
   * @returns {Float32Array} - Transformed point coordinates
   */
  getTransformedVertex() {
      // Create a vector from the original vertex
      const v = new Vector3([this.vertex[0], this.vertex[1], this.vertex[2]]);
      
      // Apply model matrix transformations
      const transformed = this.matrix.multiplyVector3(v);
      
      return new Float32Array([
          transformed.elements[0],
          transformed.elements[1],
          transformed.elements[2]
      ]);
  }
}