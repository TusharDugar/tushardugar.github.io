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

    // Scroll Reveal Animation (Intersection Observer) - for main sections
    const observerOptions = {
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
    }, observerOptions);

    // Observe specific elements for reveal triggers
    document.querySelectorAll('.about-left-content').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('#contact').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('#hero-right').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('#tools').forEach(el => sectionObserver.observe(el));
    // Note: Services section (#services) itself no longer has 'reveal-item' as its contents have continuous animation.
    // So, it's not observed by sectionObserver anymore.


    // Services Timeline and Content Scroll Interaction
    const serviceContentElements = document.querySelectorAll('.service-item');
    const timelineNumberElements = document.querySelectorAll('.timeline-item');

    // Options for the IntersectionObserver for services.
    // rootMargin: When the top of an element enters the viewport, and it exits the viewport from -50% (halfway up)
    // This creates an "active zone" in the middle of the screen.
    const servicesObserverOptions = {
        root: null, // the viewport
        rootMargin: '0px 0px -50% 0px', // Top: 0px (default), Right: 0px, Bottom: -50% (element active until its *middle* passes viewport middle), Left: 0px
        threshold: 0 // Trigger as soon as element crosses the root margin
    };

    const servicesObserver = new IntersectionObserver((entries) => {
        // Deactivate all first to ensure clean state before determining current active
        timelineNumberElements.forEach(item => item.classList.remove('active'));
        serviceContentElements.forEach(item => item.classList.remove('active-content'));

        let bestMatchIndex = -1;
        let minDistanceToCenter = Infinity;
        const viewportCenter = window.innerHeight / 2;

        entries.forEach(entry => {
            const serviceIndex = parseInt(entry.target.dataset.serviceIndex);
            const itemRect = entry.target.getBoundingClientRect();
            const itemCenter = itemRect.top + itemRect.height / 2;
            const distance = Math.abs(itemCenter - viewportCenter); // Distance from item's center to viewport's center

            if (entry.isIntersecting) {
                // If this item is closer to the viewport center than any previous match, it's the new best match
                if (distance < minDistanceToCenter) {
                    minDistanceToCenter = distance;
                    bestMatchIndex = serviceIndex;
                }
            }
        });

        // Activate the best matching item
        if (bestMatchIndex !== -1) {
            timelineNumberElements[bestMatchIndex].classList.add('active');
            serviceContentElements[bestMatchIndex].classList.add('active-content');
        } else {
            // Fallback: If no item is intersecting the central zone,
            // try to find the first service item that is *currently visible* in the viewport (any part).
            // This handles cases where scrolling is too fast or between sections.
            let firstVisibleIndex = -1;
            for (let i = 0; i < serviceContentElements.length; i++) {
                const rect = serviceContentElements[i].getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    firstVisibleIndex = i;
                    break;
                }
            }

            // If the services section is generally on screen (or scrolled to its beginning),
            // ensure the first timeline item is active if no other is.
            const servicesSectionRect = document.getElementById('services').getBoundingClientRect();
            if (servicesSectionRect.top < window.innerHeight && servicesSectionRect.bottom > 0) {
                if (firstVisibleIndex === -1 && timelineNumberElements.length > 0) {
                    // No item fully visible in middle, but section is. Default to first.
                    timelineNumberElements[0].classList.add('active');
                    serviceContentElements[0].classList.add('active-content');
                } else if (firstVisibleIndex !== -1) {
                    // If a visible item is found (but not best match for center), activate it.
                    timelineNumberElements[firstVisibleIndex].classList.add('active');
                    serviceContentElements[firstVisibleIndex].classList.add('active-content');
                }
            } else {
                // If the entire services section is out of view, ensure nothing is active.
                timelineNumberElements.forEach(item => item.classList.remove('active'));
                serviceContentElements.forEach(item => item.classList.remove('active-content'));
            }
        }

    }, servicesObserverOptions);

    // Observe all service content elements for the servicesObserver
    serviceContentElements.forEach(item => servicesObserver.observe(item));

    // Initial check for the services section visibility and active state on page load
    const servicesSection = document.getElementById('services');
    if (servicesSection && servicesSection.getBoundingClientRect().top < window.innerHeight && timelineNumberElements.length > 0) {
        // Trigger a fake scroll to initialize active state correctly on load
        // This is a common workaround when IntersectionObserver doesn't fire immediately on page load
        // for elements already in view.
        const firstServiceItemRect = serviceContentElements[0].getBoundingClientRect();
        if (firstServiceItemRect.top < window.innerHeight / 2 && firstServiceItemRect.bottom > 0) {
            timelineNumberElements[0].classList.add('active');
            serviceContentElements[0].classList.add('active-content');
        }
    }
});