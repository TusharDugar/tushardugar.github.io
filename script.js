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

    // Create the scroll spacer if it doesn't exist
    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }

    // The fixed height of the visible content window (from CSS)
    const SECTION_VISIBLE_HEIGHT = servicesContentWrapper.offsetHeight; // Should be 450px initially based on CSS
    const STICKY_TOP_OFFSET = 50; // Matches `top: 50px;` in .services-content-wrapper CSS

    // How much scroll is needed to fully transition from one slide to the next.
    // Making it slightly more than the visible height creates a smooth transition pace.
    // You can adjust '1.2' for faster/slower transitions per slide.
    const SCROLL_DISTANCE_PER_ITEM = SECTION_VISIBLE_HEIGHT * 1.2; 

    let currentActiveIndex = -1; // Tracks the currently active slide index
    let lastScrollY = window.scrollY; // For scroll direction detection
    let rafId = null; // For requestAnimationFrame optimization

    // Function to set the total scrollable height of the services section
    const adjustServicesSectionHeight = () => {
        // The total scroll range needed for all animations:
        // (Number of items - 1 transitions) * SCROLL_DISTANCE_PER_ITEM
        const totalAnimationScrollRange = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM;

        // The servicesSection needs to be tall enough to allow the sticky wrapper to "pin"
        // and for the user to scroll through the entire animation.
        // This height is provided by the `scrollSpacer`.
        // Add `SECTION_VISIBLE_HEIGHT` so the last item is fully in view when the animation ends,
        // plus the `STICKY_TOP_OFFSET` so the sticky effect feels natural from the beginning of the section.
        scrollSpacer.style.height = `${totalAnimationScrollRange + SECTION_VISIBLE_HEIGHT + STICKY_TOP_OFFSET}px`;
        // console.log(`Services Section effective scroll height: ${scrollSpacer.offsetHeight}px`);
    };

    // This is the core animation logic, triggered by scroll
    const updateServiceAnimation = () => {
        // Calculate the point where the `servicesContentWrapper` would start sticking.
        // It's the top of the `servicesSection` minus the sticky offset.
        const servicesSectionStartScroll = servicesSection.offsetTop - STICKY_TOP_OFFSET;

        // Calculate how far the user has scrolled *within* the services section's designated animation area.
        let scrollProgressInAnimation = window.scrollY - servicesSectionStartScroll;

        // Clamp the scroll progress to the valid range for our animation.
        // The maximum value is the total height of the spacer, minus the sticky offset and visible height,
        // to ensure the animation completes as the section ends.
        const maxScrollProgress = scrollSpacer.offsetHeight - STICKY_TOP_OFFSET - SECTION_VISIBLE_HEIGHT;
        scrollProgressInAnimation = Math.max(0, Math.min(maxScrollProgress, scrollProgressInAnimation));

        // Determine which item should be active based on scroll progress
        const normalizedProgress = scrollProgressInAnimation / SCROLL_DISTANCE_PER_ITEM;
        const currentIndex = Math.floor(normalizedProgress);
        const fractionalProgress = normalizedProgress - currentIndex; // Progress within the current item's transition (0 to 1)

        // Update the background number for the active slide
        const newActiveIndex = Math.max(0, Math.min(serviceItems.length - 1, currentIndex));
        if (newActiveIndex !== currentActiveIndex) {
            currentActiveIndex = newActiveIndex;
            const displayIndex = currentActiveIndex + 1; // Service numbers are 1-based
            serviceBgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;
        }

        // Apply 3D transforms and opacity to each service item
        serviceItems.forEach((item, index) => {
            let translateY = 0;
            let rotateX = 0;
            let opacity = 0;
            let zIndex = 0;

            if (index === currentIndex) {
                // The current item: animating out (rotating upwards and fading)
                rotateX = -90 * fractionalProgress; // Rotates from 0deg to -90deg
                translateY = -SECTION_VISIBLE_HEIGHT * fractionalProgress; // Moves upwards
                opacity = 1 - fractionalProgress; // Fades out
                zIndex = 2; // Ensures it's on top when exiting
            } else if (index === currentIndex + 1) {
                // The next item: animating in (rotating downwards and fading)
                rotateX = 90 * (1 - fractionalProgress); // Rotates from 90deg to 0deg
                translateY = SECTION_VISIBLE_HEIGHT * (1 - fractionalProgress); // Moves downwards into place
                opacity = fractionalProgress; // Fades in
                zIndex = 1; // Appears just below the exiting item
            } else {
                // All other items are hidden and reset
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

    // 1. Set the initial height for the services section
    adjustServicesSectionHeight();

    // 2. Recalculate height and re-render on window resize
    window.addEventListener('resize', () => {
        // Re-calculate visible height on resize as it might change
        const updatedSectionVisibleHeight = servicesContentWrapper.offsetHeight;
        if (SECTION_VISIBLE_HEIGHT !== updatedSectionVisibleHeight) {
            // Update the constant if necessary, though it's typically fixed by CSS
            // SECTION_VISIBLE_HEIGHT = updatedSectionVisibleHeight; // Would need to make this a `let`
        }
        adjustServicesSectionHeight();
        // Immediately update animation state to prevent visual glitches after resize
        requestAnimationFrame(updateServiceAnimation); 
    });

    // 3. Attach the optimized scroll handler
    window.addEventListener('scroll', handleScrollEvent);

    // 4. Trigger initial animation state on page load
    // Using setTimeout to ensure all DOM elements and CSS are rendered and calculated.
    setTimeout(() => {
        requestAnimationFrame(updateServiceAnimation);
    }, 100);

    // Ensure the services section itself gets the 'revealed' class
    sectionObserver.observe(servicesSection); 
});