// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .catch(err => console.log('SW registration failed:', err));
    });
}

// Global PWA Install Prompt Handler
let deferredPrompt = null;

function injectInstallPrompt() {
    const card = document.createElement('div');
    card.id = 'pwa-install-card';
    card.className = 'pwa-card pwa-card-hidden';
    card.innerHTML = `
        <div class="pwa-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        </div>
        <div class="pwa-card-content">
            <div class="pwa-card-title">Install Squishy</div>
            <div class="pwa-card-desc">Add to home screen for offline play.</div>
        </div>
        <div class="pwa-card-actions">
            <button id="pwa-install-btn" class="pwa-btn pwa-btn-primary">Install</button>
            <button id="pwa-dismiss-btn" class="pwa-btn pwa-btn-close" aria-label="Dismiss">&times;</button>
        </div>
    `;
    document.body.appendChild(card);

    const installBtn = document.getElementById('pwa-install-btn');
    const dismissBtn = document.getElementById('pwa-dismiss-btn');

    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            card.classList.add('pwa-card-hidden');
        }
        deferredPrompt = null;
    });

    dismissBtn.addEventListener('click', () => {
        card.classList.add('pwa-card-hidden');
    });
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const card = document.getElementById('pwa-install-card');
    if (card) {
        card.classList.remove('pwa-card-hidden');
    }
});

// Spring Soft-Body Physics Implementation
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

// Canvas Setup and Main Loop
window.addEventListener('DOMContentLoaded', () => {
    injectInstallPrompt();

    const canvas = document.getElementById('physics-canvas');
    const ctx = canvas.getContext('2d');
    const balls = [];
    const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

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

    // Initial balls
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