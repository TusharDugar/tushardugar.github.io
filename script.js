document.addEventListener('DOMContentLoaded', () => {
    // --------------------------
    // Contact Button Copy to Clipboard (UNCHANGED)
    // --------------------------
    const contactButtons = document.querySelectorAll('.contact-button');

    contactButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const contactValue = button.dataset.contact;

            if (button.classList.contains('copied')) return;

            try {
                await navigator.clipboard.writeText(contactValue);
                button.classList.add('copied');
                setTimeout(() => {
                    button.classList.remove('copied');
                }, 1500);
            } catch (err) {
                alert('Could not copy automatically. Please copy manually: ' + contactValue);
            }
        });
    });

    // --------------------------
    // Intersection Observer for General Reveal (UNCHANGED)
    // --------------------------
    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Unobserve for general sections to run animation once
                // Services section is handled by its own scroll logic (now fixed-step)
                if (entry.target.id !== 'services') {
                    observer.unobserve(entry.target);
                }
            }
        });
    }, { threshold: 0.1 });

    // Observe all main sections with the general section observer
    document.querySelectorAll('#contact, #hero-right, #tools').forEach(el => sectionObserver.observe(el));


    // --------------------------
    // About Section Stagger Reveal (DesignCube-like) (UNCHANGED)
    // --------------------------
    const aboutSection = document.getElementById('about');
    const revealStaggerParent = aboutSection ? aboutSection.querySelector('.profile-card-wrapper.reveal-stagger-parent') : null;
    const revealStaggerChildren = revealStaggerParent ? revealStaggerParent.querySelectorAll('.reveal-stagger') : [];

    if (revealStaggerParent && revealStaggerChildren.length > 0) {
        const staggerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    revealStaggerChildren.forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('revealed');
                        }, index * 200); // 0.2s stagger delay
                    });
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, { threshold: 0.1 });

        staggerObserver.observe(revealStaggerParent);
    } else {
        if (aboutSection) aboutSection.classList.add('revealed');
    }
    if (aboutSection) sectionObserver.observe(aboutSection);

    // --------------------------
    // Minimal, reusable staggered reveal for .reveal-parent and .reveal-child
    // --------------------------
    document.querySelectorAll('.reveal-parent').forEach(parent => {
        const children = parent.querySelectorAll('.reveal-child');
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    children.forEach((child, idx) => {
                        setTimeout(() => {
                            child.classList.add('revealed');
                        }, idx * 200);
                    });
                    obs.unobserve(parent);
                }
            });
        }, { threshold: 0.2 });
        observer.observe(parent);
    });

    // --- Cube Flip Animation for Services Section (X-axis, scroll-based, with translateZ for real 3D cube effect) ---
    (() => {
        const servicesSection = document.getElementById('services');
        const itemsContainer = servicesSection?.querySelector('.services-items-container');
        const serviceItems = itemsContainer ? Array.from(itemsContainer.querySelectorAll('.service-item')) : [];
        const bgNumber = servicesSection?.querySelector('.service-bg-number');
        let currentIndex = 0;
        let isAnimating = false;
        const duration = 1200; // ms, matches CSS

        // Calculate faceOffset for translateZ (half the container height)
        function getFaceOffset() {
            if (!itemsContainer) return 0;
            return itemsContainer.offsetHeight / 2;
        }

        // --- INITIAL STATE: Ensure first face is visible and active ---
        function setInitialCubeState() {
            const faceOffset = getFaceOffset();
            serviceItems.forEach((item, i) => {
                item.classList.remove('active', 'cube-out', 'cube-in');
                item.style.opacity = i === 0 ? '1' : '0';
                item.style.transform = i === 0
                    ? `rotateX(0deg) translateZ(${faceOffset}px)`
                    : `rotateX(90deg) translateZ(${faceOffset}px)`;
                item.style.zIndex = i === 0 ? '2' : '1';
                item.style.transition = '';
            });
            if (bgNumber) bgNumber.textContent = '01';
            currentIndex = 0;
            isAnimating = false;
        }

        // On load and on resize, set initial state
        setInitialCubeState();
        window.addEventListener('resize', setInitialCubeState);

        // --- Helper: update background number ---
        function updateBgNumber(idx) {
            if (bgNumber) {
                bgNumber.textContent = (idx + 1).toString().padStart(2, '0');
            }
        }

        // --- Flip Animation ---
        function flipCube(direction) {
            if (isAnimating) return;
            const prevIndex = currentIndex;
            const nextIndex = currentIndex + direction;
            if (nextIndex < 0 || nextIndex >= serviceItems.length) return;

            isAnimating = true;
            const faceOffset = getFaceOffset();

            // Outgoing face
            const outgoing = serviceItems[prevIndex];
            // Incoming face
            const incoming = serviceItems[nextIndex];

            // Remove all classes and reset z-index
            serviceItems.forEach((item, i) => {
                item.classList.remove('active', 'cube-out', 'cube-in');
                item.style.transition = '';
                item.style.zIndex = '1';
            });

            // Set up outgoing
            outgoing.classList.add('cube-out');
            outgoing.style.opacity = '1';
            outgoing.style.transform = `rotateX(0deg) translateZ(${faceOffset}px)`;
            outgoing.style.transition = `transform ${duration}ms cubic-bezier(0.77,0,0.175,1), opacity ${duration}ms ease-in-out`;
            outgoing.style.zIndex = '3';

            // Set up incoming
            incoming.classList.add('cube-in');
            incoming.style.opacity = '0';
            incoming.style.transform = `rotateX(${direction > 0 ? 90 : -90}deg) translateZ(${faceOffset}px)`;
            incoming.style.transition = `transform ${duration}ms cubic-bezier(0.77,0,0.175,1), opacity ${duration}ms ease-in-out`;
            incoming.style.zIndex = '3';

            // Force reflow for transition
            void outgoing.offsetWidth;

            // Animate
            outgoing.style.transform = `rotateX(${direction > 0 ? -90 : 90}deg) translateZ(${faceOffset}px)`;
            outgoing.style.opacity = '0';

            setTimeout(() => {
                incoming.style.transform = `rotateX(0deg) translateZ(${faceOffset}px)`;
                incoming.style.opacity = '1';
            }, 20); // Small delay to ensure transition triggers

            // After animation, cleanup and set new active
            setTimeout(() => {
                serviceItems.forEach((item, i) => {
                    item.classList.remove('active', 'cube-out', 'cube-in');
                    item.style.transition = '';
                    item.style.zIndex = '1';
                    if (i === nextIndex) {
                        item.classList.add('active');
                        item.style.opacity = '1';
                        item.style.transform = `rotateX(0deg) translateZ(${faceOffset}px)`;
                        item.style.zIndex = '2';
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = `rotateX(90deg) translateZ(${faceOffset}px)`;
                    }
                });
                currentIndex = nextIndex;
                updateBgNumber(currentIndex);
                isAnimating = false;
            }, duration);
        }

        // --- Scroll Handler ---
        function handleCubeScroll(e) {
            if (isAnimating || !serviceItems.length) return;

            let delta = 0;
            if (e.type === 'wheel') {
                delta = e.deltaY;
            } else if (e.type === 'keydown') {
                if (e.key === 'ArrowDown' || e.key === 'PageDown') delta = 1;
                if (e.key === 'ArrowUp' || e.key === 'PageUp') delta = -1;
            }

            if (delta > 0 && currentIndex < serviceItems.length - 1) {
                flipCube(1);
                e.preventDefault();
            } else if (delta < 0 && currentIndex > 0) {
                flipCube(-1);
                e.preventDefault();
            } else if (delta < 0 && currentIndex === 0) {
                // At first, scroll up: exit to previous section
                const about = document.getElementById('about');
                if (about) about.scrollIntoView({ behavior: 'smooth' });
                e.preventDefault();
            } else if (delta > 0 && currentIndex === serviceItems.length - 1) {
                // At last, scroll down: exit to next section
                const tools = document.getElementById('tools');
                if (tools) tools.scrollIntoView({ behavior: 'smooth' });
                e.preventDefault();
            }
        }

        // --- Mouse wheel and keyboard ---
        if (servicesSection) {
            // Remove previous listeners to avoid stacking
            servicesSection.onwheel = null;
            servicesSection.onkeydown = null;
            servicesSection.addEventListener('wheel', handleCubeScroll, { passive: false });
            servicesSection.addEventListener('keydown', handleCubeScroll);
            servicesSection.tabIndex = 0; // Make focusable for keyboard
        }

        // --- Touch swipe support ---
        let touchStartY = null;
        if (servicesSection) {
            servicesSection.addEventListener('touchstart', e => {
                if (e.touches.length === 1) touchStartY = e.touches[0].clientY;
            }, { passive: true });
            servicesSection.addEventListener('touchend', e => {
                if (touchStartY === null) return;
                const touchEndY = e.changedTouches[0].clientY;
                const deltaY = touchStartY - touchEndY;
                if (Math.abs(deltaY) > 30) {
                    if (deltaY > 0 && currentIndex < serviceItems.length - 1) {
                        flipCube(1);
                    } else if (deltaY < 0 && currentIndex > 0) {
                        flipCube(-1);
                    } else if (deltaY < 0 && currentIndex === 0) {
                        const about = document.getElementById('about');
                        if (about) about.scrollIntoView({ behavior: 'smooth' });
                    } else if (deltaY > 0 && currentIndex === serviceItems.length - 1) {
                        const tools = document.getElementById('tools');
                        if (tools) tools.scrollIntoView({ behavior: 'smooth' });
                    }
                }
                touchStartY = null;
            }, { passive: false });
        }

        // Optional: update bg number and reset cube on resize
        window.addEventListener('resize', () => {
            setInitialCubeState();
            updateBgNumber(currentIndex);
        });
    });
});