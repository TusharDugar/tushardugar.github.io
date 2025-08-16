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
                observer.unobserve(entry.target); // Unobserve after reveal
            }
        });
    }, { threshold: 0.1 });

    // Observe all main sections with the general section observer
    document.querySelectorAll('#contact, #hero-right, #tools, #services').forEach(el => sectionObserver.observe(el));


    // --------------------------
    // About Section Stagger Reveal (DesignCube-like) (UNCHANGED)
    // --------------------------
    const aboutSection = document.getElementById('about');
    // Corrected selector to .reveal-parent and .reveal-child as per your prompt
    const revealStaggerParent = aboutSection ? aboutSection.querySelector('.profile-card-wrapper.reveal-parent') : null; 
    const revealStaggerChildren = revealStaggerParent ? revealStaggerParent.querySelectorAll('.reveal-child') : [];

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
        if (aboutSection) sectionObserver.observe(aboutSection);
    }


    // --------------------------
    // Services Section GSAP 3D Cube Animation
    // --------------------------
    // Ensure GSAP and ScrollTrigger are loaded
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("GSAP or ScrollTrigger is not loaded. Skipping Services Cube Animation.");
        return;
    }
    gsap.registerPlugin(ScrollTrigger);

    const servicesSection = document.getElementById('services');
    const servicesHeading = servicesSection?.querySelector('.services-heading'); // Used for initial Y animation
    const servicesContentWrapper = servicesSection?.querySelector('.services-content-wrapper'); // The sticky perspective container
    const servicesItemsContainer = servicesContentWrapper?.querySelector('.services-items-container'); // The element that rotates
    const serviceItems = servicesItemsContainer ? Array.from(servicesItemsContainer.querySelectorAll('.service-item')) : [];

    // Check for core elements
    if (!servicesSection || !servicesContentWrapper || !servicesItemsContainer || serviceItems.length === 0) {
        console.warn("GSAP Services Cube: One or more required elements missing (#services, .services-content-wrapper, .services-items-container, .service-item). Skipping animation setup.");
        // Ensure the section still reveals itself normally if animation fails
        if(servicesSection) servicesSection.classList.add('revealed');
        return;
    }

    const cubeHeight = 250; // Fixed height of each face as per example
    const faceOffset = cubeHeight / 2; // Half of cubeHeight

    let cubeWidth = 0; // Will be set dynamically by JS

    // Function to update cube dimensions and initial transforms
    function updateCubeDimensions() {
        const width = window.innerWidth;
        if (width >= 1024) cubeWidth = 900;
        else if (width >= 768) cubeWidth = 640;
        else cubeWidth = 300;

        // Apply width to the servicesItemsContainer (the cube itself)
        gsap.set(servicesItemsContainer, { width: cubeWidth });
        // Apply height to each item (CSS already has height: 100%, but good for consistency)
        gsap.set(serviceItems, { height: cubeHeight });


        // Set initial transforms for each service item (face)
        // This is crucial because GSAP animates *from* these set values.
        serviceItems.forEach((item, i) => {
            // Corrected transform string usage as per your diagnosis.
            gsap.set(item, {
                transform: `rotateX(${i * 90}deg) translateZ(${faceOffset}px)`,
                opacity: 1 // All faces are initially visible for a scrubbing effect
            });
        });

        // Set the counter-translate for the wrapper to bring the whole cube forward
        // so its 'front' face (rotateX:0) aligns with the viewer's plane.
        // Corrected transform string usage.
        gsap.set(servicesContentWrapper, { transform: `translateZ(${-faceOffset}px)` });
    }

    // Call on load and resize
    window.addEventListener('resize', updateCubeDimensions);
    updateCubeDimensions(); // Initial call to set dimensions and initial transforms

    // GSAP Animation Timeline
    const masterTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: servicesSection,
            start: "top top", // Pin the section when its top hits viewport top
            end: "bottom top", // Unpin when section's bottom hits viewport top
            scrub: true, // Smoothly link animation to scroll
            pin: true, // Keep the section pinned while animating
            pinSpacing: false, // Prevent ScrollTrigger from adding extra spacing due to pin if not desired
        }
    });

    // Main cube rotation animation: rotate the container through all items
    masterTimeline.to(servicesItemsContainer, {
        rotateX: serviceItems.length * 90, // Total rotation for all 8 items (8 * 90 = 720 degrees)
        ease: "none" // Linear easing for scrubbing
    });


    // Update background number based on scroll progress (inside Services section)
    ScrollTrigger.create({
        trigger: servicesSection,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: self => {
            // Get current rotation value (0 to 720 degrees) mapped to progress (0-1)
            const totalRotationDegrees = serviceItems.length * 90;
            const currentRotationDegrees = self.progress * totalRotationDegrees;
            
            // Determine which face is currently "active"
            // Divide by 90 (degrees per face step) and round to get the nearest index
            let activeFaceIndex = Math.round(currentRotationDegrees / 90);
            activeFaceIndex = Math.max(0, Math.min(serviceItems.length - 1, activeFaceIndex)); // Clamp to valid index range

            // Update the background number for the active item
            const currentBgNumberElement = serviceItems[activeFaceIndex]?.querySelector('.service-bg-number');
            if (currentBgNumberElement) {
                // Hide all numbers except the active one (GSAP handles visibility more smoothly)
                serviceItems.forEach(item => {
                    const itemBgNumber = item.querySelector('.service-bg-number');
                    if (itemBgNumber) {
                        gsap.to(itemBgNumber, {
                            opacity: (item === serviceItems[activeFaceIndex]) ? 1 : 0,
                            duration: 0.1 // Small fade for the number
                        });
                    }
                });
            }
        }
    });
});