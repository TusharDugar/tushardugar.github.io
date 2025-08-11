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
    const observerOptions = {
        root: null, // viewport as the root
        rootMargin: '0px',
        threshold: 0.1 // 10% of the item must be visible to trigger
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Handle section titles separately
                if (entry.target.tagName === 'H2' && entry.target.closest('.section')) {
                    entry.target.classList.add('revealed');
                } else if (entry.target.classList.contains('reveal-item')) {
                    // For sections themselves, add class immediately
                    entry.target.classList.add('revealed');
                    
                    // Staggered reveal for children elements like cards
                    let delay = 0;
                    if (entry.target.id === 'about') {
                        // For about section, reveal text and image
                        const aboutText = entry.target.querySelector('.about-text');
                        const aboutImage = entry.target.querySelector('.about-image');
                        if (aboutText) setTimeout(() => aboutText.classList.add('revealed'), 100);
                        if (aboutImage) setTimeout(() => aboutImage.classList.add('revealed'), 300);
                    } else if (entry.target.id === 'services') {
                        entry.target.querySelectorAll('.service-card').forEach((card, index) => {
                            setTimeout(() => card.classList.add('revealed'), index * 150 + 200); // Staggered
                        });
                    } else if (entry.target.id === 'skills') {
                        entry.target.querySelectorAll('.skill-card-container').forEach((card, index) => {
                            setTimeout(() => card.classList.add('revealed'), index * 120 + 200); // Staggered
                        });
                    } else if (entry.target.id === 'websites') {
                        entry.target.querySelectorAll('.website-card').forEach((card, index) => {
                            setTimeout(() => card.classList.add('revealed'), index * 150 + 200); // Staggered
                        });
                    } else if (entry.target.id === 'contact') {
                        // For contact section, reveal tagline and then buttons
                        const contactTagline = entry.target.querySelector('.contact-tagline');
                        const contactButtons = entry.target.querySelector('.contact-buttons');
                        if (contactTagline) setTimeout(() => contactTagline.classList.add('revealed'), 100);
                        if (contactButtons) setTimeout(() => contactButtons.classList.add('revealed'), 300);
                    }
                }
                observer.unobserve(entry.target); // Stop observing once revealed
            }
        });
    }, observerOptions);

    // Observe all relevant elements
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section); // Observe the section for overall reveal
        observer.observe(section.querySelector('h2')); // Observe the heading for its own reveal
    });

    // Observe specific sub-elements for their staggered reveals (handled within the main observer)
    // No need to explicitly observe individual cards here if handled by parent section reveal
});