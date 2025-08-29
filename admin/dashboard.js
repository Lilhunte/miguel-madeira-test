// Supabase credentials provided by user
const SUPABASE_URL = 'https://sgypqfqlpbsvzpndoofx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneXBxZnFscGJzdnpwbmRvb2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzA4NjAsImV4cCI6MjA3MTgwNjg2MH0.DepBq3-C3W9vJDAyBnwBv9rAwnC2LkEtAT_7dqFVADI';

// Initialize the Supabase client
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- AUTHENTICATION LOGIC ---
const logoutButton = document.getElementById('logout-button');

const checkSession = async () => {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html'; // Corrected path
    }
};

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    // Also fetch vehicles on page load after checking session
    fetchVehicles();
});

logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = 'Logging out...';
    const { error } = await _supabase.auth.signOut();
    if (error) {
        console.error('Logout failed:', error);
        alert(`Logout failed: ${error.message}`);
        logoutButton.disabled = false;
        logoutButton.textContent = 'Logout';
    } else {
        window.location.href = 'login.html'; // Corrected path
    }
});

// --- CRUD & UI LOGIC ---

// UI Elements
const addVehicleBtn = document.getElementById('add-vehicle-btn');
const vehicleFormContainer = document.getElementById('vehicle-form-container');
const vehicleForm = document.getElementById('vehicle-form');
const formTitle = document.getElementById('form-title');
const cancelBtn = document.getElementById('cancel-btn');
const inventoryTableBody = document.getElementById('inventory-table-body');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const vehicleIdInput = document.getElementById('vehicle-id');

// Show/Hide Form
const showForm = (isEdit = false, vehicle = null) => {
    formTitle.textContent = isEdit ? 'Editar Viatura' : 'Adicionar Nova Viatura';
    vehicleForm.reset();
    vehicleIdInput.value = '';

    if (isEdit && vehicle) {
        // Populate form for editing
        Object.keys(vehicle).forEach(key => {
            const input = vehicleForm.elements[key];
            if (input) {
                // For file inputs, we can't set the value, so we skip it.
                if (input.type === 'file') return;
                input.value = vehicle[key];
            }
        });
        vehicleIdInput.value = vehicle.id;
    }

    vehicleFormContainer.classList.remove('hidden');
};

const hideForm = () => {
    vehicleFormContainer.classList.add('hidden');
    vehicleForm.reset();
    vehicleIdInput.value = '';
};

addVehicleBtn.addEventListener('click', () => showForm(false));
cancelBtn.addEventListener('click', hideForm);

// READ Vehicles
const fetchVehicles = async () => {
    const loadingRow = document.getElementById('loading-state').parentElement.parentElement;
    loadingRow.classList.remove('hidden');
    inventoryTableBody.innerHTML = ''; // Clear table but keep loading row
    inventoryTableBody.appendChild(loadingRow);


    const { data: vehicles, error } = await _supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

    loadingRow.classList.add('hidden'); // Hide the loading row

    if (error) {
        console.error('Error fetching vehicles:', error);
        inventoryTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500">Erro ao carregar viaturas: ${error.message}</td></tr>`;
        return;
    }

    if (vehicles.length === 0) {
        const emptyRow = document.getElementById('empty-state').parentElement.parentElement;
        emptyRow.classList.remove('hidden');
        inventoryTableBody.innerHTML = '';
        inventoryTableBody.appendChild(emptyRow);
    } else {
        renderVehicles(vehicles);
    }
};

const renderVehicles = (vehicles) => {
    inventoryTableBody.innerHTML = ''; // Clear previous content
    vehicles.forEach(vehicle => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${vehicle.title || 'N/A'}</div>
                <div class="text-sm text-gray-500">${vehicle.make} ${vehicle.model}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€${(vehicle.price_eur || 0).toLocaleString('pt-PT')}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vehicle.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${vehicle.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vehicle.year}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button data-id="${vehicle.id}" class="edit-btn text-indigo-600 hover:text-indigo-900">Editar</button>
                <button data-id="${vehicle.id}" class="delete-btn text-red-600 hover:text-red-900 ml-4">Apagar</button>
            </td>
        `;
        inventoryTableBody.appendChild(row);
    });
};

// CREATE/UPDATE Vehicle
vehicleForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = vehicleForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Aguarde...';

    const formData = new FormData(vehicleForm);
    const vehicleData = Object.fromEntries(formData.entries());
    const id = vehicleIdInput.value;
    const imageFiles = vehicleForm.elements.images.files;

    // Convert empty strings to null for nullable fields
    for (const key in vehicleData) {
        if (vehicleData[key] === '' && key !== 'id') {
            vehicleData[key] = null;
        }
    }
    delete vehicleData.images; // Remove the file input value from the data object

    try {
        let vehicleId = id;
        // If it's a new vehicle, generate an ID first.
        if (!vehicleId) {
            vehicleId = `veh-${Date.now()}-${vehicleData.make.toLowerCase().replace(/ /g, '-')}`;
        }
        vehicleData.id = vehicleId;

        // --- Handle Image Uploads ---
        // NOTE: Ensure a 'vehicle-images' bucket exists in your Supabase project with public read access.
        if (imageFiles.length > 0) {
            submitButton.textContent = 'A carregar imagens...';
            const uploadPromises = Array.from(imageFiles).map(file => {
                const filePath = `public/${vehicleId}/${file.name}`;
                return _supabase.storage.from('vehicle-images').upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true // Overwrite file if it exists
                });
            });

            const uploadResults = await Promise.all(uploadPromises);

            // Check for errors during upload
            const uploadErrors = uploadResults.filter(result => result.error);
            if (uploadErrors.length > 0) {
                throw new Error(`Error uploading images: ${uploadErrors.map(e => e.error.message).join(', ')}`);
            }

            // Get public URLs for all uploaded images
            const mediaArray = uploadResults.map(result => {
                const { data: { publicUrl } } = _supabase.storage.from('vehicle-images').getPublicUrl(result.data.path);
                return { type: 'image', url: publicUrl };
            });

            vehicleData.media = mediaArray;
        }
        // --- End Image Handling ---

        submitButton.textContent = 'A salvar dados...';

        // Upsert the vehicle data (works for both create and update)
        // Use the hidden vehicle-id field to determine if it's an update or insert.
        delete vehicleData['vehicle-id'];
        const { error } = await _supabase.from('vehicles').upsert(vehicleData, { onConflict: 'id' });

        if (error) {
            throw error;
        }

        hideForm();
        fetchVehicles(); // Refresh table

    } catch (error) {
        alert(`Erro: ${error.message}`);
        console.error(error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar Viatura';
    }
});

// DELETE/EDIT event delegation
inventoryTableBody.addEventListener('click', async (event) => {
    const target = event.target;
    const id = target.dataset.id;

    if (!id) return; // Exit if the clicked element doesn't have a data-id

    if (target.classList.contains('delete-btn')) {
        if (confirm('Tem a certeza que quer apagar esta viatura? Esta ação é irreversível.')) {
            const { error } = await _supabase.from('vehicles').delete().eq('id', id);
            if (error) {
                alert(`Erro ao apagar: ${error.message}`);
                console.error(error);
            } else {
                fetchVehicles(); // Refresh table
            }
        }
    }

    if (target.classList.contains('edit-btn')) {
        const { data, error } = await _supabase.from('vehicles').select('*').eq('id', id).single();
        if (error) {
            alert(`Erro ao carregar dados da viatura: ${error.message}`);
            console.error(error);
        } else if (data) {
            showForm(true, data);
        }
    }
});

// --- Password Change Modal Logic ---
const changePasswordBtn = document.getElementById('change-password-btn');
const passwordModal = document.getElementById('password-modal');
const passwordForm = document.getElementById('password-form');
const cancelPasswordBtn = document.getElementById('cancel-password-btn');
const passwordError = document.getElementById('password-error');

if(changePasswordBtn && passwordModal && passwordForm) { // Check if the elements exist
    const openPasswordModal = () => {
        passwordModal.classList.remove('hidden');
    };

    const closePasswordModal = () => {
        passwordModal.classList.add('hidden');
        passwordForm.reset();
        if(passwordError) passwordError.textContent = '';
    };

    changePasswordBtn.addEventListener('click', openPasswordModal);
    cancelPasswordBtn.addEventListener('click', closePasswordModal);

    passwordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        passwordError.textContent = '';

        const newPassword = passwordForm.new_password.value;
        const confirmPassword = passwordForm.confirm_password.value;

        if (newPassword.length < 6) {
            passwordError.textContent = 'A senha deve ter no mínimo 6 caracteres.';
            return;
        }

        if (newPassword !== confirmPassword) {
            passwordError.textContent = 'As senhas não coincidem.';
            return;
        }

        const { data, error } = await _supabase.auth.updateUser({
          password: newPassword
        });

        if (error) {
            passwordError.textContent = `Erro: ${error.message}`;
            console.error('Password update error:', error);
        } else {
            alert('Senha atualizada com sucesso!');
            closePasswordModal();
        }
    });
}
