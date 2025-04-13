
let canvas, ctx;
const scale = 20;

function main() {
  canvas = document.getElementById("example");
  if (!canvas) {
    console.log("Canvas not found");
    return;
  }
  ctx = canvas.getContext("2d");
  clearCanvas();

  // Initial vector for step 2
  const v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, "red");
}

function clearCanvas() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVector(v, color) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + v.elements[0] * scale, centerY - v.elements[1] * scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function getInputVectors() {
  const x1 = parseFloat(document.getElementById("x1").value);
  const y1 = parseFloat(document.getElementById("y1").value);
  const x2 = parseFloat(document.getElementById("x2").value);
  const y2 = parseFloat(document.getElementById("y2").value);

  return [
    new Vector3([x1, y1, 0]),
    new Vector3([x2, y2, 0])
  ];
}

function handleDrawEvent() {
  clearCanvas();

  const [v1, v2] = getInputVectors();

  drawVector(v1, "red");
  drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
  clearCanvas();

  const [v1, v2] = getInputVectors();
  const op = document.getElementById("operation").value;
  const scalar = parseFloat(document.getElementById("scalar").value);

  drawVector(v1, "red");
  drawVector(v2, "blue");

  let result;

  switch (op) {
    case "add":
      result = v1.add(v2);
      drawVector(result, "green");
      break;

    case "sub":
      result = v1.sub(v2);
      drawVector(result, "green");
      break;

    case "mul":
      drawVector(v1.mul(scalar), "green");
      drawVector(v2.mul(scalar), "green");
      break;

    case "div":
      if (scalar !== 0) {
        drawVector(v1.div(scalar), "green");
        drawVector(v2.div(scalar), "green");
      } else {
        console.log("Division by zero is not allowed.");
      }
      break;

    case "magnitude":
      console.log("Magnitude of v1:", v1.magnitude());
      console.log("Magnitude of v2:", v2.magnitude());
      drawVector(v1.normalize(), "green");
      drawVector(v2.normalize(), "green");
      break;
    case "normalize":
      drawVector(v1.normalize(), "green");
      drawVector(v2.normalize(), "green");
      break;
    case "angle":
      const dot = Vector3.dot(v1, v2);
      const angle = Math.acos(dot / (v1.magnitude() * v2.magnitude()));
      console.log("Angle between v1 and v2:", angle);
      break;

    case "area":
      const cross = Vector3.cross(v1, v2);
      const area = 0.5 * cross.magnitude();
      console.log("Area of triangle formed by v1 and v2:", area);
      break;
  }
}

