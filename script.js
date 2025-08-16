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
                // Services section is handled by its own scroll logic (now fixed-step)
                if (entry.target.id !== 'services') {
                    observer.unobserve(entry.target);
                }
            }
        });
    }, { threshold: 0.1 });

    // Observe all main sections with the general section observer
    document.querySelectorAll('#contact, #hero-right, #tools').forEach(el => sectionObserver.observe(el));


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
    if (aboutSection) sectionObserver.observe(aboutSection);


    // --------------------------
    // Services Cube Animation (NEW LOGIC)
    // --------------------------
    const servicesSection = document.getElementById('services');
    const wrapper = servicesSection?.querySelector('.services-content-wrapper');
    const container = servicesSection?.querySelector('.services-items-container');
    const items = Array.from(container?.querySelectorAll('.service-item') || []);
    const bgNumber = servicesSection?.querySelector('.service-bg-number');

    if (!wrapper || !container || items.length === 0 || !bgNumber) {
        console.warn("Services cube: required elements missing or no items found. Skipping animation setup.");
        if (servicesSection) servicesSection.classList.add('revealed');
        return;
    }

    let activeIndex = 0;
    let isAnimating = false;
    let scrollQueue = [];

    // Create the scroll spacer if it's not already there
    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }

    function adjustLayout() {
        const wrapperHeight = wrapper.offsetHeight;
        if (wrapperHeight === 0) return;
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

        // --- Fix: Only add enough scroll space for (items.length - 1) transitions ---
        // This ensures after the last face, the section ends without extra blank space.
        const estimatedScrollPerItem = window.innerHeight * 1.5;
        // Only (items.length - 1) transitions are needed for N items
        scrollSpacer.style.height = `${(items.length - 1) * estimatedScrollPerItem}px`;
    }

    function layoutFaces() {
        items.forEach((item, index) => {
            item.className = 'service-item';
            if (index === activeIndex) {
                item.classList.add('front');
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
    }

    function updateBgNumber() {
        const displayIndex = activeIndex + 1;
        bgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;
    }

    // Animation queue logic
    function processScrollQueue() {
        if (isAnimating || scrollQueue.length === 0) return;
        const direction = scrollQueue.shift();
        let newIndex;
        if (direction === 'up') {
            newIndex = (activeIndex + 1) % items.length;
        } else {
            newIndex = (activeIndex - 1 + items.length) % items.length;
        }
        if (newIndex === activeIndex) {
            // At boundary, skip and process next in queue
            processScrollQueue();
            return;
        }
        isAnimating = true;
        const current = items[activeIndex];
        const next = items[newIndex];

        // Remove all animation classes first
        items.forEach(item => {
            item.classList.remove('exit-to-top', 'exit-to-bottom', 'enter-from-bottom', 'enter-from-top');
        });

        // Only two faces visible during animation
        items.forEach((item, idx) => {
            if (item !== current && item !== next) {
                item.style.opacity = '0';
            } else {
                item.style.opacity = '';
            }
        });

        if (direction === 'up') {
            current.classList.add('exit-to-top');
            next.classList.add('enter-from-bottom');
        } else {
            current.classList.add('exit-to-bottom');
            next.classList.add('enter-from-top');
        }

        setTimeout(() => {
            activeIndex = newIndex;
            layoutFaces();
            updateBgNumber();
            isAnimating = false;
            processScrollQueue();
        }, 800);
    }

    // Step function queues scrolls
    function step(direction) {
        // At boundaries, do not queue further scrolls
        if ((direction === 'up' && activeIndex === items.length - 1) ||
            (direction === 'down' && activeIndex === 0)) {
            return false;
        }
        scrollQueue.push(direction);
        processScrollQueue();
        return true;
    }

    // Initial layout and number
    layoutFaces();
    updateBgNumber();
    adjustLayout();
    window.addEventListener('resize', adjustLayout);

    // Scroll handling (mouse/trackpad)
    let scrollAccum = 0;
    const handleWheelEvent = (e) => {
        const servicesRect = servicesSection.getBoundingClientRect();
        const isServicesMainlyVisible = servicesRect.top < window.innerHeight * 0.75 && servicesRect.bottom > window.innerHeight * 0.25;
        const atStart = activeIndex === 0 && e.deltaY < 0;
        const atEnd = activeIndex === items.length - 1 && e.deltaY > 0;

        if (isAnimating) {
            e.preventDefault();
            return;
        }
        if (isServicesMainlyVisible) {
            if (!(atStart || atEnd)) {
                e.preventDefault();
            } else {
                return;
            }
        } else {
            return;
        }

        scrollAccum += e.deltaY;
        const scrollThreshold = 50;
        if (scrollAccum > scrollThreshold) {
            if (step('up')) scrollAccum = 0;
            else scrollAccum = 0;
        } else if (scrollAccum < -scrollThreshold) {
            if (step('down')) scrollAccum = 0;
            else scrollAccum = 0;
        }
    };
    window.removeEventListener('wheel', window.handleWheelEvent || (() => {}), { passive: false });
    window.addEventListener('wheel', handleWheelEvent, { passive: false });
    window.handleWheelEvent = handleWheelEvent;

    // Keyboard support
    window.addEventListener('keydown', (e) => {
        const servicesRect = servicesSection.getBoundingClientRect();
        const isServicesMainlyVisible = servicesRect.top < window.innerHeight * 0.75 && servicesRect.bottom > window.innerHeight * 0.25;
        if (!isServicesMainlyVisible) return;
        if (isAnimating) {
            if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(e.key)) {
                e.preventDefault();
            }
            return;
        }
        let handled = false;
        if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
            if (activeIndex < items.length - 1) {
                step('up');
                handled = true;
            }
        } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
            if (activeIndex > 0) {
                step('down');
                handled = true;
            }
        }
        if (handled) e.preventDefault();
    });

    // Touch swipe support
    let touchStartY = null;
    window.addEventListener('touchstart', (e) => {
        const servicesRect = servicesSection.getBoundingClientRect();
        if (e.touches.length === 1 && servicesRect.top < window.innerHeight && servicesRect.bottom > 0) {
            touchStartY = e.touches[0].clientY;
        } else {
            touchStartY = null;
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (touchStartY === null || e.touches.length !== 1) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY;
        const scrollThreshold = 10;
        if (Math.abs(deltaY) > scrollThreshold && !isAnimating) {
            const servicesRect = servicesSection.getBoundingClientRect();
            const isServicesMainlyVisible = servicesRect.top < window.innerHeight * 0.75 && servicesRect.bottom > window.innerHeight * 0.25;
            if (isServicesMainlyVisible) {
                if (!((activeIndex === 0 && deltaY > 0) || (activeIndex === items.length - 1 && deltaY < 0))) {
                    e.preventDefault();
                }
            }
        }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        if (touchStartY === null) return;
        const diff = touchStartY - e.changedTouches[0].clientY;
        const swipeThreshold = 40;
        if (Math.abs(diff) > swipeThreshold) {
            const direction = diff > 0 ? 'up' : 'down';
            step(direction);
        }
        touchStartY = null;
    });

    sectionObserver.observe(servicesSection);
});