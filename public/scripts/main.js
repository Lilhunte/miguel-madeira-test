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
    if (!chatbotFab) return; // Exit if chatbot elements are not on the page

    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotStickyNote = document.getElementById('chatbot-sticky-note');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMicBtn = document.getElementById('chat-mic-btn');
    const webhookUrl = 'https://boxer-rich-raccoon.ngrok-free.app/webhook/n8n';

    // --- Chatbot UI Visibility ---
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

    // --- Message Handling ---
    const addMessage = (text, sender) => {
        const messageElement = document.createElement('div');
        messageElement.className = `p-3 rounded-lg max-w-xs text-sm mb-2 clear-both ${sender === 'user' ? 'bg-blue-500 text-white float-right' : 'bg-gray-200 text-gray-800 float-left'}`;
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
    };

    const handleSendMessage = async () => {
        const messageText = chatInput.value.trim();
        if (messageText === '') return;

        addMessage(messageText, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        chatSendBtn.disabled = true;
        addMessage("A pensar...", 'bot'); // Typing indicator

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText })
            });

            // Remove typing indicator
            chatMessages.removeChild(chatMessages.lastChild);

            if (!response.ok) {
                throw new Error(`Webhook returned status ${response.status}`);
            }

            const data = await response.json();
            const botReply = data.response || "Desculpe, não entendi.";
            addMessage(botReply, 'bot');

        } catch (error) {
            console.error("Error sending message to webhook:", error);
            if(chatMessages.lastChild.textContent === "A pensar..."){
                 chatMessages.removeChild(chatMessages.lastChild);
            }
            addMessage("Desculpe, ocorreu um erro de conexão.", 'bot');
        } finally {
            chatInput.disabled = false;
            chatSendBtn.disabled = false;
            chatInput.focus();
        }
    };

    chatSendBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    });

    // --- Voice Input (Web Speech API) ---
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
                console.error("Could not start recognition service:", e);
                addMessage("O serviço de voz não pôde ser iniciado. Já está ativo?", 'bot');
            }
        });

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            chatInput.value = transcript;
            if (transcript) {
                handleSendMessage();
            }
        };

        recognition.onspeechend = () => {
            recognition.stop();
        };

        recognition.onend = () => {
            chatMicBtn.classList.remove('text-red-500');
        };

        recognition.onerror = (e) => {
            console.error('Speech recognition error:', e.error);
            addMessage(`Erro no reconhecimento de voz: ${e.error}`, 'bot');
        };

    } else {
        console.log("Web Speech API not supported in this browser.");
        chatMicBtn.style.display = 'none';
    }
});
