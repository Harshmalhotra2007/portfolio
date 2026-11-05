// IIFE to avoid polluting the global namespace
(() => {
    'use strict';

    // Always land at the top of the page on refresh/reload
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('DOMContentLoaded', () => {
        window.scrollTo(0, 0);

        // Centralized contact email — update this single value to
        // change every mailto link and the fallback line in the
        // success overlay.
        const CONTACT_EMAIL = 'harshmalhotra2007@gmail.com';
        const emailLink = document.getElementById('contactEmail');
        const fallbackEmail = document.getElementById('fallbackEmail');
        if (emailLink) {
            emailLink.textContent = CONTACT_EMAIL;
            emailLink.setAttribute('href', 'mailto:' + CONTACT_EMAIL);
        }
        if (fallbackEmail) {
            fallbackEmail.textContent = CONTACT_EMAIL;
            fallbackEmail.setAttribute('href', 'mailto:' + CONTACT_EMAIL);
        }

        // 1. Lenis Smooth Scroll Initialization
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: !prefersReducedMotion,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        let rafRunning = true;
        function raf(time) {
            if (!rafRunning) return;
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Lenis drives scrolling, so native 'scroll' events never fire.
        // Update the progress bar from Lenis's scroll callback instead.
        lenis.on('scroll', (e) => {
            const el = document.getElementById('scrollProgress');
            if (!el) return;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            if (max <= 0) { el.style.width = '0%'; return; }
            el.style.width = Math.min(100, (e.scrollY / max) * 100) + '%';
        });

        // Smooth-scroll anchor links through Lenis so the scroll
        // animation is consistent (native scroll-behavior is disabled
        // by Lenis, so plain clicks would jump).
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a[href^="#"]');
            if (!anchor) return;
            const id = anchor.getAttribute('href');
            if (id.length <= 1) return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            lenis.scrollTo(target, { offset: -100, duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        });

        // 2. Background Canvas Wireframe Globe Drawing Logic
        const canvas = document.getElementById('canvas-globe');
        const ctx = canvas.getContext('2d');

        // If user prefers reduced motion, don't animate the globe
        if (!canvas || prefersReducedMotion) {
            canvas.style.visibility = 'hidden';
            canvas.style.display = 'none';
        } else {
            let width = canvas.width = window.innerWidth;
            let height = canvas.height = window.innerHeight;

            let mouseX = -1000;
            let mouseY = -1000;

            window.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });

            window.addEventListener('mouseout', () => {
                mouseX = -1000;
                mouseY = -1000;
            });

            window.addEventListener('resize', () => {
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
            });

            // Pause the animation when the tab is hidden to save CPU/battery
            let paused = false;
            document.addEventListener('visibilitychange', () => {
                paused = document.hidden;
                rafRunning = !paused;
                if (!paused) lastFrameTime = 0;
            });

            // Sphere 3D Wireframe Coordinates
            const points = [];
            const latCount = 14;
            const lonCount = 22;
            const radius = 240;

            for (let i = 0; i <= latCount; i++) {
                const lat = (i * Math.PI) / latCount - Math.PI / 2;
                for (let j = 0; j < lonCount; j++) {
                    const lon = (j * 2 * Math.PI) / lonCount;
                    points.push({
                        x: radius * Math.cos(lat) * Math.cos(lon),
                        y: radius * Math.sin(lat),
                        z: radius * Math.cos(lat) * Math.sin(lon),
                        latIdx: i,
                        lonIdx: j
                    });
                }
            }

            function rotateX(point, angle) {
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const y = point.y * cos - point.z * sin;
                const z = point.y * sin + point.z * cos;
                point.y = y;
                point.z = z;
            }

            function rotateY(point, angle) {
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const x = point.x * cos - point.z * sin;
                const z = point.x * sin + point.z * cos;
                point.x = x;
                point.z = z;
            }

            let lastFrameTime = 0;
            let rotationAngle = 0;

            function drawGlobe(timestamp) {
                if (!rafRunning) return;
                const deltaTime = timestamp - lastFrameTime;
                lastFrameTime = timestamp;

                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.fillRect(0, 0, width, height);
                ctx.fillStyle = 'rgba(0, 255, 102, 0.4)';
                ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
                ctx.lineWidth = 1.2;

                const fov = 500;
                const centerX = width / 2;
                const centerY = height / 2;

                const cameraX = (mouseX - centerX) * 0.001;
                const cameraY = (mouseY - centerY) * 0.001;

                const transformedPoints = points.map(p => {
                    const px = { ...p };
                    rotateX(px, rotationAngle + cameraY * 0.5);
                    rotateY(px, rotationAngle * 0.3 + cameraX);
                    return px;
                });

                // Draw lines between adjacent points
                for (const p of transformedPoints) {
                    const sx = centerX + (p.x * fov) / (p.z + fov);
                    const sy = centerY + (p.y * fov) / (p.z + fov);

                    for (let j = 0; j < lonCount; j++) {
                        const neighbor = transformedPoints[p.latIdx * lonCount + ((j + 1) % lonCount)];
                        if (neighbor) {
                            const nsx = centerX + (neighbor.x * fov) / (neighbor.z + fov);
                            const nsy = centerY + (neighbor.y * fov) / (neighbor.z + fov);
                            ctx.beginPath();
                            ctx.moveTo(sx, sy);
                            ctx.lineTo(nsx, nsy);
                            ctx.stroke();
                        }
                    }

                    // Connect latitude lines
                    if (p.latIdx > 0) {
                        const prevLat = transformedPoints[(p.latIdx - 1) * lonCount + p.lonIdx];
                        if (prevLat) {
                            const psx = centerX + (prevLat.x * fov) / (prevLat.z + fov);
                            const psy = centerY + (prevLat.y * fov) / (prevLat.z + fov);
                            ctx.beginPath();
                            ctx.moveTo(sx, sy);
                            ctx.lineTo(psx, psy);
                            ctx.stroke();
                        }
                    }
                }

                rotationAngle += 0.001;
                requestAnimationFrame(drawGlobe);
            }

            requestAnimationFrame(drawGlobe);
        }

        // 3. Mobile Menu Toggle Logic
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.getElementById('navLinks');
        menuToggle.setAttribute('aria-expanded', 'false');

        menuToggle.addEventListener('click', () => {
            const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', String(!expanded));
            navLinks.classList.toggle('active');
        });

        // Close mobile menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });

        // 4. Project Filter Logic
        const filterButtons = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');

        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update button states
                filterButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');

                const filter = btn.dataset.filter;
                projectCards.forEach(card => {
                    const categories = card.dataset.category.split(' ');
                    if (filter === 'all' || categories.includes(filter)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // 5. Contact Form Submission
        const contactForm = document.getElementById('contactForm');
        const formStatus = document.getElementById('formStatus');
        const formSuccessOverlay = document.getElementById('formSuccessOverlay');
        const resetFormBtn = document.getElementById('resetFormBtn');

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            formStatus.textContent = "[ TRANSMISSION IN PROGRESS ]";
            formStatus.className = "form-status";

            try {
                // Placeholder for real Formspree submission
                // Using Formspree as an example - you need to create a Formspree form
                // and replace YOUR_FORMSPREE_ID with the actual form ID
                const response = await fetch('https://formspree.io/f/YOUR_FORMSPREE_ID', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    body: new FormData(contactForm)
                });

                const data = await response.json();
                if (data.ok) {
                    contactForm.reset();
                    formStatus.textContent = "[ TRANSMISSION SENT SUCCESSFULLY ]";
                    formStatus.className = "form-status success";
                    formSuccessOverlay.classList.add('active');
                } else {
                    const reason = (data.errors && data.errors.length)
                        ? data.errors.map(e => e.message).join(" ")
                        : "unknown";
                    formStatus.textContent = "[ TRANSMISSION REJECTED: " + reason.toUpperCase() + " ]";
                    formStatus.className = "form-status error";
                }
            } catch (error) {
                // Mock success for development (remove when using real backend)
                // In production, this would be the catch block above
                if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    contactForm.reset();
                    formStatus.textContent = "[ TRANSMISSION SENT SUCCESSFULLY ]";
                    formStatus.className = "form-status success";
                    formSuccessOverlay.classList.add('active');
                } else {
                    formStatus.textContent = "[ CONNECTION ERROR: CHECK NETWORK ]";
                    formStatus.className = "form-status error";
                }
            }
        });

        resetFormBtn.addEventListener('click', () => {
            formSuccessOverlay.classList.remove('active');
        });

        // Set current footer year dynamically
        const yearSpan = document.getElementById('currentYear');
        yearSpan.textContent = new Date().getFullYear();

        // Trigger initial scroll reveal trigger
        window.dispatchEvent(new Event('scroll'));
    });
})();