// Main exports for MatrixMode

// Core components
export { MatrixActionBridgeMorph } from '../../../../../core/bridge/action-bridge';
export { 
  MatrixBridgeProvider, 
  useMatrixBridge, 
  MatrixActionButton,
  MatrixForm 
} from '../../../../../core/bridge/bridge-client';

// Integrations
export { NextMatrixAdapterMorph } from './integrations/next-adapter';

// Create a complete pipeline for MatrixMode
import { createPipeline } from "../pipeline";
import { EditOutput } from "../edit/base";
import { MatrixActionBridgeMorph } from '../../../../../core/bridge/action-bridge';
import { NextMatrixAdapterMorph } from './integrations/next-adapter';

/**
 * Complete MatrixMode pipeline with Next.js integration
 */
export const MatrixModePipeline = createPipeline<EditOutput, EditOutput>(
  "MatrixModePipeline")
  .pipe(MatrixActionBridgeMorph)
  .pipe(NextMatrixAdapterMorph)
  .build({
    description: "Enable MatrixMode with Next.js integration",
    category: "matrix",
    tags: ["matrix", "distributed", "events", "actions", "next"],
    inputType: "EditOutput",
    outputType: "EditOutput"
  });