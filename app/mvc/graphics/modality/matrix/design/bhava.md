/**
 * ReductioLogic: The abhava-bhava path of Vedic Science/Logic
 * 
 * Implements the Vedic understanding that truth emerges precisely at the
 * point where logic reaches apparent contradiction (abhava).
 */
export interface ReductioLogic {
  // The judicial weighing method
  judicial: {
    weighingMethod: 'dialectical' | 'statistical' | 'analytical' | 'transcendental';
    
    // For statistical weighing (valid but "Maya as abhava")
    statistical?: {
      confidenceLevel: number; // 0-1
      bayesianPrior?: number; // Prior probability if using Bayesian approach
      frequentistPValue?: number; // P-value if using frequentist approach
      mayicNature: true; // Statistical methods always embody Maya
    };
    
    // For dialectical weighing (reveals bhava through abhava)
    dialectical?: {
      thesis: string;
      antithesis: string;
      synthesis: string;
      negationOfNegation: boolean; // Whether double negation has occurred
      copulaRevealed: boolean; // The "Light Revealing" aspect of the copula
    };
  };
  
  // The reductio path
  reductioPath: {
    deadEndReached: boolean; // Whether logic has hit its apparent dead end
    truthRevealed: boolean; // Whether truth has been revealed through the dead end
    abhava: string; // The "not-being" or negative determination
    bhava: string; // The "being" or positive determination that emerges
  };
  
  // The unity of Science and Logic in the Vedic system
  vedicUnity: {
    scienceLogicUnity: boolean; // Recognition that Science and Logic are One
    yogicIntegration: boolean; // Integration with yogic realization
  };
}