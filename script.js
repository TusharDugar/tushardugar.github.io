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
                // Handle section titles separately for the right column (which might be revealed with its parent section)
                if (entry.target.classList.contains('section-title-right')) {
                    entry.target.classList.add('revealed');
                } 
                // Handle main sections or content items
                else if (entry.target.classList.contains('reveal-item')) {
                    // For sections themselves or direct reveal items
                    entry.target.classList.add('revealed');

                    // Staggered reveal for children elements like cards within sections
                    if (entry.target.id === 'about') {
                        // For about section, reveal image card and stats
                        const aboutImageCard = entry.target.querySelector('.about-image-card');
                        const aboutStats = entry.target.querySelector('.about-stats');
                        if (aboutImageCard) setTimeout(() => aboutImageCard.classList.add('revealed'), 100);
                        if (aboutStats) setTimeout(() => aboutStats.classList.add('revealed'), 300);
                    } 
                    // No need for specific .about-text.revealed as it's part of about-left-content's overall reveal now
                    else if (entry.target.classList.contains('experience-list')) { // For experience items
                        entry.target.querySelectorAll('.experience-item').forEach((item, index) => {
                            setTimeout(() => item.classList.add('revealed'), index * 120 + 200);
                        });
                    }
                    else if (entry.target.classList.contains('services-grid')) { // For service cards
                        entry.target.querySelectorAll('.service-card').forEach((card, index) => {
                            setTimeout(() => card.classList.add('revealed'), index * 150 + 200);
                        });
                    } else if (entry.target.classList.contains('skills-grid')) { // For skills cards
                        entry.target.querySelectorAll('.skill-card-container').forEach((card, index) => {
                            setTimeout(() => card.classList.add('revealed'), index * 120 + 200);
                        });
                    } else if (entry.target.classList.contains('websites-grid')) { // For website cards
                        entry.target.querySelectorAll('.website-card').forEach((card, index) => {
                            setTimeout(() => card.classList.add('revealed'), index * 150 + 200);
                        });
                    } else if (entry.target.id === 'contact') { // For footer/contact section
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

    // Observe all main sections for overall reveal and then trigger children animations
    document.querySelectorAll('.section.reveal-item').forEach(section => observer.observe(section));
    
    // Observe specific elements that might need separate reveal triggers
    document.querySelectorAll('.section-title-right').forEach(title => observer.observe(title));
    document.querySelectorAll('.experience-list').forEach(list => observer.observe(list));
    document.querySelectorAll('.services-grid').forEach(grid => observer.observe(grid));
    document.querySelectorAll('.skills-grid').forEach(grid => observer.observe(grid));
    document.querySelectorAll('.websites-grid').forEach(grid => observer.observe(grid));
});