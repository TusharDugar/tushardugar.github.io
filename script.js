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
    const servicesHeading = servicesSection ? servicesSection.querySelector('.services-heading') : null;
    const servicesContentWrapper = servicesSection ? servicesSection.querySelector('.services-content-wrapper') : null;
    const serviceItems = servicesContentWrapper ? servicesContentWrapper.querySelectorAll('.service-item') : [];
    const serviceBgNumber = servicesContentWrapper ? servicesContentWrapper.querySelector('.service-bg-number') : null;
    
    // Critical check for existence
    if (!servicesSection || serviceItems.length === 0 || !servicesHeading || !servicesContentWrapper || !serviceBgNumber) {
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

    // Define how much scroll distance is needed to fully transition one item.
    // Reverting to 1.0 multiplier for cleaner 1:1 scroll interaction, which aligns better with "hold" each item.
    const SCROLL_DISTANCE_PER_ITEM_MULTIPLIER = 1.0; 
    let SCROLL_DISTANCE_PER_ITEM; // Will be calculated based on servicesContentWrapper height

    let currentActiveIndex = 0; // Tracks the currently active slide index, initialized to 0
    let lastScrollY = window.scrollY; // For scroll direction detection
    let rafId = null; // For requestAnimationFrame optimization

    // Function to calculate and set the total scrollable height of the services section
    // and the sticky container's top offset for centering
    const adjustServicesLayout = () => {
        // Recalculate dynamic values on resize or initial load
        const contentWrapperHeight = servicesContentWrapper.offsetHeight;
        const servicesHeadingHeight = servicesHeading.offsetHeight;
        const gapBetweenHeadingAndWrapper = 50; // Based on margin-bottom on heading in CSS

        // Total visual height of the sticky block when it is stuck
        const totalVisualStickyBlockHeight = servicesHeadingHeight + gapBetweenHeadingAndWrapper + contentWrapperHeight;

        // Calculate the ideal top offset for the heading to be visually centered
        // It's (viewport height - total visual sticky block height) / 2
        let stickyTopH2 = (window.innerHeight - totalVisualStickyBlockHeight) / 2;
        stickyTopH2 = Math.max(0, stickyTopH2); // Ensure it's not negative

        // The wrapper's sticky top should be right below the heading + gap when both are sticky
        let stickyTopWrapper = stickyTopH2 + servicesHeadingHeight + gapBetweenHeadingAndWrapper;

        // Set CSS variables for sticky top offsets
        servicesSection.style.setProperty('--services-sticky-top-h2', `${stickyTopH2}px`);
        servicesSection.style.setProperty('--services-sticky-top-wrapper', `${stickyTopWrapper}px`);

        // The actual scroll distance for one item's animation (1:1 scroll with wrapper height)
        SCROLL_DISTANCE_PER_ITEM = contentWrapperHeight * SCROLL_DISTANCE_PER_ITEM_MULTIPLIER;

        // Total scroll required for all items to transition AND the last item to hold.
        // If there are N items, there are N "positions" for items to be fully displayed.
        const totalAnimationDurationScroll = serviceItems.length * SCROLL_DISTANCE_PER_ITEM; 

        // The spacer needs to provide enough height for:
        // 1. All N items to have their full display and transition time (`totalAnimationDurationScroll`).
        // 2. The entire sticky block (heading + content wrapper) to scroll out of view
        //    after the animation sequence is complete.
        scrollSpacer.style.height = `${totalAnimationDurationScroll + totalVisualStickyBlockHeight}px`;

        console.log('--- Services Layout Adjusted (Revised Final) ---');
        console.log(`Viewport Height: ${window.innerHeight}px`);
        console.log(`Heading Height: ${servicesHeadingHeight}px, Wrapper Height: ${contentWrapperHeight}px`);
        console.log(`Total Visual Sticky Block Height: ${totalVisualStickyBlockHeight}px`);
        console.log(`Sticky Top H2 (CSS variable): ${stickyTopH2}px`);
        console.log(`Sticky Top Wrapper (CSS variable): ${stickyTopWrapper}px`);
        console.log(`SCROLL_DISTANCE_PER_ITEM: ${SCROLL_DISTANCE_PER_ITEM}px`);
        console.log(`Total Animation Duration Scroll (N items * dist/item): ${totalAnimationDurationScroll}px`);
        console.log(`Calculated Scroll Spacer Height: ${scrollSpacer.offsetHeight}px`);
        console.log(`servicesSection.offsetTop: ${servicesSection.offsetTop}px`);
    };

    // This is the core animation logic, triggered by scroll
    const updateServiceAnimation = () => {
        // Calculate scroll progress relative to when the services section's heading starts sticking
        const stickyH2Top = parseFloat(getComputedStyle(servicesSection).getPropertyValue('--services-sticky-top-h2'));
        const animationStartScroll = servicesSection.offsetTop + stickyH2Top;

        let scrollProgress = window.scrollY - animationStartScroll;

        // Clamp the scroll progress to ensure it only covers the defined animation duration.
        // Max range is now N items * SCROLL_DISTANCE_PER_ITEM, because the last item also gets a full "scroll slot" to hold its position.
        const maxScrollableRangeForAnimation = serviceItems.length * SCROLL_DISTANCE_PER_ITEM; 
        scrollProgress = Math.max(0, Math.min(maxScrollableRangeForAnimation, scrollProgress));

        // Determine which item should be active based on scroll progress
        const normalizedProgress = scrollProgress / SCROLL_DISTANCE_PER_ITEM;
        
        const currentIndex = Math.floor(normalizedProgress);
        // fractionalProgress should be 0 for the fully active item, and animate to 1 as it exits.
        // For the last item, fractionalProgress should remain 0 once it's fully in view.
        let fractionalProgress = normalizedProgress - currentIndex;

        // If we are on the last item and it has fully entered, lock fractionalProgress to 0
        if (currentIndex === serviceItems.length - 1 && fractionalProgress > 0) {
            fractionalProgress = 0; // Lock the last item in place
        }

        // Update the background number for the active slide
        const newActiveIndex = Math.max(0, Math.min(serviceItems.length - 1, currentIndex));
        if (newActiveIndex !== currentActiveIndex) {
            currentActiveIndex = newActiveIndex;
        }
        const displayIndex = currentActiveIndex + 1; // Service numbers are 1-based
        serviceBgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;

        const contentWrapperHeight = servicesContentWrapper.offsetHeight; // Get current height

        // Apply 3D transforms and opacity to each service item
        serviceItems.forEach((item, index) => {
            let translateY = 0;
            let rotateX = 0;
            let opacity = 0;
            let zIndex = 0;

            if (index === currentIndex) {
                // The current item: animating out (rotating outwards and fading)
                rotateX = 90 * fractionalProgress; 
                translateY = -contentWrapperHeight * fractionalProgress; 
                opacity = 1 - fractionalProgress; 
                zIndex = 2; // On top when exiting
            } else if (index === currentIndex + 1) {
                // The next item: animating in (rotating into view from behind/below)
                rotateX = -90 + (90 * fractionalProgress); 
                translateY = contentWrapperHeight * (1 - fractionalProgress); 
                opacity = fractionalProgress; 
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

        // Uncomment for detailed debugging in console
        // console.log(`ScrollY: ${window.scrollY}, StartScroll: ${animationStartScroll.toFixed(2)}, Progress: ${scrollProgress.toFixed(2)}, CurrentIndex: ${currentIndex}, Fractional: ${fractionalProgress.toFixed(2)}`);

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

    const initializeServices = () => {
        adjustServicesLayout();
        requestAnimationFrame(updateServiceAnimation); // Trigger initial animation state
        // Ensure first item is active on load
        if (serviceItems.length > 0) {
            serviceItems[0].classList.add('active-content'); // Ensure first item is visible initially
            serviceBgNumber.textContent = '01'; // Set initial background number
        }
    };

    // Use a small delay with setTimeout for robust calculation after page render
    setTimeout(initializeServices, 500); 

    // Recalculate height and re-render on window resize (debounced)
    window.addEventListener('resize', () => {
        clearTimeout(window.resizeServicesTimeout);
        window.resizeServicesTimeout = setTimeout(() => {
            adjustServicesLayout();
            requestAnimationFrame(updateServiceAnimation); 
        }, 100);
    });

    // Attach the optimized scroll handler
    window.addEventListener('scroll', handleScrollEvent);

    // Ensure the services section itself gets the 'revealed' class
    sectionObserver.observe(servicesSection);
});