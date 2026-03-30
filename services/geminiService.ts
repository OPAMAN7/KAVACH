
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult, ThreatSeverity, ThreatSector, OrganizationIntel } from "../types";

const processEnvApiKey = process.env.API_KEY;

export const getOrganizationIntel = async (domain: string): Promise<OrganizationIntel | null> => {
  if (!processEnvApiKey) {
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: processEnvApiKey });

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      website: { type: Type.STRING },
      mainPerson: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          title: { type: Type.STRING },
          linkedin: { type: Type.STRING },
          website: { type: Type.STRING },
        },
        required: ["name", "title"],
      },
      authorities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            title: { type: Type.STRING },
            linkedin: { type: Type.STRING },
            website: { type: Type.STRING },
          },
          required: ["name", "title"],
        },
      },
      employees: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            title: { type: Type.STRING },
            email: { type: Type.STRING },
          },
          required: ["name", "title", "email"],
        },
      },
      linkedin: { type: Type.STRING },
      description: { type: Type.STRING },
    },
    required: ["name", "website", "mainPerson", "authorities", "employees"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for detailed organizational intelligence for the domain: ${domain}
      
      Find:
      1. Official Organization Name.
      2. Official Website.
      3. Main Person in Charge (CEO, Principal, Director, etc.) with their LinkedIn and personal website/portfolio if available.
      4. Other key authorities or leadership members with their LinkedIn and website if available.
      5. A few notable employees or departments.
      6. Official LinkedIn page for the organization.
      7. Brief description of the organization.
      
      Use Google Search to find the most accurate and up-to-date information.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as OrganizationIntel;
  } catch (error) {
    console.error("Organization Intel Error:", error);
    return null;
  }
};

export const analyzeThreatContent = async (content: string): Promise<AIAnalysisResult> => {
  if (!processEnvApiKey) {
    throw new Error("Gemini API Key is missing. Please configure it in Settings.");
  }

  const ai = new GoogleGenAI({ apiKey: processEnvApiKey });

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      severity: { type: Type.STRING, enum: Object.values(ThreatSeverity) },
      sector: { type: Type.STRING, enum: Object.values(ThreatSector) },
      keywords: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "General topic tags (e.g., 'Ransomware', 'DarkWeb', 'SQL Injection')" 
      },
      entities: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Specific Indicators of Compromise (IOCs) such as IP addresses, Domains, Malware Names, Threat Actor Groups, or CVE IDs." 
      },
      summary: { type: Type.STRING },
      credibilityScore: { type: Type.INTEGER, description: "Score from 0 to 100 based on technical depth and source reliability." },
      isThreat: { type: Type.BOOLEAN },
    },
    required: ["severity", "sector", "keywords", "entities", "summary", "credibilityScore", "isThreat"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert Cyber Threat Intelligence Analyst for KAVACH (Indian Defense System). 
      Analyze the following web forum post.
      
      Tasks:
      1. Classify the SEVERITY and target SECTOR.
      2. Extract general KEYWORDS (topics).
      3. Extract specific ENTITIES/IOCs (Malware names, IP addresses, Domains, CVEs, Actor names like 'Lazarus').
      4. Provide a tactical SUMMARY.
      5. Rate credibility (0-100) based on specificity.
      
      Post Content: "${content}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    
    const result = JSON.parse(text) as AIAnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback for demo purposes if API fails
    return {
      severity: ThreatSeverity.LOW,
      sector: ThreatSector.TRANSPORT,
      keywords: ["error", "fallback"],
      entities: [],
      summary: "Analysis failed due to API error. Please check console.",
      credibilityScore: 0,
      isThreat: false
    };
  }
};

export const searchSocialMedia = async (username: string, email: string): Promise<any> => {
  if (!processEnvApiKey) {
    throw new Error("API Key is missing for Social Media Search.");
  }

  const ai = new GoogleGenAI({ apiKey: processEnvApiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a comprehensive Maigret-style Social Media OSINT search for:
      Target Username: ${username}
      Associated Email: ${email || "Not provided"}
      
      Tasks:
      1. Check for profile existence and activity on 500+ platforms including LinkedIn, Twitter/X, GitHub, Instagram, Facebook, Reddit, Pinterest, Snapchat, TikTok, Telegram, Discord, and niche forums.
      2. Identify associated accounts, aliases, and potential real-world identities.
      3. Extract public intelligence: bio information, location mentions, linked websites, and recent activity patterns.
      4. Look for mentions of this username in data leaks, paste sites (Pastebin, Ghostbin), and underground forums.
      5. Provide a structured intelligence report with direct links to found profiles.
      
      Format the output as a professional tactical intelligence report for a cybersecurity operator. Include a 'Confidence Score' for each found profile.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  } catch (error) {
    console.error("Social Media Search Error:", error);
    throw error;
  }
};
