// Sphere.js 

class Sphere {
    constructor(radius = 0.5, latitudeBands = 30, longitudeBands = 30) {
        // Sphere properties
        this.radius = radius;
        this.latitudeBands = latitudeBands;
        this.longitudeBands = longitudeBands;
        
        // Vertex and buffer properties
        this.vertices = null;
        this.normals = null;
        this.uvs = null;
        this.indices = null;
        this.vertexBuffer = null;
        this.normalBuffer = null;
        this.uvBuffer = null;
        this.indexBuffer = null;
        
        // Color and texture properties
        this.color = [1.0, 1.0, 1.0, 1.0]; // Default white color
        this.textureNum = -2; // Default to solid color (-2), -1 for UV visualization
        
        // Transformation properties
        this.matrix = new Matrix4(); // Model matrix for transformations
        
        // Initialize sphere geometry
        this.generateSphere();
    }
    
    /**
     * Generate sphere vertices, normals, UVs, and indices
     */
    generateSphere() {
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        
        // Generate vertices, normals, and UVs
        for (let latNumber = 0; latNumber <= this.latitudeBands; latNumber++) {
            const theta = (latNumber * Math.PI) / this.latitudeBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let longNumber = 0; longNumber <= this.longitudeBands; longNumber++) {
                const phi = (longNumber * 2 * Math.PI) / this.longitudeBands;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                // Calculate vertex position
                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;
                
                // Add vertex (scaled by radius)
                vertices.push(this.radius * x);
                vertices.push(this.radius * y);
                vertices.push(this.radius * z);
                
                // Add normal (for sphere centered at origin, normal = normalized position)
                normals.push(x);
                normals.push(y);
                normals.push(z);
                
                // Add UV coordinates
                const u = 1 - (longNumber / this.longitudeBands);
                const v = 1 - (latNumber / this.latitudeBands);
                uvs.push(u);
                uvs.push(v);
            }
        }
        
        // Generate indices for triangles
        for (let latNumber = 0; latNumber < this.latitudeBands; latNumber++) {
            for (let longNumber = 0; longNumber < this.longitudeBands; longNumber++) {
                const first = (latNumber * (this.longitudeBands + 1)) + longNumber;
                const second = first + this.longitudeBands + 1;
                
                // First triangle
                indices.push(first);
                indices.push(second);
                indices.push(first + 1);
                
                // Second triangle
                indices.push(second);
                indices.push(second + 1);
                indices.push(first + 1);
            }
        }
        
        // Convert to Float32Array and Uint16Array
        this.vertices = new Float32Array(vertices);
        this.normals = new Float32Array(normals);
        this.uvs = new Float32Array(uvs);
        this.indices = new Uint16Array(indices);
    }
    
    /**
     * Renders the sphere with the current transformations,
     * color/texture settings, and lighting
     */
    render() {
        // Send the model matrix to the shader
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        
        // Calculate and send normal matrix (inverse transpose of model matrix)
        var normalMatrix = new Matrix4();
        normalMatrix.setInverseOf(this.matrix);
        normalMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
        
        // Set the texture type
        gl.uniform1i(u_whichTexture, this.textureNum);
        
        // Set the color (used when texture is not applied or for blending)
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        
        // Create and bind vertex buffer
        if (!this.vertexBuffer) {
            this.vertexBuffer = gl.createBuffer();
            if (!this.vertexBuffer) {
                console.log('Failed to create vertex buffer object');
                return;
            }
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        
        // Create and bind normal buffer
        if (!this.normalBuffer) {
            this.normalBuffer = gl.createBuffer();
            if (!this.normalBuffer) {
                console.log('Failed to create normal buffer object');
                return;
            }
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);
        
        // Create and bind UV buffer
        if (!this.uvBuffer) {
            this.uvBuffer = gl.createBuffer();
            if (!this.uvBuffer) {
                console.log('Failed to create UV buffer object');
                return;
            }
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);
        
        // Create and bind index buffer
        if (!this.indexBuffer) {
            this.indexBuffer = gl.createBuffer();
            if (!this.indexBuffer) {
                console.log('Failed to create index buffer object');
                return;
            }
        }
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
        
        // Draw the sphere using indices
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    
    /**
     * Set the radius of the sphere
     * @param {number} radius - New radius for the sphere
     */
    setRadius(radius) {
        this.radius = radius;
        this.generateSphere();
        // Reset buffers so they get recreated with new data
        this.vertexBuffer = null;
        this.normalBuffer = null;
        this.uvBuffer = null;
        this.indexBuffer = null;
    }
    
    /**
     * Set the number of bands for sphere resolution
     * @param {number} latBands - Number of latitude bands
     * @param {number} longBands - Number of longitude bands
     */
    setResolution(latBands, longBands) {
        this.latitudeBands = latBands;
        this.longitudeBands = longBands;
        this.generateSphere();
        this.vertexBuffer = null;
        this.normalBuffer = null;
        this.uvBuffer = null;
        this.indexBuffer = null;
    }
}