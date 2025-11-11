// Supabase Authentication Client
class SupabaseAuth {
    constructor() {
        this.supabaseUrl = null;
        this.supabaseAnonKey = null;
        this.supabase = null;
        this.currentUser = null;
        this.authListeners = [];
        
        // Initialize Supabase client when config is available
        this.initializeSupabase();
    }

    async initializeSupabase() {
        try {
            // Fetch Supabase config from server
            const response = await fetch('/api/auth/config');
            if (response.ok) {
                const config = await response.json();
                this.supabaseUrl = config.supabaseUrl;
                this.supabaseAnonKey = config.supabaseAnonKey;
                
                if (this.supabaseUrl && this.supabaseAnonKey && window.supabase) {
                    // Initialize Supabase client
                    this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseAnonKey);
                    
                    // Set up auth state listener
                    this.supabase.auth.onAuthStateChange((event, session) => {
                        this.currentUser = session?.user || null;
                        this.notifyAuthListeners(this.currentUser);
                        
                        // Store token for API calls
                        if (session?.access_token) {
                            localStorage.setItem('supabase_token', session.access_token);
                        } else {
                            localStorage.removeItem('supabase_token');
                        }
                    });
                    
                    // Check current session
                    const { data: { session } } = await this.supabase.auth.getSession();
                    this.currentUser = session?.user || null;
                    
                    if (session?.access_token) {
                        localStorage.setItem('supabase_token', session.access_token);
                    }
                }
            }
        } catch (error) {
            console.warn('Supabase initialization skipped:', error.message);
            // Continue without Supabase - will use ownerId fallback
        }
    }

    // Register auth state change listener
    onAuthChange(callback) {
        this.authListeners.push(callback);
        // Immediately call with current state
        callback(this.currentUser);
    }

    // Notify all listeners of auth state change
    notifyAuthListeners(user) {
        this.authListeners.forEach(callback => callback(user));
    }

    // Get current user
    getUser() {
        return this.currentUser;
    }

    // Get auth token for API calls
    getAuthToken() {
        return localStorage.getItem('supabase_token');
    }

    // Sign in with email and password
    async signIn(email, password) {
        if (!this.supabase) {
            throw new Error('Authentication service not available');
        }
        
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        return data;
    }

    // Sign up with email and password
    async signUp(email, password, metadata = {}) {
        if (!this.supabase) {
            throw new Error('Authentication service not available');
        }
        
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        
        if (error) throw error;
        return data;
    }

    // Sign out
    async signOut() {
        if (this.supabase) {
            await this.supabase.auth.signOut();
        }
        localStorage.removeItem('supabase_token');
        this.currentUser = null;
        this.notifyAuthListeners(null);
    }

    // Get headers for authenticated API calls
    // NOTE: Auth temporarily disabled - using browser-based client ID
    getAuthHeaders() {
        const clientId = this.getOrCreateClientId();
        return {
            'X-Client-Id': clientId
        };
    }
    
    // Get or create unique browser-based client ID
    getOrCreateClientId() {
        let clientId = localStorage.getItem('compli_client_id');
        if (!clientId) {
            // Generate unique ID for this browser
            clientId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            localStorage.setItem('compli_client_id', clientId);
        }
        return clientId;
    }

    // Backwards compatibility: Get or create ownerId
    getOrCreateOwnerId() {
        let ownerId = localStorage.getItem('ybg_owner_id');
        if (!ownerId) {
            // Generate unique ID
            ownerId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            localStorage.setItem('ybg_owner_id', ownerId);
        }
        return ownerId;
    }
}

// Create global auth instance
window.supabaseAuth = new SupabaseAuth();