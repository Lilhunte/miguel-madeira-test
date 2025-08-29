document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu logic
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Chatbot UI logic
    const chatbotFab = document.getElementById('chatbot-fab');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotStickyNote = document.getElementById('chatbot-sticky-note');
    const chatCloseBtn = document.getElementById('chat-close-btn');


    if (chatbotFab && chatbotWindow && chatbotStickyNote) {
        // Show sticky note after a delay, only if chat window is not already open
        setTimeout(() => {
            if (chatbotWindow.classList.contains('hidden')) {
                chatbotStickyNote.classList.remove('hidden', 'opacity-0');
            }
        }, 2000);

        const toggleChat = () => {
            chatbotWindow.classList.toggle('hidden');
            chatbotWindow.classList.toggle('opacity-0');
            chatbotStickyNote.classList.add('hidden', 'opacity-0'); // Always hide note when interacting
        };

        chatbotFab.addEventListener('click', toggleChat);
        if(chatCloseBtn) {
            chatCloseBtn.addEventListener('click', toggleChat);
        }
    }
});
