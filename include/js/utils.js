function map(x, in_min, in_max, out_min, out_max) 
{
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function plot(id, data)
{
    if(data.length <= 1)
        return;

    var canvas = document.getElementById(id);
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    var sx = 10;
    var sy = 10;
    
    h -= 20;
    w -= 20;

    var min = Infinity, max = -Infinity;
    for(var i = 0; i < data.length; i++)
    {
        if(data[i] < min)
            min = data[i];
        if(data[i] > max)
            max = data[i];
    }
    
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    
    var x, y;
    for(var i = 0; i < data.length; i++)
    {
        x = map(i, 0, data.length, sx, sx + w);
        y = map(data[i], min, max, sy + h, sy);
        if(i == 0)
            ctx.moveTo(x, y);
        else
            ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function drawPolygon(verts, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    for (var i = 1; i < verts.length; i++) {
        ctx.lineTo(verts[i].x, verts[i].y);
    }
    ctx.lineTo(verts[0].x, verts[0].y);
    ctx.fill();
    ctx.stroke();
}

function connector(bodyA, bodyB, aX, aY, bX, bY) {
    //shorthand for constraint.create with all of the settings needed
    return Constraint.create({
        bodyA: bodyA,
        bodyB: bodyB,
        pointA: { x: aX, y: aY }, //where on body A is the connector
        pointB: { x: bX, y: bY }, //where on body B is the connector
        stiffness: 1,
        length: 0,
        damping: 0.1 //don't jiggle around
    })
}

var ticks = 0;
var populationDead = 0;

function getScore(walker) {
    var score = ((walker.body.bounds.min.x) / ticks) * (1 / walker.getStdHeight());
    if(score < 0)
        score = 0;
    else if(!Number.isFinite(score))
        score = 0;
    return score;
}

function endGeneration() {
    var text = "Generation: " + alg.gen;
    ticks = 0;
    populationDead = 0;

    //reset everything
    World.clear(engine.world);
    Engine.clear(engine);

    var score = alg.update();
    plot('graph', alg.score);

    text += ", Best score: " + score[0] + ", Average score: " + score[1];
    text += ", Best of all: " + alg.best + ", Best score of all: " + alg.bestScore.toFixed(2);


    document.getElementById("gen").innerHTML = text;
}

function run() {

    if(alg.done)
    {
        alg.train = false;
        initialChromosome = alg.best;
        this.N = 1;
        displayTicks = true;
    }
    else
    {
        alg.train = train;
    }

    alg.minimize = minimize;
    alg.prepare(initialChromosome);

    ticks++;

    var shouldDisplay = displayTicks;
    if (ticks % 10 == 0)
        shouldDisplay = true;

    Matter.Runner.tick(runner, engine, 30); //move time forwards 30 milliseconds

    if (shouldDisplay) {
        ctx.clearRect(0, 0, 600, 600);

        ctx.fillStyle = "red";
        ctx.fillRect(0, deathLine, 600, 3);

        ctx.fillStyle = "black";
        ctx.fillRect(startLine - 1, 0, 2, 600);

        drawPolygon(ground.vertices, "green");
    }

    alg.population.forEach((walker, index) => {
        if (ticks % 10 == 0)
            walker.tick();

        if (walker.alive) {
            // if (index == alg.N - 1 && shouldDisplay) {
            //     //if it is the best one of the previous generation, make it white
            //     walker.draw("grey");
            // }
            // else 
            if (shouldDisplay) {
                //if not, color it rainbow and make it semi-transparent
                walker.draw("hsla(" + index * 360 / alg.N + ", 100%, 70%, 30%)");
            }

            if ((walker.body.bounds.max.y > deathLine + 50 && ticks > 100) || !Number.isFinite(walker.body.bounds.max.y)) {
                //kill a robot. sets to static so the computer doesn't have to worry about moving the robot anymore.
                var parts = walker.getVisible();
                for(var i = 0; i < parts.length; i++)
                {
                    Body.setStatic(parts[i], true);    
                }
                // Body.setStatic(walker.body, true);
                // Body.setStatic(walker.leftThigh, true);
                // Body.setStatic(walker.rightThigh, true);
                
                walker.alive = false;
                walker.score = getScore(walker);

                populationDead++;
                if (populationDead == alg.N) {
                    endGeneration();
                }
            }
        }
    });

    if (displayTicks) {
        setTimeout(run, 30);
    } else {
        setTimeout(run, 1);
    }
}