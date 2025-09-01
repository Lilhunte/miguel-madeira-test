document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = 'https://sgypqfqlpbsvzpndoofx.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneXBxZnFscGJzdnpwbmRvb2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzA4NjAsImV4cCI6MjA3MTgwNjg2MH0.DepBq3-C3W9vJDAyBnwBv9rAwnC2LkEtAT_7dqFVADI';
    const { createClient } = supabase;
    const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const params = new URLSearchParams(window.location.search);
    const vehicleId = params.get('id');

    const mainContent = document.querySelector('main');

    if (!vehicleId) {
        mainContent.innerHTML = '<h1 class="text-center text-red-500 text-2xl py-24">Erro: ID da viatura não especificado.</h1>';
        return;
    }

    const fetchVehicleDetails = async () => {
        const { data: vehicle, error } = await _supabase
            .from('vehicles')
            .select('*')
            .eq('id', vehicleId)
            .single();

        if (error || !vehicle) {
            console.error('Error fetching vehicle details:', error);
            mainContent.innerHTML = `<h1 class="text-center text-red-500 text-2xl py-24">Erro: Viatura não encontrada.</h1>`;
            return;
        }

        populatePage(vehicle);
    };

    const populatePage = (vehicle) => {
        // Set page title
        document.title = `${vehicle.title} - Car&Moto Solutions`;

        // Populate header
        document.getElementById('vehicle-title').textContent = vehicle.title;

        // Populate image gallery
        const imageGallery = document.getElementById('image-gallery');
        const primaryMedia = (vehicle.media && vehicle.media.length > 0) ? vehicle.media[0] : null;
        let mediaElement = `<img src="https://via.placeholder.com/800x600.png?text=Imagem+Indispon%C3%ADvel" alt="Imagem de ${vehicle.title}" class="w-full h-auto object-cover">`;

        if (primaryMedia) {
            if (primaryMedia.type.includes('image')) {
                mediaElement = `<img src="${primaryMedia.url.trim()}" alt="Imagem de ${vehicle.title}" class="w-full h-auto object-cover">`;
            } else if (primaryMedia.type.includes('video')) {
                mediaElement = `<video src="${primaryMedia.url.trim()}" controls autoplay muted loop playsinline class="w-full h-auto object-cover"></video>`;
            }
        }
        imageGallery.innerHTML = mediaElement;

        // Populate specs
        document.getElementById('spec-price').textContent = `€${(vehicle.price_eur || 0).toLocaleString('pt-PT')}`;
        document.getElementById('spec-year').textContent = vehicle.year || 'N/A';
        document.getElementById('spec-mileage').textContent = `${(vehicle.mileage_km || 0).toLocaleString('pt-PT')} km`;
        document.getElementById('spec-fuel').textContent = vehicle.fuel_type || 'N/A';
        document.getElementById('spec-transmission').textContent = vehicle.transmission || 'N/A';
        document.getElementById('spec-power').textContent = vehicle.power_cv ? `${vehicle.power_cv} cv` : 'N/A';
        document.getElementById('spec-engine').textContent = vehicle.engine_cc ? `${vehicle.engine_cc} cc` : 'N/A';

        // Populate description
        document.getElementById('vehicle-description').textContent = vehicle.description || 'Sem descrição detalhada.';

        // --- Add Structured Data for SEO ---
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Vehicle",
            "name": vehicle.title,
            "description": vehicle.description,
            "image": imageUrl,
            "brand": {
                "@type": "Brand",
                "name": vehicle.make
            },
            "model": vehicle.model,
            "vehicleModelDate": vehicle.year,
            "mileageFromOdometer": {
                "@type": "QuantitativeValue",
                "value": vehicle.mileage_km,
                "unitCode": "KMT"
            },
            "fuelType": vehicle.fuel_type,
            "vehicleTransmission": vehicle.transmission,
            "offers": {
                "@type": "Offer",
                "price": vehicle.price_eur,
                "priceCurrency": "EUR",
                "availability": "https://schema.org/InStock"
            }
        };

        // Remove existing structured data script if it exists to avoid duplicates
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData, null, 2); // Pretty print for readability
        document.head.appendChild(script);
    };

    fetchVehicleDetails();
});
