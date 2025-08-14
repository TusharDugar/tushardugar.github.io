document.addEventListener('DOMContentLoaded', () => {
    // --------------------------
    // Contact Button Copy to Clipboard
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
    // Intersection Observer for General Reveal
    // --------------------------
    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                if (entry.target.id !== 'services') {
                    observer.unobserve(entry.target);
                }
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('#contact, #hero-right, #tools').forEach(el => sectionObserver.observe(el));

    // --------------------------
    // About Section Stagger Reveal (DesignCube-like)
    // --------------------------
    const aboutSection = document.getElementById('about');
    const revealStaggerParent = aboutSection ? aboutSection.querySelector('.reveal-stagger-parent') : null;
    const revealStaggerChildren = revealStaggerParent ? revealStaggerParent.querySelectorAll('.reveal-stagger') : [];

    if (revealStaggerParent && revealStaggerChildren.length > 0) {
        const staggerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    revealStaggerChildren.forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('revealed');
                        }, index * 200);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        staggerObserver.observe(revealStaggerParent);
    } else {
        if (aboutSection) aboutSection.classList.add('revealed');
    }

    if (aboutSection) sectionObserver.observe(aboutSection);

    // --------------------------
    // Services Section 3D Cube Scroll Effect
    // --------------------------
    const servicesSection = document.getElementById('services');
    const servicesHeading = servicesSection?.querySelector('.services-heading');
    const servicesContentWrapper = servicesSection?.querySelector('.services-content-wrapper');
    const serviceItems = servicesContentWrapper?.querySelectorAll('.service-item') || [];
    const serviceBgNumber = servicesSection?.querySelector('.service-bg-number');

    if (!servicesSection || !serviceItems.length || !servicesHeading || !servicesContentWrapper || !serviceBgNumber) {
        if (servicesSection) servicesSection.classList.add('revealed');
        return;
    }

    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }

    const SCROLL_DISTANCE_MULTIPLIER = 1.2;
    let SCROLL_DISTANCE_PER_ITEM = 0;
    let currentActiveIndex = 0;
    let rafId = null;

    const adjustServicesLayout = () => {
        const contentWrapperHeight = servicesContentWrapper.offsetHeight;
        const headingHeight = servicesHeading.offsetHeight;
        const gap = 50;

        const totalVisibleHeight = headingHeight + gap + contentWrapperHeight;
        let stickyTopH2 = (window.innerHeight - totalVisibleHeight) / 2;
        stickyTopH2 = Math.max(0, stickyTopH2);

        let stickyTopWrapper = stickyTopH2 + headingHeight + gap;

        servicesSection.style.setProperty('--services-sticky-top-h2', `${stickyTopH2}px`);
        servicesSection.style.setProperty('--services-sticky-top-wrapper', `${stickyTopWrapper}px`);

        const faceOffset = contentWrapperHeight / 2;
        servicesContentWrapper.style.setProperty('--services-face-offset', `${faceOffset}px`);

        SCROLL_DISTANCE_PER_ITEM = contentWrapperHeight * SCROLL_DISTANCE_MULTIPLIER;
        const totalScrollRange = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM;

        scrollSpacer.style.height = `${stickyTopH2 + totalScrollRange + (window.innerHeight * 0.8)}px`;
    };

    const updateServiceAnimation = () => {
        const stickyH2Top = parseFloat(getComputedStyle(servicesSection).getPropertyValue('--services-sticky-top-h2'));
        const animationStart = servicesSection.offsetTop + stickyH2Top;

        let scrollProgress = window.scrollY - animationStart;
        const maxRange = (serviceItems.length - 1) * SCROLL_DISTANCE_PER_ITEM;
        scrollProgress = Math.max(0, Math.min(maxRange, scrollProgress));

        const normalizedProgress = scrollProgress / SCROLL_DISTANCE_PER_ITEM;
        const currentIndex = Math.floor(normalizedProgress);
        const fractionalProgress = normalizedProgress - currentIndex;

        const newActiveIndex = Math.max(0, Math.min(serviceItems.length - 1, currentIndex));
        if (newActiveIndex !== currentActiveIndex) currentActiveIndex = newActiveIndex;

        const displayIndex = currentActiveIndex + 1;
        serviceBgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;

        const faceOffset = parseFloat(getComputedStyle(servicesContentWrapper).getPropertyValue('--services-face-offset'));

        serviceItems.forEach((item, index) => {
            let opacity, transformValue, zIndex;

            if (index === currentIndex) {
                const rotation = 90 * fractionalProgress;
                transformValue = `rotateX(${rotation}deg) translateZ(${faceOffset}px)`;
                opacity = 1 - fractionalProgress;
                zIndex = 2;
            } else if (index === currentIndex + 1) {
                const rotation = 90 - (90 * fractionalProgress);
                transformValue = `rotateX(${rotation}deg) translateZ(${faceOffset}px)`;
                opacity = fractionalProgress;
                zIndex = 1;
            } else {
                transformValue = `rotateX(90deg) translateZ(${faceOffset}px)`;
                opacity = 0;
                zIndex = 0;
            }

            item.style.transform = transformValue;
            item.style.opacity = opacity;
            item.style.zIndex = zIndex;
        });

        rafId = null;
    };

    const handleScrollEvent = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updateServiceAnimation);
    };

    setTimeout(() => {
        adjustServicesLayout();
        updateServiceAnimation();
        if (serviceItems.length > 0) {
            serviceBgNumber.textContent = '01';
        }
    }, 200);

    window.addEventListener('resize', () => {
        adjustServicesLayout();
        handleScrollEvent();
    });

    window.addEventListener('scroll', handleScrollEvent);

    sectionObserver.observe(servicesSection);
});
