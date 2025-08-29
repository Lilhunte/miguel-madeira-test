// Supabase credentials provided by user
const SUPABASE_URL = 'https://sgypqfqlpbsvzpndoofx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneXBxZnFscGJzdnpwbmRvb2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzA4NjAsImV4cCI6MjA3MTgwNjg2MH0.DepBq3-C3W9vJDAyBnwBv9rAwnC2LkEtAT_7dqFVADI';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const inventoryGrid = document.getElementById('inventory-grid');

const fetchInventory = async () => {
    if (!inventoryGrid) {
        console.error('Inventory grid not found');
        return;
    }
    // Show loading state
    inventoryGrid.innerHTML = '<p class="text-center col-span-full text-brand-gray">A carregar viaturas...</p>';

    const { data: vehicles, error } = await _supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'available') // Only show available vehicles
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching inventory:', error);
        inventoryGrid.innerHTML = `<p class="text-center col-span-full text-red-500">Erro ao carregar o inventário: ${error.message}</p>`;
        return;
    }

    if (vehicles.length === 0) {
        inventoryGrid.innerHTML = '<p class="text-center col-span-full text-brand-gray">Nenhuma viatura disponível de momento.</p>';
        return;
    }

    renderInventory(vehicles);
};

const renderInventory = (vehicles) => {
    inventoryGrid.innerHTML = '';
    vehicles.forEach(vehicle => {
        // Use a placeholder if the media array is empty or doesn't exist
        const imageUrl = (vehicle.media && vehicle.media.length > 0 && vehicle.media[0].url)
            ? vehicle.media[0].url.trim() // Trim whitespace from URL
            : 'https://via.placeholder.com/400x300.png?text=Car%26Moto+Solutions';

        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col';
        card.innerHTML = `
            <a href="vehicle.html?id=${vehicle.id}" class="block">
                <img src="${imageUrl}" alt="Imagem de ${vehicle.title}" class="w-full h-56 object-cover" onerror="this.onerror=null;this.src='https://via.placeholder.com/400x300.png?text=Imagem+Indispon%C3%ADvel';">
            </a>
            <div class="p-6 flex flex-col flex-grow">
                <h3 class="text-xl font-bold text-brand-dark">${vehicle.title}</h3>
                <p class="text-sm text-brand-gray mt-1">${vehicle.year} &bull; ${(vehicle.mileage_km || 0).toLocaleString('pt-PT')} km</p>
                <div class="mt-4 flex-grow">
                    <p class="text-2xl font-bold text-brand-primary">€${(vehicle.price_eur || 0).toLocaleString('pt-PT')}</p>
                </div>
                <a href="vehicle.html?id=${vehicle.id}" class="block w-full text-center bg-brand-primary text-white font-bold py-2 px-4 rounded-lg mt-4 hover:bg-blue-700 transition-colors">
                    Ver Detalhes
                </a>
            </div>
        `;
        inventoryGrid.appendChild(card);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    fetchInventory();
});
