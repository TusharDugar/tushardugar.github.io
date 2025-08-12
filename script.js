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

    // Create the scroll spacer if it doesn't exist within the services section
    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }

    // Define the fixed height of the visible services content wrapper (from CSS)
    const SECTION_VISIBLE_HEIGHT = servicesContentWrapper.offsetHeight; 
    
    // Define how much scroll distance is needed to fully transition one item.
    // This value is crucial for controlling the animation speed and overall section length.
    // Adjust '1.2' for faster/slower transitions per slide (e.g., 1.0 for very fast, 2.0 for slow).
    const SCROLL_DISTANCE_PER_ITEM = SECTION_VISIBLE_HEIGHT * 1.2; 

    let currentActiveIndex = -1; // Tracks the currently active slide index
    let lastScrollY = window.scrollY; // For scroll direction detection
    let rafId = null; // For requestAnimationFrame optimization

    // Function to set the total scrollable height of the services section
    const adjustServicesSectionHeight = () => {
        // The total scroll range needed for all animations:
        // (Number of items - 1 transitions) * SCROLL_DISTANCE_PER_ITEM
        const totalAnimationScrollRange = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM;

        // The scroll spacer's height extends the services section.
        // It needs to provide enough height for all transitions,
        // PLUS the visible height of the last item so it can be fully displayed at the end.
        scrollSpacer.style.height = `${totalAnimationScrollRange + SECTION_VISIBLE_HEIGHT}px`;
        // console.log(`Spacer height set to: ${scrollSpacer.offsetHeight}px for ${serviceItems.length} items.`);
    };

    // This is the core animation logic, triggered by scroll
    const updateServiceAnimation = () => {
        const servicesSectionTop = servicesSection.offsetTop; // Top position of the entire services section

        // Calculate how far the user has scrolled *relative to the start of the animation*.
        // The animation starts when the top of the `servicesContentWrapper` enters the viewport.
        // We consider `servicesContentWrapper.offsetTop` relative to its parent `servicesSection`.
        const animationStartPoint = servicesSectionTop + servicesContentWrapper.offsetTop;
        let scrollProgressInAnimation = window.scrollY - animationStartPoint;

        // Clamp the scroll progress to the valid range for our animation.
        // The maximum value is the height of the spacer.
        scrollProgressInAnimation = Math.max(0, Math.min(scrollSpacer.offsetHeight, scrollProgressInAnimation));

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
        adjustServicesSectionHeight();
        // 2. Trigger initial animation state on page load
        requestAnimationFrame(updateServiceAnimation);
    }, 100); // Small delay to allow CSS to render and get accurate offsetHeights

    // 3. Recalculate height and re-render on window resize
    window.addEventListener('resize', () => {
        adjustServicesSectionHeight();
        requestAnimationFrame(updateServiceAnimation); // Re-render immediately on resize
    });

    // 4. Attach the optimized scroll handler
    window.addEventListener('scroll', handleScrollEvent);

    // Ensure the services section itself gets the 'revealed' class
    sectionObserver.observe(servicesSection); 
});