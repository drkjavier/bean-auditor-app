/**
 * Farm Domain - Barrel export
 */

export type { Farm, CreateFarm, UpdateFarm } from './Farm';
export type {
  PatternType,
  PatternConfig,
  PlantPosition,
  PatternMetrics,
  PatternVisualization,
} from './plantingPattern';
export {
  calculatePattern,
  computeFieldLayout,
  generateHectarePositions,
  getPatternLabel,
  getPatternDescription,
} from './plantingPattern';
export type { TagGenerationParams, GenerationResult, GeneratedTag } from './tagGenerator';
export { generateTags, generateStandardPlantation } from './tagGenerator';
