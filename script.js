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
        button.addEventListener('click', async () => { // Use async for modern clipboard API
            const contactValue = button.dataset.contact; // Get the actual value to copy

            // Check if already in 'copied' state to prevent rapid clicks
            if (button.classList.contains('copied')) {
                return; 
            }

            // Copy to clipboard
            try {
                await navigator.clipboard.writeText(contactValue);
                console.log('Text copied to clipboard:', contactValue);
                
                // Add 'copied' class to trigger animation
                button.classList.add('copied');

                // Revert to original state after a delay
                setTimeout(() => {
                    button.classList.remove('copied');
                }, 1500); // 1.5 seconds
            } catch (err) {
                console.error('Failed to copy text: ', err);
                // Fallback for older browsers or if Clipboard API fails
                // For simplicity, for now we will just alert if modern copy fails,
                // as manual copying might be required for very old browsers.
                alert('Could not copy automatically. Please copy manually: ' + contactValue);
            }
        });
    });
});