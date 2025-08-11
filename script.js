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
        button.addEventListener('click', () => {
            const contactValue = button.dataset.contact; // Get phone number or email from data-contact attribute
            
            // Use Clipboard API for modern browsers
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(contactValue)
                    .then(() => {
                        console.log('Text copied to clipboard:', contactValue);
                        // Add 'copied' class to trigger animation
                        button.classList.add('copied');
                        // Remove 'copied' class after a delay
                        setTimeout(() => {
                            button.classList.remove('copied');
                        }, 1500); // 1.5 seconds
                    })
                    .catch(err => {
                        console.error('Failed to copy text: ', err);
                        // Fallback for older browsers or if Clipboard API fails
                        fallbackCopyToClipboard(contactValue);
                    });
            } else {
                // Fallback for older browsers
                fallbackCopyToClipboard(contactValue);
            }
        });
    });

    function fallbackCopyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed'; // Avoid scrolling to bottom
        textarea.style.left = '-9999px'; // Move off-screen
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            document.execCommand('copy');
            console.log('Fallback: Text copied to clipboard:', text);
            // Add 'copied' class to trigger animation
            event.target.classList.add('copied'); // Use event.target here if function is called from event handler
            setTimeout(() => {
                event.target.classList.remove('copied');
            }, 1500);
        } catch (err) {
            console.error('Fallback: Failed to copy text: ', err);
            alert('Could not copy: ' + text); // Inform user if copy failed
        }
        document.body.removeChild(textarea);
    }
});