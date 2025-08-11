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
                // Reveal the section's h2 or the left-column-sticky content
                if (entry.target.classList.contains('section-title-right') || entry.target.classList.contains('about-left-content')) {
                    entry.target.classList.add('revealed');
                } 
                // Handle staggered reveals for grids and lists within sections
                else if (entry.target.classList.contains('experience-list')) {
                    entry.target.classList.add('revealed'); // Reveal container itself
                    entry.target.querySelectorAll('.experience-item').forEach((item, index) => {
                        setTimeout(() => item.classList.add('revealed'), index * 120 + 200);
                    });
                } else if (entry.target.classList.contains('services-grid')) {
                    entry.target.classList.add('revealed');
                    entry.target.querySelectorAll('.service-card').forEach((card, index) => {
                        setTimeout(() => card.classList.add('revealed'), index * 150 + 200);
                    });
                } else if (entry.target.classList.contains('skills-grid')) {
                    entry.target.classList.add('revealed');
                    entry.target.querySelectorAll('.skill-card-container').forEach((card, index) => {
                        setTimeout(() => card.classList.add('revealed'), index * 120 + 200);
                    });
                } else if (entry.target.classList.contains('websites-grid')) {
                    entry.target.classList.add('revealed');
                    entry.target.querySelectorAll('.website-card').forEach((card, index) => {
                        setTimeout(() => card.classList.add('revealed'), index * 150 + 200);
                    });
                } else if (entry.target.id === 'contact') { // Footer/contact section
                    entry.target.classList.add('revealed');
                    const contactTagline = entry.target.querySelector('.contact-tagline');
                    const contactButtons = entry.target.querySelector('.contact-buttons');
                    if (contactTagline) setTimeout(() => contactTagline.classList.add('revealed'), 100);
                    if (contactButtons) setTimeout(() => contactButtons.classList.add('revealed'), 300);
                }
                observer.unobserve(entry.target); // Stop observing once revealed
            }
        });
    }, observerOptions);

    // Observe specific elements for reveal triggers
    document.querySelectorAll('.about-left-content').forEach(el => observer.observe(el));
    document.querySelectorAll('.section-title-right').forEach(el => observer.observe(el));
    document.querySelectorAll('.experience-list').forEach(el => observer.observe(el));
    document.querySelectorAll('.services-grid').forEach(el => observer.observe(el));
    document.querySelectorAll('.skills-grid').forEach(el => observer.observe(el));
    document.querySelectorAll('.websites-grid').forEach(el => observer.observe(el));
    document.querySelectorAll('#contact').forEach(el => observer.observe(el));
});