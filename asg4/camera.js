// Camera.js 
class Camera {
  constructor() {
      // Position camera at a good starting position in the world
      this.eye = new Vector3([16, 2, 16]); // Center of 32x32 world, slightly elevated
      this.at = new Vector3([17, 2, 16]);  // Looking along positive x-axis initially
      this.up = new Vector3([0, 1, 0]);    // Y-axis is up
      
      // Camera properties
      this.fov = 60;                       // Field of view in degrees
      this.speed = 0.2;                    // Movement speed
      this.rotationSpeed = 3;              // Rotation speed in degrees
      this.jumpHeight = 0;                 // Current jump height
      this.isJumping = false;              // Jump state
      
      // Mouse look properties
      this.mouseLook = false;              // Mouse look enabled flag
      this.mouseSensitivity = 0.2;         // Mouse sensitivity
      this.previousMouseX = null;          // Previous mouse X position
      this.previousMouseY = null;          // Previous mouse Y position
      this.pitchAngle = 0;                 // Current pitch angle (limited to prevent flipping)
      
      // View and projection matrices
      this.viewMatrix = new Matrix4();
      this.projectionMatrix = new Matrix4();
      
      // Initialize matrices
      this.updateViewMatrix();
  }
  
  // Update the view matrix based on current eye, at, and up vectors
  updateViewMatrix() {
      this.viewMatrix.setLookAt(
          this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
          this.at.elements[0], this.at.elements[1], this.at.elements[2],
          this.up.elements[0], this.up.elements[1], this.up.elements[2]
      );
      return this.viewMatrix;
  }
  
  // Update the projection matrix based on canvas dimensions
  updateProjectionMatrix(width, height) {
      const aspect = width / height;
      this.projectionMatrix.setPerspective(this.fov, aspect, 0.1, 100.0);
      return this.projectionMatrix;
  }
  
  // Get forward vector (normalized)
  getForwardVector() {
      const atCopy = new Vector3(this.at.elements);
      const eyeCopy = new Vector3(this.eye.elements);
      const forward = atCopy.sub(eyeCopy);
      return forward.normalize();
  }
  
  // Get right vector (normalized)
  getRightVector() {
      const forward = this.getForwardVector();
      const upCopy = new Vector3(this.up.elements);
      const right = Vector3.cross(forward, upCopy);
      return right.normalize();
  }
  
  // Move camera forward
  forward() {
      const forward = this.getForwardVector();
      forward.mul(this.speed);
      
      // Only update x and z components to maintain height (except when jumping)
      const newEye = this.eye.add(forward);
      const newAt = this.at.add(forward);
      
      this.eye = newEye;
      this.at = newAt;
  }
  
  // Move camera backward
  backward() {
      const forward = this.getForwardVector();
      forward.mul(-this.speed);
      
      // Only update x and z components to maintain height
      const newEye = this.eye.add(forward);
      const newAt = this.at.add(forward);
      
      this.eye = newEye;
      this.at = newAt;
  }
  
  // Move camera left (strafe)
  left() {
      const right = this.getRightVector();
      right.mul(-this.speed);
      
      // Only update x and z components to maintain height
      const newEye = this.eye.add(right);
      const newAt = this.at.add(right);
      
      this.eye = newEye;
      this.at = newAt;
  }
  
  // Move camera right (strafe)
  right() {
      const right = this.getRightVector();
      right.mul(this.speed);
      
      // Only update x and z components to maintain height
      const newEye = this.eye.add(right);
      const newAt = this.at.add(right);
      
      this.eye = newEye;
      this.at = newAt;
  }
  
  // Rotate camera right
  rotRight() {
      const atCopy = new Vector3(this.at.elements);
      const eyeCopy = new Vector3(this.eye.elements);
      const viewDir = atCopy.sub(eyeCopy);
      
      const rotationMatrix = new Matrix4();
      rotationMatrix.setRotate(-this.rotationSpeed, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      
      const rotatedDir = rotationMatrix.multiplyVector3(viewDir);
      this.at = rotatedDir.add(this.eye);
  }
  
  // Rotate camera left
  rotLeft() {
      const atCopy = new Vector3(this.at.elements);
      const eyeCopy = new Vector3(this.eye.elements);
      const viewDir = atCopy.sub(eyeCopy);
      
      const rotationMatrix = new Matrix4();
      rotationMatrix.setRotate(this.rotationSpeed, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      
      const rotatedDir = rotationMatrix.multiplyVector3(viewDir);
      this.at = rotatedDir.add(this.eye);
  }
  
  // Handle mouse movement for mouse look
  handleMouseMove(event, canvas) {
      if (!this.mouseLook) return;
      
      if (this.previousMouseX === null) {
          this.previousMouseX = event.clientX;
          this.previousMouseY = event.clientY;
          return;
      }
      
      // Calculate mouse movement
      const deltaX = event.clientX - this.previousMouseX;
      const deltaY = event.clientY - this.previousMouseY;
      
      this.previousMouseX = event.clientX;
      this.previousMouseY = event.clientY;
      
      // Horizontal rotation (yaw)
      if (deltaX !== 0) {
          const yawAmount = -deltaX * this.mouseSensitivity;
          
          const atCopy = new Vector3(this.at.elements);
          const eyeCopy = new Vector3(this.eye.elements);
          const viewDir = atCopy.sub(eyeCopy);
          
          const yawMatrix = new Matrix4();
          yawMatrix.setRotate(yawAmount, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
          
          const rotatedDir = yawMatrix.multiplyVector3(viewDir);
          this.at = rotatedDir.add(this.eye);
      }
      
      // Vertical rotation (pitch) - limit to prevent flipping
      if (deltaY !== 0) {
          // Update pitch angle
          this.pitchAngle += deltaY * this.mouseSensitivity;
          
          // Clamp pitch angle to prevent flipping
          this.pitchAngle = Math.max(-89, Math.min(89, this.pitchAngle));
          
          const atCopy = new Vector3(this.at.elements);
          const eyeCopy = new Vector3(this.eye.elements);
          const viewDir = atCopy.sub(eyeCopy);
          
          // Create a right vector for pitch rotation
          const rightVector = Vector3.cross(viewDir, this.up);
          rightVector.normalize();
          
          // Reset the vertical component of the view direction
          const horizontalDir = new Vector3([viewDir.elements[0], 0, viewDir.elements[2]]);
          horizontalDir.normalize();
          
          // Create a pitch matrix
          const pitchMatrix = new Matrix4();
          pitchMatrix.setRotate(this.pitchAngle, rightVector.elements[0], rightVector.elements[1], rightVector.elements[2]);
          
          // Apply pitch to the horizontal direction
          const newDir = pitchMatrix.multiplyVector3(horizontalDir);
          newDir.normalize();
          
          // Set the new at point
          this.at = newDir.add(this.eye);
      }
  }
  
  // Toggle mouse look
  toggleMouseLook() {
      this.mouseLook = !this.mouseLook;
      this.previousMouseX = null;
      this.previousMouseY = null;
      return this.mouseLook;
  }
  
  // Jump function
  jump() {
      if (!this.isJumping) {
          this.isJumping = true;
          this.jumpHeight = 0;
          this.jumpVelocity = 0.2;  // Initial jump velocity
      }
  }
  
  // Update jump animation
  updateJump() {
      if (this.isJumping) {
          // Simple physics for jump
          this.jumpHeight += this.jumpVelocity;
          this.jumpVelocity -= 0.01;  // Gravity
          
          // Update eye and at positions
          this.eye.elements[1] += this.jumpVelocity;
          this.at.elements[1] += this.jumpVelocity;
          
          // Check if jump is complete
          if (this.jumpHeight <= 0) {
              this.isJumping = false;
              this.jumpHeight = 0;
              
              // Reset to ground level
              const groundLevel = 2;  // Assuming 2 is ground level
              const heightDiff = groundLevel - this.eye.elements[1];
              this.eye.elements[1] = groundLevel;
              this.at.elements[1] += heightDiff;
          }
      }
  }
  
  // Collision detection and response
  checkCollision(worldGrid) {
      // Calculate potential new position
      const forward = this.getForwardVector();
      const potential = new Vector3(this.eye.elements);
      potential.add(forward.mul(this.speed));
      
      // Convert to grid coordinates
      const gridX = Math.floor(potential.elements[0]);
      const gridY = Math.floor(potential.elements[1]);
      const gridZ = Math.floor(potential.elements[2]);
      
      // Check if there's a block at the potential position
      if (gridX >= 0 && gridX < worldGrid.length &&
          gridZ >= 0 && gridZ < worldGrid[0].length) {
          const blockHeight = worldGrid[gridX][gridZ];
          if (blockHeight > gridY) {
              // Collision detected, prevent movement
              return true;
          }
      }
      
      // No collision
      return false;
  }
}