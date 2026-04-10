import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
    // Provide a hollow mock so the app doesn't immediately crash if keys aren't added yet
    supabase = {
        auth: {
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Not connected') }),
            signUp: () => Promise.resolve({ data: null, error: new Error('Not connected') }),
            signOut: () => Promise.resolve({ error: null }),
        },
        from: () => ({
            select: () => Promise.resolve({ data: [], error: null }),
            insert: () => Promise.resolve({ data: null, error: null }),
        })
    };
}

export { supabase };
