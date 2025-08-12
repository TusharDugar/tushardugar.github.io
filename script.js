document.addEventListener('DOMContentLoaded', () => {
    // Contact Button Copy to Clipboard Functionality (UNCHANGED)
    const contactButtons = document.querySelectorAll('.contact-button');

    contactButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const contactValue = button.dataset.contact;

            if (button.classList.contains('copied')) {
                // console.log('Button already showing "Copied!". Returning.');
                return; 
            }

            try {
                await navigator.clipboard.writeText(contactValue);
                // console.log('Text copied to clipboard:', contactValue);
                
                button.classList.add('copied');
                // console.log('Class "copied" added to button.');

                setTimeout(() => {
                    button.classList.remove('copied');
                    // console.log('Class "copied" removed from button after 1.5 seconds.');
                }, 1500);
            } catch (err) {
                console.error('Failed to copy text: ', err);
                alert('Could not copy automatically. Please copy manually: ' + contactValue);
            }
        });
    });

    // Scroll Reveal Animation (Intersection Observer) - for main sections (one-shot reveal) (UNCHANGED)
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

    // Observe all main sections with the section observer (UNCHANGED)
    document.querySelectorAll('.about-left-content').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('#contact').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('#hero-right').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('#tools').forEach(el => sectionObserver.observe(el));


    // --- Services Section Animation Logic (Framer-like "cuboid" scroll effect) ---
    const servicesSection = document.getElementById('services');
    const servicesStickyContainer = servicesSection ? servicesSection.querySelector('#services-sticky-container') : null;
    const servicesSlidesViewport = servicesStickyContainer ? servicesStickyContainer.querySelector('.services-content-wrapper') : null;
    const serviceItems = servicesSlidesViewport ? servicesSlidesViewport.querySelectorAll('.service-item') : [];
    const serviceBgNumber = servicesSlidesViewport ? servicesSlidesViewport.querySelector('#service-bg-number') : null;
    
    // Critical check for existence
    if (!servicesSection || serviceItems.length === 0 || !servicesStickyContainer || !servicesSlidesViewport || !serviceBgNumber) {
        console.warn('Services section or required elements not found. Skipping services animation setup.');
        if (servicesSection) servicesSection.classList.add('revealed'); // Ensure section itself still reveals
        return; 
    }

    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }

    let ANIMATION_VIEWPORT_HEIGHT; 
    let STICKY_CONTAINER_OFFSET_FOR_SPACER; // Renamed to clarify its role for spacer calculation
    const SCROLL_DISTANCE_PER_ITEM_MULTIPLIER = 0.9; 
    let SCROLL_DISTANCE_PER_ITEM; 

    let currentActiveIndex = -1; 
    let lastScrollY = window.scrollY; 
    let rafId = null; 

    // This function is now simplified as CSS handles the actual centering via `top: 50%`
    // The `offsetHeight` is used for spacer calculation.
    const getStickyOffsetForSpacer = () => {
        // When CSS has `top: 50%; transform: translateY(-50%);`, the visual top offset
        // where the element 'sticks' is effectively `(viewportHeight / 2) - (stickyContainerHeight / 2)`.
        // The spacer needs to account for the height of the sticky container
        // and how much "vertical space" it occupies from its actual sticky position.
        // For the spacer calculation, what matters is the full height of the sticky container.
        const viewportHeight = window.innerHeight;
        const stickyContainerHeight = servicesStickyContainer.offsetHeight;

        // The effective offset from the top of the viewport when centered.
        // This is primarily for the spacer calculation's starting point.
        let calculatedTopOffset = (viewportHeight - stickyContainerHeight) / 2;
        calculatedTopOffset = Math.max(0, calculatedTopOffset); // Clamp to 0

        console.log('--- getStickyOffsetForSpacer Debug ---');
        console.log('  Viewport Height:', viewportHeight);
        console.log('  Sticky Container OffsetHeight:', stickyContainerHeight);
        console.log('  Calculated Sticky Top Offset (for spacer):', calculatedTopOffset);
        return calculatedTopOffset;
    };

    const adjustServicesSectionHeight = () => {
        // Recalculate dynamic values on resize or initial load
        ANIMATION_VIEWPORT_HEIGHT = servicesSlidesViewport.offsetHeight; 
        
        // DEBUGGING: Log main animation viewport height
        console.log('--- adjustServicesSectionHeight Debug ---');
        console.log('  Services Slides Viewport OffsetHeight (ANIMATION_VIEWPORT_HEIGHT):', ANIMATION_VIEWPORT_HEIGHT);

        // Get the offset that the spacer needs to account for
        STICKY_CONTAINER_OFFSET_FOR_SPACER = getStickyOffsetForSpacer(); 
        // We no longer set servicesStickyContainer.style.top here, as CSS handles top: 50%

        SCROLL_DISTANCE_PER_ITEM = ANIMATION_VIEWPORT_HEIGHT * SCROLL_DISTANCE_PER_ITEM_MULTIPLIER;
        
        // DEBUGGING: Log scroll distance per item
        console.log('  Scroll Distance Per Item:', SCROLL_DISTANCE_PER_ITEM);

        // Crucial check: if ANIMATION_VIEWPORT_HEIGHT is 0 (e.g., element hidden or not rendered),
        // SCROLL_DISTANCE_PER_ITEM will be 0, leading to division by zero or NaN.
        if (isNaN(SCROLL_DISTANCE_PER_ITEM) || SCROLL_DISTANCE_PER_ITEM === 0) {
            console.error('ERROR: ANIMATION_VIEWPORT_HEIGHT is 0 or caused NaN. Services animation cannot calculate correctly. Check CSS visibility/height for .services-content-wrapper or its parents.');
            scrollSpacer.style.height = '0px'; // Prevent infinite scroll if calculations are bad
            // Set a default state for service items (e.g., show the first one)
            serviceItems.forEach((item, index) => {
                item.style.opacity = index === 0 ? 1 : 0;
                item.style.transform = 'translateY(0) rotateX(0deg)';
                item.style.zIndex = index === 0 ? 2 : 0;
            });
            serviceBgNumber.textContent = 'ER'; // Display "ER" for error
            return; // Exit function early if critical dimensions are invalid
        }

        const totalAnimationScrollRange = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM;

        // Ensure these values are valid before calculating final spacer height
        if (isNaN(totalAnimationScrollRange) || isNaN(servicesStickyContainer.offsetHeight) || isNaN(STICKY_CONTAINER_OFFSET_FOR_SPACER)) {
            console.error('ERROR: Invalid dimension detected for total scroll range. Animation may not work correctly.');
            console.error('  totalAnimationScrollRange:', totalAnimationScrollRange, ' servicesStickyContainer.offsetHeight:', servicesStickyContainer.offsetHeight, ' STICKY_CONTAINER_OFFSET_FOR_SPACER:', STICKY_CONTAINER_OFFSET_FOR_SPACER);
            scrollSpacer.style.height = '0px'; 
            return;
        }

        // The spacer height ensures enough scroll space to go through all animation steps,
        // plus the height of the sticky container itself, plus the offset it takes to reach its sticky point.
        scrollSpacer.style.height = `${totalAnimationScrollRange + servicesStickyContainer.offsetHeight + STICKY_CONTAINER_OFFSET_FOR_SPACER}px`;
        console.log(`  Scroll Spacer Height Set To: ${scrollSpacer.offsetHeight}px`);
        console.log(`  Total Animation Scroll Range: ${totalAnimationScrollRange}`);
    };

    const updateServiceAnimation = () => {
        // If critical dimensions are invalid, stop trying to animate
        if (isNaN(SCROLL_DISTANCE_PER_ITEM) || SCROLL_DISTANCE_PER_ITEM === 0) {
            console.warn('Skipping updateServiceAnimation due to invalid SCROLL_DISTANCE_PER_ITEM.');
            return;
        }

        // Calculate scroll progress relative to when the sticky effect should start
        // This accounts for the offset from the top of the viewport due to the parent section's padding-top and the sticky element's top/transform.
        let scrollProgress = window.scrollY - (servicesSection.offsetTop + STICKY_CONTAINER_OFFSET_FOR_SPACER);
        
        const maxScrollableRangeForAnimation = scrollSpacer.offsetHeight - servicesStickyContainer.offsetHeight - STICKY_CONTAINER_OFFSET_FOR_SPACER;
        scrollProgress = Math.max(0, Math.min(maxScrollableRangeForAnimation, scrollProgress));

        const normalizedProgress = scrollProgress / SCROLL_DISTANCE_PER_ITEM;
        const currentIndex = Math.floor(normalizedProgress);
        const fractionalProgress = normalizedProgress - currentIndex; 

        const newActiveIndex = Math.max(0, Math.min(serviceItems.length - 1, currentIndex));
        const displayIndex = newActiveIndex + 1;

        // DEBUGGING: Log display index and progress
        // console.log(`Update Animation Loop: Active Index: ${newActiveIndex}, Fractional Progress: ${fractionalProgress.toFixed(2)}, Display Index: ${displayIndex}`);
        
        serviceBgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;


        serviceItems.forEach((item, index) => {
            let translateY = 0;
            let rotateX = 0;
            let opacity = 0;
            let zIndex = 0;

            if (index === currentIndex) {
                rotateX = 90 * fractionalProgress; 
                translateY = -ANIMATION_VIEWPORT_HEIGHT * fractionalProgress; 
                opacity = 1 - fractionalProgress; 
                zIndex = 2; 
            } else if (index === currentIndex + 1) {
                rotateX = -90 + (90 * fractionalProgress); 
                translateY = ANIMATION_VIEWPORT_HEIGHT * (1 - fractionalProgress); 
                opacity = fractionalProgress; 
                zIndex = 1; 
            } else {
                opacity = 0;
                translateY = 0;
                rotateX = 0;
                zIndex = 0;
            }

            item.style.transform = `translateY(${translateY}px) rotateX(${rotateX}deg)`;
            item.style.opacity = opacity;
            item.style.zIndex = zIndex;
        });

        rafId = null; 
    };

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

    // Increased delay to ensure elements are fully rendered before measurements
    setTimeout(() => {
        adjustServicesSectionHeight();
        requestAnimationFrame(updateServiceAnimation);
    }, 500); // 500ms delay

    window.addEventListener('resize', () => {
        adjustServicesSectionHeight();
        requestAnimationFrame(updateServiceAnimation); 
    });

    window.addEventListener('scroll', handleScrollEvent);

    sectionObserver.observe(servicesSection); 
});