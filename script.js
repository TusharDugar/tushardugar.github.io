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
    
    // Check if services section and its critical elements exist before proceeding
    if (!servicesSection || serviceItems.length === 0 || !serviceBgNumber) {
        console.warn('Services section elements not found. Skipping services animation setup.');
        // Ensure the section is still revealed even if animation is skipped
        if (servicesSection) servicesSection.classList.add('revealed');
        return; // Exit if elements aren't present
    }

    // Ensure the scroll spacer element exists within the services section
    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }
    
    // Constants for animation control
    // This is the fixed height of the .services-content-wrapper that holds the visible service item.
    const SECTION_VISIBLE_HEIGHT = servicesContentWrapper.offsetHeight; 
    
    // This defines how much scroll distance is needed to fully transition one item.
    // Making it 1.5 times the visible height provides a smooth, unhurried 3D rotation.
    const SCROLL_DISTANCE_PER_ITEM = SECTION_VISIBLE_HEIGHT * 1.5; 

    let currentActiveIndex = -1; // Keep track of the currently "active" item for efficiency
    let lastScrollY = window.scrollY;
    let rafId = null; // Used for requestAnimationFrame optimization

    // Function to adjust the scroll spacer height dynamically
    const adjustScrollSpacerHeight = () => {
        // The total scrollable height of the spacer is calculated to allow for:
        // (number of items - 1) full transitions, plus
        // an additional SCROLL_DISTANCE_PER_ITEM at the end to ensure the last item animates fully into view
        // and stays visible for a moment before scrolling to the next section.
        const totalSpacerHeight = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM + SCROLL_DISTANCE_PER_ITEM;
        scrollSpacer.style.height = `${totalSpacerHeight}px`;
        // console.log(`Spacer height set to: ${totalSpacerHeight}px`);
    };

    // Main function to update the transforms and opacity of service items based on scroll
    const updateServiceAnimation = () => {
        const servicesSectionTop = servicesSection.offsetTop; // Top position of the entire services section
        const windowScrollTop = window.scrollY;

        // Calculate scroll progress relative to the start of the services section.
        // The animation zone effectively starts when the top of the services section aligns with the top of the viewport.
        let scrollProgressInServices = windowScrollTop - servicesSectionTop;

        // Clamp scrollProgress to ensure it stays within the effective animation range defined by the spacer.
        scrollProgressInServices = Math.max(0, Math.min(scrollSpacer.offsetHeight, scrollProgressInServices));

        // Determine the current "active" item index and its fractional progress through the transition.
        const normalizedScroll = scrollProgressInServices / SCROLL_DISTANCE_PER_ITEM;
        const currentIndex = Math.floor(normalizedScroll);
        const fractionalProgress = normalizedScroll - currentIndex; // Value from 0 to 1 for the transition between current and next item

        // Update background number only if the active index has truly changed
        const newActiveIndex = Math.max(0, Math.min(serviceItems.length - 1, currentIndex));
        if (newActiveIndex !== currentActiveIndex) {
            currentActiveIndex = newActiveIndex;
            const displayIndex = currentActiveIndex + 1; // Service numbers are 1-based
            serviceBgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;
        }

        // Apply transforms and opacity to each service item
        serviceItems.forEach((item, index) => {
            let translateY = 0;
            let rotateX = 0;
            let opacity = 0;
            let zIndex = 0; // Control stacking order during transitions

            if (index === currentIndex) {
                // This is the item that is currently visible and is potentially rotating out.
                rotateX = -90 * fractionalProgress; // Rotates from 0deg (fully visible) to -90deg (rotated upwards)
                translateY = -SECTION_VISIBLE_HEIGHT * fractionalProgress; // Moves upwards as it rotates out
                opacity = 1 - fractionalProgress; // Fades out
                zIndex = 2; // Ensures the current item is on top while it's exiting
            } else if (index === currentIndex + 1) {
                // This is the next item that is rotating into view.
                rotateX = 90 * (1 - fractionalProgress); // Rotates from 90deg (off-screen below) to 0deg (fully visible)
                translateY = SECTION_VISIBLE_HEIGHT * (1 - fractionalProgress); // Moves downwards into place
                opacity = fractionalProgress; // Fades in
                zIndex = 1; // Appears just below the exiting item
            } else {
                // All other items are completely hidden and reset to default state to avoid interference.
                opacity = 0;
                translateY = 0;
                rotateX = 0;
                zIndex = 0;
            }

            item.style.transform = `translateY(${translateY}px) rotateX(${rotateX}deg)`;
            item.style.opacity = opacity;
            item.style.zIndex = zIndex;
        });
    };

    // Debounced scroll handler using requestAnimationFrame for performance
    const handleScroll = () => {
        // Only update if scroll position has actually changed to avoid unnecessary work
        if (window.scrollY !== lastScrollY) {
            lastScrollY = window.scrollY;
            // Cancel any pending animation frame to ensure only the latest scroll position is rendered
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            // Request a new animation frame to call updateServiceAnimation
            rafId = requestAnimationFrame(updateServiceAnimation);
        }
    };

    // Initial setup and event listeners
    adjustScrollSpacerHeight(); // Calculate spacer height initially

    // Handle resizing: recalculate spacer height and re-render animation to adapt to new dimensions
    window.addEventListener('resize', () => {
        adjustScrollSpacerHeight();
        updateServiceAnimation(); // Re-render immediately on resize
    });

    // Attach the main scroll handler to the window's scroll event
    window.addEventListener('scroll', handleScroll);

    // Call updateServiceAnimation immediately on page load to set the correct initial state.
    // This is crucial for the first item to be visible and correctly positioned when the page loads.
    // A small delay ensures all CSS and element dimensions are correctly calculated by the browser.
    setTimeout(() => {
        updateServiceAnimation();
    }, 100);

    // The 'servicesSection' is already observed by 'sectionObserver'
    // to add the 'revealed' class for its initial fade-in (as a whole section).
});