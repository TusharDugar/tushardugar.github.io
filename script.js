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


    // --- Services Section Animation Logic (Framer-like scroll effect) ---
    const servicesSection = document.getElementById('services');
    const serviceItems = document.querySelectorAll('.service-item');
    
    // Check if services section and items exist before proceeding
    if (!servicesSection || serviceItems.length === 0) {
        console.warn('Services section or service items not found. Skipping services animation setup.');
        return; // Exit if elements aren't present
    }

    // This spacer creates the necessary scrollable height to trigger item changes
    const scrollSpacer = document.createElement('div');
    scrollSpacer.classList.add('services-section-scroll-spacer');
    // We add this spacer AFTER all service-items to ensure their absolute positioning works within their parent,
    // and this spacer creates the global scroll effect.
    servicesSection.appendChild(scrollSpacer);

    // Initial state: set the first item to active-content on load
    serviceItems[0].classList.add('active-content');

    // Options for the IntersectionObserver for service items
    // rootMargin: Defines the active zone in the viewport.
    // -20% 0px -70% 0px means:
    // Top is 20% down from viewport top (triggers when top of item enters this line)
    // Bottom is 70% down from viewport top (triggers when bottom of item passes this line)
    // This creates an activation zone in the central 50% of the viewport.
    const servicesObserverOptions = {
        root: null, // the viewport
        rootMargin: '-20% 0px -70% 0px', // Top starts at 20% from viewport top, Bottom ends at 70% from viewport top
        threshold: 0 // Trigger as soon as element crosses the root margin
    };

    let currentActiveIndex = 0; // Keep track of the currently active service item index

    const servicesIntersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const serviceIndex = parseInt(entry.target.dataset.serviceIndex);

            if (entry.isIntersecting) {
                // An item is entering the active zone. Make it active.
                if (serviceIndex !== currentActiveIndex) {
                    // Only change if a new item is truly becoming active
                    serviceItems[currentActiveIndex].classList.remove('active-content'); // Deactivate old
                    entry.target.classList.add('active-content'); // Activate new
                    currentActiveIndex = serviceIndex;
                }
            } else {
                // An item is exiting the active zone.
                // If the exiting item is the currently active one, and it's scrolling *up* (i.e., its bottom is above the rootMargin top),
                // then activate the previous item.
                if (serviceIndex === currentActiveIndex && entry.boundingClientRect.bottom < 0) {
                    const prevIndex = currentActiveIndex - 1;
                    if (prevIndex >= 0) {
                        serviceItems[currentActiveIndex].classList.remove('active-content');
                        serviceItems[prevIndex].classList.add('active-content');
                        currentActiveIndex = prevIndex;
                    }
                }
                // If the exiting item is the currently active one, and it's scrolling *down* (i.e., its top is below the rootMargin bottom),
                // then activate the next item. (This should be handled by the next item entering, but good for robustness)
                else if (serviceIndex === currentActiveIndex && entry.boundingClientRect.top > window.innerHeight) {
                    const nextIndex = currentActiveIndex + 1;
                    if (nextIndex < serviceItems.length) {
                        serviceItems[currentActiveIndex].classList.remove('active-content');
                        serviceItems[nextIndex].classList.add('active-content');
                        currentActiveIndex = nextIndex;
                    }
                }
            }
        });
    }, servicesObserverOptions);

    // Observe each service item with the custom observer
    serviceItems.forEach(item => {
        servicesIntersectionObserver.observe(item);
    });

    // Adjust the height of the scroll spacer dynamically
    // The total scrollable height for the services section will be:
    // (Number of service items - 1) * scroll distance per item + viewport height
    // This allows each item to have its own scroll "stop" point.
    const serviceItemHeight = servicesSection.querySelector('.services-content-wrapper').offsetHeight;
    const scrollPerItem = window.innerHeight * 0.8; // Example: 80% of viewport height per item

    // Calculate total needed height for the spacer
    // The spacer only needs to cover (N-1) transitions, plus enough room for the last item to be centered
    // Min 100vh to ensure the whole section is scrollable enough
    let totalSpacerHeight = (serviceItems.length - 1) * scrollPerItem;
    // Ensure that if there's only one item or very few, there's still some scroll
    totalSpacerHeight = Math.max(totalSpacerHeight, window.innerHeight * 0.5); // At least half viewport height if content is short

    scrollSpacer.style.height = `${totalSpacerHeight}px`;

    // Initialize the active state on page load by forcing a scroll check if section is visible
    const initialServicesRect = servicesSection.getBoundingClientRect();
    if (initialServicesRect.top < window.innerHeight && initialServicesRect.bottom > 0) {
        // Scroll to the start of the services section to ensure first item is active correctly
        // This is a common workaround for IntersectionObserver not firing immediately on initial load.
        window.scrollTo({
            top: servicesSection.offsetTop + 1, // +1px to ensure a scroll event is triggered
            behavior: 'instant'
        });
        // Then scroll back if not exactly at the top
        if (window.scrollY !== servicesSection.offsetTop + 1) {
             window.scrollTo({
                top: servicesSection.offsetTop,
                behavior: 'instant'
            });
        }
    }
});