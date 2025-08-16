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

    // --- Cube Flip Animation for Services Section (X-axis, scroll-based) ---
    document.addEventListener('DOMContentLoaded', () => {
        // Cube flip logic for services
        const servicesSection = document.getElementById('services');
        const itemsContainer = servicesSection?.querySelector('.services-items-container');
        const serviceItems = itemsContainer ? Array.from(itemsContainer.querySelectorAll('.service-item')) : [];
        const bgNumber = servicesSection?.querySelector('.service-bg-number');
        let currentIndex = 0;
        let isAnimating = false;

        // Helper: set cube face classes (ensure only 2 faces visible)
        function setCubeClasses(idx, direction) {
            serviceItems.forEach((item, i) => {
                item.classList.remove(
                    'cube-current', 'cube-next', 'cube-prev', 'cube-flip-up', 'cube-flip-down'
                );
                if (i === idx) {
                    item.classList.add('cube-current');
                    item.style.opacity = '1';
                    item.style.pointerEvents = 'auto';
                } else if (i === idx + 1 && direction === 1) {
                    item.classList.add('cube-next');
                    item.style.opacity = '1';
                    item.style.pointerEvents = 'auto';
                } else if (i === idx - 1 && direction === -1) {
                    item.classList.add('cube-prev');
                    item.style.opacity = '1';
                    item.style.pointerEvents = 'auto';
                } else {
                    item.style.opacity = '';
                    item.style.pointerEvents = '';
                }
            });
        }

        // Helper: update background number
        function updateBgNumber(idx) {
            if (bgNumber) {
                bgNumber.textContent = (idx + 1).toString().padStart(2, '0');
            }
        }

        // Helper: update visible service points (titles/descriptions)
        function updateServicePoints(idx) {
            serviceItems.forEach((item, i) => {
                if (i === idx) {
                    item.style.visibility = 'visible';
                } else {
                    item.style.visibility = 'hidden';
                }
            });
        }

        // Initial state
        if (serviceItems.length) {
            setCubeClasses(currentIndex, 0);
            updateBgNumber(currentIndex);
            updateServicePoints(currentIndex);
            if (bgNumber) bgNumber.style.opacity = '1';
        }

        // Flip animation
        function flipCube(direction) {
            if (isAnimating) return;
            const prevIndex = currentIndex;
            const nextIndex = currentIndex + direction;
            if (nextIndex < 0 || nextIndex >= serviceItems.length) return;

            isAnimating = true;

            // Outgoing face
            serviceItems[prevIndex].classList.add(direction > 0 ? 'cube-flip-up' : 'cube-flip-down');
            // Incoming face
            serviceItems[nextIndex].classList.add(direction > 0 ? 'cube-next' : 'cube-prev');
            // Remove current
            serviceItems[prevIndex].classList.remove('cube-current');

            // Fade timing: outgoing opacity 0 by 40%, incoming starts fade at 60%
            serviceItems[prevIndex].style.animation = 'cubeFadeOut 0.8s linear forwards';
            serviceItems[nextIndex].style.animation = 'cubeFadeIn 0.8s linear forwards';

            // Make both faces visible for the duration of the animation
            serviceItems[prevIndex].style.visibility = 'visible';
            serviceItems[nextIndex].style.visibility = 'visible';

            setTimeout(() => {
                // Clean up
                serviceItems[prevIndex].classList.remove('cube-flip-up', 'cube-flip-down');
                serviceItems[prevIndex].style.animation = '';
                serviceItems[nextIndex].classList.remove('cube-next', 'cube-prev');
                serviceItems[nextIndex].style.animation = '';
                currentIndex = nextIndex;
                setCubeClasses(currentIndex, 0);
                updateBgNumber(currentIndex);
                updateServicePoints(currentIndex);
                isAnimating = false;
            }, 800);
        }

        // Section boundary scroll helpers
        function scrollToPrevSection() {
            // Scroll to About or Hero section
            const about = document.getElementById('about');
            if (about) about.scrollIntoView({ behavior: 'smooth' });
        }
        function scrollToNextSection() {
            // Scroll to Tools section
            const tools = document.getElementById('tools');
            if (tools) tools.scrollIntoView({ behavior: 'smooth' });
        }

        // Mouse wheel
        if (servicesSection) {
            servicesSection.addEventListener('wheel', handleCubeScroll, { passive: false });
            // Keyboard navigation
            servicesSection.addEventListener('keydown', handleCubeScroll);
            servicesSection.tabIndex = 0; // Make focusable for keyboard
        }

        // Touch swipe support
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
                        scrollToPrevSection();
                    } else if (deltaY > 0 && currentIndex === serviceItems.length - 1) {
                        scrollToNextSection();
                    }
                }
                touchStartY = null;
            }, { passive: false });
        }

        // Optional: update bg number on resize (if needed)
        window.addEventListener('resize', () => updateBgNumber(currentIndex));
    });
});