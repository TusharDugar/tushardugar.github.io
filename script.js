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

    // Scroll Reveal Animation (Intersection Observer) - only for about card, hero section, tools section, and footer
    const observerOptions = {
        root: null, // viewport as the root
        rootMargin: '0px',
        threshold: 0.1 // 10% of the item must be visible to trigger
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Reveal the about-left-content card
                if (entry.target.classList.contains('about-left-content')) {
                    entry.target.classList.add('revealed');
                } 
                // Reveal hero/introduction section on the right
                else if (entry.target.id === 'hero-right') {
                    entry.target.classList.add('revealed');
                }
                // Reveal the tools section on the right
                else if (entry.target.id === 'tools') { // <--- ADDED THIS CONDITION
                    entry.target.classList.add('revealed');
                }
                // Reveal footer/contact section
                else if (entry.target.id === 'contact') {
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
    document.querySelectorAll('#contact').forEach(el => observer.observe(el));
    document.querySelectorAll('#hero-right').forEach(el => observer.observe(el));
    document.querySelectorAll('#tools').forEach(el => observer.observe(el)); // <--- ADDED THIS LINE
});
76.7s
