
import { GoogleGenAI, Type } from "@google/genai";
import { BalancedReactionResponse, MolecularGeometry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const balanceReaction = async (reactionString: string): Promise<BalancedReactionResponse> => {
  const model = "gemini-3-flash-preview";

  const prompt = `ChemLab AI: Process reactants "${reactionString}".
  1. Balance the equation.
  2. Classify reaction.
  3. For EVERY product, provide: 
     - Scientific name and formula.
     - Common name if available (e.g., "Baking Soda", "Table Salt", "Quicklime").
     - Physical properties (Melting, Boiling, Density, Solubility).
     - Atomic insights (Bonding type, MW, Geometry name).
     - Brief historical/industrial significance.
  4. Provide Enthalpy (ΔH) in kJ/mol.
  Return valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            balancedEquation: { type: Type.STRING },
            product: { type: Type.STRING },
            reactionType: { type: Type.STRING },
            explanation: { type: Type.STRING },
            elementCounts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING },
                  before: { type: Type.NUMBER },
                  after: { type: Type.NUMBER },
                  isBalanced: { type: Type.BOOLEAN }
                },
                required: ["symbol", "before", "after", "isBalanced"]
              }
            },
            thermodynamics: {
              type: Type.OBJECT,
              properties: {
                enthalpyChange: { type: Type.NUMBER },
                isExothermic: { type: Type.BOOLEAN },
                energyIntensity: { type: Type.NUMBER },
                description: { type: Type.STRING }
              },
              required: ["isExothermic", "energyIntensity", "description"]
            },
            productDetails: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  formula: { type: Type.STRING },
                  name: { type: Type.STRING },
                  commonName: { type: Type.STRING, description: "Common name like 'Table Salt' if applicable" },
                  description: { type: Type.STRING },
                  physicalProperties: {
                    type: Type.OBJECT,
                    properties: {
                      meltingPoint: { type: Type.STRING },
                      boilingPoint: { type: Type.STRING },
                      density: { type: Type.STRING },
                      solubility: { type: Type.STRING }
                    }
                  },
                  atomicInsights: {
                    type: Type.OBJECT,
                    properties: {
                      bondingType: { type: Type.STRING },
                      molecularWeight: { type: Type.STRING },
                      geometry: { type: Type.STRING }
                    }
                  },
                  history: { type: Type.STRING }
                },
                required: ["formula", "name", "description", "physicalProperties", "atomicInsights", "history"]
              }
            },
            error: { type: Type.STRING }
          },
          required: ["balancedEquation", "product", "reactionType", "elementCounts", "thermodynamics", "productDetails"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Reaction Sync Error:", error);
    return { balancedEquation: "", product: "", reactionType: "", elementCounts: [], error: "Sync Failure" };
  }
};

export const getMolecularGeometry = async (query: string): Promise<MolecularGeometry | null> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Return 3D molecular geometry for "${query}". 
  Provide accurate VSEPR-based coordinates. 
  Ensure atoms are clearly spaced (coords between -3 and 3). 
  Include all chemical bonds.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            formula: { type: Type.STRING },
            description: { type: Type.STRING },
            atoms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  z: { type: Type.NUMBER }
                }
              }
            },
            bonds: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
              }
            }
          },
          required: ["name", "formula", "atoms", "bonds"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Geometry Sync Error:", error);
    return null;
  }
};
