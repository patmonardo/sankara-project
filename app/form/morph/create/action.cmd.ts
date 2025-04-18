import { FormAction } from "../../schema/form"; // Import FormAction and FormMessage
import { CreateContext, isCreateContext } from "../mode";
import { CreateOutput, CreateField } from "./pipeline"; // Import CreateField too
import { GenerateCreateActionsMorph } from "./actions";

// --- 1. Minimal Sample Input (Complete CreateOutput shape) ---
// Ensure all required properties of CreateOutput are present
const sampleBaseOutput: CreateOutput = {
  // Properties inherited/required from FormShape (via Omit)
  id: "actionTestForm",
  // name?: string; // Optional
  // description?: string; // Optional
  // layout?: FormLayout; // Optional, but added {} below

  // Properties specific to CreateOutput
  fields: [] as CreateField[], // Use the specialized CreateField type, cast needed if empty
  mode: "create",
  isNew: true, // Required
  valid: false, // Required - provide a default boolean
  complete: false, // Required - provide a default boolean

  // Optional properties from CreateOutput (can be omitted if truly optional)
  // submitButton?: { label: string; position: 'top' | 'bottom' | 'both'; };
  // cancelButton?: { label: string; position: 'top' | 'bottom' | 'both'; };
  // clearOnSubmit?: boolean;

  // Required meta property from CreateOutput
  meta: {
    // Base meta properties (if any defined on FormShape['meta'])
    // ...

    // CreateOutput specific meta properties
    mode: "create",
    timestamp: new Date().toISOString(), // Required
    fieldsInitialized: [], // Required
    // title?: string; // Optional
  },

  // Ensure optional properties from base FormShape are handled if needed
  layout: {}, // Provide empty object if layout is optional but used
};

// ... rest of the file ...
// --- 2. Define Various Create Contexts ---

// Context with default settings
const defaultContext: CreateContext = {
  id: "defaultActionContext",
  name: "Default Actions",
  timestamp: Date.now(),
  mode: "create",
  // No action-specific overrides
};

// Context with custom labels
const customLabelsContext: CreateContext = {
  id: "customLabelsContext",
  name: "Custom Labels",
  timestamp: Date.now(),
  mode: "create",
  submitLabel: "Save Item",
  cancelLabel: "Discard Changes",
};

// Context hiding the Cancel button
const noCancelContext: CreateContext = {
  id: "noCancelContext",
  name: "No Cancel Button",
  timestamp: Date.now(),
  mode: "create",
  showCancel: false,
};

// Context hiding the Reset button (assuming showReset exists)
const noResetContext: CreateContext = {
  id: "noResetContext",
  name: "No Reset Button",
  timestamp: Date.now(),
  mode: "create",
  showReset: false, // Add this if your context supports it
};

// Context with buttons at the top
const topPositionContext: CreateContext = {
  id: "topPositionContext",
  name: "Top Button Position",
  timestamp: Date.now(),
  mode: "create",
  buttonPosition: "top",
};

// --- 3. Execute the Action Generation Morph for Each Context ---

console.log("======================================");
console.log("=== TEST 1: Default Actions ===");
console.log("======================================");
try {
  const resultDefault = GenerateCreateActionsMorph.apply(
    sampleBaseOutput,
    defaultContext
  );

  console.log("\nOutput Actions:");
  console.log(JSON.stringify(resultDefault.actions, null, 2));

  // Validation Checks
  console.log("\n--- Validation Checks ---");
  const actionsDefault: FormAction[] = resultDefault.actions || []; // Explicitly type actions array

  console.log(
    `Correct number of actions (Submit, Cancel, Reset): ${
      actionsDefault.length === 3 // Assuming Reset is default
    }`
  );

  console.log(
    `Submit label is default 'Create': ${
      actionsDefault.find((action: FormAction) => action.id === "submit")?.label === "Create" // Explicitly type 'action'
    }`
  );

  console.log(
    `Cancel button shown: ${
      actionsDefault.some((action: FormAction) => action.id === "cancel") // Explicitly type 'action'
    }`
  );

  console.log(
    `Reset button shown: ${
      actionsDefault.some((action: FormAction) => action.id === "reset") // Explicitly type 'action', assuming Reset is default
    }`
  );

  console.log(
    `Button position is default 'bottom': ${
      actionsDefault.every((action: FormAction) => action.position === "bottom") // Explicitly type 'action'
    }`
  );

} catch (error) {
  console.error("\n--- Error during Default Actions Test ---", error);
}


console.log("\n\n======================================");
console.log("=== TEST 2: Custom Labels ===");
console.log("======================================");
try {
  const resultCustomLabels = GenerateCreateActionsMorph.apply(
    sampleBaseOutput,
    customLabelsContext
  );

  console.log("\nOutput Actions:");
  console.log(JSON.stringify(resultCustomLabels.actions, null, 2));

  // Validation Checks
  console.log("\n--- Validation Checks ---");
  const actionsCustom: FormAction[] = resultCustomLabels.actions || []; // Explicitly type actions array

  console.log(
    `Submit label is 'Save Item': ${
      actionsCustom.find((action: FormAction) => action.id === "submit")?.label === "Save Item" // Explicitly type 'action'
    }`
  );

  console.log(
    `Cancel label is 'Discard Changes': ${
      actionsCustom.find((action: FormAction) => action.id === "cancel")?.label === "Discard Changes" // Explicitly type 'action'
    }`
  );

} catch (error) {
  console.error("\n--- Error during Custom Labels Test ---", error);
}


console.log("\n\n======================================");
console.log("=== TEST 3: No Cancel Button ===");
console.log("======================================");
try {
  const resultNoCancel = GenerateCreateActionsMorph.apply(
    sampleBaseOutput,
    noCancelContext
  );

  console.log("\nOutput Actions:");
  console.log(JSON.stringify(resultNoCancel.actions, null, 2));

  // Validation Checks
  console.log("\n--- Validation Checks ---");
  const actionsNoCancel: FormAction[] = resultNoCancel.actions || []; // Explicitly type actions array

  console.log(
    `Correct number of actions (Submit, Reset): ${
      actionsNoCancel.length === 2 // Assuming Reset is default
    }`
  );

  console.log(
    `Cancel button hidden: ${
      !actionsNoCancel.some((action: FormAction) => action.id === "cancel") // Explicitly type 'action'
    }`
  );

} catch (error) {
  console.error("\n--- Error during No Cancel Test ---", error);
}


console.log("\n\n======================================");
console.log("=== TEST 4: No Reset Button ==="); // Assuming showReset exists
console.log("======================================");
try {
  const resultNoReset = GenerateCreateActionsMorph.apply(
    sampleBaseOutput,
    noResetContext
  );

  console.log("\nOutput Actions:");
  console.log(JSON.stringify(resultNoReset.actions, null, 2));

  // Validation Checks
  console.log("\n--- Validation Checks ---");
  const actionsNoReset: FormAction[] = resultNoReset.actions || []; // Explicitly type actions array

  console.log(
    `Correct number of actions (Submit, Cancel): ${
      actionsNoReset.length === 2
    }`
  );

  console.log(
    `Reset button hidden: ${
      !actionsNoReset.some((action: FormAction) => action.id === "reset") // Explicitly type 'action'
    }`
  );

} catch (error) {
  console.error("\n--- Error during No Reset Test ---", error);
}


console.log("\n\n======================================");
console.log("=== TEST 5: Top Button Position ===");
console.log("======================================");
try {
  const resultTopPosition = GenerateCreateActionsMorph.apply(
    sampleBaseOutput,
    topPositionContext
  );

  console.log("\nOutput Actions:");
  console.log(JSON.stringify(resultTopPosition.actions, null, 2));

  // Validation Checks
  console.log("\n--- Validation Checks ---");
  const actionsTop: FormAction[] = resultTopPosition.actions || []; // Explicitly type actions array

  console.log(
    `Button position is 'top': ${
      actionsTop.every((action: FormAction) => action.position === "top") // Explicitly type 'action'
    }`
  );

} catch (error) {
  console.error("\n--- Error during Top Position Test ---", error);
}

// --- 4. Final Message ---
console.log("\n\n======================================");
console.log("=== All Action Tests Complete ===");
console.log("======================================");
console.log(
  "Verify the generated actions match the expected configurations based on the context."
);
