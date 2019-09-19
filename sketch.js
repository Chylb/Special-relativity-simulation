var WIDTH;
var HEIGHT;

var up;

var mouseSensitivity = 0.003;

var constantSpeed = false;
var constantRotation = false;
var reset = false;
var stop = false;
var fi;
var si;
var vi;
var right;
var front;

var pitch = 0;
var yaw = 270;

var camPos;
var cameraFront;
var camUp;
var camVel;
var direction;
var camTarget;

var ite = 0;

var fontHelvetica;
var buff;

var program;

var prevTime;
var time;
var etherTime = 0;

var debugPos;

var g;
var b;
var n;
var boost;

function setup() {
  WIDTH = windowWidth - 20;
  HEIGHT = windowHeight - 20;
  var canvas = createCanvas(WIDTH, HEIGHT);
  canvas.id('myCanvas');
    
  myCanvas.addEventListener("mousemove", e => {
    yaw += e.movementX * mouseSensitivity;
    pitch += e.movementY * mouseSensitivity;
  });
  buff = createGraphics(WIDTH, HEIGHT, WEBGL);
  //setAttributes('antialias', true);

  camPos = createVector(-5,0,0);
  cameraFront = createVector(0,0,-1);
  camUp = createVector(0,1,0);
  camVel = createVector(0,0,0);

  direction = createVector();
  camTarget = createVector();

  buff.perspective( radians(60), WIDTH/HEIGHT, 0.1, 1000.0);
  
  buff.stroke(100);
  buff.strokeWeight(0.03);
  //buff.noStroke();

  stroke(0);
  strokeWeight(3);
  
  //defaultScenario();
  //lightScenario();
  simultaneityScenario();

  debugPos = createVector(0,0,0);  

  prevTime = Date.now();
  
  up = createVector(0,1,0);
}

function draw() {
  ite++;
  time = Date.now();
  let dt = (time - prevTime)/1000;
  prevTime = time;

  if(pitch > HALF_PI)
    pitch =  HALF_PI;
  if(pitch < -HALF_PI)
    pitch = -HALF_PI;

  direction.x = cos(pitch) * cos(yaw);
  direction.y = sin(pitch);
  direction.z = cos(pitch) * sin(yaw);

  fi = 0;
  si = 0;
  vi = 0;

  if (keyIsDown(87)) fi += 1;
  if (keyIsDown(83)) fi -= 1;
  if (keyIsDown(68)) si += 1;
  if (keyIsDown(65)) si -= 1;
  if (keyIsDown(16)) vi -= 1;
  if (keyIsDown(17)) vi += 1;

  right = p5.Vector.cross(direction,up);
  front = p5.Vector.cross(up, right);

  if(!constantSpeed)
    camVel.mult(0.95);

  let dv;
  if(!constantRotation) {
    dv = createVector(0,0,0);
    dv.add(right.mult(si));
    dv.add(front.mult(fi));
    dv.add(up.copy().mult(vi));
    dv.normalize();
  }
  else {
    dv = camVel.copy();
    dv.normalize();
    dv.mult(fi);
  }

  if(!constantSpeed)
    dv.mult(0.0499);
  else
    dv.mult((1-camVel.mag())/100);

  camVel.add(dv);
  
  if(reset){
    reset = false;
    camPos.x = 0;
    camPos.y = 0;
    camPos.z = 0;
    camVel.x = 0;
    camVel.y = 0;
    camVel.z = 0;
  }
  if(stop){
    stop = false;
    camVel.x = 0;
    camVel.y = 0;
    camVel.z = 0;
  }

  let det = dt / sqrt(1-camVel.magSq());
  //let det = 1 / sqrt(1-camVel.magSq());

  etherTime += det;
  
  camPos.add(camVel.copy().mult( det ));

  b = camVel.mag();
  g = 1 / sqrt(1 - camVel.magSq());
  if(camVel.magSq() == 0)
    n = createVector(0,0,0);
  else
    n = camVel.copy().normalize();

  boost = [
      g, -g*b*n.x, -g*b*n.y, -g*b*n.z,
      -g*b*n.x, 1+(g-1)*n.x*n.x, (g-1)*n.x*n.y, (g-1)*n.x*n.z,
      -g*b*n.y, (g-1)*n.y*n.x, 1+(g-1)*n.y*n.y, (g-1)*n.y*n.z,
      -g*b*n.z, (g-1)*n.z*n.x, (g-1)*n.z*n.y, 1+(g-1)*n.z*n.z
  ];

  buff.camera(0,0,0, direction.x, direction.y, direction.z, 0, 1, 0);

  buff.background(0);
  
  buff.fill(255);

  for(let b of bodies){
    b.update();
    b.show(buff);
  }
  
  image(buff,0,0);  


  fill(255);
  text("Position: " +camPos.x.toFixed(2) + "  " +camPos.y.toFixed(2)+"  "+camPos.z.toFixed(2) , 10, 10);
  text("Velocity: " +camVel.mag().toFixed(4), 10, 30);
  text("Time: " + etherTime.toFixed(2), 10, 50);
  if(constantSpeed)
    text("Constant speed", 10, 70);
  if(constantRotation)
    text("Constant rotation", 10, 90);
}

function mousePressed() {
  let canvas = document.getElementById("myCanvas");
  lockPointer(canvas);
}

function keyPressed() {
  if (keyCode == 67){
    if(constantSpeed) constantSpeed = false;
    else constantSpeed = true;
  }
  if (keyCode == 81){
    if(constantRotation) constantRotation = false;
    else constantRotation = true;
  }
  if(keyCode == 82){
    reset = true;
  }
  if(keyCode == 32){
    stop = true;
  }
  if(keyCode == 76){
    direction = camVel.copy().normalize();
    pitch = degrees(asin(direction.y));
    let flat = createVector(direction.x, direction.z);
    yaw = degrees(flat.heading());  
  }
  if(keyCode == 69){
    let light = new Cube(camPos.x,camPos.y,camPos.z,0.1,0.1,0.1,color(255,255,0));
    light.vel = direction.copy();
    light.pos.sub( light.vel.copy().mult(etherTime));
  }
  if(keyCode == 37)
    yaw -= 45;
  if(keyCode == 39)
    yaw += 45;
  return false; // prevent any default behavior
}

function lockPointer(elem) {
  if (elem.requestPointerLock) {
    elem.requestPointerLock();
  } else if (elem.webkitRequestPointerLock) {
    elem.webkitRequestPointerLock();
  } else if (elem.mozRequestPointerLock) {
    elem.mozRequestPointerLock();
  } else {
    console.warn("Pointer locking not supported");
  }
}

