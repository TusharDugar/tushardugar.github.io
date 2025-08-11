document.addEventListener('DOMContentLoaded', () => {
    // Contact Button Copy to Clipboard Functionality (only remaining JS)
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

    // Scroll Reveal Animation (Intersection Observer) - only for footer now
    const observerOptions = {
        root: null, // viewport as the root
        rootMargin: '0px',
        threshold: 0.1 // 10% of the item must be visible to trigger
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.id === 'contact') { // Footer/contact section
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

    // Observe only the footer for reveal
    document.querySelectorAll('#contact').forEach(el => observer.observe(el));
});