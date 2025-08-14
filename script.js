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
                // Services section is handled by serviceItemsObserver now
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


    // --- Services Section Animation Logic (2D Layered Staggered Reveal) ---
    const servicesSection = document.getElementById('services');
    const servicesContentWrapper = servicesSection ? servicesSection.querySelector('.services-content-wrapper') : null;
    const serviceItems = servicesContentWrapper ? servicesContentWrapper.querySelectorAll('.service-item') : [];
    
    // Critical check for existence
    if (!servicesSection || !servicesContentWrapper || serviceItems.length === 0) {
        console.warn('Services section or required elements not found. Skipping services animation setup.');
        // Ensure the section itself is marked as revealed if no specific animation applies
        if (servicesSection) servicesSection.classList.add('revealed'); 
        return; 
    }

    // Intersection Observer for staggered service item reveal
    const serviceItemsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // When the services content wrapper comes into view, trigger staggered animation for its children
                serviceItems.forEach((item, index) => {
                    // Use setTimeout to create the staggered delay
                    setTimeout(() => {
                        item.classList.add('active-content');
                    }, index * 200); // Stagger each item by 200ms (0.2s)
                });
                observer.unobserve(entry.target); // Unobserve after triggering, so it runs only once
            }
        });
    }, {
        root: null, // viewport as the root
        rootMargin: '0px',
        threshold: 0.2 // Trigger when 20% of the wrapper is visible
    });

    // Observe the services content wrapper to trigger its children's staggered animation
    serviceItemsObserver.observe(servicesContentWrapper);

    // Also observe the main services section with the general section observer
    // This ensures its main 'revealed' class is added.
    sectionObserver.observe(servicesSection); 
});