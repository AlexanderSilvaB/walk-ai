class Walker {
    constructor(chromosome) {
        this.alive = true;
        this.score = 0;
        this.ticks = 0;
        this.heights = [];
        this.chromosome = chromosome;

        this.bodySides = bodySides;
        this.bodyRadius = bodyRadius;
        this.nJoints = nJoints;
        this.nLegs = nLegs;
        this.legSize = legSize;
        this.L = L;
        if(variableLegSize)
            this.L -= wordSize;
        if(variableNSides)
            this.L -= wordSize;

        if(variableLegSize)
        {
            var sizeBin = this.chromosome.substr(this.L, wordSize);
            this.legSize = parseInt(sizeBin, 2) * 10;
        }

        if(variableNSides)
        {
            var offset = variableLegSize ? wordSize : 0;
            var sidesBin = this.chromosome.substr(this.L + offset, wordSize);
            this.bodySides = parseInt(sidesBin, 2);
        }

        if(this.bodySides < 2)
            this.bodySides = 2;
        

        var bodyParams = {
            //make them not intersect
            collisionFilter: {
                category: 2,
                group: Body.nextGroup(false),
                mask: 1
            },
            inertia: Infinity,
            restitution: 0,
            friction: 1,
            frictionAir: 0,
            mass: 0.001,
            isStatic: false
        }

        var x = startLine;
        var y = deathLine - height;
        this.body = Bodies.polygon(x, y, this.bodySides, this.bodyRadius, bodyParams);
        var dx = this.body.vertices[0].x - this.body.vertices[1].x;
        var dy = this.body.vertices[0].y - this.body.vertices[1].y;
        var angle = Math.atan2(dy, dx);
        Body.setAngle(this.body, -angle);

        var parts = [];
        var joints = [];
        var partSize = this.legSize / this.nJoints;
        var n = 0;

        while(parts.length < this.nLegs * this.nJoints)
        {
            var params = JSON.parse(JSON.stringify(bodyParams));
            params.collisionFilter.group = Body.nextGroup(false);

            var vert = this.body.vertices[n % this.body.vertices.length];
            dx = vert.x - x;
            dy = vert.y - y;
            angle = Math.atan2(dy, dx);
            var sx = vert.x;
            var sy = vert.y;
            var ex = sx + partSize * Math.cos(angle);
            var ey = sy + partSize * Math.sin(angle);
            var last = this.body;
            var legParts = [];

            for(var i = 0; i < this.nJoints; i++)
            {
                
                var part = Bodies.rectangle(sx, sy, partSize, 1, params);
                var joint = null;
                if(i == 0)
                    joint = connector(last, part, dx, dy, partSize / 2, 0);
                else
                    joint = connector(last, part, -partSize/2, 0, partSize / 2, 0);

                legParts.push(part);
                parts.push(part);
                joints.push(joint);


                sx = ex;
                sy = ey;
                ex = sx + partSize * Math.cos(angle);
                ey = sy + partSize * Math.sin(angle);
                last = part;
            }

            for(var i = 0; i < legParts.length; i++)
            {
                Body.setAngle(legParts[i], Math.PI + angle);
            }

            n++;
        }

        this.parts = parts;
        this.joints = joints;

        if(isStatic)
            Body.setStatic(this.body, true);

        this.world = World.add(engine.world, [
            ground,
            ...this.getParts()
        ]);
    }

    getStdHeight() {
        var mean = 0;
        for (var i = 0; i < this.heights.length; i++) {
            mean += this.heights[i];
        }
        mean /= this.heights.length;

        var diff, std = 0;
        for (var i = 0; i < this.heights.length; i++) {
            diff = Math.abs(this.heights[i] - mean);
            if (diff > std)
                std = diff;
        }

        return std;
    }

    tick() {
        if(isStatic)
            return;
            
        this.ticks++;
        this.heights.push(this.body.bounds.max.y);

        var l = this.L / (this.nLegs * this.nJoints);
        var lN = l - 1;
        var lB = lN / 2;
        var params = [];
        var joints = this.getJoints();

        for(var i = 0; i < joints.length; i++)
        {
            var param = {};
            param.binRef = this.chromosome.substr(i * l, lB);
            param.binTurn = this.chromosome.substr((i * l) + lB, lB);
            param.sign = this.chromosome[(i * l) + (2 * lB)] == '1' ? -1 : 1;
            param.ref = parseInt(param.binRef, 2);
            param.turn = parseInt(param.binTurn, 2);
            param.val = baseSpeed * param.ref * param.sign;
            if (this.ticks % param.turn == 0)
                param.val = -param.val;
            params.push(param);
        }

        for(var i = 0; i < joints.length; i++)
        {
            Body.setAngularVelocity(joints[i], params[i].val);
        }
    }

    getParts() {
        return this.parts.concat(this.joints).concat([this.body]);
    }

    getJoints()
    {
        return this.parts;
    }

    getVisible()
    {
        return this.parts.concat([this.body]);   
    }

    draw(color) {
        drawPolygon(this.body.vertices, color);
        
        for(var i = 0; i < this.parts.length; i++)
        {
            drawPolygon(this.parts[i].vertices, "black");
        }
    }
}