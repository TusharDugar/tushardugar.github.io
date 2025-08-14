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

    // Scroll Reveal Animation (Intersection Observer) - for general sections (one-shot reveal)
    const sectionObserverOptions = {
        root: null, // viewport as the root
        rootMargin: '0px',
        threshold: 0.1 // 10% of the item must be visible to trigger
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Unobserve for general sections to run animation once
                // Services section is handled by its own scroll logic
                if (entry.target.id !== 'services') { 
                    observer.unobserve(entry.target); 
                }
            }
        });
    }, sectionObserverOptions);

    // Observe all main sections with the general section observer
    document.querySelectorAll('.about-left-content').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('#contact').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('#hero-right').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('#tools').forEach(el => sectionObserver.observe(el));


    // --- Services Section Animation Logic (3D Cube Scroll Effect) ---
    const servicesSection = document.getElementById('services');
    const servicesHeading = servicesSection ? servicesSection.querySelector('.services-heading') : null;
    const servicesContentWrapper = servicesSection ? servicesSection.querySelector('.services-content-wrapper') : null;
    const serviceItems = servicesContentWrapper ? servicesContentWrapper.querySelectorAll('.service-item') : [];
    const serviceBgNumber = servicesSection ? servicesSection.querySelector('.service-bg-number') : null; // Now relative to section

    // Critical check for existence of all required elements
    if (!servicesSection || serviceItems.length === 0 || !servicesHeading || !servicesContentWrapper || !serviceBgNumber) {
        console.warn('Services section or required elements not found. Skipping services animation setup.');
        // Ensure section itself still reveals if children animation is skipped
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

    // Define how much scroll distance is needed to fully transition one item.
    // This multiplier allows fine-tuning how "long" the scroll animation for one item feels.
    const SCROLL_DISTANCE_PER_ITEM_MULTIPLIER = 1.2; // Adjust as needed for scroll "feel"
    let SCROLL_DISTANCE_PER_ITEM; // Will be calculated dynamically based on contentWrapperHeight

    let currentActiveIndex = 0; // Tracks the currently active slide index
    let rafId = null; // For requestAnimationFrame optimization

    // Function to calculate and set the total scrollable height of the services section
    // and the sticky container's top offset for centering
    const adjustServicesLayout = () => {
        // Recalculate dynamic values on resize or initial load
        const contentWrapperHeight = servicesContentWrapper.offsetHeight; 
        const servicesHeadingHeight = servicesHeading.offsetHeight;
        const gapBetweenHeadingAndWrapper = 50; // Based on margin-bottom on heading in CSS

        // Calculate the ideal top offset for the heading to be visually centered
        // It's (viewport height - total visible sticky content height) / 2
        // Total visible sticky content is heading + gap + contentWrapper
        const totalVisibleStickyHeight = servicesHeadingHeight + gapBetweenHeadingAndWrapper + contentWrapperHeight;
        let stickyTopH2 = (window.innerHeight - totalVisibleStickyHeight) / 2;
        stickyTopH2 = Math.max(0, stickyTopH2); // Ensure it's not negative

        // The wrapper's sticky top should be right below the heading + gap
        let stickyTopWrapper = stickyTopH2 + servicesHeadingHeight + gapBetweenHeadingAndWrapper;

        // Set CSS variables for sticky top offsets
        servicesSection.style.setProperty('--services-sticky-top-h2', `${stickyTopH2}px`);
        servicesSection.style.setProperty('--services-sticky-top-wrapper', `${stickyTopWrapper}px`);

        // Update the CSS variable for 3D face offset
        // This should be half the height of the contentWrapper
        const newFaceOffset = contentWrapperHeight / 2;
        servicesSection.style.setProperty('--services-face-offset', `${newFaceOffset}px`);

        // The actual scroll distance for one item's animation
        SCROLL_DISTANCE_PER_ITEM = contentWrapperHeight * SCROLL_DISTANCE_PER_ITEM_MULTIPLIER;

        // The total animation scroll range for all items to transition
        const totalAnimationScrollRange = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM;

        // The spacer needs to provide enough height for:
        // 1. Scrolling until the sticky elements hit their top position (stickyTopH2)
        // 2. Scrolling through the entire animation range (totalAnimationScrollRange)
        // 3. A buffer at the end so the last animation can complete before the section ends.
        scrollSpacer.style.height = `${stickyTopH2 + totalAnimationScrollRange + (window.innerHeight * 0.8)}px`; // Increased end buffer

        // Console logs for debugging layout calculation
        // console.log(`[Services Layout] Spacer height set to: ${scrollSpacer.offsetHeight}px for ${serviceItems.length} items.`);
        // console.log(`[Services Layout] Heading Height: ${servicesHeadingHeight}, Wrapper Height: ${contentWrapperHeight}`);
        // console.log(`[Services Layout] Sticky Top H2: ${stickyTopH2}, Sticky Top Wrapper: ${stickyTopWrapper}`);
        // console.log(`[Services Layout] Scroll Distance Per Item: ${SCROLL_DISTANCE_PER_ITEM}`);
    };

    // This is the core animation logic, triggered by scroll
    const updateServiceAnimation = () => {
        // console.log('[Services Animation] updateServiceAnimation is running...');

        // Calculate scroll progress relative to when the services section's heading starts sticking
        const stickyH2Top = parseFloat(getComputedStyle(servicesSection).getPropertyValue('--services-sticky-top-h2'));
        const animationStartScroll = servicesSection.offsetTop + stickyH2Top;

        let scrollProgress = window.scrollY - animationStartScroll;

        // Clamp the scroll progress to the valid range for our animation.
        const maxScrollableRangeForAnimation = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM;
        scrollProgress = Math.max(0, Math.min(maxScrollableRangeForAnimation, scrollProgress));

        // Determine which item should be active based on scroll progress
        const normalizedProgress = scrollProgress / SCROLL_DISTANCE_PER_ITEM;
        const currentIndex = Math.floor(normalizedProgress);
        const fractionalProgress = normalizedProgress - currentIndex; // Progress within the current item's transition (0 to 1)

        // Console logs for debugging animation progress
        // console.log(`[Services Animation] Current Index: ${currentIndex}, Fractional Progress: ${fractionalProgress.toFixed(2)}`);

        // Update the background number for the active slide
        const newActiveIndex = Math.max(0, Math.min(serviceItems.length - 1, currentIndex));
        if (newActiveIndex !== currentActiveIndex) {
            currentActiveIndex = newActiveIndex;
        }
        const displayIndex = currentActiveIndex + 1; // Service numbers are 1-based
        serviceBgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;

        // Get the current value of --services-face-offset from CSS for consistent calculations
        const faceOffset = parseFloat(getComputedStyle(servicesSection).getPropertyValue('--services-face-offset'));
        
        // Apply 3D transforms and opacity to each service item
        serviceItems.forEach((item, index) => {
            let opacity = 0;
            let transformValue = '';
            let zIndex = 0;

            if (index === currentIndex) {
                // The current item: active, but animating out (rotating upwards and fading)
                // Rotates from 0deg to 90deg (forward/outwards) as fractionalProgress goes from 0 to 1
                const rotation = 90 * fractionalProgress;
                transformValue = `rotateX(${rotation}deg) translateZ(${faceOffset}px)`;
                opacity = 1 - fractionalProgress; // Fades out from 1 to 0
                zIndex = 2; // Ensures it's on top when exiting
            } else if (index === currentIndex + 1) {
                // The next item: animating in (rotating into view from behind/below)
                // Rotates from 90deg to 0deg (inwards) as fractionalProgress goes from 0 to 1
                const rotation = 90 - (90 * fractionalProgress);
                transformValue = `rotateX(${rotation}deg) translateZ(${faceOffset}px)`;
                opacity = fractionalProgress; // Fades in from 0 to 1
                zIndex = 1; // Appears just below the exiting item
            } else {
                // All other items are completely hidden and reset to their inactive transformed state
                // This is crucial to prevent them from "popping" into view incorrectly.
                transformValue = `rotateX(90deg) translateZ(${faceOffset}px)`; // Pushed back and rotated
                opacity = 0; // Fully transparent
                zIndex = 0; // Lowest z-index
            }

            item.style.transform = transformValue;
            item.style.opacity = opacity;
            item.style.zIndex = zIndex;
        });

        rafId = null; // Reset requestAnimationFrame ID
    };

    // Debounced scroll handler to optimize performance with requestAnimationFrame
    const handleScrollEvent = () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(updateServiceAnimation);
    };

    // --- Initialize animation and event listeners ---

    // 1. Set the initial height for the services section and the spacer
    // Call this inside a setTimeout to ensure all initial DOM rendering and calculations are complete
    setTimeout(() => {
        adjustServicesLayout();
        // 2. Trigger initial animation state on page load
        updateServiceAnimation(); // Call directly once to set initial state based on current scroll
        // Ensure the first item is active initially if the section is in view
        if (serviceItems.length > 0) {
            serviceItems[0].classList.add('active-content'); // Set the first item active initially
            serviceBgNumber.textContent = '01'; // Ensure number is correct
        }
    }, 200); // Increased delay for robust calculation

    // 3. Recalculate height and re-render on window resize
    window.addEventListener('resize', () => {
        adjustServicesLayout();
        handleScrollEvent(); // Re-render immediately on resize
    });

    // 4. Attach the optimized scroll handler
    window.addEventListener('scroll', handleScrollEvent);

    // Ensure the services section itself gets the 'revealed' class for its parent section observer
    sectionObserver.observe(servicesSection); 
});