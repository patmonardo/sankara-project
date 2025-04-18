import { FormShape } from "../../schema/form";
import { EditContext } from "../mode";
import { EditModePipeline, EditOutput } from "./pipeline";
import { GenerateEditActionsMorph } from "./action";

console.log("=== EDIT ACTIONS MORPHS TESTS ===");

// --- Sample Form Schema ---
const testShape: FormShape = {
  id: "actions-test-form",
  title: "Actions Test Form",
  fields: [
    {
      id: "name",
      type: "text",
      label: "Name"
    },
    {
      id: "email",
      type: "text",
      label: "Email"
    }
  ]
};

// --- Test 1: Default Actions ---
console.log("\n--- TEST 1: Default Actions Generation ---");

const defaultContext: EditContext = {
  id: "default-actions-test",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "user-123",
  data: {
    name: "John Doe",
    email: "john@example.com"
  }
};

try {
  // Get basic edit output
  const editOutput = EditModePipeline.apply(testShape, defaultContext);
  
  // Apply actions morph
  const result = GenerateEditActionsMorph.apply(editOutput, defaultContext);
  
  console.log("\n--- Default Actions Generated ---");
  console.log(`Total actions: ${result.actions?.length ?? 0}`);
  
  // Output actions details
  if (result.actions) {
    result.actions.forEach(action => {
      console.log(`\nAction: ${action.id}`);
      console.log(`Label: ${action.label}`);
      console.log(`Type: ${action.type}`);
      console.log(`Primary: ${action.primary}`);
      console.log(`Disabled: ${action.disabled}`);
      console.log(`Position: ${action.position}`);
    });
  }
  
  // Check specific actions
  console.log("\n--- Action Availability ---");
  console.log(`Has Submit: ${result.actions?.some(a => a.id === "submit")}`);
  console.log(`Has Cancel: ${result.actions?.some(a => a.id === "cancel")}`);
  console.log(`Has Reset: ${result.actions?.some(a => a.id === "reset")}`);
  console.log(`Has Delete: ${result.actions?.some(a => a.id === "delete") === false}`); // Should not exist by default
  
} catch (error) {
  console.error("\n--- Error in Default Actions Test ---");
  console.error(error);
}

// --- Test 2: Changed Form State ---
console.log("\n\n--- TEST 2: Form with Changes ---");

try {
  // Get basic edit output
  const editOutput = EditModePipeline.apply(testShape, defaultContext);
  
  // Add changed fields to meta
  const withChanges = {
    ...editOutput,
    meta: {
      ...(editOutput.meta || {}),
      mode: "edit" as const,
      timestamp: new Date().toISOString(),
      edit: {
        ...(editOutput.meta?.edit || {}),
        trackChanges: true,
        changedFields: ["name"] // Name has changed
      }
    }
  } as EditOutput;
  
  // Apply actions morph
  const result = GenerateEditActionsMorph.apply(withChanges, defaultContext);
  
  console.log("\n--- Actions with Form Changes ---");
  const submitAction = result.actions?.find(a => a.id === "submit");
  const resetAction = result.actions?.find(a => a.id === "reset");
  
  console.log(`Submit action disabled: ${submitAction?.disabled === false}`); 
  console.log(`Reset action disabled: ${resetAction?.disabled === false}`);
  
} catch (error) {
  console.error("\n--- Error in Changed Form Test ---");
  console.error(error);
}

// --- Test 3: Custom Labels and Positions ---
console.log("\n\n--- TEST 3: Custom Actions Configuration ---");

const customContext: EditContext = {
  id: "custom-actions-test",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "user-456",
  data: {},
  saveLabel: "Update Profile",
  cancelLabel: "Go Back",
  deleteLabel: "Remove Account",
  buttonPosition: "top",
  showDelete: true
};

try {
  // Get basic edit output
  const editOutput = EditModePipeline.apply(testShape, customContext);
  
  // Apply actions morph
  const result = GenerateEditActionsMorph.apply(editOutput, customContext);
  
  console.log("\n--- Custom Action Configuration ---");
  
  // Find specific actions
  const submitAction = result.actions?.find(a => a.id === "submit");
  const cancelAction = result.actions?.find(a => a.id === "cancel");
  const deleteAction = result.actions?.find(a => a.id === "delete");
  
  console.log(`Submit label: "${submitAction?.label}"`);
  console.log(`Cancel label: "${cancelAction?.label}"`);
  console.log(`Delete label: "${deleteAction?.label}"`);
  console.log(`Button position: ${submitAction?.position}`);
  console.log(`Delete action included: ${deleteAction !== undefined}`);
  
} catch (error) {
  console.error("\n--- Error in Custom Configuration Test ---");
  console.error(error);
}

// --- Test 4: Disable Options ---
console.log("\n\n--- TEST 4: Disabled Action Options ---");

const disableOptionsContext: EditContext = {
  id: "disable-options-test",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "user-789",
  data: {},
  showReset: false,
  showCancel: false,
  disableSaveIfUnchanged: false
};

try {
  // Get basic edit output
  const editOutput = EditModePipeline.apply(testShape, disableOptionsContext);
  
  // Apply actions morph
  const result = GenerateEditActionsMorph.apply(editOutput, disableOptionsContext);
  
  console.log("\n--- Disabled Options Results ---");
  
  // Check existence of Reset and Cancel
  console.log(`Reset action removed: ${result.actions?.some(a => a.id === "reset") === false}`);
  console.log(`Cancel action removed: ${result.actions?.some(a => a.id === "cancel") === false}`);
  
  // Check Submit is enabled even without changes
  const submitAction = result.actions?.find(a => a.id === "submit");
  console.log(`Submit always enabled: ${submitAction?.disabled === false}`);
  
  // Check total number of actions
  console.log(`Total actions: ${result.actions?.length ?? 0}`); // Should be just 1
  
} catch (error) {
  console.error("\n--- Error in Disabled Options Test ---");
  console.error(error);
}

// --- Test 5: No Changes Behavior ---
console.log("\n\n--- TEST 5: No Changes Behavior ---");

try {
  // Get basic edit output
  const editOutput = EditModePipeline.apply(testShape, defaultContext);
  
  // Explicitly set empty changedFields
  const withNoChanges = {
    ...editOutput,
    meta: {
      ...(editOutput.meta || {}),
      mode: "edit" as const,
      timestamp: new Date().toISOString(),
      edit: {
        ...(editOutput.meta?.edit || {}),
        trackChanges: true,
        changedFields: [] // Empty array = no changes
      }
    }
  } as EditOutput;
  
  // Apply actions morph
  const result = GenerateEditActionsMorph.apply(withNoChanges, defaultContext);
  
  console.log("\n--- Actions with No Form Changes ---");
  const submitAction = result.actions?.find(a => a.id === "submit");
  const resetAction = result.actions?.find(a => a.id === "reset");
  
  console.log(`Submit action disabled: ${submitAction?.disabled === true}`); 
  console.log(`Reset action disabled: ${resetAction?.disabled === true}`);
  
} catch (error) {
  console.error("\n--- Error in No Changes Test ---");
  console.error(error);
}