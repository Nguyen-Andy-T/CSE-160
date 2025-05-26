// World.js - 
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  attribute float a_PointSize;
  
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_NormalMatrix;
  
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;
  
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    gl_PointSize = a_PointSize;
    
    // Pass UV coordinates to fragment shader
    v_UV = a_UV;
    
    // Calculate world position for lighting
    v_PositionInWorld = (u_ModelMatrix * a_Position).xyz;
    
    // Transform normal to world coordinates
    v_Normal = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;
  
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  
  // Lighting uniforms
  uniform vec3 u_LightPosition;
  uniform vec3 u_LightColor;
  uniform vec3 u_CameraPosition;
  uniform bool u_LightingEnabled;
  uniform bool u_NormalVisualization;
  
  void main() {
    // If normal visualization is enabled, show normals as colors
    if (u_NormalVisualization) {
      gl_FragColor = vec4((v_Normal + 1.0) / 2.0, 1.0);
      return;
    }
    
    // Get base color from texture or solid color
    vec4 baseColor;
    if (u_whichTexture == -2) {
      baseColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      baseColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      baseColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      baseColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      baseColor = texture2D(u_Sampler2, v_UV);
    } else {
      baseColor = vec4(1.0, 0.2, 0.2, 1.0);
    }
    
    if (!u_LightingEnabled) {
      gl_FragColor = baseColor;
      return;
    }
    
    // Phong lighting calculation
    vec3 normal = normalize(v_Normal);
    vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
    vec3 viewDirection = normalize(u_CameraPosition - v_PositionInWorld);
    vec3 reflectDirection = reflect(-lightDirection, normal);
    
    // Ambient lighting
    float ambientStrength = 0.3;
    vec3 ambient = ambientStrength * u_LightColor;
    
    // Diffuse lighting
    float diffuseStrength = max(dot(normal, lightDirection), 0.0);
    vec3 diffuse = diffuseStrength * u_LightColor;
    
    // Specular lighting
    float specularStrength = 0.5;
    float shininess = 32.0;
    float specular = pow(max(dot(viewDirection, reflectDirection), 0.0), shininess);
    vec3 specularLight = specularStrength * specular * u_LightColor;
    
    // Combine all lighting components
    vec3 finalColor = (ambient + diffuse + specularLight) * baseColor.rgb;
    gl_FragColor = vec4(finalColor, baseColor.a);
  }`;

// Global WebGL variables
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let a_PointSize;
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_NormalMatrix;
let u_FragColor;
let u_whichTexture;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;

// Lighting uniforms
let u_LightPosition;
let u_LightColor;
let u_CameraPosition;
let u_LightingEnabled;
let u_NormalVisualization;

// Global lighting variables
let g_lightPosition = [0, 10, 0];      // Point light position
let g_lightColor = [1.0, 1.0, 1.0];    // White light
let g_lightingEnabled = true;           // Lighting on/off
let g_normalVisualization = false;      // Normal visualization
let g_lightAngle = 0;                   // For animating light

// Global application variables
let g_camera;
let g_worldSize = 32;
let g_worldMap = [];
let g_animalPositions = [];
let g_flowerPositions = [];
let g_showAnimals = true;
let g_dayNightCycle = false;
let g_timeOfDay = 0;
let g_startTime;
let g_seconds;

// Animation variables
let g_animalBobHeight = 0;
let g_animalRotation = 0;

let g_spherePositions = [];

function main() {
    // Setup canvas and WebGL context
    setupCanvas();
    
    // Initialize shaders and connect variables
    connectVariablesToGLSL();
    
    // Setup input events
    setupEvents();
    
    // Initialize textures
    initTextures();
    
    // Initialize the camera
    g_camera = new Camera();
    
    // Initialize the world map and objects
    initWorldMap();
    
    // Record start time for animations
    g_startTime = performance.now() / 1000.0;
    
    // Start the rendering loop
    requestAnimationFrame(tick);
}

/**
 * Sets up the WebGL canvas
 */
function setupCanvas() {
    // Get the canvas element
    canvas = document.getElementById('asg3');
    
    // Get the WebGL context
    gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) {
        console.error('Failed to get the WebGL context');
        return;
    }
    
    // Enable depth testing for 3D rendering
    gl.enable(gl.DEPTH_TEST);
    
    // Clear the canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * Initialize and connect variables to GLSL shaders
 */
function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.error('Failed to initialize shaders');
        return;
    }
    
    // Get attribute locations
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    
    if (a_Position < 0 || a_UV < 0 || a_Normal < 0) {
        console.error('Failed to get attribute locations');
        return;
    }
    
    // Get uniform locations
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');

    // Get lighting uniform locations
    u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    u_CameraPosition = gl.getUniformLocation(gl.program, 'u_CameraPosition');
    u_LightingEnabled = gl.getUniformLocation(gl.program, 'u_LightingEnabled');
    u_NormalVisualization = gl.getUniformLocation(gl.program, 'u_NormalVisualization');
    
    // Important: Set the initial associations between texture units and samplers
    gl.uniform1i(u_Sampler0, 0);
    gl.uniform1i(u_Sampler1, 1); 
    gl.uniform1i(u_Sampler2, 2);
    
    if (!u_ModelMatrix || !u_ViewMatrix || !u_ProjectionMatrix || !u_NormalMatrix ||
        !u_FragColor || !u_whichTexture || 
        !u_Sampler0 || !u_Sampler1 || !u_Sampler2 ||
        !u_LightPosition || !u_LightColor || !u_CameraPosition ||
        !u_LightingEnabled || !u_NormalVisualization) {
        console.error('Failed to get uniform locations');
        return;
    }
}

/**
 * Set up user input events
 */
function setupEvents() {
    // Keyboard events for camera movement
    document.onkeydown = keydown;
    
    // UI button events
    document.getElementById('toggleAnimals').addEventListener('click', toggleAnimals);
    document.getElementById('toggleDayNight').addEventListener('click', toggleDayNight);
    const genBtn = document.getElementById('generateWorld');
    if (genBtn) {
      genBtn.addEventListener('click', generateWorld);
    }
        // New lighting control buttons
    const lightingBtn = document.getElementById('toggleLighting');
    if (lightingBtn) {
        lightingBtn.addEventListener('click', toggleLighting);
    }
    
    const normalsBtn = document.getElementById('toggleNormals');
    if (normalsBtn) {
        normalsBtn.addEventListener('click', toggleNormals);
    }
    
    // FOV slider event
    const fovSlider = document.getElementById('fovSlider');
    if (fovSlider) {
        fovSlider.addEventListener('input', function() {
            g_camera.fov = Number(this.value);
            document.getElementById('fovValue').textContent = this.value + '°';
        });
    }
    
        // Light position slider
    const lightSlider = document.getElementById('lightSlider');
    if (lightSlider) {
        lightSlider.addEventListener('input', function() {
            g_lightAngle = Number(this.value) * Math.PI / 180; // Convert to radians
        });
    }

        // Light color sliders
    const lightRedSlider = document.getElementById('lightRedSlider');
    const lightGreenSlider = document.getElementById('lightGreenSlider');
    const lightBlueSlider = document.getElementById('lightBlueSlider');
    
    if (lightRedSlider && lightGreenSlider && lightBlueSlider) {
        lightRedSlider.addEventListener('input', updateLightColor);
        lightGreenSlider.addEventListener('input', updateLightColor);
        lightBlueSlider.addEventListener('input', updateLightColor);
    }


    // Mouse look events - enable when 'M' is pressed
    let mouseEnabled = false;
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'm' || event.key === 'M') {
            mouseEnabled = !mouseEnabled;
            
            if (mouseEnabled) {
                canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
                canvas.requestPointerLock();
            } else {
                document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
                document.exitPointerLock();
            }
        } else if (event.key === ' ') { // Space bar for jump
            if (g_camera.jump && typeof g_camera.jump === 'function') {
                g_camera.jump();
            }
        }
    });
    
    // Mouse movement for camera control
    document.addEventListener('mousemove', function(event) {
        if (mouseEnabled && g_camera.handleMouseMove) {
            g_camera.handleMouseMove(event, canvas);
        }
    });
}

/**
 * Update light color from sliders
 */
function updateLightColor() {
    const red = document.getElementById('lightRedSlider').value / 100;
    const green = document.getElementById('lightGreenSlider').value / 100;
    const blue = document.getElementById('lightBlueSlider').value / 100;
    
    g_lightColor = [red, green, blue];
}

/**
 * Toggle lighting on/off
 */
function toggleLighting() {
    g_lightingEnabled = !g_lightingEnabled;
    console.log('Lighting enabled:', g_lightingEnabled);
}

/**
 * Toggle normal visualization on/off
 */
function toggleNormals() {
    g_normalVisualization = !g_normalVisualization;
    console.log('Normal visualization enabled:', g_normalVisualization);
}

/**
 * Initialize textures for the world
 */
// Updated initTextures() function:
function initTextures() {
  // Log that we're starting to load textures
  console.log('Initializing textures...');
  
  // Load texture 0 - Grass
  var grassImage = new Image();
  grassImage.onload = function() {
      console.log('Grass texture loaded');
      loadTexture(grassImage, 0);
  };
  grassImage.onerror = function() {
      console.error('Failed to load grass texture');
  };
  grassImage.src = 'grassTop.png';
  
  // Load texture 1 - Dirt
  var dirtImage = new Image();
  dirtImage.onload = function() {
      console.log('Dirt texture loaded');
      loadTexture(dirtImage, 1);
  };
  dirtImage.onerror = function() {
      console.error('Failed to load dirt texture');
  };
  dirtImage.src = 'dirt.png';
  
  // Load texture 2 - Sky
  var skyImage = new Image();
  skyImage.onload = function() {
      console.log('Sky texture loaded');
      loadTexture(skyImage, 2);
  };
  skyImage.onerror = function() {
      console.error('Failed to load sky texture');
  };
  skyImage.src = 'sky.png';
  
  return true;
}


function loadTexture(image, texUnit) {
  console.log('Loading texture to unit ' + texUnit);
  
  // Create texture object
  var texture = gl.createTexture();
  if (!texture) {
      console.error('Failed to create texture object for unit ' + texUnit);
      return false;
  }
  
  // Flip Y-axis to match WebGL coordinates
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  
  // Activate texture unit
  gl.activeTexture(gl.TEXTURE0 + texUnit);
  
  // Bind texture object to target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Set proper texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  // Set texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  
  // Generate mipmaps - important for proper texture display
  gl.generateMipmap(gl.TEXTURE_2D);
  
  // Set texture unit to sampler
  if (texUnit === 0) {
      gl.uniform1i(u_Sampler0, 0);
  } else if (texUnit === 1) {
      gl.uniform1i(u_Sampler1, 1);
  } else if (texUnit === 2) {
      gl.uniform1i(u_Sampler2, 2);
  }
  
  console.log('Texture ' + texUnit + ' loaded successfully');
  return true;
}

/**
 * Handle keyboard input for camera movement
 * @param {KeyboardEvent} ev - Keyboard event
 */
function keydown(ev) {
    switch(ev.keyCode) {
        case 87: // W - move forward
            g_camera.forward();
            break;
        case 83: // S - move backward
            g_camera.backward();
            break;
        case 65: // A - move left
            g_camera.left();
            break;
        case 68: // D - move right
            g_camera.right();
            break;
        case 81: // Q - rotate left
            g_camera.rotLeft();
            break;
        case 69: // E - rotate right
            g_camera.rotRight();
            break;
        case 32: // Space - jump
            if (g_camera.jump && typeof g_camera.jump === 'function') {
                g_camera.jump();
            }
            break;
    }
}

/**
 * Animation and rendering loop
 */
function tick() {
    // Update time
    g_seconds = performance.now() / 1000.0 - g_startTime;
    
    // Update animations
    updateAnimations();
    
    // Update camera (for jumping, etc.)
    if (g_camera.updateJump && typeof g_camera.updateJump === 'function') {
        g_camera.updateJump();
    }
    
    // Render the scene
    renderScene();
    requestAnimationFrame(tick);
}

/**
 * Update all animations based on current time
 */
function updateAnimations() {
    // Update animal animations
    g_animalBobHeight = 0.05 * Math.sin(g_seconds * 2);
    g_animalRotation = 5 * Math.sin(g_seconds);
    
    // Update day/night cycle if enabled
    if (g_dayNightCycle) {
        g_timeOfDay = (Math.sin(g_seconds / 30) + 1) / 2;
    }
    
    // Animate light position in a circle
    const radius = g_worldSize / 3;
    g_lightPosition[0] = Math.cos(g_seconds * 0.5 + g_lightAngle) * radius;
    g_lightPosition[1] = 8 + Math.sin(g_seconds * 0.3) * 3; // Vertical bobbing
    g_lightPosition[2] = Math.sin(g_seconds * 0.5 + g_lightAngle) * radius;
}

/**
 * Render the entire scene
 */
function renderScene() {
    // Set up projection matrix
    var projMatrix = new Matrix4();
    projMatrix.setPerspective(g_camera.fov || 60, canvas.width / canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMatrix.elements);
    
    // Set up view matrix from camera
    var viewMatrix = new Matrix4();
    viewMatrix.setLookAt(
        g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
        g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2],
        g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]
    );
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    
    // Set lighting uniforms
    gl.uniform3fv(u_LightPosition, g_lightPosition);
    gl.uniform3fv(u_LightColor, g_lightColor);
    gl.uniform3fv(u_CameraPosition, g_camera.eye.elements);
    gl.uniform1i(u_LightingEnabled, g_lightingEnabled);
    gl.uniform1i(u_NormalVisualization, g_normalVisualization);
    
    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Draw the world
    drawWorld();
    
    // Draw light marker
    drawLightMarker();
}

/**
 * Draw a small cube at the light position to show where the light is
 */
function drawLightMarker() {
    var lightMarker = new Cube();
    lightMarker.color = g_lightColor.concat([1.0]); // Add alpha
    lightMarker.textureNum = -2; // Use solid color
    lightMarker.matrix.translate(g_lightPosition[0], g_lightPosition[1], g_lightPosition[2]);
    lightMarker.matrix.scale(0.5, 0.5, 0.5);
    lightMarker.render();
}

/**
 * Toggle animal visibility
 */
function toggleAnimals() {
    g_showAnimals = !g_showAnimals;
}

/**
 * Toggle day/night cycle
 */
function toggleDayNight() {
    g_dayNightCycle = !g_dayNightCycle;
    
    // Reset time of day if cycle is disabled
    if (!g_dayNightCycle) {
        g_timeOfDay = 0;
    }
}

/**
 * Generate a new world
 */
function generateWorld() {
    initWorldMap();
}

// World.js (Part 2: Terrain Generation and Rendering Functions)

/**
 * Initialize the world map with terrain heights
 * Generates hills, flat areas, and places for animals and flowers
 */
function initWorldMap() {
  // Initialize empty map
  g_worldMap = [];
  for (let i = 0; i < g_worldSize; i++) {
      g_worldMap[i] = [];
      for (let j = 0; j < g_worldSize; j++) {
          g_worldMap[i][j] = 1; // Base height is 1 block
      }
  }
  
  // Generate terrain with hills
  generateTerrain();
  
  // Place animals randomly
  placeAnimals();
  
  // Add flowers
  addFlowers();
  
  addSpheres();
}

/**
* Generate terrain with rolling hills
* Uses a combination of predefined and random hills
*/
function generateTerrain() {
  // Add central mountain
  addHill(g_worldSize/2, g_worldSize/2, 8, 6);
  
  // Add some predefined hills
  addHill(10, 10, 5, 4);
  addHill(20, 8, 4, 3);
  addHill(5, 25, 6, 3);
  addHill(25, 20, 7, 5);
  addHill(15, 18, 3, 2);
  
  // Add some random hills
  for (let i = 0; i < 10; i++) {
      let x = Math.floor(Math.random() * g_worldSize);
      let z = Math.floor(Math.random() * g_worldSize);
      let radius = 2 + Math.floor(Math.random() * 3);
      let height = 1 + Math.floor(Math.random() * 2);
      addHill(x, z, radius, height);
  }
}

/**
* Adds a hill to the map at the specified position
* Uses a radial falloff for natural-looking hills
* @param {number} centerX - X coordinate of hill center
* @param {number} centerZ - Z coordinate of hill center
* @param {number} radius - Radius of the hill
* @param {number} height - Maximum height of the hill
*/
function addHill(centerX, centerZ, radius, height) {
  for (let x = Math.max(0, centerX - radius); x < Math.min(g_worldSize, centerX + radius); x++) {
      for (let z = Math.max(0, centerZ - radius); z < Math.min(g_worldSize, centerZ + radius); z++) {
          // Calculate distance from center
          let distance = Math.sqrt((x - centerX) * (x - centerX) + (z - centerZ) * (z - centerZ));
          
          if (distance < radius) {
              // Calculate height based on distance (higher at center, lower at edges)
              let heightIncrease = Math.floor(height * (1 - distance / radius));
              g_worldMap[x][z] = Math.max(g_worldMap[x][z], 1 + heightIncrease);
          }
      }
  }
}

/**
* Places animals randomly throughout the world
* Ensures animals are placed on flat ground
*/
function placeAnimals() {
  g_animalPositions = [];
  
  // Place pigs
  for (let i = 0; i < 8; i++) {
      placeSingleAnimal(0); // 0 = pig
  }
  
  // Place cows
  for (let i = 0; i < 6; i++) {
      placeSingleAnimal(1); // 1 = cow
  }
}

/**
* Places a single animal in the world
* @param {number} animalType - 0 for pig, 1 for cow
*/
function placeSingleAnimal(animalType) {
  let attempts = 0;
  let placed = false;
  
  while (!placed && attempts < 50) {
      let x = Math.floor(Math.random() * g_worldSize);
      let z = Math.floor(Math.random() * g_worldSize);
      
      // Check if position is suitable
      if (isSuitableForAnimal(x, z)) {
          g_animalPositions.push([x, z, animalType]);
          placed = true;
      }
      
      attempts++;
  }
}

/**
* Checks if a position is suitable for placing an animal
* @param {number} x - X coordinate to check
* @param {number} z - Z coordinate to check
* @returns {boolean} - True if the position is suitable
*/
function isSuitableForAnimal(x, z) {
  // Check bounds
  if (x < 0 || x >= g_worldSize || z < 0 || z >= g_worldSize) {
      return false;
  }
  
  // Check if position is already occupied
  for (let i = 0; i < g_animalPositions.length; i++) {
      if (g_animalPositions[i][0] === x && g_animalPositions[i][1] === z) {
          return false;
      }
  }
  
  // Check height (must be on reasonable terrain)
  let height = g_worldMap[x][z];
  if (height <= 0 || height > 3) {
      return false;
  }
  
  // Check if surrounding area is flat enough
  for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
          let nx = x + dx;
          let nz = z + dz;
          
          if (nx >= 0 && nx < g_worldSize && nz >= 0 && nz < g_worldSize) {
              if (Math.abs(g_worldMap[nx][nz] - height) > 1) {
                  return false; // Too steep
              }
          }
      }
  }
  
  return true;
}

/**
* Adds flowers randomly throughout the world
*/
function addFlowers() {
  g_flowerPositions = [];
  
  for (let i = 0; i < 24; i++) {
      placeSingleFlower();
  }
}

/**
* Places a single flower in the world
*/
function placeSingleFlower() {
  let attempts = 0;
  let placed = false;
  
  while (!placed && attempts < 50) {
      let x = Math.floor(Math.random() * g_worldSize);
      let z = Math.floor(Math.random() * g_worldSize);
      
      // Check if position is suitable
      if (isSuitableForFlower(x, z)) {
          // Random flower color (0=red, 1=yellow, 2=white)
          let color = Math.floor(Math.random() * 3);
          g_flowerPositions.push([x, z, color]);
          placed = true;
      }
      
      attempts++;
  }
}

/**
* Checks if a position is suitable for placing a flower
* @param {number} x - X coordinate to check
* @param {number} z - Z coordinate to check
* @returns {boolean} - True if the position is suitable
*/
function isSuitableForFlower(x, z) {
  // Check bounds
  if (x < 0 || x >= g_worldSize || z < 0 || z >= g_worldSize) {
      return false;
  }
  
  // Check if position is already occupied by another flower
  for (let i = 0; i < g_flowerPositions.length; i++) {
      if (g_flowerPositions[i][0] === x && g_flowerPositions[i][1] === z) {
          return false;
      }
  }
  
  // Check height
  let height = g_worldMap[x][z];
  if (height <= 0 || height > 4) {
      return false;
  }
  
  return true;
}

/**
 * Add spheres to the world during initialization
 */
function addSpheres() {
    g_spherePositions = [];
    
    // Add a few spheres at strategic locations
    g_spherePositions.push({
        x: 5, y: 3, z: 5,
        radius: 1.5,
        color: [1.0, 0.3, 0.3, 1.0], // Red sphere
        textureNum: -2
    });
    
    g_spherePositions.push({
        x: -8, y: 2, z: 10,
        radius: 1.0,
        color: [0.3, 1.0, 0.3, 1.0], // Green sphere
        textureNum: -2
    });
    
    g_spherePositions.push({
        x: 12, y: 4, z: -6,
        radius: 2.0,
        color: [0.3, 0.3, 1.0, 1.0], // Blue sphere
        textureNum: -2
    });
    
    // Add a textured sphere
    g_spherePositions.push({
        x: -5, y: 2, z: -8,
        radius: 1.2,
        color: [1.0, 1.0, 1.0, 1.0], // White for texture
        textureNum: 0 // Use grass texture
    });
}
/**
* Draws the entire world including ground, sky, blocks, animals, and flowers
*/
function drawWorld() {
  drawGround();
  drawSky();
  drawBlocks();
  
  if (g_showAnimals) {
      drawAnimals();
  }
  
  drawFlowers();
  drawSpheres();
}

/**
* Draws the ground plane of the world
*/
function drawGround() {
  var ground = new Cube();
  ground.textureNum = 1; // Use dirt texture
  ground.matrix.translate(-g_worldSize/2, -1.01, -g_worldSize/2);
  ground.matrix.scale(g_worldSize, 0.01, g_worldSize);
  ground.render();
}

/**
* Draws the sky box with a sun
*/
function drawSky() {
  // Sky box
  var sky = new Cube();
  
  // Use sky texture instead of color
  sky.textureNum = 2; // Use sky texture (texture unit 2)
  sky.matrix.translate(-g_worldSize, -g_worldSize, -g_worldSize);
  sky.matrix.scale(g_worldSize * 3, g_worldSize * 3, g_worldSize * 3);
  sky.render();
  
  // Sun
  var sun = new Cube();
  sun.color = [1.0, 0.9, 0.0, 1.0];
  sun.textureNum = -2; // Use solid color for the sun
  
  // Static sun position
  sun.matrix.translate(g_worldSize / 4, g_worldSize / 3, -g_worldSize / 2);
  sun.matrix.scale(2, 2, 0.5);
  sun.render();
}

/**
* Draws all the block elements based on the world map
*/
function drawBlocks() {
  // Create one cube object to reuse
  var block = new Cube();
  
  for (let x = 0; x < g_worldSize; x++) {
      for (let z = 0; z < g_worldSize; z++) {
          let height = g_worldMap[x][z];
          
          for (let y = 0; y < height; y++) {
              // Reset the model matrix for each cube
              block.matrix.setIdentity();
              
              // Choose texture based on position
              if (y === height - 1) {
                  block.textureNum = 0; // Grass texture for top (texture unit 0)
              } else {
                  block.textureNum = 1; // Dirt texture for inside (texture unit 1)
              }
              
              // Position the cube
              block.matrix.translate(x - g_worldSize/2, y - 0.5, z - g_worldSize/2);
              
              // Render the cube
              block.render();
          }
      }
  }
}

/**
* Draws the animals in the world
*/
function drawAnimals() {
  for (let i = 0; i < g_animalPositions.length; i++) {
      let x = g_animalPositions[i][0] - g_worldSize/2;
      let z = g_animalPositions[i][1] - g_worldSize/2;
      let type = g_animalPositions[i][2];
      let y = g_worldMap[g_animalPositions[i][0]][g_animalPositions[i][1]];
      
      if (type === 0) {
          drawPig(x, y, z);
      } else {
          drawCow(x, y, z);
      }
  }
}

/**
* Draws a pig at the specified position
* @param {number} x - X coordinate
* @param {number} y - Y coordinate (height)
* @param {number} z - Z coordinate
*/
function drawPig(x, y, z) {
  // Body
  var body = new Cube();
  body.color = [1.0, 0.8, 0.8, 1.0]; // Pink
  body.textureNum = -2; // Use solid color
  body.matrix.translate(x, y + 0.3 + g_animalBobHeight, z);
  body.matrix.rotate(g_animalRotation, 0, 1, 0);
  body.matrix.scale(0.4, 0.3, 0.6);
  body.render();
  
  // Head
  var head = new Cube();
  head.color = [1.0, 0.8, 0.8, 1.0]; // Pink
  head.textureNum = -2; // Use solid color
  head.matrix.translate(x + 0.3, y + 0.5 + g_animalBobHeight, z);
  head.matrix.rotate(g_animalRotation, 0, 1, 0);
  head.matrix.scale(0.3, 0.3, 0.3);
  head.render();
  
  // Snout
  var snout = new Cube();
  snout.color = [1.0, 0.7, 0.7, 1.0]; // Darker pink
  snout.textureNum = -2; // Use solid color
  snout.matrix.translate(x + 0.5, y + 0.5 + g_animalBobHeight, z);
  snout.matrix.rotate(g_animalRotation, 0, 1, 0);
  snout.matrix.scale(0.1, 0.15, 0.2);
  snout.render();
  
  // Legs
  var legColor = [0.9, 0.7, 0.7, 1.0]; // Slightly darker pink
  
  for (let i = 0; i < 4; i++) {
      var leg = new Cube();
      leg.color = legColor;
      leg.textureNum = -2; // Use solid color
      
      let legX = (i % 2 === 0) ? x - 0.15 : x + 0.15;
      let legZ = (i < 2) ? z - 0.2 : z + 0.2;
      
      leg.matrix.translate(legX, y + 0.1 + g_animalBobHeight * (i < 2 ? 1 : -1), legZ);
      leg.matrix.rotate(g_animalRotation, 0, 1, 0);
      leg.matrix.scale(0.1, 0.2, 0.1);
      leg.render();
  }
}

/**
* Draws a cow at the specified position
* @param {number} x - X coordinate
* @param {number} y - Y coordinate (height)
* @param {number} z - Z coordinate
*/
function drawCow(x, y, z) {
  // Body
  var body = new Cube();
  body.color = [0.2, 0.2, 0.2, 1.0]; // Dark gray
  body.textureNum = -2; // Use solid color
  body.matrix.translate(x, y + 0.4 + g_animalBobHeight, z);
  body.matrix.rotate(g_animalRotation, 0, 1, 0);
  body.matrix.scale(0.5, 0.4, 0.8);
  body.render();
  
  // White patches
  var patches = new Cube();
  patches.color = [1.0, 1.0, 1.0, 1.0]; // White
  patches.textureNum = -2; // Use solid color
  patches.matrix.translate(x + 0.1, y + 0.41 + g_animalBobHeight, z - 0.1);
  patches.matrix.rotate(g_animalRotation, 0, 1, 0);
  patches.matrix.scale(0.3, 0.3, 0.4);
  patches.render();
  
  // Head
  var head = new Cube();
  head.color = [0.3, 0.3, 0.3, 1.0]; // Gray
  head.textureNum = -2; // Use solid color
  head.matrix.translate(x + 0.4, y + 0.6 + g_animalBobHeight, z);
  head.matrix.rotate(g_animalRotation, 0, 1, 0);
  head.matrix.scale(0.35, 0.35, 0.3);
  head.render();
  
  // Horns
  var hornColor = [0.8, 0.8, 0.7, 1.0]; // Light tan
  
  for (let i = 0; i < 2; i++) {
      var horn = new Cube();
      horn.color = hornColor;
      horn.textureNum = -2; // Use solid color
      
      let hornX = x + 0.5;
      let hornZ = i === 0 ? z - 0.15 : z + 0.15;
      
      horn.matrix.translate(hornX, y + 0.9 + g_animalBobHeight, hornZ);
      horn.matrix.rotate(g_animalRotation, 0, 1, 0);
      horn.matrix.scale(0.05, 0.15, 0.05);
      horn.render();
  }
  
  // Legs
  var legColor = [0.2, 0.2, 0.2, 1.0]; // Dark gray
  
  for (let i = 0; i < 4; i++) {
      var leg = new Cube();
      leg.color = legColor;
      leg.textureNum = -2; // Use solid color
      
      let legX = (i % 2 === 0) ? x - 0.2 : x + 0.2;
      let legZ = (i < 2) ? z - 0.3 : z + 0.3;
      
      leg.matrix.translate(legX, y + 0.2 + g_animalBobHeight * (i < 2 ? 1 : -1), legZ);
      leg.matrix.rotate(g_animalRotation, 0, 1, 0);
      leg.matrix.scale(0.1, 0.4, 0.1);
      leg.render();
  }
}

/**
* Draws the flowers throughout the world
*/
function drawFlowers() {
  for (let i = 0; i < g_flowerPositions.length; i++) {
      let x = g_flowerPositions[i][0] - g_worldSize/2;
      let z = g_flowerPositions[i][1] - g_worldSize/2;
      let color = g_flowerPositions[i][2];
      let y = g_worldMap[g_flowerPositions[i][0]][g_flowerPositions[i][1]];
      
      drawFlower(x, y, z, color);
  }
}

/**
* Draws a single flower at the specified position
* @param {number} x - X coordinate
* @param {number} y - Y coordinate (height)
* @param {number} z - Z coordinate
* @param {number} colorType - 0=red, 1=yellow, 2=white
*/
function drawFlower(x, y, z, colorType) {
  // Stem
  var stem = new Cube();
  stem.color = [0.0, 0.7, 0.0, 1.0]; // Green
  stem.textureNum = -2; // Use solid color
  stem.matrix.translate(x, y, z);
  stem.matrix.scale(0.03, 0.5, 0.03);
  stem.render();
  
  // Flower head
  var flowerHead = new Cube();
  
  // Different colors based on flower type
  if (colorType === 0) {
      flowerHead.color = [1.0, 0.0, 0.0, 1.0]; // Red
  } else if (colorType === 1) {
      flowerHead.color = [1.0, 1.0, 0.0, 1.0]; // Yellow
  } else {
      flowerHead.color = [1.0, 1.0, 1.0, 1.0]; // White
  }
  
  flowerHead.textureNum = -2; // Use solid color
  flowerHead.matrix.translate(x, y + 0.5, z);
  flowerHead.matrix.scale(0.15, 0.05, 0.15);
  flowerHead.render();
  
  // Petals
  for (let i = 0; i < 4; i++) {
      var petal = new Cube();
      petal.color = flowerHead.color;
      petal.textureNum = -2; // Use solid color
      
      let angle = i * Math.PI / 2;
      let petalX = x + Math.cos(angle) * 0.1;
      let petalZ = z + Math.sin(angle) * 0.1;
      
      petal.matrix.translate(petalX, y + 0.5, petalZ);
      petal.matrix.scale(0.1, 0.03, 0.1);
      petal.render();
  }
}

function drawSpheres() {
    for (let i = 0; i < g_spherePositions.length; i++) {
        let sphereData = g_spherePositions[i];
        
        var sphere = new Sphere(sphereData.radius);
        sphere.color = sphereData.color;
        sphere.textureNum = sphereData.textureNum;
        sphere.matrix.translate(sphereData.x, sphereData.y, sphereData.z);
        sphere.render();
    }
}