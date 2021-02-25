var canvas = document.getElementById('display'),
    ctx = canvas.getContext('2d');

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Body = Matter.Body,
    Detector = Matter.Detector,
    Constraint = Matter.Constraint,
    Runner = Matter.Runner;

var engine = Engine.create();
var runner = Runner.create();

// Create world
var bodySides = 4;
var bodyRadius = 40;
var legSize = 30;
var nJoints = 2;
var nLegs = 2;
var wordSize = 4;
var variableLegSize = true;
var variableNSides = true;

var isStatic = false;

var deathLine = 300;
var startLine = 100;
var height = 40;
var baseSpeed = Math.PI / 40;
var N = 20;
var L = nLegs * nJoints * (2 * wordSize + 1); // Num legs * Num joints * (Num inner joints * Word size + 1)
if(variableLegSize)
    L += wordSize;
if(variableNSides)
    L += wordSize;


var maxGen = 1000;
var minimize = false;
var train = true;
var displayTicks = !train;
var initialChromosome = undefined;

var alg = new GA(N, L, maxGen, 0.05, 0.7);

var ground = Bodies.rectangle(300, 400, 600, 50, {
    isStatic: true, collisionFilter: {
        category: 1
    }
});


run();