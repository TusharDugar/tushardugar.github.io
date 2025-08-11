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


    // Services Timeline and Content Scroll Interaction
    const serviceContentElements = document.querySelectorAll('.service-item');
    const timelineNumberElements = document.querySelectorAll('.timeline-item');

    // Options for the IntersectionObserver for services.
    // Use multiple thresholds to get more granular updates.
    const servicesObserverOptions = {
        root: null, // the viewport
        rootMargin: '0px 0px 0px 0px', // Observe entire element
        threshold: Array.from({length: 101}, (v, k) => k / 100) // All thresholds from 0.00 to 1.00
    };

    const servicesObserver = new IntersectionObserver((entries) => {
        // Find the service item that is most centrally located and visible
        let activeIndex = -1;
        let minDistanceToCenter = Infinity;
        const viewportCenter = window.innerHeight / 2; // Vertical center of the viewport

        entries.forEach(entry => {
            const serviceIndex = parseInt(entry.target.dataset.serviceIndex);
            const itemRect = entry.target.getBoundingClientRect();
            const itemCenter = itemRect.top + itemRect.height / 2;
            
            // Check if the item is currently visible in the viewport
            const isVisible = itemRect.top < window.innerHeight && itemRect.bottom > 0;

            if (isVisible) {
                const distance = Math.abs(itemCenter - viewportCenter);

                // If this item is closer to the viewport center and is sufficiently in view
                // We consider an item "sufficiently in view" if its top is above the 75% mark
                // and its bottom is below the 25% mark, indicating it's broadly covering the center
                if (itemRect.top < window.innerHeight * 0.75 && itemRect.bottom > window.innerHeight * 0.25) {
                    if (distance < minDistanceToCenter) {
                        minDistanceToCenter = distance;
                        activeIndex = serviceIndex;
                    }
                }
            }
        });

        // Apply/remove active classes based on the determined activeIndex
        timelineNumberElements.forEach((el, index) => {
            if (index === activeIndex) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        serviceContentElements.forEach((el, index) => {
            if (index === activeIndex) {
                el.classList.add('active-content');
            } else {
                el.classList.remove('active-content');
            }
        });

        // Fallback for initial load or if no item perfectly aligns with center
        // This ensures the first item is active if the section is at the top of the page
        // and no other specific item is dominant.
        if (activeIndex === -1 && timelineNumberElements.length > 0) {
            const servicesSectionRect = document.getElementById('services').getBoundingClientRect();
            if (servicesSectionRect.top < window.innerHeight / 2 && servicesSectionRect.bottom > 0) {
                // If the services section is broadly in view, default to the first element
                // or the first one that is currently visible.
                let firstVisibleServiceIndex = -1;
                for (let i = 0; i < serviceContentElements.length; i++) {
                    const rect = serviceContentElements[i].getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        firstVisibleServiceIndex = i;
                        break;
                    }
                }

                if (firstVisibleServiceIndex !== -1) {
                    timelineNumberElements[firstVisibleServiceIndex].classList.add('active');
                    serviceContentElements[firstVisibleServiceIndex].classList.add('active-content');
                } else {
                     // If for some reason nothing is visible in the section (e.g., scrolled too fast),
                     // and the section itself is in view, activate the first.
                    timelineNumberElements[0].classList.add('active');
                    serviceContentElements[0].classList.add('active-content');
                }
            }
        }

    }, servicesObserverOptions);

    // Observe all service content elements
    serviceContentElements.forEach(item => {
        servicesObserver.observe(item);
    });

    // Initial check (once observer is set up) to correctly set active state on page load
    // This helps if the page loads directly onto the services section.
    // Triggering a scroll event or re-evaluating after a small timeout can help.
    setTimeout(() => {
        // Force a re-evaluation of current visible items after everything is rendered
        if (servicesSection && servicesSection.getBoundingClientRect().top < window.innerHeight && timelineNumberElements.length > 0) {
             // Simulate a scroll for the observer to fire
            window.dispatchEvent(new Event('scroll'));
        }
    }, 100); // Small delay to ensure all elements are rendered and positioned
});