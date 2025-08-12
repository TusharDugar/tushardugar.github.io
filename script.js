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
                // Don't unobserve #services immediately, as its internal animation also uses `revealed`
                // and we want it to stay revealed while its children animate.
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
    
    let activeServiceIndex = -1; // Tracks which service item is currently considered active
    
    // Define the offset from the viewport top where an item becomes "active"
    // This value determines where in the viewport the currently active service item will settle.
    const ACTIVATE_POINT_IN_VIEWPORT = window.innerHeight * 0.3; // 30% from top of viewport

    // Define how much scroll distance is needed for each item to transition in/out.
    // This defines the "scroll-snap" distance for each logical item.
    const SCROLL_DISTANCE_PER_ITEM = window.innerHeight * 0.7; // 70% of viewport height

    // Function to update the active service item and background number
    const updateActiveService = (newIndex) => {
        // Only update if the index has changed or if no item is currently active
        if (newIndex === activeServiceIndex && activeServiceIndex !== -1) {
            return;
        }

        // Clamp newIndex to ensure it's within valid bounds
        newIndex = Math.max(0, Math.min(serviceItems.length - 1, newIndex));

        // Deactivate previously active item, if any
        if (activeServiceIndex !== -1 && serviceItems[activeServiceIndex]) {
            serviceItems[activeServiceIndex].classList.remove('active-content');
        }

        // Activate the new item
        if (serviceItems[newIndex]) {
            serviceItems[newIndex].classList.add('active-content');
            activeServiceIndex = newIndex;
            // Update background number text content
            serviceBgNumber.textContent = `0${newIndex + 1}`; // e.g., "01", "02"
        }
    };

    // Dynamically adjust the height of the scroll spacer
    const adjustScrollSpacerHeight = () => {
        // The total height of the spacer controls how much the user has to scroll
        // to go through all service items.
        // It's (number of transitions) * (distance per transition) + (buffer for last item to snap).
        const totalHeightNeeded = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM + ACTIVATE_POINT_IN_VIEWPORT;
        scrollSpacer.style.height = `${totalHeightNeeded}px`;
    };

    // Main scroll handler for the services section
    const handleServicesScroll = () => {
        // Calculate the scroll position where the animation for the services section effectively begins.
        // This is when the top of the services section aligns with our activation point in the viewport.
        const animationStartScrollY = servicesSection.offsetTop - ACTIVATE_POINT_IN_VIEWPORT;
        
        // Calculate the current scroll progress relative to the start of the animation zone.
        // Clamp it to ensure it stays within the valid range (0 to the total height of the spacer).
        let currentProgress = window.scrollY - animationStartScrollY;
        currentProgress = Math.max(0, Math.min(scrollSpacer.offsetHeight, currentProgress));

        // Determine the current active item index based on the clamped scroll progress.
        // Each item "occupies" SCROLL_DISTANCE_PER_ITEM of scroll.
        let newIndex = Math.floor(currentProgress / SCROLL_DISTANCE_PER_ITEM);
        newIndex = Math.max(0, Math.min(serviceItems.length - 1, newIndex)); // Ensure index is within bounds [0, length-1]

        updateActiveService(newIndex);
    };

    // Initial setup and event listeners
    adjustScrollSpacerHeight(); // Calculate spacer height initially
    window.addEventListener('resize', adjustScrollSpacerHeight); // Recalculate on window resize

    // Attach the main scroll handler to the window's scroll event
    window.addEventListener('scroll', handleServicesScroll);
    
    // Call handleServicesScroll immediately on page load to set the correct initial state
    // based on the current scroll position.
    handleServicesScroll();

    // Also observe the main services section itself for the general reveal animation.
    sectionObserver.observe(servicesSection); 
});