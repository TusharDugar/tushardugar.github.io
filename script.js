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
                // Services section is handled by its own scroll logic, so don't unobserve with general.
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
    const revealStaggerParent = aboutSection ? aboutSection.querySelector('.profile-card-wrapper.reveal-parent') : null; // Corrected to .reveal-parent
    const revealStaggerChildren = revealStaggerParent ? revealStaggerParent.querySelectorAll('.reveal-child') : []; // Corrected to .reveal-child

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
        // If stagger elements are not found, ensure the parent section still reveals
        if (aboutSection) sectionObserver.observe(aboutSection); // Observe with general if no stagger children found
    }


    // --------------------------
    // Services Cube Animation (RESTORED & REFINED)
    // --------------------------
    (() => {
        const servicesSection = document.getElementById('services');
        // Critical: Services section must be found and its ID must be correct.
        if (!servicesSection) {
            console.warn("Services Cube Animation: #services section not found. Skipping setup.");
            return;
        }

        const wrapper = servicesSection.querySelector('.services-content-wrapper');
        const container = servicesSection.querySelector('.services-items-container');
        const serviceItems = container ? Array.from(container.querySelectorAll('.service-item')) : [];
        const bgNumber = servicesSection.querySelector('.service-bg-number'); // Corrected selector for bgNumber

        // Debugging initial element checks
        console.log("Services Section (for cube):", servicesSection ? 'found' : 'not found');
        console.log("Wrapper (services-content-wrapper):", wrapper ? 'found' : 'not found');
        console.log("Container (services-items-container):", container ? 'found' : 'not found');
        console.log("Service Items count:", serviceItems.length);
        console.log("Background Number:", bgNumber ? 'found' : 'not found');

        if (!wrapper || !container || serviceItems.length < 2 || !bgNumber) {
            console.error("Services Cube Animation: Missing crucial elements. Check HTML structure for #services, .services-content-wrapper, .services-items-container, .service-item (at least 2), and .service-bg-number.");
            // Ensure section still gets revealed if cube animation fails
            if (servicesSection) servicesSection.classList.add('revealed');
            return;
        }

        let currentIndex = 0;
        let isAnimating = false;
        const duration = 800; // ms, matches CSS transition duration for transform/opacity

        // Create the scroll spacer if it's not already there
        let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
        if (!scrollSpacer) {
            scrollSpacer = document.createElement('div');
            scrollSpacer.classList.add('services-section-scroll-spacer');
            servicesSection.appendChild(scrollSpacer);
        }

        // Calculate faceOffset for translateZ (half the container height)
        function getFaceOffset() {
            const currentWrapperHeight = wrapper.offsetHeight;
            if (currentWrapperHeight === 0) {
                console.warn("services-content-wrapper has 0 height during getFaceOffset. Check its CSS height. Defaulting to 150px.");
                return 150; // Fallback value
            }
            return currentWrapperHeight / 2;
        }

        // --- INITIAL STATE: Ensure first face is visible and active ---
        function setInitialCubeState() {
            const faceOffset = getFaceOffset();
            servicesSection.style.setProperty('--faceZ', `${-faceOffset}px`); // Set CSS variable for cube depth

            serviceItems.forEach((item, i) => {
                item.className = 'service-item'; // Reset all classes
                item.style.transition = ''; // Remove transition during initial setup

                if (i === 0) {
                    item.classList.add('active', 'front');
                } else if (i === 1) { // The item immediately after the first one
                    item.classList.add('below'); // Position it ready to enter from below
                } else {
                    item.classList.add('above'); // Park other items in hidden "above" state by default
                }
                // Apply transforms based on initial parked state classes
                // CSS will define the transform for 'front', 'below', 'above'
                // Opacity is also managed by CSS classes for parked states.
            });

            if (bgNumber) bgNumber.textContent = '01'; // Ensure initial number is correct
            currentIndex = 0;
            isAnimating = false;
            // console.log("Initial Cube State Set. Active Index:", currentIndex); // Debugging
        }

        // --- Helper: update background number ---
        function updateBgNumberDisplay(idx) {
            if (bgNumber) {
                bgNumber.textContent = (idx + 1).toString().padStart(2, '0');
            }
        }

        // --- Flip Animation ---
        function flipCube(direction) { // direction: 1 for down, -1 for up
            if (isAnimating) return;
            const prevIndex = currentIndex;
            const nextIndex = currentIndex + direction;

            // Check if we are trying to go out of bounds of the actual items
            const atFirstItem = currentIndex === 0 && direction === -1;
            const atLastItem = currentIndex === serviceItems.length - 1 && direction === 1;

            if (atFirstItem || atLastItem) {
                // We're at a boundary where cube animation stops and normal page scroll should take over.
                // This function should return early, signaling the event listener NOT to prevent default.
                return false; // Signifies that no cube flip occurred
            }

            isAnimating = true;
            const outgoingItem = serviceItems[prevIndex];
            const incomingItem = serviceItems[nextIndex];

            // Apply animation classes
            if (direction === 1) { // Scrolling down (next item comes from below)
                outgoingItem.classList.replace('front', 'exit-to-top');
                incomingItem.classList.replace('below', 'enter-from-bottom');
            } else { // Scrolling up (previous item comes from above)
                outgoingItem.classList.replace('front', 'exit-to-bottom');
                incomingItem.classList.replace('above', 'enter-from-top');
            }

            // After animation duration, update activeIndex and reset classes
            setTimeout(() => {
                currentIndex = nextIndex; // Update the index
                layoutFaces(); // Re-layout all faces to their new parked states
                isAnimating = false;
                // console.log("Flip Complete. New Active Index:", currentIndex); // Debugging
            }, duration); // Match this duration to CSS transition

            return true; // Signifies that a cube flip *is* occurring
        }

        // --- Main Scroll/Input Handler ---
        let scrollAccum = 0; // For mouse wheel debounce
        let touchStartY = null; // For touch swipe detection

        function handleInput(e, direction) { // direction: 1 for down/swipe-up, -1 for up/swipe-down
            // Only engage if the services section is substantially visible on screen
            const servicesRect = servicesSection.getBoundingClientRect();
            const isServicesMainlyVisible = servicesRect.top < window.innerHeight * 0.75 && servicesRect.bottom > window.innerHeight * 0.25;

            if (!isServicesMainlyVisible) {
                // Not in services section, allow normal scroll. Don't prevent default.
                return false;
            }

            if (isAnimating) {
                // An animation is already active, prevent default but do nothing else.
                return true;
            }

            // Attempt to flip the cube. flipCube returns true if it starts an animation, false if at boundary.
            if (flipCube(direction)) {
                // Animation started, so prevent default browser scroll.
                return true;
            } else {
                // Animation did NOT start (meaning we're at a boundary), so allow default browser scroll.
                return false;
            }
        }

        // --- Event Listeners ---

        // Initial setup on load (with slight delay for layout computation)
        setTimeout(() => {
            adjustLayout(); // Calculate --faceZ and spacer height
            setInitialCubeState(); // Set initial positions and active class
            sectionObserver.observe(servicesSection); // Start observing services section for general reveal
        }, 500); // 500ms delay for safety

        // Update layout on resize
        window.addEventListener('resize', () => {
            adjustLayout();
            // After resize, reset position of all items to current active state
            // and re-set classes correctly based on potentially new faceOffset
            setInitialCubeState(); // Re-initialize to current active item to avoid visual glitches on resize
            updateBgNumberDisplay(currentIndex); // Ensure number is correct
        });

        // Wheel event listener for desktop scrolling
        window.addEventListener('wheel', (e) => {
            scrollAccum += e.deltaY;
            const scrollThreshold = 50; // Pixels needed to trigger a step

            if (scrollAccum > scrollThreshold) {
                if (handleInput(e, 1)) { // User scrolled down (direction +1)
                    e.preventDefault(); // Prevent default if internal animation occurs
                }
                scrollAccum = 0; // Reset accumulator
            } else if (scrollAccum < -scrollThreshold) {
                if (handleInput(e, -1)) { // User scrolled up (direction -1)
                    e.preventDefault(); // Prevent default if internal animation occurs
                }
                scrollAccum = 0; // Reset accumulator
            } else if (isAnimating) {
                e.preventDefault(); // If animating, consume minor wheel movements
            }
            // If not enough scroll, and not animating, and not handled by cube, default browser scroll is allowed.
        }, { passive: false });

        // Touch swipe support (touchstart & touchend)
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: false }); // Needs passive: false for potential preventDefault in touchend

        window.addEventListener('touchend', (e) => {
            if (touchStartY === null) return;

            const deltaY = touchStartY - e.changedTouches[0].clientY; // Positive if swiped up, negative if swiped down
            const swipeThreshold = 40; // Pixels for a significant swipe

            if (Math.abs(deltaY) > swipeThreshold) {
                const direction = deltaY > 0 ? 1 : -1; // 1 for swipe up, -1 for swipe down
                if (handleInput(e, direction)) {
                    e.preventDefault(); // Prevent default only if an internal animation was triggered
                }
            }
            touchStartY = null; // Reset for next swipe
        }, { passive: false });

        // Keyboard support (for accessibility/testing)
        window.addEventListener('keydown', (e) => {
            let direction = 0;
            if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
                direction = 1; // Downward keys
            } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                direction = -1; // Upward keys
            }

            if (direction !== 0) {
                if (handleInput(e, direction)) {
                    e.preventDefault(); // Prevent default only if internal animation triggers
                }
            }
        });
    })(); // End of Services Cube Animation IIFE
});