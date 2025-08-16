document.addEventListener('DOMContentLoaded', () => {
    // --------------------------
    // Contact Button Copy to Clipboard (UNCHANGED)
    // --------------------------
    const contactButtons = document.querySelectorAll('.contact-button');

    contactButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const contactValue = button.dataset.contact;

            if (button.classList.contains('copied')) return;

            try {
                await navigator.clipboard.writeText(contactValue);
                button.classList.add('copied');
                setTimeout(() => {
                    button.classList.remove('copied');
                }, 1500);
            } catch (err) {
                alert('Could not copy automatically. Please copy manually: ' + contactValue);
            }
        });
    });

    // --------------------------
    // Intersection Observer for General Reveal (UNCHANGED)
    // --------------------------
    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Unobserve for general sections to run animation once
                // Services section is now static, so its general reveal is handled normally
                observer.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.1 });

    // Observe all main sections with the general section observer
    document.querySelectorAll('#contact, #hero-right, #tools, #services').forEach(el => sectionObserver.observe(el));


    // --------------------------
    // About Section Stagger Reveal (DesignCube-like) (UNCHANGED)
    // --------------------------
    const aboutSection = document.getElementById('about');
    const revealStaggerParent = aboutSection ? aboutSection.querySelector('.profile-card-wrapper.reveal-stagger-parent') : null;
    const revealStaggerChildren = revealStaggerParent ? revealStaggerParent.querySelectorAll('.reveal-stagger') : [];

    if (revealStaggerParent && revealStaggerChildren.length > 0) {
        const staggerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    revealStaggerChildren.forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('revealed');
                        }, index * 200); // 0.2s stagger delay
                    });
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, { threshold: 0.1 });

        staggerObserver.observe(revealStaggerParent);
    } else {
        if (aboutSection) aboutSection.classList.add('revealed');
    }
    // No longer explicitly observing aboutSection here with sectionObserver, as it's part of its own stagger logic.


    // --------------------------
    // Services Cube Animation (COMMENTED OUT - NO LONGER ACTIVE)
    // --------------------------
    // All JavaScript logic for the 3D cube animation is now commented out
    // as the Services section is intended to be static.
    /*
    const servicesSection = document.getElementById('services');
    const wrapper = servicesSection?.querySelector('.services-content-wrapper');
    const container = servicesSection?.querySelector('.services-items-container');
    const items = Array.from(container?.querySelectorAll('.service-item') || []);
    const bgNumber = servicesSection?.querySelector('.service-bg-number'); // This element is removed in HTML

    if (!wrapper || !container || items.length === 0) { // Removed bgNumber from check as it's gone
        console.warn("Services cube: required elements missing or no items found. Skipping animation setup.");
        if (servicesSection) servicesSection.classList.add('revealed');
        return;
    }

    let activeIndex = 0;
    let isAnimating = false;

    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }

    function adjustLayout() {
        const wrapperHeight = wrapper.offsetHeight;
        if (wrapperHeight === 0) {
             console.warn("services-content-wrapper has 0 height. Cannot calculate faceZ. Check CSS 'height' for .services-content-wrapper.");
             servicesSection.style.setProperty('--faceZ', `-150px`);
             return;
        }
        const faceZ = -(wrapperHeight / 2);
        servicesSection.style.setProperty('--faceZ', `${faceZ}px`);

        const servicesHeadingHeight = servicesSection.querySelector('.services-heading')?.offsetHeight || 0;
        const gapBetweenHeadingAndWrapper = 50;
        const totalVisibleStickyHeight = servicesHeadingHeight + gapBetweenHeadingAndWrapper + wrapperHeight;
        let stickyTopH2 = (window.innerHeight - totalVisibleStickyHeight) / 2;
        stickyTopH2 = Math.max(0, stickyTopH2);
        let stickyTopWrapper = stickyTopH2 + servicesHeadingHeight + gapBetweenHeadingAndWrapper;

        servicesSection.style.setProperty('--services-sticky-top-h2', `${stickyTopH2}px`);
        servicesSection.style.setProperty('--services-sticky-top-wrapper', `${stickyTopWrapper}px`);

        const estimatedScrollPerItem = window.innerHeight * 1.5;
        scrollSpacer.style.height = `${items.length * estimatedScrollPerItem}px`;
    }

    function layoutFaces() {
        items.forEach((item, index) => {
            item.className = 'service-item';
            item.classList.remove('active-content');

            if (index === activeIndex) {
                item.classList.add('front', 'active-content');
            } else if (index === (activeIndex + 1) % items.length) {
                item.classList.add('below');
            } else if (index === (activeIndex - 1 + items.length) % items.length) {
                item.classList.add('above');
            } else {
                if (index < activeIndex) {
                    item.classList.add('above');
                } else {
                    item.classList.add('below');
                }
            }
        });
        if(bgNumber) updateBgNumber(); // Conditional check for bgNumber
    }

    function updateBgNumber() {
        if(bgNumber) { // Defensive check
            const displayIndex = activeIndex + 1;
            bgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;
        }
    }

    function goToIndex(newIndex, directionName) {
        if (isAnimating || newIndex === activeIndex) return;
        isAnimating = true;

        const current = items[activeIndex];
        const next = items[newIndex];

        if (directionName === 'up') {
            current.classList.replace('front', 'exit-to-top');
            next.classList.replace('below', 'enter-from-bottom');
        } else {
            current.classList.replace('front', 'exit-to-bottom');
            next.classList.replace('above', 'enter-from-top');
        }

        setTimeout(() => {
            activeIndex = newIndex;
            layoutFaces();
            isAnimating = false;
        }, 800);
    }

    function step(direction) {
        let newIndex;
        if (direction === 'up') {
            newIndex = activeIndex + 1;
        } else {
            newIndex = activeIndex - 1;
        }

        const atStartBoundary = activeIndex === 0 && direction === 'down';
        const atEndBoundary = activeIndex === items.length - 1 && direction === 'up';

        if (atStartBoundary || atEndBoundary) {
            return false;
        }

        newIndex = Math.max(0, Math.min(items.length - 1, newIndex));

        if (newIndex === activeIndex) {
            return true;
        }

        goToIndex(newIndex, direction);
        return true;
    }

    let scrollAccum = 0;
    let touchStartY = null;

    setTimeout(() => {
        adjustLayout();
        layoutFaces();
        sectionObserver.observe(servicesSection); // Still observe for general reveal
    }, 500);

    window.removeEventListener('wheel', window.handleWheelEvent || (() => {}), { passive: false }); // Clean up old listeners
    window.removeEventListener('keydown', window.handleKeydownEvent || (() => {}), { passive: false });
    window.removeEventListener('touchstart', window.handleTouchstartEvent || (() => {}), { passive: false });
    window.removeEventListener('touchend', window.handleTouchendEvent || (() => {}), { passive: false });

    // New event listeners for static page scroll. Removed from current version.
    // wheel, keydown, touchstart, touchend event listeners were here.
    // They are now removed because Services section is static.
    // If other sections need these, they would need their own specific handlers.

    */
    // END OF COMMENTED OUT SERVICES CUBE ANIMATION JAVASCRIPT
});