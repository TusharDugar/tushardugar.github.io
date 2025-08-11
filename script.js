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

    // Scroll Reveal Animation (Intersection Observer) - for sections
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
    document.querySelectorAll('#services').forEach(el => sectionObserver.observe(el)); // ADDED: Observe Services section

    // Services Timeline Intersection Observer
    const serviceItems = document.querySelectorAll('.service-item');
    const timelineItems = document.querySelectorAll('.timeline-item');

    const servicesObserverOptions = {
        root: null, // viewport as the root
        rootMargin: '0px 0px -50% 0px', // Adjust bottom margin to trigger when item is halfway up/down the viewport
        threshold: 0 // We're interested in the intersection change, not full visibility for threshold
    };

    const servicesObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const index = parseInt(entry.target.dataset.timelineTarget || entry.target.id.split('-')[1]);
            const correspondingTimelineItem = timelineItems[index];

            if (entry.isIntersecting) {
                // If it's entering from above (scrolling down)
                if (entry.boundingClientRect.top < window.innerHeight / 2) {
                    timelineItems.forEach(item => item.classList.remove('active'));
                    correspondingTimelineItem.classList.add('active');
                }
            } else {
                // If it's exiting
                if (entry.boundingClientRect.top < 0) { // Scrolling up, and this element is now above the viewport
                    // Logic to set active class to the *previous* element when scrolling UP
                    const prevIndex = index - 1;
                    if (prevIndex >= 0) {
                        timelineItems.forEach(item => item.classList.remove('active'));
                        timelineItems[prevIndex].classList.add('active');
                    }
                }
                // If the very first service item is active and it scrolls out, deactivate it
                if (index === 0 && !entry.isIntersecting && entry.boundingClientRect.bottom < 0) {
                     correspondingTimelineItem.classList.remove('active');
                }
            }
        });

        // Fallback: If no service item is actively intersecting, default to the first one being active
        // This ensures one is always highlighted if some part of the services section is visible
        const anyActive = Array.from(serviceItems).some(item => {
            const rect = item.getBoundingClientRect();
            // Check if any part of the item is within the middle half of the viewport
            return rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25;
        });

        if (!anyActive && serviceItems.length > 0) {
            // If scrolled above the services section, activate the first one
            if (window.scrollY < document.getElementById('services').offsetTop + document.getElementById('services').offsetHeight / 2) {
                timelineItems.forEach(item => item.classList.remove('active'));
                timelineItems[0].classList.add('active');
            }
        }
    }, servicesObserverOptions);

    // Initial check to set the first item as active if the page loads directly to or past the services section
    let initialActiveSet = false;
    serviceItems.forEach((item, index) => {
        // Ensure that data-timeline-target is correctly set for all items
        item.setAttribute('data-timeline-target', index);
        servicesObserver.observe(item);

        // Initial check for active state on page load
        if (!initialActiveSet) {
            const rect = item.getBoundingClientRect();
            // If the service item is at least partially in the upper half of the screen
            if (rect.top < window.innerHeight / 2 && rect.bottom > 0) {
                timelineItems.forEach(tItem => tItem.classList.remove('active'));
                timelineItems[index].classList.add('active');
                initialActiveSet = true;
            }
        }
    });

    // If no service item was initially active (e.g., page loads far above the section), activate the first
    if (!initialActiveSet && timelineItems.length > 0) {
        timelineItems[0].classList.add('active');
    }
});