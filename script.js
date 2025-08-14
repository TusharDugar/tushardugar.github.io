document.addEventListener('DOMContentLoaded', () => {
    // --------------------------
    // Contact Button Copy to Clipboard
    // --------------------------
    const contactButtons = document.querySelectorAll('.contact-button');

    contactButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const contactValue = button.dataset.contact;

            if (button.classList.contains('copied')) return;

            try {
                await navigator.clipboard.writeText(contactValue);
                button.classList.add('copied');
                setTimeout(() => {
                    button.classList.remove('copied');
                }, 1500);
            } catch (err) {
                alert('Could not copy automatically. Please copy manually: ' + contactValue);
            }
        });
    });

    // --------------------------
    // Intersection Observer for General Reveal
    // --------------------------
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
    }, { threshold: 0.1 });

    // Observe all main sections with the general section observer
    document.querySelectorAll('#contact, #hero-right, #tools').forEach(el => sectionObserver.observe(el));


    // --------------------------
    // About Section Stagger Reveal (DesignCube-like)
    // --------------------------
    const aboutSection = document.getElementById('about');
    // Ensure this selector correctly targets the parent that contains reveal-stagger children
    const revealStaggerParent = aboutSection ? aboutSection.querySelector('.profile-card-wrapper.reveal-stagger-parent') : null;
    const revealStaggerChildren = revealStaggerParent ? revealStaggerParent.querySelectorAll('.reveal-stagger') : [];

    if (revealStaggerParent && revealStaggerChildren.length > 0) {
        const staggerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    revealStaggerChildren.forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('revealed');
                        }, index * 200); // 0.2s stagger delay
                    });
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, { threshold: 0.1 }); // Trigger when 10% of the parent is visible

        staggerObserver.observe(revealStaggerParent);
    } else {
        // If stagger elements are not found, ensure the parent section still reveals
        if (aboutSection) aboutSection.classList.add('revealed');
    }
    // Also observe the main about section with the general section observer for its own reveal-item class
    if (aboutSection) sectionObserver.observe(aboutSection);


    // --------------------------
    // Services Section 3D Cube Scroll Effect
    // --------------------------
    const servicesSection = document.getElementById('services');
    const servicesHeading = servicesSection?.querySelector('.services-heading');
    const servicesContentWrapper = servicesSection?.querySelector('.services-content-wrapper');
    const serviceItems = servicesContentWrapper?.querySelectorAll('.service-item') || [];
    const serviceBgNumber = servicesSection?.querySelector('.service-bg-number');

    // Critical check for existence of all required elements
    if (!servicesSection || !serviceItems.length || !servicesHeading || !servicesContentWrapper || !serviceBgNumber) {
        console.warn('[Services Animation] Services section or required elements not found. Skipping services animation setup.');
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
    const SCROLL_DISTANCE_MULTIPLIER = 1.0; // Adjusted for snappier animation
    let SCROLL_DISTANCE_PER_ITEM = 0; // Will be calculated dynamically

    let currentActiveIndex = 0;
    let rafId = null;

    // Function to calculate and set the total scrollable height of the services section
    const adjustServicesLayout = () => {
        const contentWrapperHeight = servicesContentWrapper.offsetHeight;
        const servicesHeadingHeight = servicesHeading.offsetHeight;
        const gapBetweenHeadingAndWrapper = 50; // Based on margin-bottom on heading in CSS

        const totalVisibleStickyHeight = servicesHeadingHeight + gapBetweenHeadingAndWrapper + contentWrapperHeight;
        let stickyTopH2 = (window.innerHeight - totalVisibleStickyHeight) / 2;
        stickyTopH2 = Math.max(0, stickyTopH2);

        let stickyTopWrapper = stickyTopH2 + servicesHeadingHeight + gapBetweenHeadingAndWrapper;

        servicesSection.style.setProperty('--services-sticky-top-h2', `${stickyTopH2}px`);
        servicesSection.style.setProperty('--services-sticky-top-wrapper', `${stickyTopWrapper}px`);

        // The faceOffset is half the height of the contentWrapper for a perfect cube.
        // This is used to calculate the translateZ distance.
        const faceOffset = contentWrapperHeight / 2;

        SCROLL_DISTANCE_PER_ITEM = contentWrapperHeight * SCROLL_DISTANCE_MULTIPLIER;

        const totalAnimationScrollRange = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM;

        scrollSpacer.style.height = `${stickyTopH2 + totalAnimationScrollRange + (window.innerHeight * 0.8)}px`;

        // console.log(`[Services Layout] Spacer height set to: ${scrollSpacer.offsetHeight}px for ${serviceItems.length} items.`);
        // console.log(`[Services Layout] Heading Height: ${servicesHeadingHeight}, Wrapper Height: ${contentWrapperHeight}`);
        // console.log(`[Services Layout] Sticky Top H2: ${stickyTopH2}, Sticky Top Wrapper: ${stickyTopWrapper}`);
        // console.log(`[Services Layout] Scroll Distance Per Item: ${SCROLL_DISTANCE_PER_ITEM}`);
        // console.log(`[Services Layout] Calculated Face Offset: ${faceOffset}px`);
    };

    // This is the core animation logic, triggered by scroll
    const updateServiceAnimation = () => {
        // console.log('[Services Animation] updateServiceAnimation is running...');

        const stickyH2Top = parseFloat(getComputedStyle(servicesSection).getPropertyValue('--services-sticky-top-h2'));
        const animationStartScroll = servicesSection.offsetTop + stickyH2Top;

        let scrollProgress = window.scrollY - animationStartScroll;

        const maxScrollableRangeForAnimation = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM;
        scrollProgress = Math.max(0, Math.min(maxScrollableRangeForAnimation, scrollProgress));

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

        // Get the current height of the content wrapper to calculate faceOffset
        const faceOffset = servicesContentWrapper.offsetHeight / 2;

        // Apply 3D transforms and opacity to each service item
        serviceItems.forEach((item, index) => {
            let opacity, transformValue, zIndex;

            if (index === currentIndex) {
                // The current item: active, but animating out (rotating from front to top)
                // Rotates from 0deg to 90deg (upwards)
                // translateZ moves it from -faceOffset (at the front of cube) to 0 (at the top edge, just rotating away)
                const rotation = 90 * fractionalProgress;
                const currentTranslateZ = -faceOffset * (1 - fractionalProgress); // Interpolates from -faceOffset to 0
                transformValue = `rotateX(${rotation}deg) translateZ(${currentTranslateZ}px)`;

                // Opacity fades out very fast, completely gone by 40% of the transition (1 / 2.5 = 0.4)
                opacity = 1 - Math.min(1, fractionalProgress * 2.5);
                zIndex = 2; // Ensures it's on top when exiting
            } else if (index === currentIndex + 1) {
                // The next item: animating in (rotating from bottom to front)
                // Rotates from -90deg to 0deg (upwards)
                // translateZ moves it from 0 (at the bottom edge, just rotating in) to -faceOffset (at the front of cube)
                const rotation = -90 + (90 * fractionalProgress);
                const currentTranslateZ = -faceOffset * fractionalProgress; // Interpolates from 0 to -faceOffset
                transformValue = `rotateX(${rotation}deg) translateZ(${currentTranslateZ}px)`;

                // Opacity fades in after a delay (starts at 60%, fully visible by 100%)
                // This gap (0.4 to 0.6) prevents ghosting.
                opacity = Math.max(0, (fractionalProgress - 0.6) * 2.5);
                zIndex = 1; // Appears just below the exiting item
            } else {
                // All other items are completely hidden and reset to their inactive transformed state
                // Items before current index are "above" the cube, items after next are "below"
                if (index < currentIndex) {
                    transformValue = `rotateX(90deg) translateZ(0px)`; // Positioned at top face, hidden
                } else { // index > currentIndex + 1
                    transformValue = `rotateX(-90deg) translateZ(0px)`; // Positioned at bottom face, hidden
                }
                opacity = 0; // Fully transparent
                zIndex = 0; // Lowest z-index
            }

            // Apply styles
            item.style.transform = transformValue;
            item.style.opacity = opacity;
            item.style.zIndex = zIndex;

            // Manage active-content class specifically for CSS hover rules
            if (index === currentActiveIndex) {
                item.classList.add('active-content');
            } else {
                item.classList.remove('active-content');
            }
        });

        rafId = null;
    };

    // Debounced scroll handler to optimize performance with requestAnimationFrame
    const handleScrollEvent = () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(updateServiceAnimation);
    };

    // --- Initialize animation and event listeners ---

    // Set timeout to ensure all initial DOM rendering and calculations are complete
    setTimeout(() => {
        adjustServicesLayout();
        // Trigger initial animation state on page load based on current scroll
        updateServiceAnimation();
        // Ensure the first item is active initially if the section is in view
        if (serviceItems.length > 0) {
            serviceItems[0].classList.add('active-content'); // Set the first item active initially for CSS hover
            serviceBgNumber.textContent = '01'; // Ensure number is correct
        }
    }, 200); // Increased delay for robust calculation

    // Recalculate height and re-render on window resize
    window.addEventListener('resize', () => {
        adjustServicesLayout();
        handleScrollEvent(); // Re-render immediately on resize
    });

    // Attach the optimized scroll handler
    window.addEventListener('scroll', handleScrollEvent);

    // Ensure the services section itself gets the 'revealed' class for its parent section observer
    sectionObserver.observe(servicesSection);
});