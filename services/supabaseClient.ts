import { createClient } from '@supabase/supabase-js';
import { getAppConfig } from './configService';
import { ForumPost, HistoryLog } from '../types';

const LOCAL_HISTORY_KEY = 'kavach_local_history';
const LOCAL_THREATS_KEY = 'kavach_local_threats';

export const getSupabase = () => {
  const { supabaseUrl, supabaseKey } = getAppConfig();
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
};

export const saveToHistory = async (type: string, value: string, summary: string, data: any) => {
  const supabase = getSupabase();

  // 1. Fallback: Local Storage (if no DB)
  if (!supabase) {
      try {
        const newLog: HistoryLog = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            query_type: type as any,
            query_value: value,
            summary: summary,
            full_data: data
        };
        const existing = localStorage.getItem(LOCAL_HISTORY_KEY);
        const logs = existing ? JSON.parse(existing) : [];
        const updatedLogs = [newLog, ...logs].slice(0, 50); // Keep last 50
        localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updatedLogs));
      } catch (e) {
        console.error("Local History Save Error:", e);
      }
      return;
  }

  // 2. Database: Supabase
  try {
    const { error } = await supabase.from('history_logs').insert([
      {
        query_type: type,
        query_value: value,
        summary: summary,
        full_data: data
      }
    ]);
    if (error) console.error("Supabase Insert Error (History):", error);
  } catch (error) {
    console.error("Supabase Save Error:", error);
  }
};

export const saveThreat = async (post: ForumPost) => {
  const supabase = getSupabase();

  // 1. Fallback: Local Storage
  if (!supabase) {
      try {
         const existing = localStorage.getItem(LOCAL_THREATS_KEY);
         let threats = existing ? JSON.parse(existing) : [];
         
         // Upsert logic for local storage
         const index = threats.findIndex((t: any) => t.id === post.id);
         if (index >= 0) {
             threats[index] = post;
         } else {
             threats.push(post);
         }
         
         localStorage.setItem(LOCAL_THREATS_KEY, JSON.stringify(threats));
      } catch(e) {
          console.error("Local Threat Save Error:", e);
      }
      return;
  }

  // 2. Database: Supabase
  try {
      // Upsert based on source_id to prevent duplicates
      const { error } = await supabase.from('threat_events').upsert({
          source_id: post.id,
          source: post.source,
          author: post.author,
          content: post.content,
          severity: post.severity,
          sector: post.sector,
          type: post.type,
          posted_at: post.timestamp,
          keywords: post.keywords,
          credibility_score: post.credibilityScore,
          is_analyzed: post.isAnalyzed,
          analysis_summary: post.analysisSummary,
          raw_data: post
      }, { onConflict: 'source_id' });

      if (error) console.error("Supabase Insert Error (Threat):", error);
  } catch (error) {
      console.error("Supabase Threat Save Error:", error);
  }
};

export const fetchHistory = async () => {
  const supabase = getSupabase();

  // 1. Fallback: Local Storage
  if (!supabase) {
      try {
        const existing = localStorage.getItem(LOCAL_HISTORY_KEY);
        return existing ? JSON.parse(existing) : [];
      } catch (e) {
        return [];
      }
  }

  // 2. Database: Supabase
  try {
    const { data, error } = await supabase
      .from('history_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Supabase Fetch Error:", error);
    // On API error, try to fall back to local as a failsafe
    try {
        const existing = localStorage.getItem(LOCAL_HISTORY_KEY);
        return existing ? JSON.parse(existing) : [];
    } catch(e) { return []; }
  }
};