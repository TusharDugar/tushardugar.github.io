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
        return; // Exit if elements aren't present
    }

    // Ensure the scroll spacer element exists
    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }
    
    // Constants for animation control
    // This should match the CSS height of .services-content-wrapper
    const SECTION_VISIBLE_HEIGHT = servicesContentWrapper.offsetHeight; 
    // This is the scroll distance needed to fully transition from one slide to the next.
    // Making it equal to SECTION_VISIBLE_HEIGHT ensures a compact scroll.
    const SCROLL_DISTANCE_PER_ITEM = SECTION_VISIBLE_HEIGHT; 

    // Function to adjust the scroll spacer height dynamically
    const adjustScrollSpacerHeight = () => {
        // Total scrollable height provided by the spacer:
        // (number of items - 1) * SCROLL_DISTANCE_PER_ITEM to transition between them,
        // plus one SECTION_VISIBLE_HEIGHT so the last item can be fully active in view.
        const totalSpacerHeight = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM + SECTION_VISIBLE_HEIGHT;
        scrollSpacer.style.height = `${totalSpacerHeight}px`;
    };

    // Main scroll handler for the services section animation
    const handleServicesScroll = () => {
        const servicesSectionTop = servicesSection.offsetTop;
        const windowScrollTop = window.scrollY;

        // Calculate scroll progress within the services section's active animation zone
        // The animation starts when the top of the services section aligns with the viewport top.
        let scrollProgress = windowScrollTop - servicesSectionTop;

        // Clamp scrollProgress to the effective animation range
        scrollProgress = Math.max(0, Math.min(scrollSpacer.offsetHeight, scrollProgress));

        // Determine the current "active" item index based on scrollProgress
        const activeItemIndex = Math.floor(scrollProgress / SCROLL_DISTANCE_PER_ITEM);
        // Calculate relative scroll within the current item's transition phase
        const relativeScroll = scrollProgress % SCROLL_DISTANCE_PER_ITEM;

        // Update background number
        const displayIndex = activeItemIndex + 1;
        serviceBgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;

        // Loop through all service items to apply transforms and opacity
        serviceItems.forEach((item, index) => {
            let translateY = 0;
            let rotateX = 0;
            let opacity = 0;
            let zIndex = 0;

            if (index === activeItemIndex) {
                // This is the current active item, possibly rotating out
                const progressOut = relativeScroll / SCROLL_DISTANCE_PER_ITEM; // 0 to 1
                rotateX = -90 * progressOut; // Rotates from 0 to -90 degrees (upwards)
                translateY = -SECTION_VISIBLE_HEIGHT * progressOut; // Moves upwards
                opacity = 1 - progressOut; // Fades out
                zIndex = 2; // Keep on top during its exit
            } else if (index === activeItemIndex + 1) {
                // This is the next item, rotating in
                const progressIn = 1 - (relativeScroll / SCROLL_DISTANCE_PER_ITEM); // 1 to 0
                rotateX = 90 * progressIn; // Rotates from 90 to 0 degrees (downwards into view)
                translateY = SECTION_VISIBLE_HEIGHT * progressIn; // Moves downwards into place
                opacity = 1 - progressIn; // Fades in
                zIndex = 1; // Appears below the exiting slide initially
            } else {
                // All other items are hidden
                opacity = 0;
                translateY = 0;
                rotateX = 0;
                zIndex = 0;
            }

            // Apply transforms and opacity
            item.style.transform = `translateY(${translateY}px) rotateX(${rotateX}deg)`;
            item.style.opacity = opacity;
            item.style.zIndex = zIndex;
        });
    };

    // Initial setup and event listeners
    adjustScrollSpacerHeight(); // Calculate spacer height initially
    window.addEventListener('resize', adjustScrollSpacerHeight); // Recalculate on window resize
    window.addEventListener('scroll', handleServicesScroll); // Attach scroll handler

    // Call handleServicesScroll immediately on page load to set the correct initial state
    // This is crucial for the first item to be visible and correctly positioned.
    handleServicesScroll();

    // Also observe the main services section itself for the general reveal animation.
    sectionObserver.observe(servicesSection); 
});