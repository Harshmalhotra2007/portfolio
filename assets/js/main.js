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
        // Force reveal elements to show on load in case IntersectionObserver fails
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));

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

        // Lenis scroll progress bar
        if (typeof lenis !== 'undefined' && lenis && lenis.on) {
            lenis.on('scroll', (e) => {
                const el = document.getElementById('scrollProgress');
                if (!el) return;
                const max = document.documentElement.scrollHeight - window.innerHeight;
                if (max <= 0) { el.style.width = '0%'; return; }
                const scrollY = e.y || e.scrollY || 0;
                el.style.width = Math.min(100, (scrollY / max) * 100) + '%';
            });
        }

        // Smooth-scroll anchor links through Lenis
        if (typeof lenis !== 'undefined' && lenis && lenis.scrollTo) {
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
        }

        // 2. Background Canvas Wireframe Globe (disabled for reduced motion)
        const canvas = document.getElementById('canvas-globe');
        const ctx = canvas.getContext('2d');

        if (prefersReducedMotion) {
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
                    const px = {...p};
                    rotateX(px, rotationAngle + cameraY * 0.5);
                    rotateY(px, rotationAngle * 0.3 + cameraX);
                    return px;
                });

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

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });

        // 4. Scroll progress bar (standalone for accessibility)
        const scrollProgress = document.getElementById('scrollProgress');
        function updateScrollProgress() {
            const winHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (winHeight <= 0) {
                scrollProgress.style.width = '0%';
                return;
            }
            const scrollPct = Math.min(100, (window.scrollY / winHeight) * 100);
            scrollProgress.style.width = scrollPct + '%';
        }
        window.addEventListener('scroll', updateScrollProgress, { passive: true });

        // 5. Scroll Reveal via IntersectionObserver
        const reveals = document.querySelectorAll('.reveal');
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    if (entry.target.id === 'about') {
                        animateSkills();
                    }
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -130px 0px' });
        reveals.forEach(reveal => revealObserver.observe(reveal));

        // 6. Active section navbar highlighting
        const sections = document.querySelectorAll('section');
        const navLinksItems = document.querySelectorAll('.nav-links a');
        function updateActiveNav() {
            let currentId = '';
            sections.forEach(section => {
                const top = section.offsetTop - 120;
                const height = section.clientHeight;
                if (window.scrollY >= top && window.scrollY < top + height) {
                    currentId = section.getAttribute('id');
                }
            });
            navLinksItems.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentId}`) {
                    link.classList.add('active');
                }
            });
        }
        window.addEventListener('scroll', updateActiveNav, { passive: true });

        // 7. Skills segmented loading bars progress animation
        let skillsAnimated = false;
        function animateSkills() {
            if (skillsAnimated) return;
            const progressBars = document.querySelectorAll('.skill-progress');
            progressBars.forEach(bar => {
                const skillLevel = bar.closest('.skill-item').querySelector('.skill-level');
                const widthVal = skillLevel.getAttribute('data-target') + '%';
                bar.style.width = widthVal;
            });
            skillsAnimated = true;
        }

        // 8. Dynamic Typing Subtitle in Hero
        const words = [
            "writing clean code.",
            "designing efficient algorithms.",
            "configuring secure home servers.",
            "troubleshooting hardware setups.",
            "exploring systems & networking."
        ];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        const typingSpeed = 60;
        const erasingSpeed = 30;
        const delayBetweenWords = 1800;
        const typingSpan = document.getElementById('typingSubtitle');

        function typeWords() {
            const currentWord = words[wordIndex];
            const typed = `BCA STUDENT PASSIONATE ABOUT ${currentWord.substring(0, charIndex)}`;
            if (isDeleting) {
                typingSpan.firstChild.nodeValue = typed;
                charIndex--;
            } else {
                typingSpan.firstChild.nodeValue = typed;
                charIndex++;
            }

            if (!isDeleting && charIndex === currentWord.length + 1) {
                isDeleting = true;
                setTimeout(typeWords, delayBetweenWords);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                setTimeout(typeWords, 500);
            } else {
                setTimeout(typeWords, isDeleting ? erasingSpeed : typingSpeed);
            }
        }

        setTimeout(typeWords, 800);

        // 9. Interactive Projects Filter Logic
        const filterButtons = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');

                const categoryFilter = button.getAttribute('data-filter');
                projectCards.forEach(card => {
                    const categories = card.getAttribute('data-categories').split(' ');
                    if (categoryFilter === 'all' || categories.includes(categoryFilter)) {
                        card.classList.remove('hide');
                    } else {
                        card.classList.add('hide');
                    }
                });
            });
        });

        // 10. Contact Form Submission (Mailto fallback for reliability)
        const contactForm = document.getElementById('contactForm');
        const formStatus = document.getElementById('formStatus');
        const formSuccessOverlay = document.getElementById('formSuccessOverlay');
        const resetFormBtn = document.getElementById('resetFormBtn');

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            formStatus.textContent = "[ TRANSMISSION IN PROGRESS ]";
            formStatus.className = "form-status";

            // Use mailto: as reliable fallback (Formspree often fails silently)
            const name = document.getElementById('formName').value.trim();
            const email = document.getElementById('formEmail').value.trim();
            const subject = document.getElementById('formSubject').value.trim();
            const message = document.getElementById('formMessage').value.trim();

            // Build mailto link
            const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=Name: ${encodeURIComponent(name)}%0D%0AEmail: ${encodeURIComponent(email)}%0D%0A%0D%0A${encodeURIComponent(message)}`;

            // Open email client
            window.location.href = mailtoLink;

            contactForm.reset();
            formStatus.textContent = "[ TRANSMISSION SENT SUCCESSFULLY ]";
            formStatus.className = "form-status success";
            formSuccessOverlay.classList.add('active');
        });

        resetFormBtn.addEventListener('click', () => {
            formSuccessOverlay.classList.remove('active');
        });

        // Set current footer year dynamically
        const yearSpan = document.getElementById('currentYear');
        yearSpan.textContent = new Date().getFullYear();
    });
})();