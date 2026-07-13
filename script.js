(function() {
    const copyrightYearEl = document.getElementById('copyright-year');
    if (copyrightYearEl) copyrightYearEl.textContent = new Date().getFullYear();

    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeColorMeta = document.getElementById('theme-color-meta');
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('.theme-icon');
        function setTheme(t){
            html.setAttribute('data-theme',t);
            localStorage.setItem('theme',t);
            if (themeIcon) themeIcon.textContent=t==='dark'?'☀️':'🌙';
            if (themeColorMeta) themeColorMeta.setAttribute('content', t === 'dark' ? '#1A1A1A' : '#FDF8F0');
            themeToggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
        const prefersDark=window.matchMedia('(prefers-color-scheme:dark)').matches;
        setTheme(localStorage.getItem('theme')||(prefersDark?'dark':'light'));
        themeToggle.addEventListener('click',()=>setTheme(html.getAttribute('data-theme')==='dark'?'light':'dark'));
    }

    const menuToggle=document.getElementById('menu-toggle');
    const navLinks=document.getElementById('nav-links');
    const menuBackdrop=document.getElementById('menu-backdrop');
    function closeMenu(){
        if (!navLinks) return;
        navLinks.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded','false');
        menuToggle.setAttribute('aria-label','Open menu');
    }
    menuToggle?.addEventListener('click',()=>{
        if (!navLinks) return;
        const isOpen=navLinks.classList.toggle('is-open');
        menuToggle.setAttribute('aria-expanded',isOpen);
        menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });
    navLinks?.querySelectorAll('a').forEach(l=>l.addEventListener('click',()=>{closeMenu();}));
    if(menuBackdrop){menuBackdrop.addEventListener('click',()=>{closeMenu();});}

    const header=document.getElementById('site-header');
    const hero=document.getElementById('home');
    if(header&&hero)new IntersectionObserver(([e])=>header.classList.toggle('scrolled',!e.isIntersecting),{rootMargin:'-80px 0px 0px 0px'}).observe(hero);

    document.querySelectorAll('[data-reveal]').forEach(el=>{
        new IntersectionObserver((entries,obs)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-revealed');obs.unobserve(e.target);}});},{threshold:0.15,rootMargin:'0px 0px -40px 0px'}).observe(el);
    });

    function forceRevealAll(){document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach(el=>el.classList.add('is-revealed'));}
    if(!window.IntersectionObserver){forceRevealAll();}else{setTimeout(()=>{if(document.querySelector('[data-reveal]:not(.is-revealed)')){forceRevealAll();}},3000);}

    const countersContainer = document.getElementById('trustCounters');
    const counterEls = document.querySelectorAll('.counter-number');
    let countersAnimated = false;

    function getTargetValue(el) {
        const currentYear = new Date().getFullYear();
        if (el.hasAttribute('data-founding-year')) {
            const foundingYear = parseInt(el.getAttribute('data-founding-year')) || 2022;
            return currentYear - foundingYear;
        }
        if (el.hasAttribute('data-base-year')) {
            const baseYear = parseInt(el.getAttribute('data-base-year')) || 2026;
            const baseCount = parseInt(el.getAttribute('data-base-count')) || 8000;
            const yearlyIncrement = parseInt(el.getAttribute('data-yearly-increment')) || 2000;
            return baseCount + (currentYear - baseYear) * yearlyIncrement;
        }
        return parseInt(el.getAttribute('data-count')) || 0;
    }

    if (countersContainer) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !countersAnimated) {
                    countersAnimated = true;
                    requestAnimationFrame(() => {
                        countersContainer.classList.add('is-visible');
                        const duration = 2000;
                        const easeOut = t => 1 - Math.pow(1 - t, 3);
                        const data = Array.from(counterEls).map(el => ({
                            el,
                            target: getTargetValue(el),
                            suffix: el.getAttribute('data-suffix') || ''
                        }));
                        let startTime = null;

                        function tick(timestamp) {
                            if (!startTime) startTime = timestamp;
                            const elapsed = timestamp - startTime;
                            const raw = Math.min(elapsed / duration, 1);
                            const eased = easeOut(raw);
                            data.forEach(({el, target, suffix}) => {
                                el.textContent = Math.round(eased * target) + suffix;
                            });
                            if (raw < 1) {
                                requestAnimationFrame(tick);
                            } else {
                                data.forEach(({el, target, suffix}) => {
                                    el.textContent = target + suffix;
                                });
                            }
                        }
                        requestAnimationFrame(tick);
                    });
                }
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -20px 0px' });
        observer.observe(countersContainer);
    }

    document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',function(e){
        const t=document.querySelector(this.getAttribute('href'));
        if(t){e.preventDefault();window.scrollTo({top:t.getBoundingClientRect().top+window.pageYOffset-(header?.offsetHeight||70),behavior:'smooth'});}
    }));

    function initializeTestimonials() {
        const track = document.getElementById('testimonialTrack');
        if (!track) return;

        if (track._cancelAnim) {
            cancelAnimationFrame(track._cancelAnim);
            track._cancelAnim = null;
            track._lastTimestamp = null;
        }

        const allCards = Array.from(track.children);
        allCards.forEach(card => { if (card.hasAttribute('aria-hidden')) card.remove(); });

        const originals = Array.from(track.children);
        if (originals.length === 0) return;

        originals.forEach(c => {
            const clone = c.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
        });

        const startWhenReady = () => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const totalTrackWidth = track.scrollWidth;
                    const originalSetWidth = totalTrackWidth / 2;
                    if (originalSetWidth <= 0) return;

                    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    if (prefersReducedMotion) {
                        track.style.transform = 'translate3d(0,0,0)';
                        return;
                    }

                    const speed = originalSetWidth / 90000;
                    let offset = 0;
                    let lastTimestamp = null;

                    function animate(timestamp) {
                        if (!lastTimestamp) lastTimestamp = timestamp;
                        const delta = timestamp - lastTimestamp;
                        lastTimestamp = timestamp;
                        offset += speed * delta;
                        offset %= originalSetWidth;
                        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
                        track._cancelAnim = requestAnimationFrame(animate);
                    }

                    document.addEventListener('visibilitychange', () => {
                        if (document.hidden) {
                            if (track._cancelAnim) cancelAnimationFrame(track._cancelAnim);
                            track._cancelAnim = null;
                            lastTimestamp = null;
                        } else {
                            if (!track._cancelAnim) {
                                lastTimestamp = null;
                                track._cancelAnim = requestAnimationFrame(animate);
                            }
                        }
                    });

                    track._cancelAnim = requestAnimationFrame(animate);
                });
            });
        };

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(startWhenReady);
        } else {
            window.addEventListener('load', startWhenReady, { once: true });
            setTimeout(startWhenReady, 500);
        }
    }

    if (document.readyState === 'complete') {
        initializeTestimonials();
    } else {
        window.addEventListener('load', initializeTestimonials);
    }

    let lastWidth = window.innerWidth;
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (window.innerWidth !== lastWidth) {
            lastWidth = window.innerWidth;
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(initializeTestimonials, 200);
        }
    });
    window.addEventListener('orientationchange', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(initializeTestimonials, 200);
    });

    const waButton = document.querySelector('.float-wa');
    const heroSection = document.getElementById('home');
    if (waButton && heroSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    waButton.classList.remove('float-wa--visible');
                } else {
                    waButton.classList.add('float-wa--visible');
                }
            });
        }, { threshold: 0 });
        observer.observe(heroSection);
    }

    const form = document.getElementById('contactForm');
    const waNum='919656681000';
    const nameInput = document.getElementById('ownerName');
    const petInput = document.getElementById('petName');
    const phoneInput = document.getElementById('phone');
    const serviceSelect = document.getElementById('service');
    if (form && nameInput && petInput && phoneInput && serviceSelect) {
    form.addEventListener('submit',function(e){
        e.preventDefault();
        document.querySelectorAll('.form-error').forEach(el=>el.textContent='');
        [nameInput, petInput, phoneInput, serviceSelect].forEach(el => el.setAttribute('aria-invalid', 'false'));
        const ownerName = nameInput.value.trim();
        const petName = petInput.value.trim();
        const phone = phoneInput.value.trim();
        const service = serviceSelect.value;
        const message = document.getElementById('message').value.trim();
        let ok=true;
        if(!ownerName){document.getElementById('nameError').textContent="Please enter the owner's name";nameInput.setAttribute('aria-invalid','true');ok=false;}
        if(!petName){document.getElementById('petError').textContent="Please enter your pet's name";petInput.setAttribute('aria-invalid','true');ok=false;}
        if(!phone){document.getElementById('phoneError').textContent="Please enter your phone number";phoneInput.setAttribute('aria-invalid','true');ok=false;}else{const cleaned=phone.replace(/[\s\-\(\)]/g,'');if(!/^(\+91)?[6-9]\d{9}$/.test(cleaned)){document.getElementById('phoneError').textContent="Enter a valid 10-digit phone number";phoneInput.setAttribute('aria-invalid','true');ok=false;}}
        if(!service){document.getElementById('serviceError').textContent="Please select a service";serviceSelect.setAttribute('aria-invalid','true');ok=false;}
        if(!ok)return;
        const msg=`Hello DOKVET, I'd like to book an appointment.%0A%0A*Owner:* ${encodeURIComponent(ownerName)}%0A*Pet:* ${encodeURIComponent(petName)}%0A*Phone:* ${encodeURIComponent(phone)}%0A*Service:* ${encodeURIComponent(service)}%0A*Message:* ${encodeURIComponent(message)}`;
        const url=`https://wa.me/${waNum}?text=${msg}`;
        window.open(url,'_blank','noopener,noreferrer');
    });
    }
})();