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
    // Services Cube Animation (NEW LOGIC)
    // --------------------------
    const servicesSection = document.getElementById('services');
    const wrapper = servicesSection?.querySelector('.services-content-wrapper');
    const container = servicesSection?.querySelector('.services-items-container');
    const items = Array.from(container?.querySelectorAll('.service-item') || []); // Ensure items are array-like
    const bgNumber = servicesSection?.querySelector('.service-bg-number');

    // Basic existence check for core elements
    if (!wrapper || !container || items.length === 0 || !bgNumber) {
        console.warn("Services cube: required elements missing or no items found. Skipping animation setup.");
        // Ensure section itself still reveals if animation is skipped
        if (servicesSection) servicesSection.classList.add('revealed');
        return;
    }

    let activeIndex = 0;
    let isAnimating = false;

    // Create the scroll spacer if it's not already there (used for overall page length)
    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }

    // Function to set CSS variables based on layout
    function adjustLayout() {
        const wrapperHeight = wrapper.offsetHeight;
        // console.log("Wrapper Height for faceZ:", wrapperHeight); // Debugging

        if (wrapperHeight === 0) {
             console.warn("services-content-wrapper has 0 height. Cannot calculate faceZ. Check CSS 'height' for .services-content-wrapper.");
             return; // Exit if height is 0
        }
        const faceZ = -(wrapperHeight / 2);
        servicesSection.style.setProperty('--faceZ', `${faceZ}px`);

        // Adjust overall page scroll length based on number of items
        const servicesHeadingHeight = servicesSection.querySelector('.services-heading')?.offsetHeight || 0;
        const gapBetweenHeadingAndWrapper = 50; // Based on margin-bottom on heading in CSS
        const totalVisibleStickyHeight = servicesHeadingHeight + gapBetweenHeadingAndWrapper + wrapperHeight;
        let stickyTopH2 = (window.innerHeight - totalVisibleStickyHeight) / 2;
        stickyTopH2 = Math.max(0, stickyTopH2);
        let stickyTopWrapper = stickyTopH2 + servicesHeadingHeight + gapBetweenHeadingAndWrapper;

        servicesSection.style.setProperty('--services-sticky-top-h2', `${stickyTopH2}px`);
        servicesSection.style.setProperty('--services-sticky-top-wrapper', `${stickyTopWrapper}px`);

        // Provide enough scroll space for the section
        const estimatedScrollPerItem = window.innerHeight * 1.5; // More generous scroll per item
        scrollSpacer.style.height = `${items.length * estimatedScrollPerItem}px`;
    }

    // Function to apply class names for parked states
    function layoutFaces() {
        items.forEach((item, index) => {
            item.className = 'service-item'; // Reset all classes first

            if (index === activeIndex) {
                item.classList.add('front');
            } else if (index === (activeIndex + 1) % items.length) { // Below active (for scrolling down)
                item.classList.add('below');
            } else if (index === (activeIndex - 1 + items.length) % items.length) { // Above active (for scrolling up)
                item.classList.add('above');
            } else { // All other items
                // Default hidden state for items that are not front, below, or above
                // To prevent "popping" when moving multiple steps quickly,
                // set them to the "above" or "below" hidden state directly.
                if (index < activeIndex) {
                    item.classList.add('above');
                } else {
                    item.classList.add('below');
                }
            }
        });
        updateBgNumber();
    }

    // Update the background number text
    function updateBgNumber() {
        const displayIndex = activeIndex + 1;
        bgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;
    }

    // Main function to initiate a transition between steps
    function goToIndex(newIndex, directionName) { // directionName: 'up' (for next) or 'down' (for previous)
        if (isAnimating || newIndex === activeIndex) return; // Ignore if animating or no change
        isAnimating = true;

        const current = items[activeIndex];
        const next = items[newIndex];

        // Apply animation classes
        if (directionName === 'up') { // User scrolled down, next item comes from below
            current.classList.add('exit-to-top'); // Current moves up and out
            next.classList.add('enter-from-bottom'); // Next moves up and in
        } else { // User scrolled up, previous item comes from above
            current.classList.add('exit-to-bottom'); // Current moves down and out
            next.classList.add('enter-from-top'); // Next moves down and in
        }

        // After animation duration, update activeIndex and reset classes
        setTimeout(() => {
            activeIndex = newIndex;
            layoutFaces(); // This call will reset classes to 'front', 'above', 'below' based on new activeIndex
            isAnimating = false;
        }, 800); // This duration (800ms) must match the CSS 'transition' duration for transform/opacity on .service-item
    }

    // Generic step function to determine target index and direction
    function step(direction) { // direction: 'up' (for next item, scrolling down) or 'down' (for previous item, scrolling up)
        let newIndex;
        if (direction === 'up') {
            newIndex = (activeIndex + 1) % items.length;
        } else { // direction === 'down'
            newIndex = (activeIndex - 1 + items.length) % items.length; // Handles negative modulus
        }

        // Call goToIndex only if the index actually changes
        if (newIndex !== activeIndex) {
            goToIndex(newIndex, direction);
            return true; // Signal that animation started, prevent default browser scroll
        }
        return false; // Signal that no animation started, allow default browser scroll
    }

    // --- Event Handlers for Navigation ---
    let scrollAccum = 0; // Accumulate scroll delta for mouse wheel sensitivity
    window.addEventListener('wheel', (e) => {
        // Only trigger when the services section is substantially visible
        const servicesRect = servicesSection.getBoundingClientRect();
        const isServicesVisible = servicesRect.top < window.innerHeight && servicesRect.bottom > 0;

        if (!isServicesVisible) return; // Don't interfere if section is out of view

        // Prevent default scroll if we are going to try to animate or if an animation is in progress
        e.preventDefault();

        // Check if we are at the boundaries and should let the page scroll
        const atStartBoundary = activeIndex === 0 && e.deltaY < 0; // At first item, scrolling up
        const atEndBoundary = activeIndex === items.length - 1 && e.deltaY > 0; // At last item, scrolling down

        if (isAnimating) {
            // If animating, let preventDefault() keep working, but don't try to trigger new step
            return;
        }

        if ((atStartBoundary && e.deltaY < 0) || (atEndBoundary && e.deltaY > 0)) {
            // At boundary and trying to scroll past it, allow normal page scroll.
            // Temporarily remove preventDefault for this specific scroll event.
            // This is complex as preventDefault() is called earlier.
            // A common pattern is to only call preventDefault() *if* step returns true.
            // We'll revert to that pattern by adjusting this listener.
            // For now, if we reach here and are at a boundary, we explicitly return
            // without trying to 'step', letting the browser scroll if not prevented elsewhere.
            // The logic below will handle the preventDefault correctly.
        }

        scrollAccum += e.deltaY;
        if (scrollAccum > 50) { // Scroll down threshold
            if (step('up')) { // Try to move to next item
                scrollAccum = 0; // Reset accumulator only if step happened
            } else {
                // If step didn't happen (e.g., at end of items), allow regular page scroll
                // But only if we're at the very last item and trying to scroll down, or first and trying to scroll up
                if (atEndBoundary) {
                    window.removeEventListener('wheel', arguments.callee, { passive: false }); // Remove self to allow default
                    window.requestAnimationFrame(() => { // Re-add self after a brief moment
                        window.addEventListener('wheel', arguments.callee, { passive: false });
                    });
                }
            }
        } else if (scrollAccum < -50) { // Scroll up threshold
            if (step('down')) { // Try to move to previous item
                scrollAccum = 0; // Reset accumulator only if step happened
            } else {
                if (atStartBoundary) {
                    window.removeEventListener('wheel', arguments.callee, { passive: false });
                    window.requestAnimationFrame(() => {
                        window.addEventListener('wheel', arguments.callee, { passive: false });
                    });
                }
            }
        }
    }, { passive: false });


    // Re-adjusting the wheel listener to be more precise for boundary conditions
    // The previous implementation of wheel listener could lead to subtle issues with preventDefault.
    // Let's use a simpler, more robust conditional preventDefault.
    const handleWheelEvent = (e) => {
        const servicesRect = servicesSection.getBoundingClientRect();
        // Check if the services section is largely in view
        const isServicesMainlyVisible = servicesRect.top < window.innerHeight * 0.75 && servicesRect.bottom > window.innerHeight * 0.25;

        // Check for boundaries
        const atStart = activeIndex === 0 && e.deltaY < 0; // Scrolling up at first item
        const atEnd = activeIndex === items.length - 1 && e.deltaY > 0; // Scrolling down at last item

        if (isAnimating) {
            e.preventDefault(); // Always prevent default if an animation is in progress
            return;
        }

        if (isServicesMainlyVisible) {
            // If inside the services section and not at a boundary that allows external scroll
            if (!(atStart || atEnd)) {
                e.preventDefault(); // Prevent default to handle scroll internally
            } else if (atStart && e.deltaY < 0) {
                // At first item, scrolling up, let browser scroll
                return;
            } else if (atEnd && e.deltaY > 0) {
                // At last item, scrolling down, let browser scroll
                return;
            }
        } else {
             // Not in services section, allow normal scroll
            return;
        }


        // Accumulate scroll for step triggering
        scrollAccum += e.deltaY;
        const scrollThreshold = 50; // Pixels needed to trigger a step

        if (scrollAccum > scrollThreshold) {
            if (step('up')) { // Try to move to next item
                scrollAccum = 0;
            } else {
                // If step didn't occur (e.g., already animating or at very end), reset accum to prevent repeated attempts
                scrollAccum = 0;
            }
        } else if (scrollAccum < -scrollThreshold) {
            if (step('down')) { // Try to move to previous item
                scrollAccum = 0;
            } else {
                scrollAccum = 0;
            }
        }
    };

    window.removeEventListener('wheel', window.handleWheelEvent || (() => {}), { passive: false }); // Remove old if it exists
    window.addEventListener('wheel', handleWheelEvent, { passive: false });
    window.handleWheelEvent = handleWheelEvent; // Store for potential removal if needed elsewhere


    // Keyboard support
    window.addEventListener('keydown', (e) => {
        const servicesRect = servicesSection.getBoundingClientRect();
        const isServicesMainlyVisible = servicesRect.top < window.innerHeight * 0.75 && servicesRect.bottom > window.innerHeight * 0.25;

        if (!isServicesMainlyVisible) return; // Only trigger if section is visible

        if (isAnimating) {
            if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(e.key)) {
                e.preventDefault(); // Prevent default if animating and key is related to scroll
            }
            return;
        }

        let handled = false;
        if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
            if (activeIndex < items.length - 1) { // Only animate if not at the last item
                step('up');
                handled = true;
            }
        } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
            if (activeIndex > 0) { // Only animate if not at the first item
                step('down');
                handled = true;
            }
        }

        if (handled) {
            e.preventDefault(); // Prevent default only if an animation was triggered
        }
    });

    // Touch swipe support
    let touchStartY = null;
    let touchMoved = false; // Flag to track if touch has moved significantly

    window.addEventListener('touchstart', (e) => {
        // Only capture touch if it starts within the Services section or if the section is close
        const servicesRect = servicesSection.getBoundingClientRect();
        if (e.touches.length === 1 && servicesRect.top < window.innerHeight && servicesRect.bottom > 0) {
            touchStartY = e.touches[0].clientY;
            touchMoved = false;
        } else {
            touchStartY = null;
        }
    }, { passive: false }); // Needs passive: false to potentially preventDefault in touchmove/touchend

    window.addEventListener('touchmove', (e) => {
        if (touchStartY === null || e.touches.length !== 1) return;

        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY;
        const scrollThreshold = 10; // Smaller threshold to detect "movement" for preventing default

        // If moved significantly and we are potentially in a stepped scroll area
        if (Math.abs(deltaY) > scrollThreshold && !isAnimating) {
            const servicesRect = servicesSection.getBoundingClientRect();
            const isServicesMainlyVisible = servicesRect.top < window.innerHeight * 0.75 && servicesRect.bottom > window.innerHeight * 0.25;

            if (isServicesMainlyVisible) {
                // If we are about to trigger a step or are within bounds, prevent default to avoid page scroll.
                // This makes the touch feel more dedicated to the cube.
                if (!( (activeIndex === 0 && deltaY > 0) || (activeIndex === items.length - 1 && deltaY < 0) )) {
                    e.preventDefault();
                    touchMoved = true; // Mark as moved for handling in touchend
                }
            }
        }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        if (touchStartY === null) return;
        const diff = touchStartY - e.changedTouches[0].clientY; // Positive for swipe up, negative for swipe down
        const swipeThreshold = 40; // Pixels needed for a significant swipe

        if (Math.abs(diff) > swipeThreshold) {
            // Determine direction for step function
            const direction = diff > 0 ? 'up' : 'down'; // 'up' means user swiped up, want next item

            // Attempt to step; step() returns true if animation initiated, false if at boundary/no change
            if (step(direction)) {
                // Animation started, great. No further action needed as preventDefault was likely done in touchmove.
            } else {
                // If step didn't happen (e.g., at boundary), ensure page can scroll.
                // This is implicitly handled by not calling preventDefault if step() returns false.
            }
        }
        touchStartY = null; // Reset
        touchMoved = false; // Reset
    });

    // The services section itself should still be revealed by the general observer.
    sectionObserver.observe(servicesSection);
});