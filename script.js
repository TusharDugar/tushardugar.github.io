document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Sticky header functionality
    const navbar = document.querySelector('.navbar');
    const scrollThreshold = 100; // How many pixels to scroll before the header changes

    window.addEventListener('scroll', () => {
        if (window.scrollY > scrollThreshold) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Initialize the sticky header state on load in case user refreshed while scrolled
    if (window.scrollY > scrollThreshold) {
        navbar.classList.add('scrolled');
    }

    // Contact Button Copy to Clipboard Functionality
    const contactButtons = document.querySelectorAll('.contact-button');

    contactButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const contactValue = button.dataset.contact;

            if (button.classList.contains('copied')) {
                return; 
            }

            try {
                await navigator.clipboard.writeText(contactValue);
                console.log('Text copied to clipboard:', contactValue);
                
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

    // Scroll Reveal Animation (Intersection Observer)
    const revealElements = document.querySelectorAll('.reveal-item, .section h2');

    const observerOptions = {
        root: null, // viewport as the root
        rootMargin: '0px',
        threshold: 0.1 // 10% of the item must be visible to trigger
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Optionally stop observing once revealed
                // observer.unobserve(entry.target); 
            } else {
                // Optional: remove 'revealed' class if it goes out of view
                // entry.target.classList.remove('revealed');
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        observer.observe(el);
    });

    // Special handling for service cards (delay their reveal slightly)
    const serviceCards = document.querySelectorAll('.service-card');
    const skillsGrid = document.querySelector('.skills-grid');
    const websiteCards = document.querySelectorAll('.website-card');

    const cardObserverOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Slightly higher threshold for cards
    };

    const cardObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add revealed class with a delay for each card
                if (entry.target.classList.contains('service-card')) {
                    const index = Array.from(serviceCards).indexOf(entry.target);
                    setTimeout(() => {
                        entry.target.classList.add('revealed');
                    }, index * 100); // 100ms delay per card
                } else if (entry.target.classList.contains('website-card')) {
                    const index = Array.from(websiteCards).indexOf(entry.target);
                    setTimeout(() => {
                        entry.target.classList.add('revealed');
                    }, index * 100); // 100ms delay per card
                } else if (entry.target.classList.contains('skills-grid')) {
                    // For skills grid, reveal all cards inside it
                    entry.target.classList.add('revealed');
                    entry.target.querySelectorAll('.skill-card-container').forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('revealed');
                        }, index * 80); // Slight delay for each skill card
                    });
                }
                observer.unobserve(entry.target); // Stop observing once cards are revealed
            }
        });
    }, cardObserverOptions);

    serviceCards.forEach(card => cardObserver.observe(card));
    if (skillsGrid) cardObserver.observe(skillsGrid); // Observe the skills grid container
    websiteCards.forEach(card => cardObserver.observe(card));
});