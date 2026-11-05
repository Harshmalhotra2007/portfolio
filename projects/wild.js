document.addEventListener('DOMContentLoaded', () => {
    const wildlifeData = [
        {
            name: 'Bengal Tiger', scientific: 'Panthera tigris tigris', habitat: 'Central India, Sundarbans', status: 'Endangered',
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Bengal_tiger_in_Sanjay_Dubri_Tiger_Reserve_December_2024_by_Tisha_Mukherjee_11.jpg/960px-Bengal_tiger_in_Sanjay_Dubri_Tiger_Reserve_December_2024_by_Tisha_Mukherjee_11.jpg',
            info: 'India is home to over 70% of the world\'s wild tigers. They are apex predators and a vital keystone species in the Indian forest ecosystem.',
            coords: [22.3302, 80.3236] // Central India (Kanha)
        },
        {
            name: 'Indian Elephant', scientific: 'Elephas maximus indicus', habitat: 'Western Ghats, Northeast', status: 'Endangered',
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Elephas_maximus_%28Bandipur%29.jpg/960px-Elephas_maximus_%28Bandipur%29.jpg',
            info: 'Known as the "megagardeners" of the forest, they help maintain forest and savanna ecosystems by dispersing seeds over long distances.',
            coords: [9.4679, 77.1390] // Western Ghats (Periyar)
        },
        {
            name: 'Snow Leopard', scientific: 'Panthera uncia', habitat: 'Himalayas', status: 'Vulnerable',
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Irbis4.JPG/500px-Irbis4.JPG',
            info: 'Known as the "ghost of the mountains," this elusive cat is perfectly adapted to cold, steep, and rocky high-altitude environments.',
            coords: [32.2396, 78.0349] // Himalayas (Spiti)
        },
        {
            name: 'Asiatic Lion', scientific: 'Panthera leo persica', habitat: 'Gir National Park, Gujarat', status: 'Endangered',
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Panthera_leo_persica_-_Tierpark_Berlin_-_2015.jpg/960px-Panthera_leo_persica_-_Tierpark_Berlin_-_2015.jpg',
            info: 'India is the only place on Earth where the Asiatic Lion is still found in the wild, saved from the brink of extinction by intense conservation efforts.',
            coords: [21.1158, 70.7960] // Gir National Park
        },
        {
            name: 'Indian Rhino', scientific: 'Rhinoceros unicornis', habitat: 'Kaziranga National Park, Assam', status: 'Vulnerable',
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Indian_One_Horned_Rhino.jpg/960px-Indian_One_Horned_Rhino.jpg',
            info: 'Famous for its single black horn and distinct armor-like skin folds, primarily found in the tall grasslands and riverine forests of the northeast.',
            coords: [26.5775, 93.1711] // Kaziranga National Park
        },
        {
            name: 'Red Panda', scientific: 'Ailurus fulgens', habitat: 'Eastern Himalayas', status: 'Endangered',
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Red_Panda%2C_Gentle_Tree-Dweller_of_the_Himalayas.jpg/960px-Red_Panda%2C_Gentle_Tree-Dweller_of_the_Himalayas.jpg',
            info: 'An elusive, tree-dwelling mammal known for its striking reddish-brown fur and bushy tail. They primarily eat bamboo and are a vital indicator of healthy high-altitude forests.',
            coords: [27.0863, 88.0163] // Singalila National Park
        },
        {
            name: 'Kashmir Stag (Hangul)', scientific: 'Cervus hanglu hanglu', habitat: 'Kashmir Valley', status: 'Critically Endangered',
            image: 'https://static.toiimg.com/thumb/108750661/Hangul-kashmir.jpg?width=1200&height=900',
            info: 'The state animal of Jammu and Kashmir, this is the only surviving sub-species of Red Deer in the Indian subcontinent, restricted to Dachigam National Park.',
            coords: [34.1398, 74.9398] // Dachigam National Park
        },
        {
            name: 'Gharial', scientific: 'Gavialis gangeticus', habitat: 'Chambal River', status: 'Critically Endangered',
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Gharial_Ranganthittu_Wildlife_Sanctuary.jpg/960px-Gharial_Ranganthittu_Wildlife_Sanctuary.jpg',
            info: 'A fish-eating crocodile with a long, thin snout. Once widespread, they are now restricted to only a few river systems in northern India.',
            coords: [26.7573, 78.8922] // National Chambal Sanctuary
        }
    ];

    const forestTypesData = [
        {
            name: 'Tropical Evergreen', color: '#004d00', info: 'Found in the Western Ghats and Northeast, these forests receive over 200cm of rain and never shed their leaves.',
            bounds: [[8, 74], [16, 76], [14, 78]]
        },
        {
            name: 'Tropical Deciduous', color: '#228b22', info: 'The most widespread forests in India, covering Central and South India. Trees shed leaves in spring.',
            bounds: [[18, 75], [26, 85], [20, 82]]
        },
        {
            name: 'Arid / Thorny', color: '#8b4513', info: 'Found in Rajasthan and Gujarat, characterized by deep-rooted, thorny vegetation adapted to low rainfall.',
            bounds: [[24, 70], [30, 75], [26, 73]]
        },
        {
            name: 'Montane (Himalayan)', color: '#2f4f4f', info: 'Forest types change with altitude in the Himalayas, from subtropical pines to alpine mosses.',
            bounds: [[30, 77], [35, 80], [32, 85]]
        },
        {
            name: 'Mangrove / Littoral', color: '#556b2f', info: 'Found in river deltas like the Sundarbans. Specialized roots (pneumatophores) help trees breathe in saltwater.',
            bounds: [[21.5, 88], [22.5, 89.5], [21.8, 89]]
        }
    ];

    const nationalParksData = [
        { name: 'Jim Corbett', state: 'Uttarakhand', est: '1936', coords: [29.5300, 78.7747], info: 'India\'s first national park, famous for Royal Bengal Tigers.' },
        { name: 'Kanha', state: 'Madhya Pradesh', est: '1955', coords: [22.3345, 80.6115], info: 'Largest park in central India, source of inspiration for "The Jungle Book".' },
        { name: 'Kaziranga', state: 'Assam', est: '1905', coords: [26.5775, 93.1711], info: 'World Heritage site hosting two-thirds of the world\'s great one-horned rhinoceroses.' },
        { name: 'Gir Forest', state: 'Gujarat', est: '1965', coords: [21.1158, 70.7960], info: 'The sole home of the Asiatic Lion in the world.' },
        { name: 'Sundarbans', state: 'West Bengal', est: '1984', coords: [21.9497, 88.9007], info: 'Largest mangrove forest in the world and home to swimming tigers.' },
        { name: 'Periyar', state: 'Kerala', est: '1982', coords: [9.4679, 77.1390], info: 'Famous for its elephant and tiger reserve in the Cardamom Hills.' },
        { name: 'Hemis', state: 'Ladakh', est: '1981', coords: [33.7258, 77.3485], info: 'High-altitude park globally famous for its snow leopard population.' },
        { name: 'Ranthambore', state: 'Rajasthan', est: '1980', coords: [26.0173, 76.5026], info: 'One of northern India\'s largest national parks, known for its tigers.' }
    ];

    let activeFilter = 'All';
    let forestMapInstance, typesMapInstance, parksMapInstance;

    // Initialization logic
    function init() {
        renderWildlife();
        // Setup Hash handling
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            showSection(hash, true);
        } else {
            showSection('hero', true);
        }

        window.onpopstate = function (event) {
            if (event.state && event.state.sectionId) {
                showSection(event.state.sectionId, true);
            } else {
                showSection('hero', true);
            }
        };
    }

    // Modal Functions
    window.openModal = function(index) {
        const animal = wildlifeData[index];
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        const statusClass = animal.status.toLowerCase().replace(/ /g, '-');

        modalBody.innerHTML = `
            <img src="${animal.image}" alt="${animal.name}" class="modal-image">
            <h2 id="modal-title" style="color: var(--primary-color); margin-bottom: 0.5rem; font-size: 2.2rem; font-family: var(--font-display);">${animal.name}</h2>
            <p style="font-style: italic; margin-bottom: 1.5rem; color: var(--text-muted); font-size: 1.05rem;">${animal.scientific}</p>
            <div class="modal-grid">
                <div>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.2rem; text-transform: uppercase; letter-spacing: 0.05em;">Primary Habitat</p>
                    <p style="font-weight: 500; font-size: 1.1rem;">${animal.habitat}</p>
                </div>
                <div>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.2rem; text-transform: uppercase; letter-spacing: 0.05em;">Conservation Status</p>
                    <span class="status-badge ${statusClass}" style="margin-top: 0.1rem;">${animal.status}</span>
                </div>
            </div>
            <p class="modal-detail-text">${animal.info}</p>
        `;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    window.closeModal = function() {
        document.getElementById('modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    // Close modal on click outside
    window.onclick = function(event) {
        const modal = document.getElementById('modal');
        if (event.target == modal) { closeModal(); }
    };

    // Wildlife Rendering
    function renderWildlife() {
        const grid = document.getElementById('wildlife-grid');
        grid.innerHTML = '';
        const searchVal = document.getElementById('search-input').value.toLowerCase();

        const filtered = wildlifeData.filter(animal => {
            const matchesSearch = animal.name.toLowerCase().includes(searchVal) || animal.habitat.toLowerCase().includes(searchVal);
            const matchesFilter = activeFilter === 'All' || animal.status === activeFilter;
            return matchesSearch && matchesFilter;
        });

        if (filtered.length === 0) {
            grid.innerHTML = '<div class="no-results">No animals found matching your criteria. Try adjusting the search or filter.</div>';
            return;
        }

        filtered.forEach((animal, index) => {
            const card = document.createElement('div');
            card.className = 'wildlife-card fade-in';
            card.setAttribute('tabindex', '0');
            const statusClass = animal.status.toLowerCase().replace(/ /g, '-');

            card.innerHTML = `
                <img src="${animal.image}" alt="${animal.name}" class="card-image" loading="lazy">
                <div class="card-content">
                    <span class="status-badge ${statusClass}">${animal.status}</span>
                    <h3 class="card-title">${animal.name}</h3>
                    <p class="card-scientific">${animal.scientific}</p>
                    <p class="card-habitat"><b>Habitat:</b> ${animal.habitat}</p>
                </div>
            `;
            card.onclick = () => openModal(wildlifeData.indexOf(animal));
            card.onkeypress = (e) => { if (e.key === 'Enter') openModal(wildlifeData.indexOf(animal)); };
            grid.appendChild(card);

            // Re-observe for animation
            setTimeout(() => card.classList.add('visible'), 50);
        });
    }

    // Map Initializations
    function initForestMap() {
        forestMapInstance = L.map('india-map-container').setView([22.5937, 78.9629], 5);
        const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(forestMapInstance);
        tiles.on('load', () => hideLoader('forests-loader'));

        wildlifeData.forEach((animal, index) => {
            if (animal.coords) {
                const marker = L.marker(animal.coords).addTo(forestMapInstance);
                marker.bindTooltip(`<b>${animal.name}</b>`, { direction: 'top', offset: [0, -10] });
                const popupContent = `
                    <div style="text-align: center; min-width: 170px; font-family: var(--font-body);">
                        <h4 style="margin-bottom: 8px; color: var(--primary-color); font-size: 1.1rem; font-family: var(--font-display);">${animal.name}</h4>
                        <img src="${animal.image}" alt="${animal.name}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 6px; margin-bottom: 8px; border: 1px solid var(--border-card);">
                        <button onclick="openModal(${wildlifeData.indexOf(animal)})" style="padding: 6px 12px; background: var(--primary-color); color: var(--bg-dark); border: none; border-radius: 20px; font-weight: bold; cursor: pointer; width: 100%; transition: var(--transition-speed);">View Details</button>
                    </div>
                `;
                marker.bindPopup(popupContent);
            }
        });
    }

    function initTypesMap() {
        typesMapInstance = L.map('types-map-container').setView([22.5937, 78.9629], 5);

        const typesTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; National Geographic',
            maxZoom: 10, minZoom: 4
        }).addTo(typesMapInstance);
        typesTiles.on('load', () => hideLoader('forest-types-loader'));

        forestTypesData.forEach(type => {
            const polygon = L.polygon(type.bounds, {
                color: type.color,
                weight: 2,
                fillColor: type.color,
                fillOpacity: 0.35,
                smoothFactor: 1
            }).addTo(typesMapInstance);

            polygon.bindPopup(`
                <div style="text-align: center; font-family: var(--font-body); padding: 5px;">
                    <h4 style="color: var(--primary-color); font-family: var(--font-display); font-size: 1.25rem; margin-bottom: 5px;">${type.name}</h4>
                    <p style="font-size: 0.95rem; color: #e1efe0;">${type.info}</p>
                </div>
            `);

            polygon.on('mouseover', function () {
                this.setStyle({ fillOpacity: 0.6, weight: 3 });
            });
            polygon.on('mouseout', function () {
                this.setStyle({ fillOpacity: 0.35, weight: 2 });
            });
        });
    }

    function initParksMap() {
        parksMapInstance = L.map('parks-map-container').setView([22.5937, 78.9629], 5);
        const parksTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; National Geographic',
            maxZoom: 10, minZoom: 4
        }).addTo(parksMapInstance);
        parksTiles.on('load', () => hideLoader('national-parks-loader'));

        nationalParksData.forEach(park => {
            const marker = L.marker(park.coords).addTo(parksMapInstance);
            marker.bindTooltip(`<b>${park.name}</b>`, { direction: 'top', offset: [0, -10] });
            const popupContent = `
                <div style="text-align: center; font-family: var(--font-body); min-width: 190px;">
                    <h4 style="color: var(--primary-color); margin-bottom: 5px; font-size: 1.1rem; font-family: var(--font-display);">${park.name}</h4>
                    <p style="font-size: 0.85rem; color: #a3b899; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;"><strong>${park.state}</strong> (Est. ${park.est})</p>
                    <p style="font-size: 0.9rem; color: #e1efe0; line-height: 1.4;">${park.info}</p>
                </div>
            `;
            marker.bindPopup(popupContent);
        });
    }

    function hideLoader(id) {
        const loader = document.getElementById(id);
        if (loader) loader.classList.add('hidden');
    }

    // Section Navigation
    window.showSection = function(sectionId, skipHash) {
        document.querySelectorAll('.section, .hero').forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('visible');
        });

        const target = document.getElementById(sectionId);
        if (target) {
            target.style.display = sectionId === 'hero' ? 'flex' : 'block';
            void target.offsetWidth;
            target.classList.add('visible');
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });

        const navMenu = document.getElementById('navMenu');
        const navToggle = document.getElementById('navToggle');
        if (navMenu && navMenu.classList.contains('open')) {
            navMenu.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        }

        if (!skipHash) {
            const newHash = sectionId === 'hero' ? '' : `#${sectionId}`;
            if (window.location.hash !== newHash) {
                history.pushState({ sectionId }, '', newHash || window.location.pathname);
            }
        }

        if (sectionId === 'forests') {
            if (!forestMapInstance) { initForestMap(); }
            else { setTimeout(() => { forestMapInstance.invalidateSize(); }, 100); }
        }
        if (sectionId === 'forest-types') {
            if (!typesMapInstance) { initTypesMap(); }
            else { setTimeout(() => { typesMapInstance.invalidateSize(); }, 100); }
        }
        if (sectionId === 'national-parks') {
            if (!parksMapInstance) { initParksMap(); }
            else { setTimeout(() => { parksMapInstance.invalidateSize(); }, 100); }
        }
    };

    // Event Listeners
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen);
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const sectionId = e.target.dataset.section;
            if (sectionId) showSection(sectionId);
        });
    });

    document.getElementById('search-input').addEventListener('input', renderWildlife);

    const filterContainer = document.getElementById('filterTags');
    filterContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tag')) {
            document.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            activeFilter = e.target.dataset.filter;
            renderWildlife();
        }
    });

    // Fade-In Observer for Sections
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add('visible'); }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Initialize
    init();
});
