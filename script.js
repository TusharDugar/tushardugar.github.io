document.addEventListener('DOMContentLoaded', () => {
    // Contact Button Copy to Clipboard Functionality (UNCHANGED)
    const contactButtons = document.querySelectorAll('.contact-button');

    contactButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const contactValue = button.dataset.contact;

            if (button.classList.contains('copied')) {
                return; 
            }

            try {
                await navigator.clipboard.writeText(contactValue);
                button.classList.add('copied');

                setTimeout(() => {
                    button.classList.remove('copied');
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
        if (servicesSection) servicesSection.classList.add('revealed'); 
        return; 
    }

    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }

    let ANIMATION_VIEWPORT_HEIGHT; 
    let STICKY_CONTAINER_OFFSET_FOR_SPACER; 
    const SCROLL_DISTANCE_PER_ITEM_MULTIPLIER = 0.9; 
    let SCROLL_DISTANCE_PER_ITEM; 

    let currentActiveIndex = -1; 
    let lastScrollY = window.scrollY; 
    let rafId = null; 

    const getStickyOffsetForSpacer = () => {
        const viewportHeight = window.innerHeight;
        const stickyContainerHeight = servicesStickyContainer.offsetHeight;
        const stickyContainerDisplay = getComputedStyle(servicesStickyContainer).display;

        console.log('--- getStickyOffsetForSpacer Debug ---');
        console.log('  Viewport Height:', viewportHeight);
        console.log('  Sticky Container OffsetHeight (raw):', stickyContainerHeight);
        console.log('  Sticky Container Computed Display:', stickyContainerDisplay);

        // If height is 0 or display is none, it cannot be centered normally.
        if (stickyContainerHeight === 0 || stickyContainerDisplay === 'none') {
            console.error('ERROR: Sticky Container has 0 height or display: none. Cannot calculate proper offset for spacer.');
            return 0; // Fallback to 0, which will prevent spacer from having excessive height
        }

        let calculatedTopOffset = (viewportHeight - stickyContainerHeight) / 2;
        calculatedTopOffset = Math.max(0, calculatedTopOffset); // Clamp to 0
        console.log('  Calculated Sticky Top Offset (for spacer):', calculatedTopOffset);
        return calculatedTopOffset;
    };

    const adjustServicesSectionHeight = () => {
        const servicesSlidesViewportHeight = servicesSlidesViewport.offsetHeight;
        const servicesSlidesViewportDisplay = getComputedStyle(servicesSlidesViewport).display;

        // DEBUGGING: Log main animation viewport height and display style
        console.log('--- adjustServicesSectionHeight Debug ---');
        console.log('  Services Slides Viewport OffsetHeight (raw):', servicesSlidesViewportHeight);
        console.log('  Services Slides Viewport Computed Display:', servicesSlidesViewportDisplay);

        // Check if the viewport itself has a valid height before proceeding
        if (servicesSlidesViewportHeight === 0 || servicesSlidesViewportDisplay === 'none') {
            console.error('ERROR: Services Slides Viewport has 0 height or display: none. Services animation cannot calculate correctly. Check CSS visibility/height for .services-content-wrapper.');
            serviceBgNumber.textContent = 'ER'; // Immediate visual error feedback
            scrollSpacer.style.height = '0px'; 
            return; // Exit function early if critical dimensions are invalid
        }
        
        ANIMATION_VIEWPORT_HEIGHT = servicesSlidesViewportHeight; 

        STICKY_CONTAINER_OFFSET_FOR_SPACER = getStickyOffsetForSpacer(); 
        // Note: We no longer set servicesStickyContainer.style.top here, as CSS handles top: 50%

        SCROLL_DISTANCE_PER_ITEM = ANIMATION_VIEWPORT_HEIGHT * SCROLL_DISTANCE_PER_ITEM_MULTIPLIER;
        
        console.log('  Calculated SCROLL_DISTANCE_PER_ITEM:', SCROLL_DISTANCE_PER_ITEM);

        // Final check on critical values before setting spacer height
        if (isNaN(SCROLL_DISTANCE_PER_ITEM) || SCROLL_DISTANCE_PER_ITEM === 0) {
            console.error('ERROR: SCROLL_DISTANCE_PER_ITEM is 0 or NaN. Services animation will be disabled. Check ANIMATION_VIEWPORT_HEIGHT calculation.');
            serviceBgNumber.textContent = 'ER';
            scrollSpacer.style.height = '0px';
            return;
        }

        const totalAnimationScrollRange = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM;

        if (isNaN(totalAnimationScrollRange) || isNaN(servicesStickyContainer.offsetHeight) || isNaN(STICKY_CONTAINER_OFFSET_FOR_SPACER)) {
            console.error('ERROR: Invalid dimension detected for total scroll range. Animation may not work correctly.');
            console.error('  totalAnimationScrollRange:', totalAnimationScrollRange, ' servicesStickyContainer.offsetHeight:', servicesStickyContainer.offsetHeight, ' STICKY_CONTAINER_OFFSET_FOR_SPACER:', STICKY_CONTAINER_OFFSET_FOR_SPACER);
            serviceBgNumber.textContent = 'ER';
            scrollSpacer.style.height = '0px'; 
            return;
        }

        scrollSpacer.style.height = `${totalAnimationScrollRange + servicesStickyContainer.offsetHeight + STICKY_CONTAINER_OFFSET_FOR_SPACER}px`;
        console.log(`  Scroll Spacer Height Set To: ${scrollSpacer.offsetHeight}px`);
        console.log(`  Total Animation Scroll Range: ${totalAnimationScrollRange}`);

        // Ensure the background number is set to a valid value if it was 'ER' previously
        if (serviceBgNumber.textContent === 'ER') {
            serviceBgNumber.textContent = '01'; // Reset to initial if error was cleared
        }
    };

    const updateServiceAnimation = () => {
        // If critical dimensions are invalid (from adjustServicesSectionHeight), stop trying to animate
        if (isNaN(SCROLL_DISTANCE_PER_ITEM) || SCROLL_DISTANCE_PER_ITEM === 0) {
            console.warn('Skipping updateServiceAnimation due to invalid SCROLL_DISTANCE_PER_ITEM. Animation is effectively disabled.');
            return;
        }

        let scrollProgress = window.scrollY - (servicesSection.offsetTop + STICKY_CONTAINER_OFFSET_FOR_SPACER);
        
        const maxScrollableRangeForAnimation = scrollSpacer.offsetHeight - servicesStickyContainer.offsetHeight - STICKY_CONTAINER_OFFSET_FOR_SPACER;
        scrollProgress = Math.max(0, Math.min(maxScrollableRangeForAnimation, scrollProgress));

        const normalizedProgress = scrollProgress / SCROLL_DISTANCE_PER_ITEM;
        const currentIndex = Math.floor(normalizedProgress);
        const fractionalProgress = normalizedProgress - currentIndex; 

        const newActiveIndex = Math.max(0, Math.min(serviceItems.length - 1, currentIndex));
        const displayIndex = newActiveIndex + 1;

        // console.log(`Update Animation Loop: Active Index: ${newActiveIndex}, Fractional Progress: ${fractionalProgress.toFixed(2)}, Display Index: ${displayIndex}`);
        
        // Only update text content if it's not already 'ER'
        if (serviceBgNumber.textContent !== 'ER') {
            serviceBgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;
        }


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

    // Increased delay for desktop environments for layout stability
    setTimeout(() => {
        adjustServicesSectionHeight();
        requestAnimationFrame(updateServiceAnimation);
    }, 1000); // Increased delay from 500ms to 1000ms

    window.addEventListener('resize', () => {
        adjustServicesSectionHeight();
        requestAnimationFrame(updateServiceAnimation); 
    });

    window.addEventListener('scroll', handleScrollEvent);

    sectionObserver.observe(servicesSection); 
});