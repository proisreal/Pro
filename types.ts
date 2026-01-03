
export interface ElementData {
  name: string;
  mass: number;
  number: number;
  category: string;
  properties?: string;
  position: [number, number];
  isFBlock?: boolean;
  electronConfig?: string;
  oxidationStates?: string;
  meltingPoint?: number;
  boilingPoint?: number;
  density?: number;
  yearDiscovered?: string;
  electronegativity?: number;
  valenceElectrons?: number;
}

export interface CompoundDetails {
  formula: string;
  name: string;
  commonName?: string; // e.g., "Baking Soda"
  description: string;
  physicalProperties: {
    meltingPoint?: string;
    boilingPoint?: string;
    density?: string;
    solubility?: string;
  };
  atomicInsights: {
    bondingType: string;
    molecularWeight: string;
    geometry: string;
  };
  history: string;
}

export interface MolecularGeometry {
  name: string;
  formula: string;
  description: string;
  atoms: {
    symbol: string;
    x: number;
    y: number;
    z: number;
    color?: string;
  }[];
  bonds: [number, number][];
}

export interface ReactionElement {
  symbol: string;
  name: string;
  mass: number;
  before: number;
  after: number;
  isBalanced: boolean;
}

export interface BalancedReactionResponse {
  balancedEquation: string;
  product: string;
  reactionType: string;
  elementCounts: {
    symbol: string;
    before: number;
    after: number;
    isBalanced: boolean;
  }[];
  thermodynamics?: {
    enthalpyChange?: number; // ΔH in kJ/mol
    isExothermic: boolean;
    energyIntensity: number; // 0 to 1 scale for visualization
    description: string;
  };
  productDetails?: CompoundDetails[];
  explanation?: string;
  error?: string;
}

export type ElementCategories = {
  [key: string]: {
    color: string;
    bg: string;
    border: string;
  };
};
