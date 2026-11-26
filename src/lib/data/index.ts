'use client';

import { localAdapter } from './local';
import { supabaseAdapter } from './supabase';
import type { DataAdapter } from './types';

const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Ohne Supabase-Umgebungsvariablen läuft die Demo vollständig im Browser. */
export const data: DataAdapter = hasSupabase ? supabaseAdapter : localAdapter;
export * from './types';
