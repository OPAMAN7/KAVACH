import { AppConfig } from "../types";

const STORAGE_KEY = 'kavach_config';

export const getAppConfig = (): AppConfig => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const config = stored ? JSON.parse(stored) : {};
  
  return {
    supabaseUrl: config.supabaseUrl || process.env.SUPABASE_URL || '',
    supabaseKey: config.supabaseKey || process.env.SUPABASE_KEY || '',
    hunterApiKey: config.hunterApiKey || process.env.HUNTER_API_KEY || '90320b9abb0db509f3753c9fda0d88724a82693e', 
    hibpApiKey: config.hibpApiKey || process.env.HIBP_API_KEY || '',
    vtApiKey: config.vtApiKey || process.env.VT_API_KEY || '76edcd830ae4b41063c46a6cf18346937b09a8f18a4403c079d56efa1dc2392c',
    parseHubApiKey: config.parseHubApiKey || process.env.PARSEHUB_API_KEY || 'tP4BTpUuEZu_',
  };
};

export const saveAppConfig = (config: AppConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};