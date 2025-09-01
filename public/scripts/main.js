document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile menu logic ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- Chatbot Logic ---
    const chatbotFab = document.getElementById('chatbot-fab');
    if (chatbotFab) {
        const chatbotWindow = document.getElementById('chatbot-window');
        const chatbotStickyNote = document.getElementById('chatbot-sticky-note');
        const chatCloseBtn = document.getElementById('chat-close-btn');
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');
        const chatSendBtn = document.getElementById('chat-send-btn');
        const chatMicBtn = document.getElementById('chat-mic-btn');
        const webhookUrl = 'https://boxer-rich-raccoon.ngrok-free.app/webhook/n8n';

        setTimeout(() => {
            if (chatbotWindow && chatbotWindow.classList.contains('hidden')) {
                chatbotStickyNote.classList.remove('hidden', 'opacity-0');
            }
        }, 2000);

        const toggleChat = () => {
            chatbotWindow.classList.toggle('hidden');
            chatbotWindow.classList.toggle('opacity-0');
            chatbotStickyNote.classList.add('hidden', 'opacity-0');
        };

        chatbotFab.addEventListener('click', toggleChat);
        chatCloseBtn.addEventListener('click', toggleChat);

        const addMessage = (text, sender) => {
            const messageElement = document.createElement('div');
            messageElement.className = `p-3 rounded-lg max-w-xs text-sm mb-2 clear-both ${sender === 'user' ? 'bg-blue-500 text-white float-right' : 'bg-gray-200 text-gray-800 float-left'}`;
            messageElement.textContent = text;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };

        const handleSendMessage = async () => {
            const messageText = chatInput.value.trim();
            if (messageText === '') return;
            addMessage(messageText, 'user');
            chatInput.value = '';
            chatInput.disabled = true;
            chatSendBtn.disabled = true;
            addMessage("A pensar...", 'bot');
            const UNIQUE_KEY = 'YOUR_UNIQUE_KEY_HERE';
            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: messageText, timestamp: new Date().toISOString(), key: UNIQUE_KEY, action: "voice_input" })
                });
                if(chatMessages.lastChild && chatMessages.lastChild.textContent === "A pensar..."){ chatMessages.removeChild(chatMessages.lastChild); }
                if (!response.ok) { throw new Error(`Webhook returned status ${response.status}`); }
                const data = await response.json();
                const omniResponse = data.output || data.response || data.message || "I received your message!";
                addMessage(omniResponse, 'bot');
            } catch (error) {
                console.error("Error sending message to webhook:", error);
                if(chatMessages.lastChild && chatMessages.lastChild.textContent === "A pensar..."){ chatMessages.removeChild(chatMessages.lastChild); }
                addMessage("Sorry, I encountered an error processing your request.", 'bot');
            } finally {
                chatInput.disabled = false;
                chatSendBtn.disabled = false;
                chatInput.focus();
            }
        };

        chatSendBtn.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { handleSendMessage(); } });

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            chatMicBtn.addEventListener('click', () => {
                try {
                    recognition.start();
                    chatMicBtn.classList.add('text-red-500');
                } catch(e) {
                    addMessage("O serviço de voz não pôde ser iniciado. Já está ativo?", 'bot');
                }
            });
            recognition.onresult = (e) => {
                const transcript = e.results[0][0].transcript;
                chatInput.value = transcript;
                if (transcript) { handleSendMessage(); }
            };
            recognition.onspeechend = () => { recognition.stop(); };
            recognition.onend = () => { chatMicBtn.classList.remove('text-red-500'); };
            recognition.onerror = (e) => { addMessage(`Erro no reconhecimento de voz: ${e.error}`, 'bot'); };
        } else {
            chatMicBtn.style.display = 'none';
        }
    }

    // --- Featured Vehicles on Homepage Logic ---
    const featuredGrid = document.getElementById('featured-vehicles-grid');
    if (featuredGrid) {
        const SUPABASE_URL = 'https://sgypqfqlpbsvzpndoofx.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneXBxZnFscGJzdnpwbmRvb2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzA4NjAsImV4cCI6MjA3MTgwNjg2MH0.DepBq3-C3W9vJDAyBnwBv9rAwnC2LkEtAT_7dqFVADI';
        const { createClient } = supabase;
        const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const renderFeatured = (vehicles) => {
            featuredGrid.innerHTML = '';
            vehicles.forEach(vehicle => {
                const imageUrl = (vehicle.media && vehicle.media.length > 0 && vehicle.media[0].url) ? vehicle.media[0].url.trim() : 'https://via.placeholder.com/400x300.png?text=Car%26Moto+Solutions';
                const card = document.createElement('div');
                card.className = 'bg-gray-900/50 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden ring-1 ring-white/10 flex flex-col transition-all duration-300 hover:ring-brand-primary';
                card.innerHTML = `
                    <a href="vehicle.html?id=${vehicle.id}" class="block overflow-hidden">
                        <img src="${imageUrl}" alt="Imagem de ${vehicle.title}" class="w-full h-56 object-cover transition-transform duration-300 hover:scale-105" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/400x300.png?text=Imagem+Indispon%C3%ADvel';">
                    </a>
                    <div class="p-6 flex flex-col flex-grow">
                        <h3 class="text-xl font-bold text-brand-light">${vehicle.title}</h3>
                        <p class="text-2xl font-semibold text-brand-primary mt-2">€${(vehicle.price_eur || 0).toLocaleString('pt-PT')}</p>
                        <div class="mt-4 flex-grow space-y-2 text-sm text-brand-gray border-t border-white/10 pt-4">
                            <p class="flex items-center justify-between"><span>Ano:</span> <span class="font-semibold text-brand-light">${vehicle.year || 'N/A'}</span></p>
                            <p class="flex items-center justify-between"><span>Quilometragem:</span> <span class="font-semibold text-brand-light">${(vehicle.mileage_km || 0).toLocaleString('pt-PT')} km</span></p>
                        </div>
                        <a href="vehicle.html?id=${vehicle.id}" class="block w-full text-center bg-brand-primary text-white font-bold py-3 px-4 rounded-lg mt-6 hover:bg-blue-700 transition-colors">
                            Ver Detalhes
                        </a>
                    </div>
                `;
                featuredGrid.appendChild(card);
            });
        };

        const fetchFeaturedVehicles = async () => {
            featuredGrid.innerHTML = '<p class="text-center col-span-full text-brand-gray">A carregar destaques...</p>';
            const { data, error } = await _supabase.from('vehicles').select('*').eq('status', 'available').order('created_at', { ascending: false }).limit(3);
            if (error) {
                featuredGrid.innerHTML = '<p class="text-center col-span-full text-red-500">Não foi possível carregar os destaques.</p>';
                return;
            }
            if (data.length === 0) {
                featuredGrid.innerHTML = '<p class="text-center col-span-full text-brand-gray">Sem viaturas em destaque de momento.</p>';
            } else {
                renderFeatured(data);
            }
        };

        fetchFeaturedVehicles();
    }

    // --- Scroll Animation Logic ---
    const animatedSections = document.querySelectorAll('.fade-in-section');
    if (animatedSections.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Stop observing once it's visible
                }
            });
        }, { threshold: 0.1 }); // Trigger when 10% of the element is visible

        animatedSections.forEach(section => {
            observer.observe(section);
        });
    }
});
