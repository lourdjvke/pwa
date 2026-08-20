class SquishyBall {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8 - 3;
        this.radius = radius;
        this.color = color;
        this.numPoints = 16;
        this.points = [];

        for (let i = 0; i < this.numPoints; i++) {
            const angle = (i / this.numPoints) * Math.PI * 2;
            this.points.push({
                angle: angle,
                dist: radius,
                targetDist: radius,
                vDist: 0
            });
        }
    }

    update(width, height) {
        const gravity = 0.35;
        const friction = 0.99;
        const k = 0.2; // Spring elasticity coefficient
        const damping = 0.82; // Spring dampening

        this.vy += gravity;
        this.x += this.vx;
        this.y += this.vy;

        this.vx *= friction;
        this.vy *= friction;

        // Wall Collisions & Squish Dynamics
        if (this.y + this.radius > height) {
            this.y = height - this.radius;
            const impact = Math.abs(this.vy);
            this.vy *= -0.72;
            this.squish(Math.PI / 2, impact * 1.8);
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            const impact = Math.abs(this.vy);
            this.vy *= -0.72;
            this.squish(-Math.PI / 2, impact * 1.8);
        }
        if (this.x + this.radius > width) {
            this.x = width - this.radius;
            const impact = Math.abs(this.vx);
            this.vx *= -0.72;
            this.squish(0, impact * 1.8);
        }
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            const impact = Math.abs(this.vx);
            this.vx *= -0.72;
            this.squish(Math.PI, impact * 1.8);
        }

        // Update Perimeter Rim Points
        for (let p of this.points) {
            const force = (p.targetDist - p.dist) * k;
            p.vDist += force;
            p.vDist *= damping;
            p.dist += p.vDist;
        }
    }

    squish(impactAngle, force) {
        for (let p of this.points) {
            const diff = Math.cos(p.angle - impactAngle);
            p.vDist -= diff * force;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.beginPath();

        const coords = this.points.map(p => ({
            x: Math.cos(p.angle) * p.dist,
            y: Math.sin(p.angle) * p.dist
        }));

        ctx.moveTo((coords[0].x + coords[this.numPoints - 1].x) / 2, (coords[0].y + coords[this.numPoints - 1].y) / 2);
        for (let i = 0; i < this.numPoints; i++) {
            const nextIdx = (i + 1) % this.numPoints;
            const midX = (coords[i].x + coords[nextIdx].x) / 2;
            const midY = (coords[i].y + coords[nextIdx].y) / 2;
            ctx.quadraticCurveTo(coords[i].x, coords[i].y, midX, midY);
        }

        ctx.closePath();
        ctx.fill();

        // Inner soft glint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.25, -this.radius * 0.25, this.radius * 0.22, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('physics-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const balls = [];
    const colors = ['#7c5cfc', '#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7'];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function spawnBall(x, y) {
        const radius = Math.random() * 20 + 35;
        const color = colors[Math.floor(Math.random() * colors.length)];
        balls.push(new SquishyBall(x, y, radius, color));
        if (balls.length > 25) balls.shift();
    }

    // Spawn initial balls
    spawnBall(window.innerWidth / 2 - 50, 100);
    spawnBall(window.innerWidth / 2 + 50, 150);

    canvas.addEventListener('pointerdown', (e) => {
        spawnBall(e.clientX, e.clientY);
    });

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let ball of balls) {
            ball.update(canvas.width, canvas.height);
            ball.draw(ctx);
        }
        requestAnimationFrame(loop);
    }
    loop();
});