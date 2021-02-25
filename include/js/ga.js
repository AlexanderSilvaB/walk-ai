class GA {
    constructor(N, L, maxGen, pm, pc) {
        this.N = N;
        this.L = L;
        this.maxGen = maxGen;
        this.pm = pm;
        this.pc = pc;
        this.population = [];
        this.score = [];
        this.minimize = true;
        this.train = true;
        this.gen = 0;
        this.done = false;
        this.best = null;
        this.bestScore = null;
    }

    crossover(c1, c2) {
        var locus = Math.floor(Math.random() * this.L);
        var child1 = c1.substr(0, locus) + c2.substr(locus);
        var child2 = c2.substr(0, locus) + c1.substr(locus);
        return [c1, c2];
    }

    mutation(c) {
        var locus = Math.floor(Math.random() * this.L);
        var bit = c[locus];

        if (bit == '0')
            bit = '1';
        else
            bit = '0';

        c = c.substr(0, locus) + bit + c.substr(locus + 1);
        return c;
    }

    fitness(walker) {
        return walker.score;
    }

    newChromossome() {
        var c = '';
        while (c.length < this.L) {
            if (Math.random() < 0.5)
                c += '1';
            else
                c += '0';
        }
        return c;
    }

    select(fitness_pop) {
        var copy = [...fitness_pop];

        var sum = 0;
        for (var i = 0; i < copy.length; i++) {
            sum += copy[i];
        }

        for (var i = 0; i < copy.length; i++) {
            if(this.minimize)
                copy[i] = 1.0 - (copy[i] /  sum);
            else
                copy[i] = (copy[i] /  sum);
            if(Number.isNaN(copy[i]))
                return Math.floor(Math.random() * copy.length);
        }

        var roulette = Math.random();
        var s = 0;
        var k = 0;

        while (k < copy.length) {
            s += copy[k];
            if (roulette < s)
                return k;
            k++;
        }

        return k - 1;
    }

    prepare(chromosome) {
        if (this.population.length != this.N) {
            this.population = [];
            while (this.population.length < this.N) {
                if(!chromosome)
                    this.population.push(new Walker(this.newChromossome()));
                else
                {
                    this.population.push(new Walker(chromosome));
                    if(!this.train)
                    {
                        this.N = 1;
                    }
                }
            }
        }
    }

    update() {
        if(!this.train)
        {
            var score = this.population[0].score;
            var chromosome = this.population[0].chromosome;

            console.log(chromosome + ' -> ' + score + ' | ' + this.population[0].getStdHeight());

            this.bestScore = score;
            this.best = chromosome;

            this.population = [];
            this.population.push(new Walker(chromosome));

            return [score.toFixed(2), score.toFixed(2)];

        }
        var fitness_pop = []
        var new_pop = []

        var f;
        var avg = 0;
        var min = Infinity;
        var minI = 0;
        var max = -Infinity;
        var maxI = 0;
        for (var i = 0; i < this.N; i++) {
            f = this.fitness(this.population[i]);
            fitness_pop.push(f);
            if(f < min)
            {
                min = f;
                minI = i;
            }
            if(f > max)
            {
                max = f;
                maxI = i;
            }
            avg += f;
        }

        var bestForGen = 0;

        if(this.minimize)
        {
            bestForGen = min;
            if(this.bestScore == null || min < this.bestScore)
            {
                this.bestScore = min;
                this.best = this.population[minI].chromosome;
            }
        }
        else
        {
            bestForGen = max;
            if(this.bestScore == null || max > this.bestScore)
            {
                this.bestScore = max;
                this.best = this.population[maxI].chromosome;
            }
        }
            

        avg /= fitness_pop.length;
        this.score.push(avg);

        while (new_pop.length < this.N) {
            var s1 = this.select(fitness_pop);
            if(this.N > 1)
            {
                var s2 = s1;
                while (s1 == s2) {
                    s2 = this.select(fitness_pop);
                }

                var p1 = this.population[s1].chromosome;
                var p2 = this.population[s2].chromosome;
                var c1 = p1;
                var c2 = p2;

                // parents, crossover
                if (Math.random() < this.pc) {
                    var cross = this.crossover(p1, p2);
                    c1 = cross[0];
                    c2 = cross[1];
                }

                // mutation
                if (Math.random() < this.pm)
                    c1 = this.mutation(c1)
                if (Math.random() < this.pm)
                    c2 = this.mutation(c2)

                new_pop.push(c1);
                new_pop.push(c2);
            }
            else
            {
                var c1 = this.population[s1].chromosome;
                if (Math.random() < this.pm)
                    c1 = this.mutation(c1)
                new_pop.push(c1);
            }
        }

        // this.population = new_pop.sort((a, b) => {
        //     return b.score - a.score;
        // });

        this.population = [];
        for(var i = 0; i < this.N; i++)
        {
            this.population.push(new Walker(new_pop[i]));
        }

        this.gen++;
        if(this.maxGen && this.maxGen > 0)
            this.done = this.gen >= this.maxGen;

        return [bestForGen.toFixed(2), avg.toFixed(2)];
    }
}