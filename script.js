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
    // Services Section 3D Cube Scroll Effect (REVISED FOR FIXED-STEP ANIMATION)
    // --------------------------
    const servicesSection = document.getElementById('services');
    const servicesHeading = servicesSection?.querySelector('.services-heading');
    const servicesContentWrapper = servicesSection?.querySelector('.services-content-wrapper');
    const servicesItemsContainer = servicesSection?.querySelector('.services-items-container'); // Added reference
    const serviceItems = servicesItemsContainer?.querySelectorAll('.service-item') || []; // Changed parent
    const serviceBgNumber = servicesSection?.querySelector('.service-bg-number');

    // Critical check for existence of all required elements
    if (!servicesSection || !serviceItems.length || !servicesHeading || !servicesContentWrapper || !servicesItemsContainer || !serviceBgNumber) {
        console.warn('[Services Animation] Services section or required elements not found. Skipping services animation setup.');
        if (servicesSection) servicesSection.classList.add('revealed');
        return;
    }

    // Create the scroll spacer if it's not already there
    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }

    let currentActiveIndex = 0; // Tracks the currently active slide index
    let isAnimating = false; // Flag to prevent multiple animations at once
    const scrollStepDuration = 1200; // Fixed duration for one full step in milliseconds (1.2s)
    let animationStartTime = 0;
    let startAnimationIndex = 0;
    let targetAnimationIndex = 0;
    let animationRafId = null;

    // Easing function for smoother motion (cubic ease-in-out)
    const easeInOutCubic = t => t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Function to calculate and set the total scrollable height of the services section
    const adjustServicesLayout = () => {
        const contentWrapperHeight = servicesContentWrapper.offsetHeight;
        const servicesHeadingHeight = servicesHeading.offsetHeight;
        const gapBetweenHeadingAndWrapper = 50; // Based on margin-bottom on heading in CSS

        const totalVisibleStickyHeight = servicesHeadingHeight + gapBetweenHeadingAndWrapper + contentWrapperHeight;
        let stickyTopH2 = (window.innerHeight - totalVisibleStickyHeight) / 2;
        stickyTopH2 = Math.max(0, stickyTopH2);

        let stickyTopWrapper = stickyTopH2 + servicesHeadingHeight + gapBetweenHeadingAndWrapper;

        servicesSection.style.setProperty('--services-sticky-top-h2', `${stickyTopH2}px`);
        servicesSection.style.setProperty('--services-sticky-top-wrapper', `${stickyTopWrapper}px`);

        // The faceOffset is half the height of the contentWrapper for a perfect cube.
        const faceOffset = contentWrapperHeight / 2;

        // The total scroll range needed for all steps.
        // Each "step" now effectively corresponds to the fixed duration of 1.2s, not necessarily a large scroll multiplier.
        // We ensure enough scroll space for each service item + a buffer.
        const totalVirtualScrollHeight = serviceItems.length * window.innerHeight; // Provide ample scroll space

        scrollSpacer.style.height = `${totalVirtualScrollHeight}px`;

        // We explicitly set the scroll position to target the services section for the animation start
        // This is a rough estimation of where the services section should "activate"
        const servicesSectionStart = servicesSection.offsetTop + stickyTopH2;
    };

    // Core animation logic for a single step
    const animateCubeTransition = (startIndex, targetIndex, startTime) => {
        const elapsedTime = performance.now() - startTime;
        let progress = Math.min(1, elapsedTime / scrollStepDuration);
        let easedProgress = easeInOutCubic(progress);

        const faceOffset = servicesContentWrapper.offsetHeight / 2;
        const direction = targetIndex > startIndex ? 1 : -1; // 1 for scrolling down, -1 for scrolling up

        // Update background number only when the animation is near completion or at the start
        const displayIndex = direction === 1 ? startIndex + 1 : targetIndex + 1; // Show current index when scrolling down, next when scrolling up
        serviceBgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;

        serviceItems.forEach((item, index) => {
            let opacity, transformValue, zIndex;

            if (index === startIndex) {
                // Outgoing face (from front to top/bottom)
                // Rotates from 0deg to 90deg (downwards/away if scrolling up, upwards/away if scrolling down)
                const rotation = direction * 90 * easedProgress; // +90 for down, -90 for up
                const currentTranslateZ = -faceOffset * (1 - easedProgress); // From -faceOffset to 0

                transformValue = `rotateX(${rotation}deg) translateZ(${currentTranslateZ}px)`;
                // Fades out completely by 40% of the transition
                opacity = 1 - Math.min(1, easedProgress * 2.5);
                zIndex = 2; // Ensures it's on top when exiting
            } else if (index === targetIndex) {
                // Incoming face (from bottom/top to front)
                // Rotates from -90deg to 0deg (upwards/inwards if scrolling down, downwards/inwards if scrolling up)
                const rotation = -direction * 90 * (1 - easedProgress); // -90 to 0 for down, +90 to 0 for up
                const currentTranslateZ = -faceOffset * easedProgress; // From 0 to -faceOffset

                transformValue = `rotateX(${rotation}deg) translateZ(${currentTranslateZ}px)`;
                // Fades in after a delay (starts at 60%, fully visible by 100%)
                opacity = Math.max(0, (easedProgress - 0.6) * 2.5);
                zIndex = 1; // Appears just below the exiting item
            } else {
                // All other items are completely hidden and reset
                if (index < startIndex) {
                    transformValue = `rotateX(${direction === 1 ? 90 : -90}deg) translateZ(0px)`; // Positioned as top or bottom, hidden
                } else {
                    transformValue = `rotateX(${direction === 1 ? -90 : 90}deg) translateZ(0px)`; // Positioned as top or bottom, hidden
                }
                opacity = 0; // Fully transparent
                zIndex = 0; // Lowest z-index
            }

            item.style.transform = transformValue;
            item.style.opacity = opacity;
            item.style.zIndex = zIndex;

            // Manage active-content class for CSS hover rules
            if (index === currentActiveIndex) {
                item.classList.add('active-content');
            } else {
                item.classList.remove('active-content');
            }
        });

        if (progress < 1) {
            animationRafId = requestAnimationFrame(() => animateCubeTransition(startIndex, targetIndex, startTime));
        } else {
            // Animation complete, ensure final state and correct active class
            cancelAnimationFrame(animationRafId);
            currentActiveIndex = targetIndex;
            isAnimating = false;

            // Set final state for active item to ensure consistency
            serviceItems.forEach((item, index) => {
                if (index === currentActiveIndex) {
                    item.style.transform = `rotateX(0deg) translateZ(${-faceOffset}px)`;
                    item.style.opacity = 1;
                    item.classList.add('active-content');
                } else {
                    item.style.transform = `rotateX(${index < currentActiveIndex ? 90 : -90}deg) translateZ(0px)`;
                    item.style.opacity = 0;
                    item.classList.remove('active-content');
                }
            });

            serviceBgNumber.textContent = (currentActiveIndex + 1 < 10 ? '0' : '') + (currentActiveIndex + 1);
        }
    };

    // Main scroll step handler
    const handleScrollStep = (direction) => {
        if (isAnimating) return;

        let newIndex = currentActiveIndex + direction;
        newIndex = Math.max(0, Math.min(serviceItems.length - 1, newIndex)); // Clamp index

        if (newIndex === currentActiveIndex) {
            // No change in index, no animation needed
            return;
        }

        isAnimating = true;
        animationStartTime = performance.now();
        startAnimationIndex = currentActiveIndex;
        targetAnimationIndex = newIndex;

        animateCubeTransition(startAnimationIndex, targetAnimationIndex, animationStartTime);
    };

    // --- Initialize and Event Listeners ---
    // Initial layout adjustment
    setTimeout(() => {
        adjustServicesLayout();
        // Set initial state of service items (first one active, others hidden)
        const faceOffset = servicesContentWrapper.offsetHeight / 2;
        serviceItems.forEach((item, index) => {
            if (index === 0) {
                item.style.transform = `rotateX(0deg) translateZ(${-faceOffset}px)`;
                item.style.opacity = 1;
                item.classList.add('active-content');
            } else {
                item.style.transform = `rotateX(-90deg) translateZ(0px)`; // Assuming first hidden is below
                item.style.opacity = 0;
                item.classList.remove('active-content');
            }
        });
        serviceBgNumber.textContent = '01'; // Ensure initial number is correct
    }, 200);

    // Recalculate layout on resize
    window.addEventListener('resize', () => {
        adjustServicesLayout();
        // Reset animation state to ensure correct positioning on resize
        isAnimating = false;
        cancelAnimationFrame(animationRafId);
        // Force re-render of current state after resize
        const faceOffset = servicesContentWrapper.offsetHeight / 2;
        serviceItems.forEach((item, index) => {
            if (index === currentActiveIndex) {
                item.style.transform = `rotateX(0deg) translateZ(${-faceOffset}px)`;
                item.style.opacity = 1;
                item.classList.add('active-content');
            } else {
                item.style.transform = `rotateX(${index < currentActiveIndex ? 90 : -90}deg) translateZ(0px)`;
                item.style.opacity = 0;
                item.classList.remove('active-content');
            }
        });
    });

    // Touch support variables
    let startY = 0;

    // Attach scroll and touch handlers for step-by-step navigation
    window.addEventListener('wheel', (e) => {
        // Prevent default scroll behavior to control scrolling entirely
        e.preventDefault();
        handleScrollStep(e.deltaY > 0 ? 1 : -1);
    }, { passive: false }); // passive: false is critical for preventDefault()

    window.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        let deltaY = e.changedTouches[0].clientY - startY;
        if (Math.abs(deltaY) > 30) { // Threshold for a meaningful swipe
            handleScrollStep(deltaY < 0 ? 1 : -1);
        }
    }, { passive: false });

    // The services section itself should still be revealed by the general observer.
    sectionObserver.observe(servicesSection);
});