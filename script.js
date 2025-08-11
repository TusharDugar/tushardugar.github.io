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
    document.querySelectorAll('#services').forEach(el => sectionObserver.observe(el)); // Observe Services section


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
            // Get the index from the data-service-index attribute of the corresponding timeline item
            const index = parseInt(entry.target.dataset.serviceIndex); // Correctly use data-service-index
            const correspondingTimelineItem = timelineItems[index];

            if (entry.isIntersecting) {
                // If it's entering, check if it's generally in the "active" zone (middle of viewport)
                // This logic is simplified for better reliability.
                // We activate if it enters and is roughly in the middle half of the screen.
                if (entry.boundingClientRect.top < window.innerHeight * 0.75 && entry.boundingClientRect.bottom > window.innerHeight * 0.25) {
                    timelineItems.forEach(item => item.classList.remove('active'));
                    correspondingTimelineItem.classList.add('active');
                }
            } else {
                // If the element is no longer intersecting and it's above the viewport (scrolling up)
                if (entry.boundingClientRect.bottom < 0) {
                    // Activate the *previous* timeline item
                    const prevIndex = index - 1;
                    if (prevIndex >= 0) {
                        timelineItems.forEach(item => item.classList.remove('active'));
                        timelineItems[prevIndex].classList.add('active');
                    } else { // If the first item is scrolled past, ensure it's not active
                        correspondingTimelineItem.classList.remove('active');
                    }
                } 
                // If the element is no longer intersecting and it's below the viewport (scrolling down)
                else if (entry.boundingClientRect.top > window.innerHeight) {
                    // This means a subsequent item might become active, or the previous is still active.
                    // No explicit action needed here usually, as the next item's intersection will handle it.
                }
            }
        });

        // Refined fallback to ensure one item is always active when the services section is generally in view
        // This checks if any service-item is visibly intersecting (even partially)
        const anyServiceItemVisible = Array.from(serviceItems).some(item => {
            const rect = item.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        });

        if (anyServiceItemVisible) {
            // Find the most prominent item in the view and make its timeline item active
            let activeItemFound = false;
            serviceItems.forEach((item, index) => {
                const rect = item.getBoundingClientRect();
                // If the item is in the middle third of the viewport, it's the "active" one
                if (rect.top < window.innerHeight * 0.66 && rect.bottom > window.innerHeight * 0.33) {
                    if (!timelineItems[index].classList.contains('active')) {
                        timelineItems.forEach(tItem => tItem.classList.remove('active'));
                        timelineItems[index].classList.add('active');
                    }
                    activeItemFound = true;
                }
            });

            // If no specific item is in the "middle third" (e.g., in between items),
            // ensure the *first* visible item is active as a default.
            if (!activeItemFound) {
                for (let i = 0; i < serviceItems.length; i++) {
                    const rect = serviceItems[i].getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        if (!timelineItems[i].classList.contains('active')) {
                            timelineItems.forEach(tItem => tItem.classList.remove('active'));
                            timelineItems[i].classList.add('active');
                        }
                        break; // Activate the first visible one and exit
                    }
                }
            }
        } else {
            // If the entire services section is out of view, remove all active classes
            timelineItems.forEach(item => item.classList.remove('active'));
        }

    }, servicesObserverOptions);

    // Initial setup and observation for service items
    serviceItems.forEach((item, index) => {
        // Ensure data-service-index is correctly set in HTML and used in JS
        item.setAttribute('data-service-index', index);
        servicesObserver.observe(item);
    });

    // Ensure the first item is active on initial load if the section is visible
    const servicesSection = document.getElementById('services');
    if (servicesSection && servicesSection.getBoundingClientRect().top < window.innerHeight && timelineItems.length > 0) {
        timelineItems[0].classList.add('active');
    }
});