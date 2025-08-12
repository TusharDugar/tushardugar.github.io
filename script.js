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
                observer.unobserve(entry.target); // Stop observing once revealed
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
    const serviceItems = document.querySelectorAll('.service-item');
    
    // Check if services section and items exist before proceeding
    if (!servicesSection || serviceItems.length === 0) {
        console.warn('Services section or service items not found. Skipping services animation setup.');
        return; // Exit if elements aren't present
    }

    // Create a scroll spacer if it doesn't exist (ensures enough scrollable area)
    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }
    
    // Set an initial active item (the first one)
    // This will be overridden by the observer as soon as scrolling starts
    if (serviceItems.length > 0) {
        serviceItems[0].classList.add('active-content');
    }

    // Observer options for the services section.
    // The rootMargin defines a narrow "activation zone" in the middle of the viewport.
    // An item becomes active when its top edge enters this zone.
    const servicesObserverOptions = {
        root: null, // The viewport
        rootMargin: '-20% 0px -70% 0px', // Top starts 20% down, Bottom starts 70% down. Active zone is 20-30% of viewport height.
        threshold: 0 // Trigger as soon as the element crosses the rootMargin
    };

    let activeServiceIndex = 0; // Tracks which service item is currently considered active

    const servicesIntersectionObserver = new IntersectionObserver((entries) => {
        let newActiveCandidateIndex = -1;
        let minDistanceToCenter = Infinity;
        const viewportCenter = window.innerHeight * 0.45; // Adjust this "activation line" to be slightly above center for effect

        // Find the best candidate among intersecting items
        entries.forEach(entry => {
            const index = parseInt(entry.target.dataset.serviceIndex);
            const itemRect = entry.target.getBoundingClientRect();
            const itemTopFromActivationLine = itemRect.top - viewportCenter; // How far is item's top from our activation line

            // Check if the item's top is near or just crossed the activation line
            // and it's visible.
            if (itemRect.top < window.innerHeight && itemRect.bottom > 0) { // Item is generally visible
                if (Math.abs(itemTopFromActivationLine) < minDistanceToCenter) {
                    minDistanceToCenter = Math.abs(itemTopFromActivationLine);
                    newActiveCandidateIndex = index;
                }
            }
        });

        // Apply/remove active classes based on the new active candidate
        if (newActiveCandidateIndex !== -1 && newActiveCandidateIndex !== activeServiceIndex) {
            // Deactivate the previously active item
            if (activeServiceIndex !== -1 && serviceItems[activeServiceIndex]) {
                serviceItems[activeServiceIndex].classList.remove('active-content');
            }
            // Activate the new candidate
            if (serviceItems[newActiveCandidateIndex]) {
                serviceItems[newActiveCandidateIndex].classList.add('active-content');
                activeServiceIndex = newActiveCandidateIndex;
            }
        } else if (newActiveCandidateIndex === -1 && serviceItems[activeServiceIndex]) {
            // This case handles when the active element scrolls completely out of the defined rootMargin.
            // We need to re-evaluate based on scroll direction to maintain continuity.
            // This can be complex, a simpler approach is to reactivate the closest visible if no specific match
            const currentScrollTop = window.scrollY;
            const servicesSectionTop = servicesSection.offsetTop;

            if (currentScrollTop < servicesSectionTop + servicesSection.offsetHeight / serviceItems.length) {
                // If we're near the top of the services section, reactivate first item
                if (activeServiceIndex !== 0 && serviceItems[0]) {
                    serviceItems[activeServiceIndex].classList.remove('active-content');
                    serviceItems[0].classList.add('active-content');
                    activeServiceIndex = 0;
                }
            } else if (currentScrollTop > servicesSectionTop + servicesSection.offsetHeight - (servicesSection.offsetHeight / serviceItems.length)) {
                // If we're near the bottom, reactivate last item
                const lastIndex = serviceItems.length - 1;
                if (activeServiceIndex !== lastIndex && serviceItems[lastIndex]) {
                    serviceItems[activeServiceIndex].classList.remove('active-content');
                    serviceItems[lastIndex].classList.add('active-content');
                    activeServiceIndex = lastIndex;
                }
            }
        }

    }, servicesObserverOptions);

    // Observe each service item for changes
    serviceItems.forEach(item => {
        servicesIntersectionObserver.observe(item);
    });

    // Dynamically adjust the height of the scroll spacer
    const adjustScrollSpacerHeight = () => {
        if (!servicesSection || serviceItems.length === 0) return;

        const servicesContentWrapper = servicesSection.querySelector('.services-content-wrapper');
        const itemVisualHeight = servicesContentWrapper.offsetHeight; // The height of the active content visible area

        // Each item needs enough scroll space to become active and then scroll out
        // The total height needed is (number of items * scroll distance per item)
        // Add extra height so the last item can be viewed properly before the end of the section
        const scrollDistancePerItem = window.innerHeight * 0.9; // Adjust this factor for more/less scroll per item

        // The total scrollable height provided by the spacer:
        // (number of items - 1) * scrollDistancePerItem + a buffer
        let totalSpacerNeededHeight = (serviceItems.length - 1) * scrollDistancePerItem + (window.innerHeight * 0.5); // Ensure last item centers properly
        
        scrollSpacer.style.height = `${totalSpacerNeededHeight}px`;

        // Update rootMargin for the observer based on current viewport height dynamically if needed
        // For this specific 3D effect, fixed percentages might be better
        // servicesIntersectionObserver.disconnect(); // Disconnect to re-observe with new margins if changed
        // servicesIntersectionObserver.observe(item); // Re-observe
    };

    // Initial adjustment and re-adjust on window resize
    adjustScrollSpacerHeight();
    window.addEventListener('resize', adjustScrollSpacerHeight);

    // Initial check (once observer is set up) to correctly set active state on page load
    // This helps if the page loads directly onto the services section.
    setTimeout(() => {
        // Trigger a fake scroll event to force initial IntersectionObserver callbacks
        window.dispatchEvent(new Event('scroll'));
        // Fallback: If after forced scroll, no item is active (e.g., section not in view at all),
        // ensure the first one is active.
        if (activeServiceIndex === -1 && serviceItems.length > 0) {
            serviceItems[0].classList.add('active-content');
            activeServiceIndex = 0;
        }
    }, 100); // Small delay to ensure all elements are rendered and positioned
});
