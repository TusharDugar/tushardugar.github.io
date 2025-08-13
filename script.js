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
    // serviceBgNumber is now inside each service-item, so we don't grab it globally anymore.
    
    // Critical check for existence
    if (!servicesSection || serviceItems.length === 0 || !servicesContentWrapper) {
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
    // Set to 1.0 to ensure one full viewport scroll for each item's transition.
    const SCROLL_DISTANCE_PER_ITEM_MULTIPLIER = 1.0; 
    let SCROLL_DISTANCE_PER_ITEM; // Will be calculated based on servicesContentWrapper height

    let currentActiveIndex = 0; // Tracks the currently active slide index, initialized to 0
    let lastScrollY = window.scrollY; // For scroll direction detection
    let rafId = null; // For requestAnimationFrame optimization

    // Function to calculate and set the total scrollable height of the services section
    const adjustServicesLayout = () => {
        // Recalculate dynamic values on resize or initial load
        const contentWrapperHeight = servicesContentWrapper.offsetHeight; 
        const servicesHeadingHeight = servicesSection.querySelector('.services-heading').offsetHeight;
        
        // The actual scroll distance for one item's animation is based on its visual height
        SCROLL_DISTANCE_PER_ITEM = contentWrapperHeight * SCROLL_DISTANCE_PER_ITEM_MULTIPLIER;

        // The total scroll range needed for all animations:
        // (Number of items - 1 transitions) * SCROLL_DISTANCE_PER_ITEM
        const totalAnimationScrollRange = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM;

        // The spacer needs to provide enough height for:
        // 1. The total scroll range of the animation
        // 2. A buffer at the end so the last item can be fully viewed as it animates in.
        // It's attached to servicesSection, so it extends the scroll area of the entire section.
        scrollSpacer.style.height = `${totalAnimationScrollRange + (window.innerHeight * 0.5)}px`; // Add half viewport height as end buffer

        // console.log(`Spacer height set to: ${scrollSpacer.offsetHeight}px for ${serviceItems.length} items.`);
        // console.log(`Content Wrapper Height: ${contentWrapperHeight}`);
        // console.log(`Scroll Distance Per Item: ${SCROLL_DISTANCE_PER_ITEM}`);
    };

    // This is the core animation logic, triggered by scroll
    const updateServiceAnimation = () => {
        // Calculate scroll progress relative to the start of the servicesContentWrapper
        // The animation starts when the top of servicesContentWrapper enters the viewport.
        const animationStartPoint = servicesContentWrapper.offsetTop; 
        let scrollProgress = window.scrollY - animationStartPoint;

        // Clamp the scroll progress to the valid range for our animation.
        const maxScrollableRangeForAnimation = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM;
        scrollProgress = Math.max(0, Math.min(maxScrollableRangeForAnimation, scrollProgress));

        // Determine which item should be active based on scroll progress
        const normalizedProgress = scrollProgress / SCROLL_DISTANCE_PER_ITEM;
        const currentIndex = Math.floor(normalizedProgress);
        const fractionalProgress = normalizedProgress - currentIndex; // Progress within the current item's transition (0 to 1)

        // Apply 3D transforms and opacity to each service item
        serviceItems.forEach((item, index) => {
            const serviceBgNumber = item.querySelector('.service-bg-number'); // Get individual background number
            let translateY = 0;
            let rotateX = 0;
            let opacity = 0;
            let zIndex = 0;

            if (index === currentIndex) {
                // The current item: animating out (rotating outwards and fading)
                rotateX = 90 * fractionalProgress; // Rotates from 0deg to 90deg (forward/outwards)
                translateY = -servicesContentWrapper.offsetHeight * fractionalProgress; // Moves upwards
                opacity = 1 - fractionalProgress; // Fades out
                zIndex = 2; // Ensures it's on top when exiting
            } else if (index === currentIndex + 1) {
                // The next item: animating in (rotating into view from behind/below)
                rotateX = -90 + (90 * fractionalProgress); 
                translateY = servicesContentWrapper.offsetHeight * (1 - fractionalProgress); // Moves downwards into place
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

            // Update the background number for the active slide
            if (serviceBgNumber) {
                const displayIndex = index + 1; // Service numbers are 1-based
                serviceBgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;
                // Set opacity for the number based on the item's visibility
                // It should be visible when the item is active, and fade out slightly.
                serviceBgNumber.style.opacity = opacity > 0.1 ? 1 : 0; // Make number fully visible when its slide is somewhat active
                // However, the CSS `color` property handles its base visibility.
            }
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
        adjustServicesLayout();
        // 2. Trigger initial animation state on page load
        requestAnimationFrame(updateServiceAnimation);
        // Ensure first item is active on load
        if (serviceItems.length > 0) {
            serviceItems[0].classList.add('active-content');
            // Background number text content is updated within updateServiceAnimation
        }
    }, 200); // Increased delay for robust calculation

    // 3. Recalculate height and re-render on window resize
    window.addEventListener('resize', () => {
        adjustServicesLayout();
        requestAnimationFrame(updateServiceAnimation); // Re-render immediately on resize
    });

    // 4. Attach the optimized scroll handler
    window.addEventListener('scroll', handleScrollEvent);

    // Ensure the services section itself gets the 'revealed' class
    sectionObserver.observe(servicesSection); 
});