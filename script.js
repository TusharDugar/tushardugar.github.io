document.addEventListener('DOMContentLoaded', () => {
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

    // Scroll Reveal Animation (Intersection Observer) - simplified as most elements are removed
    const observerOptions = {
        root: null, // viewport as the root
        rootMargin: '0px',
        threshold: 0.1 // 10% of the item must be visible to trigger
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Directly reveal the element if it's a main reveal-item or has a specific class
                if (entry.target.classList.contains('reveal-item')) { // Catches sections and the about card
                    entry.target.classList.add('revealed');
                    
                    // Staggered reveals for internal elements that are part of a grid/list
                    if (entry.target.classList.contains('stats-grid')) {
                        entry.target.querySelectorAll('.stat-item').forEach((item, index) => {
                            setTimeout(() => item.classList.add('revealed'), index * 100 + 100);
                        });
                    } else if (entry.target.classList.contains('experience-list')) {
                        entry.target.querySelectorAll('.experience-item').forEach((item, index) => {
                            setTimeout(() => item.classList.add('revealed'), index * 120 + 200);
                        });
                    } else if (entry.target.classList.contains('services-grid')) {
                        entry.target.querySelectorAll('.service-card').forEach((card, index) => {
                            setTimeout(() => card.classList.add('revealed'), index * 150 + 200);
                        });
                    } else if (entry.target.classList.contains('skills-grid')) {
                        entry.target.querySelectorAll('.skill-card-container').forEach((card, index) => {
                            setTimeout(() => card.classList.add('revealed'), index * 120 + 200);
                        });
                    } else if (entry.target.classList.contains('websites-grid')) {
                        entry.target.querySelectorAll('.website-card').forEach((card, index) => {
                            setTimeout(() => card.classList.add('revealed'), index * 150 + 200);
                        });
                    } else if (entry.target.id === 'contact') { // Footer/contact section
                        const contactTagline = entry.target.querySelector('.contact-tagline');
                        const contactButtons = entry.target.querySelector('.contact-buttons');
                        if (contactTagline) setTimeout(() => contactTagline.classList.add('revealed'), 100);
                        if (contactButtons) setTimeout(() => contactButtons.classList.add('revealed'), 300);
                    }
                }
                // Handle section titles separately if they are not the section itself
                else if (entry.target.classList.contains('section-title-right')) {
                    entry.target.classList.add('revealed');
                }

                observer.unobserve(entry.target); // Stop observing once revealed
            }
        });
    }, observerOptions);

    // Observe all main sections and specific grids/lists for reveal triggers
    document.querySelectorAll('.section.reveal-item').forEach(el => observer.observe(el));
    document.querySelectorAll('.section-title-right').forEach(el => observer.observe(el)); // Observe titles
    document.querySelectorAll('.stats-grid').forEach(el => observer.observe(el));
    document.querySelectorAll('.experience-list').forEach(el => observer.observe(el));
    document.querySelectorAll('.services-grid').forEach(el => observer.observe(el));
    document.querySelectorAll('.skills-grid').forEach(el => observer.observe(el));
    document.querySelectorAll('.websites-grid').forEach(el => observer.observe(el));
});