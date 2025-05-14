// Updated Cube.js with static texture methods

class Cube {
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
  
  // Static texture properties
  static texture0 = null;
  static texture1 = null;
  static texture2 = null;
  
  /**
   * Generates the vertex positions for the cube
   * Creates 36 vertices (6 faces, 2 triangles per face, 3 vertices per triangle)
   */
  generateVertices() {
      // prettier-ignore
      this.vertices = new Float32Array([
          // Front face
          -0.5, 0.5, 0.5,    -0.5, -0.5, 0.5,    0.5, -0.5, 0.5,
          -0.5, 0.5, 0.5,    0.5, -0.5, 0.5,     0.5, 0.5, 0.5,
          
          // Left face
          -0.5, 0.5, -0.5,   -0.5, -0.5, -0.5,   -0.5, -0.5, 0.5,
          -0.5, 0.5, -0.5,   -0.5, -0.5, 0.5,    -0.5, 0.5, 0.5,
          
          // Right face
          0.5, 0.5, 0.5,     0.5, -0.5, 0.5,     0.5, -0.5, -0.5,
          0.5, 0.5, 0.5,     0.5, -0.5, -0.5,    0.5, 0.5, -0.5,
          
          // Top face
          -0.5, 0.5, -0.5,   -0.5, 0.5, 0.5,     0.5, 0.5, 0.5,
          -0.5, 0.5, -0.5,   0.5, 0.5, 0.5,      0.5, 0.5, -0.5,
          
          // Back face
          0.5, 0.5, -0.5,    0.5, -0.5, -0.5,    -0.5, -0.5, -0.5,
          0.5, 0.5, -0.5,    -0.5, -0.5, -0.5,   -0.5, 0.5, -0.5,
          
          // Bottom face
          -0.5, -0.5, 0.5,   -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,
          -0.5, -0.5, 0.5,   0.5, -0.5, -0.5,    0.5, -0.5, 0.5
      ]);
  }
  
  /**
   * Generates the UV coordinates for texture mapping
   * Maps to the same vertex order as the vertices
   */
  generateUVs() {
      // prettier-ignore
      this.uvs = new Float32Array([
          // Front face
          0.0, 1.0,    0.0, 0.0,    1.0, 0.0,
          0.0, 1.0,    1.0, 0.0,    1.0, 1.0,
          
          // Left face
          1.0, 1.0,    1.0, 0.0,    0.0, 0.0,
          1.0, 1.0,    0.0, 0.0,    0.0, 1.0,
          
          // Right face
          0.0, 1.0,    0.0, 0.0,    1.0, 0.0,
          0.0, 1.0,    1.0, 0.0,    1.0, 1.0,
          
          // Top face
          0.0, 0.0,    0.0, 1.0,    1.0, 1.0,
          0.0, 0.0,    1.0, 1.0,    1.0, 0.0,
          
          // Back face
          0.0, 1.0,    0.0, 0.0,    1.0, 0.0,
          0.0, 1.0,    1.0, 0.0,    1.0, 1.0,
          
          // Bottom face
          1.0, 1.0,    1.0, 0.0,    0.0, 0.0,
          1.0, 1.0,    0.0, 0.0,    0.0, 1.0
      ]);
  }
  
  /**
   * Renders the cube with the current transformations,
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
      
      // Draw the cube
      gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
  }
  
  /**
   * Faster render method for when we're drawing many cubes
   * Assumes the buffers have already been set up in a previous call
   */
  renderfaster() {
      // Send just the model matrix and texture/color info
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      gl.uniform1i(u_whichTexture, this.textureNum);
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
      
      // Make sure the correct attribute pointers are used
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
      
      // Draw without re-binding buffers
      gl.drawArrays(gl.TRIANGLES, 0, 36); // 36 vertices in a cube
  }
  
  // Static method to set texture 0
  static setTexture0(gl, imagePath) {
      if (Cube.texture0 === null) {
          Cube.texture0 = gl.createTexture();
      }
      
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      
      if (u_Sampler0 < 0) {
          console.warn("Could not find uniform location for u_Sampler0");
      }
      
      const img = new Image();
      
      img.onload = () => {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, Cube.texture0);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.uniform1i(u_Sampler0, 0);
          console.log("Texture 0 loaded successfully:", imagePath);
      };
      
      img.onerror = () => {
          console.error("Failed to load texture 0:", imagePath);
      };
      
      img.src = imagePath;
  }
  
  // Static method to set texture 1
  static setTexture1(gl, imagePath) {
      if (Cube.texture1 === null) {
          Cube.texture1 = gl.createTexture();
      }
      
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      
      if (u_Sampler1 < 0) {
          console.warn("Could not find uniform location for u_Sampler1");
      }
      
      const img = new Image();
      
      img.onload = () => {
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, Cube.texture1);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.uniform1i(u_Sampler1, 1);
          console.log("Texture 1 loaded successfully:", imagePath);
      };
      
      img.onerror = () => {
          console.error("Failed to load texture 1:", imagePath);
      };
      
      img.src = imagePath;
  }
  
  // Static method to set texture 2
  static setTexture2(gl, imagePath) {
      if (Cube.texture2 === null) {
          Cube.texture2 = gl.createTexture();
      }
      
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      
      if (u_Sampler2 < 0) {
          console.warn("Could not find uniform location for u_Sampler2");
      }
      
      const img = new Image();
      
      img.onload = () => {
          gl.activeTexture(gl.TEXTURE2);
          gl.bindTexture(gl.TEXTURE_2D, Cube.texture2);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.uniform1i(u_Sampler2, 2);
          console.log("Texture 2 loaded successfully:", imagePath);
      };
      
      img.onerror = () => {
          console.error("Failed to load texture 2:", imagePath);
      };
      
      img.src = imagePath;
  }
}