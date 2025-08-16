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
    // Note: The 'about' section handling is separate below
    document.querySelectorAll('#hero-right, #tools, #services, #contact').forEach(el => {
        if (el) sectionObserver.observe(el);
    });


    // --------------------------
    // About Section Stagger Reveal (DesignCube-like) AND About Card Reveal
    // --------------------------
    const aboutSection = document.getElementById('about');
    // Get the main about card, which has the initial opacity:0
    const aboutLeftContent = aboutSection ? aboutSection.querySelector('.about-left-content') : null;

    // Check for the specific 'reveal-parent' for staggered children
    const revealStaggerParent = aboutSection ? aboutSection.querySelector('.profile-card-wrapper.reveal-parent') : null; 
    const revealStaggerChildren = revealStaggerParent ? revealStaggerParent.querySelectorAll('.reveal-child') : [];

    if (revealStaggerParent && revealStaggerChildren.length > 0) {
        // If a specific stagger parent and children are found, apply the stagger animation
        const staggerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Ensure the main card itself is revealed first if it's the stagger parent
                    // or if it's an ancestor of the stagger parent.
                    // If aboutLeftContent is the staggerParent, it will get 'revealed'
                    // immediately by this check.
                    if (aboutLeftContent && aboutLeftContent === entry.target) {
                        aboutLeftContent.classList.add('revealed');
                    } else if (aboutLeftContent && aboutLeftContent.contains(entry.target) && !aboutLeftContent.classList.contains('revealed')) {
                        // If the stagger parent is *inside* aboutLeftContent, reveal aboutLeftContent first
                        aboutLeftContent.classList.add('revealed');
                    }

                    revealStaggerChildren.forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('revealed');
                        }, index * 200); // 0.2s stagger delay
                    });
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, { threshold: 0.1 });

        // Observe the stagger parent
        staggerObserver.observe(revealStaggerParent);

        // Additionally, ensure the main card itself is observed if it's not the stagger parent
        // and it has its own reveal properties (opacity:0, transform)
        if (aboutLeftContent && aboutLeftContent !== revealStaggerParent) {
            sectionObserver.observe(aboutLeftContent);
        }

    } else {
        // If no specific stagger setup, ensure the main about card is revealed directly
        if (aboutLeftContent) {
            sectionObserver.observe(aboutLeftContent); // Observe the card directly
        } else if (aboutSection) {
            // Fallback: if even the card isn't found, observe the whole section
            sectionObserver.observe(aboutSection);
        }
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
    const servicesContentWrapper = servicesSection?.querySelector('.services-content-wrapper'); // The sticky perspective container
    const servicesItemsContainer = servicesContentWrapper?.querySelector('.services-items-container'); // The element that rotates
    const serviceItems = servicesItemsContainer ? Array.from(servicesItemsContainer.querySelectorAll('.service-item')) : [];
    
    // Check for core elements
    if (!servicesSection || !servicesContentWrapper || !servicesItemsContainer || serviceItems.length === 0) {
        console.warn("GSAP Services Cube: One or more required elements missing. Skipping animation setup.");
        // Ensure the section still reveals itself normally if animation fails
        if(servicesSection) servicesSection.classList.add('revealed');
        return;
    }

    const cubeHeight = 250; // Fixed height of each face as per example (from original About.tsx example)
    const faceOffset = cubeHeight / 2; // Half of cubeHeight

    // Function to update cube dimensions and initial transforms
    function updateCubeDimensions() {
        let cubeWidth = 0; // Local variable for calculated width
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

    // Main Cube Rotation Animation
    gsap.timeline({
        scrollTrigger: {
            trigger: servicesSection,
            start: "top top", // Pin the section when its top hits viewport top
            end: "bottom top", // Unpin when section's bottom hits viewport top
            scrub: true, // Smoothly link animation to scroll
            pin: true, // Keep the section pinned while animating
            pinSpacing: false, // Prevents ScrollTrigger from adding extra spacing due to pin if not desired
        }
    })
    .to(servicesItemsContainer, {
        rotateX: serviceItems.length * 90, // Total rotation for all 8 items (8 * 90 = 720 degrees)
        ease: "none" // Linear easing for scrubbing
    });


    // Update background number opacity based on scroll progress (inside Services section)
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
            let activeItemIndex = Math.round(currentRotationDegrees / 90);
            activeItemIndex = Math.max(0, Math.min(serviceItems.length - 1, activeItemIndex)); // Clamp to valid index range

            // Iterate through all items to control their background number opacity
            serviceItems.forEach((item, i) => {
                const itemBgNumber = item.querySelector('.service-bg-number');
                if (itemBgNumber) {
                    gsap.to(itemBgNumber, {
                        opacity: (i === activeItemIndex) ? 1 : 0, // Only active item's number is visible
                        duration: 0.1 // Small fade for the number visibility
                    });
                }
            });
        }
    });
});