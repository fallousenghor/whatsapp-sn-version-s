import './style.css';
import { userService } from './services/userService.js';
import { eventBus } from './utils/eventBus.js';
import { ChatHeader } from './components/ChatHeader.js';
import { MessageList } from './components/MessageList.js';
import { MessageInput } from './components/MessageInput.js';
import { ConversationList } from './components/ConversationList.js';
import { messageService } from './services/messageService.js';
import { conversationService } from './services/conversationService.js';

class WhatsAppApp {
  constructor() {
    this.currentUser = null;
    this.currentConversation = null;
    this.components = {};
    this.init();
  }

  async init() {
    // Vérifier si l'utilisateur est connecté
    this.currentUser = userService.getCurrentUser();
    
    if (!this.currentUser) {
      this.showAuthScreen();
      return;
    }

    // Initialiser l'interface principale
    this.initMainInterface();
    this.setupEventListeners();
    
    // Charger les conversations
    await this.loadConversations();
  }

  showAuthScreen() {
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-tr from-green-100 via-white to-green-50 px-4 py-10">
        <div class="bg-white shadow-2xl rounded-3xl w-full max-w-md p-8 border border-green-100">
          <div class="flex flex-col items-center mb-8">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                 alt="Logo WhatsApp" class="w-20 h-20 mb-4">
            <h2 class="text-3xl font-bold text-gray-800">WhatsApp Web</h2>
            <p class="text-gray-500 mt-1 text-center">Connectez-vous pour commencer</p>
          </div>

          <form id="auth-form" class="space-y-6">
            <div>
              <label for="phone" class="block text-base font-medium text-gray-700 mb-1">
                Numéro de téléphone
              </label>
              <div class="flex gap-3">
                <select id="country-code" class="w-1/3 px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700">
                  <option value="+221">🇸🇳 +221</option>
                  <option value="+33">🇫🇷 +33</option>
                  <option value="+225">🇨🇮 +225</option>
                  <option value="+1">🇺🇸 +1</option>
                </select>
                <input type="tel" id="phone" placeholder="78 XXX XX XX" required
                       class="w-2/3 px-5 py-3 border border-gray-300 rounded-xl">
              </div>
            </div>

            <button type="submit" class="w-full bg-green-500 text-white py-3 rounded-xl text-lg font-medium hover:bg-green-600 transition duration-200">
              Se connecter
            </button>

            <div class="text-center">
              <button type="button" id="register-btn" class="text-green-600 hover:underline font-semibold">
                Créer un compte
              </button>
            </div>
          </form>

          <!-- Formulaire d'inscription (caché par défaut) -->
          <form id="register-form" class="space-y-6 hidden">
            <div>
              <label for="first-name" class="block text-base font-medium text-gray-700 mb-1">Prénom</label>
              <input type="text" id="first-name" required class="w-full px-5 py-3 border border-gray-300 rounded-xl">
            </div>
            <div>
              <label for="last-name" class="block text-base font-medium text-gray-700 mb-1">Nom</label>
              <input type="text" id="last-name" required class="w-full px-5 py-3 border border-gray-300 rounded-xl">
            </div>
            <div>
              <label for="reg-phone" class="block text-base font-medium text-gray-700 mb-1">Numéro de téléphone</label>
              <div class="flex gap-3">
                <select id="reg-country-code" class="w-1/3 px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700">
                  <option value="+221">🇸🇳 +221</option>
                  <option value="+33">🇫🇷 +33</option>
                  <option value="+225">🇨🇮 +225</option>
                  <option value="+1">🇺🇸 +1</option>
                </select>
                <input type="tel" id="reg-phone" placeholder="78 XXX XX XX" required
                       class="w-2/3 px-5 py-3 border border-gray-300 rounded-xl">
              </div>
            </div>

            <button type="submit" class="w-full bg-green-500 text-white py-3 rounded-xl text-lg font-medium hover:bg-green-600 transition duration-200">
              S'inscrire
            </button>

            <div class="text-center">
              <button type="button" id="login-btn" class="text-green-600 hover:underline font-semibold">
                Déjà un compte ? Se connecter
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.setupAuthEventListeners();
  }

  setupAuthEventListeners() {
    const authForm = document.getElementById('auth-form');
    const registerForm = document.getElementById('register-form');
    const registerBtn = document.getElementById('register-btn');
    const loginBtn = document.getElementById('login-btn');

    // Basculer entre connexion et inscription
    registerBtn?.addEventListener('click', () => {
      authForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    });

    loginBtn?.addEventListener('click', () => {
      registerForm.classList.add('hidden');
      authForm.classList.remove('hidden');
    });

    // Connexion
    authForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const countryCode = document.getElementById('country-code').value;
      const phone = document.getElementById('phone').value.trim();
      const fullPhone = countryCode + phone.replace(/\s+/g, '');

      try {
        await userService.login(fullPhone);
        this.currentUser = userService.getCurrentUser();
        this.initMainInterface();
        this.setupEventListeners();
        await this.loadConversations();
      } catch (error) {
        alert('Erreur de connexion: ' + error.message);
      }
    });

    // Inscription
    registerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const firstName = document.getElementById('first-name').value.trim();
      const lastName = document.getElementById('last-name').value.trim();
      const countryCode = document.getElementById('reg-country-code').value;
      const phone = document.getElementById('reg-phone').value.trim();
      const fullPhone = countryCode + phone.replace(/\s+/g, '');

      try {
        await userService.register({
          firstName,
          lastName,
          phone: fullPhone
        });
        this.currentUser = userService.getCurrentUser();
        this.initMainInterface();
        this.setupEventListeners();
        await this.loadConversations();
      } catch (error) {
        alert('Erreur d\'inscription: ' + error.message);
      }
    });
  }

  initMainInterface() {
    document.getElementById('app').innerHTML = `
      <div class="bg-gray-900 text-white h-screen overflow-hidden">
        <div class="flex h-full">
          <!-- Sidebar -->
          <div class="w-16 sidebar-bg flex flex-col justify-between items-center py-4">
            <div class="space-y-4">
              <div class="bg-gray-700 p-2 rounded-lg">
                <i class="fas fa-home text-gray-300"></i>
              </div>
              <button class="p-2 rounded-lg sidebar-item cursor-pointer" data-action="settings">
                <i class="fas fa-cog text-gray-400"></i>
              </button>
              <button class="p-2 rounded-lg sidebar-item cursor-pointer" data-action="new-chat">
                <i class="fas fa-plus text-gray-400"></i>
              </button>
              <button class="p-2 rounded-lg sidebar-item cursor-pointer" data-action="archived">
                <i class="fas fa-archive text-gray-400"></i>
              </button>
            </div>
            <div class="space-y-4">
              <button class="p-2 rounded-lg sidebar-item cursor-pointer" data-action="profile">
                <i class="fas fa-user text-gray-400"></i>
              </button>
              <button class="p-2 rounded-lg sidebar-item cursor-pointer" data-action="logout">
                <i class="fas fa-sign-out-alt text-gray-400"></i>
              </button>
            </div>
          </div>

          <!-- Panel des conversations -->
          <div class="w-96 bg-gray-800 border-r border-gray-700 flex flex-col">
            <!-- Header du panel -->
            <div class="p-4 border-b border-gray-700 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="avatar bg-green-500">
                  ${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}
                </div>
                <span class="font-medium">${this.currentUser.firstName} ${this.currentUser.lastName}</span>
              </div>
              <div class="flex space-x-2">
                <button class="p-1 hover:bg-gray-700 rounded" data-action="new-chat">
                  <i class="fas fa-plus text-gray-400"></i>
                </button>
                <button class="p-1 hover:bg-gray-700 rounded" data-action="menu">
                  <i class="fas fa-ellipsis-v text-gray-400"></i>
                </button>
              </div>
            </div>

            <!-- Barre de recherche -->
            <div class="p-4">
              <div class="relative">
                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                <input type="text" id="search-conversations" 
                       placeholder="Rechercher ou démarrer une discussion"
                       class="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-gray-500">
              </div>
            </div>

            <!-- Onglets de filtrage -->
            <div class="flex border-b border-gray-700">
              <button class="filter-tab flex-1 py-3 text-green-500 border-b-2 border-green-500 font-medium" data-filter="all">
                Toutes
              </button>
              <button class="filter-tab flex-1 py-3 text-gray-400 hover:text-white" data-filter="unread">
                Non lues
              </button>
              <button class="filter-tab flex-1 py-3 text-gray-400 hover:text-white" data-filter="favorites">
                Favoris
              </button>
              <button class="filter-tab flex-1 py-3 text-gray-400 hover:text-white" data-filter="groups">
                Groupes
              </button>
            </div>

            <!-- Liste des conversations -->
            <div id="conversations-list" class="flex-1 overflow-y-auto"></div>
          </div>

          <!-- Zone de chat principale -->
          <div class="flex-1 chat-bg flex flex-col">
            <!-- Header du chat -->
            <div id="chat-header"></div>

            <!-- Zone des messages -->
            <div id="messages-container" class="flex-1 overflow-hidden"></div>

            <!-- Zone de saisie -->
            <div id="message-input-container"></div>
          </div>
        </div>
      </div>

      <!-- Modales et overlays -->
      <div id="modals-container"></div>
    `;

    // Initialiser les composants
    this.components.chatHeader = new ChatHeader(document.getElementById('chat-header'));
    this.components.messageList = new MessageList(document.getElementById('messages-container'));
    this.components.messageInput = new MessageInput(document.getElementById('message-input-container'));
    this.components.conversationList = new ConversationList(document.getElementById('conversations-list'));

    // Afficher l'état initial
    this.components.chatHeader.render(null);
    this.components.messageInput.render(null);
  }

  setupEventListeners() {
    // Événements de l'interface
    document.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action) {
        this.handleAction(action);
      }
    });

    // Filtres de conversation
    document.addEventListener('click', (e) => {
      const filterTab = e.target.closest('.filter-tab');
      if (filterTab) {
        const filter = filterTab.dataset.filter;
        this.setConversationFilter(filter);
      }
    });

    // Recherche de conversations
    const searchInput = document.getElementById('search-conversations');
    searchInput?.addEventListener('input', (e) => {
      this.components.conversationList.setSearchTerm(e.target.value);
    });

    // Événements de l'application
    eventBus.on('conversation:selected', (conversation) => {
      this.selectConversation(conversation);
    });

    eventBus.on('message:sent', (message) => {
      if (message.conversationId === this.currentConversation?.id) {
        this.components.messageList.addMessage(message);
      }
      this.components.conversationList.refresh();
    });

    eventBus.on('message:reply', (messageId) => {
      const message = this.components.messageList.messages.find(m => m.id === messageId);
      if (message) {
        this.components.messageInput.setReplyTo(message);
      }
    });

    eventBus.on('chat:showProfile', (conversation) => {
      this.showProfileModal(conversation);
    });

    eventBus.on('chat:showMenu', (conversation) => {
      this.showChatMenu(conversation);
    });

    // Gestion de la déconnexion
    window.addEventListener('beforeunload', () => {
      if (this.currentUser) {
        userService.updateUserStatus(this.currentUser.id, false);
      }
    });
  }

  async loadConversations() {
    await this.components.conversationList.render();
  }

  async selectConversation(conversation) {
    this.currentConversation = conversation;
    
    // Mettre à jour les composants
    this.components.chatHeader.render(conversation);
    this.components.messageInput.render(conversation);
    
    // Charger les messages
    try {
      const messages = await messageService.getMessages(conversation.id);
      this.components.messageList.render(messages, conversation);
      
      // Marquer les messages comme lus
      const unreadMessages = messages.filter(m => 
        m.senderId !== this.currentUser.id && m.status !== 'read'
      );
      
      if (unreadMessages.length > 0) {
        await messageService.markAsRead(
          unreadMessages.map(m => m.id), 
          conversation.id
        );
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  }

  setConversationFilter(filter) {
    // Mettre à jour l'apparence des onglets
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.remove('text-green-500', 'border-b-2', 'border-green-500', 'font-medium');
      tab.classList.add('text-gray-400', 'hover:text-white');
    });

    const activeTab = document.querySelector(`[data-filter="${filter}"]`);
    if (activeTab) {
      activeTab.classList.remove('text-gray-400', 'hover:text-white');
      activeTab.classList.add('text-green-500', 'border-b-2', 'border-green-500', 'font-medium');
    }

    // Appliquer le filtre
    this.components.conversationList.setFilter(filter);
  }

  async handleAction(action) {
    switch (action) {
      case 'new-chat':
        this.showNewChatModal();
        break;
      case 'settings':
        this.showSettingsModal();
        break;
      case 'profile':
        this.showProfileModal(this.currentUser);
        break;
      case 'archived':
        this.setConversationFilter('archived');
        break;
      case 'logout':
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
          userService.logout();
          location.reload();
        }
        break;
    }
  }

  showNewChatModal() {
    // Implémentation du modal de nouvelle conversation
    console.log('Afficher le modal de nouvelle conversation');
  }

  showSettingsModal() {
    // Implémentation du modal des paramètres
    console.log('Afficher les paramètres');
  }

  showProfileModal(user) {
    // Implémentation du modal de profil
    console.log('Afficher le profil de', user);
  }

  showChatMenu(conversation) {
    // Implémentation du menu de conversation
    console.log('Afficher le menu de conversation', conversation);
  }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
  new WhatsAppApp();
});