document.addEventListener('DOMContentLoaded', () => {
    // Contact Button Copy to Clipboard Functionality
    const contactButtons = document.querySelectorAll('.contact-button');

    contactButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const contactValue = button.dataset.contact;

            if (button.classList.contains('copied')) {
                console.log('Button already showing "Copied!". Returning.');
                return; 
            }

            try {
                await navigator.clipboard.writeText(contactValue);
                console.log('Text copied to clipboard:', contactValue);
                
                button.classList.add('copied');
                console.log('Class "copied" added to button.');

                setTimeout(() => {
                    button.classList.remove('copied');
                    console.log('Class "copied" removed from button after 1.5 seconds.');
                }, 1500);
            } catch (err) {
                console.error('Failed to copy text: ', err);
                alert('Could not copy automatically. Please copy manually: ' + contactValue);
            }
        });
    });

    // Scroll Reveal Animation (Intersection Observer) - for main sections (one-shot reveal)
    const sectionObserverOptions = {
        root: null, // viewport as the root
        rootMargin: '0px',
        threshold: 0.1 // 10% of the item must be visible to trigger
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Don't unobserve #services immediately, as its internal animation relies on visibility
                // and we want its parent section to remain "revealed".
                if (entry.target.id !== 'services') {
                    observer.unobserve(entry.target); 
                }
            }
        });
    }, sectionObserverOptions);

    // Observe all main sections with the section observer
    document.querySelectorAll('.about-left-content').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('#contact').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('#hero-right').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('#tools').forEach(el => sectionObserver.observe(el));


    // --- Services Section Animation Logic (Framer-like "cuboid" scroll effect) ---
    const servicesSection = document.getElementById('services');
    const servicesContentWrapper = servicesSection ? servicesSection.querySelector('.services-content-wrapper') : null;
    const serviceItems = servicesContentWrapper ? servicesContentWrapper.querySelectorAll('.service-item') : [];
    const serviceBgNumber = servicesContentWrapper ? servicesContentWrapper.querySelector('#service-bg-number') : null;
    
    // Critical check for existence
    if (!servicesSection || serviceItems.length === 0 || !servicesContentWrapper || !serviceBgNumber) {
        console.warn('Services section or required elements not found. Skipping services animation setup.');
        if (servicesSection) servicesSection.classList.add('revealed'); // Ensure section itself still reveals
        return; 
    }

    // Create the scroll spacer if it's not already there
    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }

    // Define the fixed height of the visible services content wrapper (from CSS)
    let SECTION_VISIBLE_HEIGHT; // Will be read dynamically
    // Define the top offset for the sticky effect (from CSS)
    let STICKY_TOP_OFFSET; // Will be read dynamically
    
    // Define how much scroll distance is needed to fully transition one item.
    // This value is crucial for controlling the animation speed and overall section length.
    // Reduced multiplier to make transitions tighter and reduce overall section length.
    const SCROLL_DISTANCE_PER_ITEM_MULTIPLIER = 0.9; 
    let SCROLL_DISTANCE_PER_ITEM; // Will be calculated based on SECTION_VISIBLE_HEIGHT

    let currentActiveIndex = -1; // Tracks the currently active slide index
    let lastScrollY = window.scrollY; // For scroll direction detection
    let rafId = null; // For requestAnimationFrame optimization

    // Function to set the total scrollable height of the services section
    const adjustServicesSectionHeight = () => {
        // Recalculate dynamic values on resize or initial load
        SECTION_VISIBLE_HEIGHT = servicesContentWrapper.offsetHeight;
        STICKY_TOP_OFFSET = parseInt(getComputedStyle(servicesContentWrapper).top);
        SCROLL_DISTANCE_PER_ITEM = SECTION_VISIBLE_HEIGHT * SCROLL_DISTANCE_PER_ITEM_MULTIPLIER;

        // The total scroll range needed for all animations:
        // (Number of items - 1 transitions) * SCROLL_DISTANCE_PER_ITEM
        const totalAnimationScrollRange = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM;

        // The servicesSection needs to be tall enough to allow the sticky wrapper to "pin"
        // and for the user to scroll through the entire animation.
        // This height is provided by the `scrollSpacer`.
        // It's the `totalAnimationScrollRange` plus the `SECTION_VISIBLE_HEIGHT` (for the last slide to display)
        // plus the `STICKY_TOP_OFFSET` so the sticky effect can start and finish cleanly within the section.
        scrollSpacer.style.height = `${totalAnimationScrollRange + SECTION_VISIBLE_HEIGHT + STICKY_TOP_OFFSET}px`;
        // console.log(`Spacer height set to: ${scrollSpacer.offsetHeight}px for ${serviceItems.length} items. Visible height: ${SECTION_VISIBLE_HEIGHT}`);
    };

    // This is the core animation logic, triggered by scroll
    const updateServiceAnimation = () => {
        // `servicesSection.offsetTop` gives the distance from the top of the document to the top of the services section.
        // The animation effectively starts when the `servicesContentWrapper` (which is sticky)
        // reaches its `top` offset in the viewport.
        // So, the scroll point where the animation *begins* is `servicesSection.offsetTop`.
        let scrollProgress = window.scrollY - servicesSection.offsetTop;

        // Clamp the scroll progress to the valid range for our animation.
        // Max progress is the total height of the spacer MINUS the height of the sticky element
        // (because the sticky element takes up space *below* the scroll top when it's active).
        const maxScrollableRangeForAnimation = scrollSpacer.offsetHeight - SECTION_VISIBLE_HEIGHT - STICKY_TOP_OFFSET;
        scrollProgress = Math.max(0, Math.min(maxScrollableRangeForAnimation, scrollProgress));

        // Determine which item should be active based on scroll progress
        const normalizedProgress = scrollProgress / SCROLL_DISTANCE_PER_ITEM;
        const currentIndex = Math.floor(normalizedProgress);
        const fractionalProgress = normalizedProgress - currentIndex; // Progress within the current item's transition (0 to 1)

        // Update the background number for the active slide
        const newActiveIndex = Math.max(0, Math.min(serviceItems.length - 1, currentIndex));
        if (newActiveIndex !== currentActiveIndex) {
            currentActiveIndex = newActiveIndex;
            const displayIndex = currentActiveIndex + 1; // Service numbers are 1-based
            serviceBgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;
            // console.log(`Active Index: ${currentActiveIndex}, Fractional Progress: ${fractionalProgress.toFixed(2)}`);
        }

        // Apply 3D transforms and opacity to each service item
        serviceItems.forEach((item, index) => {
            let translateY = 0;
            let rotateX = 0;
            let opacity = 0;
            let zIndex = 0;

            if (index === currentIndex) {
                // The current item: animating out (rotating outwards and fading)
                rotateX = 90 * fractionalProgress; // Rotates from 0deg to 90deg (forward/outwards)
                translateY = -SECTION_VISIBLE_HEIGHT * fractionalProgress; // Moves upwards
                opacity = 1 - fractionalProgress; // Fades out
                zIndex = 2; // Ensures it's on top when exiting
            } else if (index === currentIndex + 1) {
                // The next item: animating in (rotating into view from behind/below)
                // Starts rotated -90 degrees (as if coming from the 'bottom' face of the cube)
                // and rotates back to 0 degrees (flat).
                rotateX = -90 + (90 * fractionalProgress); 
                translateY = SECTION_VISIBLE_HEIGHT * (1 - fractionalProgress); // Moves downwards into place
                opacity = fractionalProgress; // Fades in
                zIndex = 1; // Appears just below the exiting item
            } else {
                // All other items are completely hidden and reset
                opacity = 0;
                translateY = 0;
                rotateX = 0;
                zIndex = 0;
            }

            item.style.transform = `translateY(${translateY}px) rotateX(${rotateX}deg)`;
            item.style.opacity = opacity;
            item.style.zIndex = zIndex;
        });

        rafId = null; // Reset requestAnimationFrame ID
    };

    // Debounced scroll handler to optimize performance with requestAnimationFrame
    const handleScrollEvent = () => {
        if (window.scrollY !== lastScrollY) {
            lastScrollY = window.scrollY;
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(updateServiceAnimation);
        }
    };

    // --- Initialize animation and event listeners ---

    // 1. Set the initial height for the services section and the spacer
    // Call this inside a setTimeout to ensure all initial DOM rendering and calculations are complete
    setTimeout(() => {
        // Read initial dimensions now that DOM is likely settled
        SECTION_VISIBLE_HEIGHT = servicesContentWrapper.offsetHeight; 
        STICKY_TOP_OFFSET = parseInt(getComputedStyle(servicesContentWrapper).top);

        adjustServicesSectionHeight();
        // 2. Trigger initial animation state on page load
        requestAnimationFrame(updateServiceAnimation);
    }, 100); // Small delay to allow CSS to render and get accurate offsetHeights

    // 3. Recalculate height and re-render on window resize
    window.addEventListener('resize', () => {
        // Re-read dimensions as they might change with screen size
        SECTION_VISIBLE_HEIGHT = servicesContentWrapper.offsetHeight;
        STICKY_TOP_OFFSET = parseInt(getComputedStyle(servicesContentWrapper).top);
        
        adjustServicesSectionHeight();
        requestAnimationFrame(updateServiceAnimation); // Re-render immediately on resize
    });

    // 4. Attach the optimized scroll handler
    window.addEventListener('scroll', handleScrollEvent);

    // Ensure the services section itself gets the 'revealed' class
    sectionObserver.observe(servicesSection); 
});
