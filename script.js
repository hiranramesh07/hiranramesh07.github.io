document.addEventListener('DOMContentLoaded', () => {
    // --- Lenis Smooth Scroll ---
    if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        window.lenis = lenis;

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);
    }

    // --- Custom Cursor ---
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');

    // Only enable custom cursor if device supports hover (not standard touch devices)
    if (window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            // Dot follows instantly
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            // Outline follows with slight delay
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        // Hover effect for links and buttons
        const interactables = document.querySelectorAll('a, button, .portfolio-item');
        interactables.forEach(link => {
            link.addEventListener('mouseenter', () => {
                cursorOutline.style.width = '60px';
                cursorOutline.style.height = '60px';
                cursorOutline.style.backgroundColor = 'rgba(252, 163, 17, 0.1)';
            });
            
            link.addEventListener('mouseleave', () => {
                cursorOutline.style.width = '40px';
                cursorOutline.style.height = '40px';
                cursorOutline.style.backgroundColor = 'transparent';
            });
        });
    }
    // --- SVG Blob Lag-Chain Engine (Desktop & Mobile Optimized) ---
    (function () {
        const svg  = document.getElementById('hero-blob-svg');
        const hero = document.querySelector('.hero');
        
        if (!svg || !hero) return; // Guard clause if elements don't exist on page
        const N    = 10;
        const VW   = 1440, VH = 900;

        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;
        const isMobileScreen = () => window.innerWidth <= 768;

        const blobs = [
            { id: 'hero-mask-a', lag: 0.22, minR: 78, maxR: 100, spd: 0.00055, phase: 0.0 },
            { id: 'hero-mask-b', lag: 0.16, minR: 100, maxR: 124, spd: 0.00048, phase: 0.9 },
            { id: 'hero-mask-c', lag: 0.12, minR: 110, maxR: 134, spd: 0.00060, phase: 1.8 },
            { id: 'hero-mask-d', lag: 0.09, minR: 98, maxR: 120, spd: 0.00042, phase: 2.7 },
            { id: 'hero-mask-e', lag: 0.07, minR: 87, maxR: 107, spd: 0.00065, phase: 3.6 },
            { id: 'hero-mask-f', lag: 0.05, minR: 76, maxR:  93, spd: 0.00050, phase: 4.5 },
            { id: 'hero-mask-g', lag: 0.038, minR: 62, maxR:  79, spd: 0.00070, phase: 5.4 },
            { id: 'hero-mask-h', lag: 0.028, minR: 50, maxR:  65, spd: 0.00045, phase: 6.3 },
            { id: 'hero-mask-i', lag: 0.020, minR: 40, maxR:  54, spd: 0.00058, phase: 7.2 },
            { id: 'hero-mask-j', lag: 0.015, minR: 31, maxR:  42, spd: 0.00062, phase: 8.1 },
            { id: 'hero-mask-k', lag: 0.010, minR: 23, maxR:  34, spd: 0.00075, phase: 9.0 },
            { id: 'hero-mask-l', lag: 0.007, minR: 14, maxR:  25, spd: 0.00068, phase: 9.9 },
        ];

        blobs.forEach(b => {
            b.el = document.getElementById(b.id);
            b.cx = VW * 0.5;
            b.cy = VH * 0.5;
        });

        let rawX = VW * 0.5, rawY = VH * 0.5;
        let velX = 0, velY = 0;
        let prevX = rawX, prevY = rawY;

        // Always keep visible on mobile/touch, auto-play active
        let autoPlay = true;
        let isUserInteracting = false;
        let resumeAutoTimer = null;

        // Kick off: blobs visible immediately
        svg.style.opacity = '1';

        // ── Auto-move with viewport-aware boundaries ───────────────────────
        function autoMove(t) {
            const r = hero.getBoundingClientRect();
            const elemW = r.width || VW;
            const elemH = r.height || VH;
            // Visible slice scaling
            const scale = Math.max(elemW / VW, elemH / VH);
            const visibleW = elemW / scale;
            const visibleH = elemH / scale;

            // Constrain oscillation so blob stays completely inside visible mobile screen
            const ampX = Math.min(visibleW * 0.32, VW * 0.30);
            const ampY = Math.min(visibleH * 0.26, VH * 0.25);

            const s  = t * 0.0007;
            const nx = VW * 0.5 + ampX * Math.sin(s * 1.0);
            const ny = VH * 0.5 + ampY * Math.sin(s * 1.6 + 0.8);
            velX = nx - rawX;
            velY = ny - rawY;
            prevX = rawX; prevY = rawY;
            rawX = nx;    rawY = ny;
        }

        // ── Slice-aware coordinate conversion ─────────────────────────────
        function toSVG(px, py) {
            const r = hero.getBoundingClientRect();
            const elemW = r.width || 1;
            const elemH = r.height || 1;
            const scale = Math.max(elemW / VW, elemH / VH);
            const renderedW = VW * scale;
            const renderedH = VH * scale;
            const offsetX = (elemW - renderedW) * 0.5;
            const offsetY = (elemH - renderedH) * 0.5;

            return {
                x: ((px - r.left) - offsetX) / scale,
                y: ((py - r.top)  - offsetY) / scale
            };
        }

        // ── Interaction Handlers ──────────────────────────────────────────
        function onPointerStart(px, py) {
            isUserInteracting = true;
            autoPlay = false;
            clearTimeout(resumeAutoTimer);
            svg.style.opacity = '1';
            const p = toSVG(px, py);
            rawX = p.x; rawY = p.y;
            prevX = p.x; prevY = p.y;
            velX = 0; velY = 0;
        }

        function onPointerMove(px, py) {
            if (!isUserInteracting && autoPlay) {
                // If desktop mouse moved over hero
                isUserInteracting = true;
                autoPlay = false;
            }
            svg.style.opacity = '1';
            const p = toSVG(px, py);
            velX = p.x - prevX;
            velY = p.y - prevY;
            prevX = rawX; prevY = rawY;
            rawX = p.x;   rawY = p.y;
        }

        function onPointerEnd() {
            isUserInteracting = false;
            // Seamlessly resume ambient animation so screen is never dead
            clearTimeout(resumeAutoTimer);
            resumeAutoTimer = setTimeout(() => {
                autoPlay = true;
            }, 800);
        }

        // Desktop Mouse Listeners
        hero.addEventListener('mouseenter', e => {
            onPointerStart(e.clientX, e.clientY);
        });

        hero.addEventListener('mousemove', e => {
            onPointerMove(e.clientX, e.clientY);
        });

        hero.addEventListener('mouseleave', () => {
            onPointerEnd();
        });

        // Mobile Touch Listeners (passive for smooth non-blocking scrolling)
        hero.addEventListener('touchstart', e => {
            if (e.touches && e.touches.length > 0) {
                onPointerStart(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        hero.addEventListener('touchmove', e => {
            if (e.touches && e.touches.length > 0) {
                onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        hero.addEventListener('touchend', () => {
            onPointerEnd();
        }, { passive: true });

        hero.addEventListener('touchcancel', () => {
            onPointerEnd();
        }, { passive: true });

        // ── Path builder ──────────────────────────────────────────────────
        function buildPath(b, t) {
            const bvx = (b.vx !== undefined) ? b.vx * 3 : velX;
            const bvy = (b.vy !== undefined) ? b.vy * 3 : velY;
            
            const vel     = Math.sqrt(bvx * bvx + bvy * bvy);
            const stretch = Math.min(vel * 1.2, 70);
            const vAngle  = Math.atan2(bvy, bvx);
            const pts     = [];

            const radiusMult = isMobileScreen() ? 0.9 : 1.0;

            for (let i = 0; i < N; i++) {
                const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
                const r = (b.minR + (b.maxR - b.minR) * 0.5 * (
                    1
                    + 0.50 * Math.sin(t * b.spd       + angle * 1.3 + b.phase)
                    + 0.30 * Math.sin(t * b.spd * 1.8 + angle * 2.1 + b.phase * 0.7)
                    + 0.20 * Math.sin(t * b.spd * 2.9 + angle * 0.9 + b.phase * 1.5)
                )) * radiusMult;
                const elongate = stretch * Math.cos(angle - vAngle);
                pts.push({
                    x: b.cx + (r + elongate) * Math.cos(angle),
                    y: b.cy + (r + elongate) * Math.sin(angle)
                });
            }

            let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
            for (let i = 0; i < N; i++) {
                const p0 = pts[(i - 1 + N) % N], p1 = pts[i],
                      p2 = pts[(i + 1) % N],     p3 = pts[(i + 2) % N];
                const cp1x = p1.x + (p2.x - p0.x) / 6, cp1y = p1.y + (p2.y - p0.y) / 6;
                const cp2x = p2.x - (p3.x - p1.x) / 6, cp2y = p2.y - (p3.y - p1.y) / 6;
                d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)},${cp2x.toFixed(1)} ${cp2y.toFixed(1)},${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
            }
            return d + ' Z';
        }

        // ── Animation loop ────────────────────────────────────────────────
        function loop(t) {
            if (autoPlay) {
                autoMove(t);
            } else {
                velX *= 0.78;
                velY *= 0.78;
            }

            blobs.forEach((b, i) => {
                const targetX = i === 0 ? rawX : blobs[i - 1].cx;
                const targetY = i === 0 ? rawY : blobs[i - 1].cy;
                
                const prevCx = b.cx;
                const prevCy = b.cy;
                
                b.cx += (targetX - b.cx) * b.lag;
                b.cy += (targetY - b.cy) * b.lag;
                
                b.vx = b.cx - prevCx;
                b.vy = b.cy - prevCy;
                
                if (b.el) b.el.setAttribute('d', buildPath(b, t));
            });

            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    })();


    // --- GSAP Magnetic Effects ---
    if (typeof gsap !== 'undefined') {
        const heroSection = document.querySelector('.hero');
        const magneticElements = document.querySelectorAll('[data-magnetic]');

        // Mouse Tracking & Magnetic Pull
        if (window.matchMedia("(pointer: fine)").matches && heroSection) {
            heroSection.addEventListener('mousemove', (e) => {
                const { clientX, clientY } = e;

                // Magnetic effect for text/buttons
                magneticElements.forEach((el) => {
                    const rect = el.getBoundingClientRect();
                    const elCenterX = rect.left + rect.width / 2;
                    const elCenterY = rect.top + rect.height / 2;
                    
                    const distX = clientX - elCenterX;
                    const distY = clientY - elCenterY;
                    const distance = Math.sqrt(distX * distX + distY * distY);
                    
                    const magneticRadius = 250;
                    
                    if (distance < magneticRadius) {
                        const pullFactor = 0.2 * (1 - distance / magneticRadius);
                        gsap.to(el, { x: distX * pullFactor, y: distY * pullFactor, duration: 0.4, ease: 'power2.out' });
                    } else {
                        gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
                    }
                });
            });

            heroSection.addEventListener('mouseleave', () => {
                magneticElements.forEach((el) => {
                    gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
                });
            });

            // Hover scale and glow effects
            magneticElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    el.classList.add('magnetic-hover');
                    gsap.to(el, { scale: 1.05, duration: 0.3, ease: 'power2.out' });
                });
                el.addEventListener('mouseleave', () => {
                    el.classList.remove('magnetic-hover');
                    gsap.to(el, { scale: 1, duration: 0.3, ease: 'power2.out' });
                });
            });
        }
    }

    // --- Mobile Navigation ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.hero-nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.hero-nav-links a').forEach(n => n.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }));
    }

    // --- Smart Navbar: hide on scroll-down, show on scroll-up ---
    const navbar = document.querySelector('.hero-navbar');
    let lastScrollY = 0;

    if (navbar) {
        window.addEventListener('scroll', () => {
            const y = window.scrollY;

            if (y <= 80) {
                // In hero — transparent, fully visible
                navbar.classList.remove('scrolled', 'nav-hidden');
            } else if (y > lastScrollY) {
                // Scrolling DOWN — hide the bar
                navbar.classList.add('nav-hidden');
            } else {
                // Scrolling UP — show with background
                navbar.classList.remove('nav-hidden');
                navbar.classList.add('scrolled');
            }

            lastScrollY = y;
        }, { passive: true });
    }

    // --- Scroll Animations ---
    const fadeElements = document.querySelectorAll('.fade-up');
    
    const fadeInOnScroll = () => {
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 50) {
                element.classList.add('visible');
            }
        });
    };

    // Run once on load
    fadeInOnScroll();
    
    // Run on scroll
    window.addEventListener('scroll', fadeInOnScroll);


    // --- Active Link Highlighting ---
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.hero-nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });
    // --- Gallery Auto-Scroll + Drag + Lightbox ---

    // Lightbox controls
    const lightboxOverlay = document.getElementById('lightbox');
    const lightboxImg     = document.getElementById('lightboxImg');
    const lightboxClose   = document.getElementById('lightboxClose');

    function openLightbox(src, alt, isScrollable = false) {
        if (!lightboxOverlay || !lightboxImg) return;
        lightboxImg.src = src;
        lightboxImg.alt = alt || '';
        
        if (isScrollable) {
            lightboxOverlay.classList.add('scrollable');
            lightboxOverlay.scrollTop = 0;
        } else {
            lightboxOverlay.classList.remove('scrollable');
        }
        
        lightboxOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (window.lenis) {
            window.lenis.stop();
        }
    }

    function closeLightbox() {
        if (!lightboxOverlay) return;
        lightboxOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (window.lenis) {
            window.lenis.start();
        }
        // Clear src after transition so old image doesn't flash on next open
        setTimeout(() => { if (lightboxImg) lightboxImg.src = ''; }, 350);
    }

    if (lightboxClose && lightboxOverlay) {
        lightboxClose.addEventListener('click', closeLightbox);
        
        lightboxOverlay.addEventListener('click', e => {
            // Do not close if clicking the scrollbar area
            if (e.clientX >= lightboxOverlay.clientWidth) return;
            if (e.target === lightboxOverlay) closeLightbox();
        });

        // Mouse wheel scrolling: stop propagation so Lenis does not block it, scroll with fast responsive speed
        lightboxOverlay.addEventListener('wheel', e => {
            e.stopPropagation();
            if (lightboxOverlay.classList.contains('scrollable')) {
                e.preventDefault();
                let dy = e.deltaY;
                if (e.deltaMode === 1) { // Line mode (Firefox)
                    dy *= 33;
                } else if (e.deltaMode === 2) { // Page mode
                    dy *= window.innerHeight;
                }
                lightboxOverlay.scrollTop += dy * 1.6;
            }
        }, { passive: false });

        // Keyboard shortcuts: Escape to close, arrows/space/pagekeys to scroll
        document.addEventListener('keydown', e => {
            if (!lightboxOverlay.classList.contains('active')) return;
            if (e.key === 'Escape') {
                closeLightbox();
            } else {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    lightboxOverlay.scrollTop += 160;
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    lightboxOverlay.scrollTop -= 160;
                } else if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
                    e.preventDefault();
                    lightboxOverlay.scrollTop += window.innerHeight * 0.85;
                } else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
                    e.preventDefault();
                    lightboxOverlay.scrollTop -= window.innerHeight * 0.85;
                }
            }
        });
    }

    // Intercept clicks on project cards to open scrollable full-res image lightbox
    document.querySelectorAll('.lightbox-trigger, .new-card, a[data-lightbox="scrollable"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const src = link.getAttribute('href') || link.dataset.full;
            const img = link.querySelector('img');
            const alt = img ? img.alt : '';
            if (src) openLightbox(src, alt, true); // true makes full image vertically scrollable!
        });
    });

    // Movie card click → open lightbox
    document.querySelectorAll('.movie-ticker-wrap').forEach(wrap => {
        wrap.addEventListener('click', e => {
            const card = e.target.closest('.movie-card');
            if (!card) return;
            const img = card.querySelector('img');
            const src = card.dataset.full || (img && img.src);
            if (src) openLightbox(src, img ? img.alt : '');
        });
    });

    // --- Sticker Dragging Logic ---
    const stickers = document.querySelectorAll('.adobe-sticker');
    
    stickers.forEach(sticker => {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        // Store original transform to re-apply (and add slight variations) after drag
        const originalTransform = sticker.style.transform;

        sticker.addEventListener('pointerdown', (e) => {
            isDragging = true;
            sticker.classList.add('dragging');
            sticker.setPointerCapture(e.pointerId);

            startX = e.clientX;
            startY = e.clientY;
            
            // Get current computed left/top or calculate from offset if it uses right/bottom
            const style = window.getComputedStyle(sticker);
            initialLeft = parseFloat(style.left) || sticker.offsetLeft;
            initialTop = parseFloat(style.top) || sticker.offsetTop;
            
            // Convert to explicit px values to avoid issues with % or bottom/right
            sticker.style.left = initialLeft + 'px';
            sticker.style.top = initialTop + 'px';
            sticker.style.bottom = 'auto';
            sticker.style.right = 'auto';
            
            // Bring to top
            stickers.forEach(s => s.style.zIndex = '10');
            sticker.style.zIndex = '100';
        });

        sticker.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            sticker.style.left = (initialLeft + dx) + 'px';
            sticker.style.top = (initialTop + dy) + 'px';
        });

        sticker.addEventListener('pointerup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            sticker.classList.remove('dragging');
            sticker.releasePointerCapture(e.pointerId);
            
            // Restore a slight random rotation when "stuck" back down
            const randomRotation = (Math.random() - 0.5) * 30; // -15 to +15 deg
            sticker.style.transform = `rotate(${randomRotation}deg)`;
        });

        sticker.addEventListener('pointercancel', (e) => {
            if (!isDragging) return;
            isDragging = false;
            sticker.classList.remove('dragging');
            sticker.style.transform = originalTransform;
        });
    });

    // --- Dark Mode Theme Toggle System ---
    (function initThemeToggle() {
        const toggles = document.querySelectorAll('.dark-mode-toggle, #darkModeToggle');
        if (!toggles.length) return;

        function updateToggleState(isDark) {
            toggles.forEach(toggle => {
                toggle.innerHTML = isDark
                    ? '<i class="fa-solid fa-sun"></i>'
                    : '<i class="fa-solid fa-moon"></i>';
                toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
                toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
            });
        }

        // Check current applied theme
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        updateToggleState(currentTheme === 'dark');

        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                const nextTheme = isDark ? 'light' : 'dark';

                // Add temporary transition class for ultra-smooth color morphing
                document.documentElement.classList.add('theme-transition');

                if (nextTheme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                }

                try {
                    localStorage.setItem('portfolio-theme', nextTheme);
                } catch (err) {
                    /* ignore storage errors */
                }

                updateToggleState(nextTheme === 'dark');

                setTimeout(() => {
                    document.documentElement.classList.remove('theme-transition');
                }, 350);
            });
        });
    })();

});



