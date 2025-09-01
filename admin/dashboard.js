document.addEventListener('DOMContentLoaded', () => {
    // --- SUPABASE SETUP ---
    const SUPABASE_URL = 'https://sgypqfqlpbsvzpndoofx.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneXBxZnFscGJzdnpwbmRvb2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzA4NjAsImV4cCI6MjA3MTgwNjg2MH0.DepBq3-C3W9vJDAyBnwBv9rAwnC2LkEtAT_7dqFVADI';
    const { createClient } = supabase;
    const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- DOM ELEMENTS ---
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const loginSubmitButton = loginForm.querySelector('button[type="submit"]');
    const logoutButton = document.getElementById('logout-button');
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const vehicleFormContainer = document.getElementById('vehicle-form-container');
    const vehicleForm = document.getElementById('vehicle-form');
    const vehicleIdInput = document.getElementById('vehicle-id');
    const addVehicleBtn = document.getElementById('add-vehicle-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const formTitle = document.getElementById('form-title');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const passwordModal = document.getElementById('password-modal');
    const passwordForm = document.getElementById('password-form');
    const cancelPasswordBtn = document.getElementById('cancel-password-btn');
    const passwordError = document.getElementById('password-error');

    // --- VIEW MANAGEMENT (attached to window for testing) ---
    window.showLoginView = () => {
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
    };

    window.showDashboardView = () => {
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        fetchVehicles();
    };

    // --- AUTHENTICATION ---
    const checkSession = async () => {
        const { data: { session } } = await _supabase.auth.getSession();
        if (session) {
            window.showDashboardView();
        } else {
            window.showLoginView();
        }
    };

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';
        loginSubmitButton.disabled = true;
        loginSubmitButton.textContent = 'A entrar...';
        const { error } = await _supabase.auth.signInWithPassword({
            email: loginForm.email.value,
            password: loginForm.password.value,
        });
        if (error) {
            errorMessage.textContent = error.message;
        } else {
            window.showDashboardView();
        }
        loginSubmitButton.disabled = false;
        loginSubmitButton.textContent = 'Sign In';
    });

    logoutButton.addEventListener('click', async () => {
        await _supabase.auth.signOut();
        window.showLoginView();
    });

    // --- DASHBOARD CRUD & MODAL LOGIC ---
    const showForm = (isEdit = false, vehicle = null) => {
        formTitle.textContent = isEdit ? 'Editar Viatura' : 'Adicionar Nova Viatura';
        vehicleForm.reset();
        vehicleIdInput.value = '';
        if (isEdit && vehicle) {
            Object.keys(vehicle).forEach(key => {
                const input = vehicleForm.elements[key];
                if (input && input.type !== 'file') input.value = vehicle[key];
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

    const fetchVehicles = async () => {
        const loadingRow = document.getElementById('loading-state').parentElement.parentElement;
        loadingRow.classList.remove('hidden');
        inventoryTableBody.innerHTML = '';
        inventoryTableBody.appendChild(loadingRow);
        const { data: vehicles, error } = await _supabase.from('vehicles').select('*').order('created_at', { ascending: false });
        loadingRow.classList.add('hidden');
        if (error) {
            inventoryTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500">Erro: ${error.message}</td></tr>`;
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
        inventoryTableBody.innerHTML = '';
        vehicles.forEach(vehicle => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${vehicle.title || 'N/A'}</div><div class="text-sm text-gray-500">${vehicle.make} ${vehicle.model}</div></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€${(vehicle.price_eur || 0).toLocaleString('pt-PT')}</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vehicle.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${vehicle.status}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vehicle.year}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button data-id="${vehicle.id}" class="edit-btn text-indigo-600 hover:text-indigo-900">Editar</button><button data-id="${vehicle.id}" class="delete-btn text-red-600 hover:text-red-900 ml-4">Apagar</button></td>
            `;
            inventoryTableBody.appendChild(row);
        });
    };

    vehicleForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = vehicleForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Aguarde...';
        const formData = new FormData(vehicleForm);
        const vehicleData = Object.fromEntries(formData.entries());
        const id = vehicleIdInput.value;
        const imageFiles = vehicleForm.elements.images.files;
        for (const key in vehicleData) { if (vehicleData[key] === '' && key !== 'id') { vehicleData[key] = null; } }
        delete vehicleData.images;
        try {
            let vehicleId = id || `veh-${Date.now()}-${vehicleData.make.toLowerCase().replace(/ /g, '-')}`;
            vehicleData.id = vehicleId;
            // NOTE: Ensure 'images' and 'videos' buckets exist in your Supabase project with public read access.
            if (imageFiles.length > 0) {
                submitButton.textContent = 'A carregar ficheiros...';

                const uploadPromises = Array.from(imageFiles).map(file => {
                    const fileType = file.type.startsWith('image/') ? 'image' : 'video';
                    const bucketName = fileType === 'image' ? 'images' : 'videos';
                    const filePath = `public/${vehicleId}/${file.name}`;

                    return _supabase.storage.from(bucketName).upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true
                    }).then(result => ({ ...result, fileType, bucketName })); // Pass along context
                });

                const uploadResults = await Promise.all(uploadPromises);

                const uploadErrors = uploadResults.filter(result => result.error);
                if (uploadErrors.length > 0) {
                    throw new Error(`Error uploading files: ${uploadErrors.map(e => e.error.message).join(', ')}`);
                }

                const mediaArray = uploadResults.map(result => {
                    const { data: { publicUrl } } = _supabase.storage.from(result.bucketName).getPublicUrl(result.data.path);
                    return { type: result.fileType, url: publicUrl };
                });

                vehicleData.media = mediaArray;
            }
            submitButton.textContent = 'A salvar dados...';
            delete vehicleData['vehicle-id'];
            const { error } = await _supabase.from('vehicles').upsert(vehicleData, { onConflict: 'id' });
            if (error) { throw error; }
            hideForm();
            fetchVehicles();
        } catch (error) {
            alert(`Erro: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Viatura';
        }
    });

    inventoryTableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const id = target.dataset.id;
        if (!id) return;
        if (target.classList.contains('delete-btn')) {
            if (confirm('Tem a certeza que quer apagar esta viatura?')) {
                const { error } = await _supabase.from('vehicles').delete().eq('id', id);
                if (error) { alert(`Erro ao apagar: ${error.message}`); } else { fetchVehicles(); }
            }
        }
        if (target.classList.contains('edit-btn')) {
            const { data, error } = await _supabase.from('vehicles').select('*').eq('id', id).single();
            if (error) { alert(`Erro ao carregar dados: ${error.message}`); } else if (data) { showForm(true, data); }
        }
    });

    if (changePasswordBtn && passwordModal && passwordForm) {
        const openPasswordModal = () => passwordModal.classList.remove('hidden');
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
            if (newPassword.length < 6) { passwordError.textContent = 'A senha deve ter no mínimo 6 caracteres.'; return; }
            if (newPassword !== passwordForm.confirm_password.value) { passwordError.textContent = 'As senhas não coincidem.'; return; }
            const { error } = await _supabase.auth.updateUser({ password: newPassword });
            if (error) { passwordError.textContent = `Erro: ${error.message}`; } else { alert('Senha atualizada com sucesso!'); closePasswordModal(); }
        });
    }

    // --- INITIAL LOAD ---
    checkSession();
});
