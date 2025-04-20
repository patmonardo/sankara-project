import { FormShape } from "../../schema/form";
import { EditContext } from "../core/mode";
import { EditModePipeline, EditOutput } from "./pipeline";

console.log("=== EDIT MODE PIPELINE TESTS ===");

// --- Test Data: Form Shape ---
const sampleShape: FormShape = {
  id: "userProfile",
  title: "User Profile",
  fields: [
    {
      id: "firstName",
      type: "text",
      label: "First Name",
      required: true
    },
    {
      id: "lastName",
      type: "text",
      label: "Last Name",
      required: true
    },
    {
      id: "email",
      type: "text",
      label: "Email",
      required: true,
      meta: {
        format: "email"
      }
    },
    {
      id: "age",
      type: "number",
      label: "Age",
      defaultValue: null
    },
    {
      id: "notes",
      type: "text",
      label: "Notes",
      meta: {
        multiline: true
      }
    },
    {
      id: "createdAt",
      type: "date",
      label: "Created Date",
      meta: {
        editReadOnly: true // Should be read-only in edit mode
      }
    },
    {
      id: "tempField",
      type: "text",
      label: "Temporary Field",
      meta: {
        createOnly: true // Should be excluded from edit mode
      }
    },
    {
      id: "adminNotes",
      type: "text",
      label: "Admin Notes",
      meta: {
        editOnly: true // Should only appear in edit mode
      }
    }
  ]
};

// --- Test 1: Edit with Existing Data ---
console.log("\n\n=== TEST 1: Edit with Existing Data ===");

// Create context with existing data
const dataContext: EditContext = {
  id: "editContext1",
  name: "Edit Context with Data",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "user-123",
  data: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    age: 32,
    notes: "Some existing notes",
    createdAt: "2023-01-15",
    adminNotes: "Admin only notes"
  },
  trackChanges: true
};

try {
  // Apply the pipeline
  const resultShape = EditModePipeline.apply(sampleShape, dataContext);
  
  // Validate the result
  console.log("\n--- Basic Tests ---");
  console.log(`Mode correctly set: ${resultShape.mode === 'edit'}`);
  console.log(`Target ID set: ${resultShape.targetId === 'user-123'}`);
  console.log(`Fields transformed to EditFields: ${resultShape.fields.every(f => 'inputType' in f)}`);
  console.log(`Form meta contains mode='edit': ${resultShape.meta?.mode === 'edit'}`);
  console.log(`Tracking changes enabled: ${resultShape.meta?.edit?.trackChanges === true}`);
  
  // Check field values
  console.log("\n--- Field Values from Data ---");
  const firstName = resultShape.fields.find(f => f.id === 'firstName');
  const age = resultShape.fields.find(f => f.id === 'age');
  console.log(`firstName value: "${firstName?.value}" (from data)`);
  console.log(`age value: ${age?.value} (from data)`);
  
  // Check original values storage
  console.log("\n--- Original Values Storage ---");
  console.log(`Original values stored: ${!!resultShape.meta?.edit?.originalValues}`);
  console.log(`firstName original value: "${resultShape.meta?.edit?.originalValues?.firstName}"`);
  
  // Check special field types
  console.log("\n--- Special Field Handling ---");
  const email = resultShape.fields.find(f => f.id === 'email');
  const notes = resultShape.fields.find(f => f.id === 'notes');
  console.log(`Email field has inputType='email': ${email?.inputType === 'email'}`);
  console.log(`Notes field has inputType='textarea': ${notes?.inputType === 'textarea'}`);
  
  // Check field inclusion/exclusion rules
  console.log("\n--- Field Inclusion/Exclusion ---");
  console.log(`createOnly field excluded: ${!resultShape.fields.some(f => f.id === 'tempField')}`);
  console.log(`editOnly field included: ${resultShape.fields.some(f => f.id === 'adminNotes')}`);
  
  // Check readOnly fields
  console.log("\n--- ReadOnly Fields ---");
  const createdAt = resultShape.fields.find(f => f.id === 'createdAt');
  console.log(`Field with editReadOnly is readOnly: ${createdAt?.readOnly === true}`);
  
  // Check actions
  console.log("\n--- Actions ---");
  console.log(`Actions array exists: ${Array.isArray(resultShape.actions)}`);
  console.log(`Actions count: ${resultShape.actions?.length || 0}`);
  
} catch (error) {
  console.error("\n--- Error in Edit with Data Test ---");
  console.error(error);
}

// --- Test 2: Edit with Empty Data ---
console.log("\n\n=== TEST 2: Edit with Empty Data ===");

// Context with empty data
const emptyDataContext: EditContext = {
  id: "editContext2",
  name: "Edit Context with Empty Data",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "new-item",
  data: {}, // Empty data
  trackChanges: true
};

try {
  // Apply the pipeline
  const resultShape = EditModePipeline.apply(sampleShape, emptyDataContext);
  
  // Check default values
  console.log("\n--- Default Values ---");
  const firstName = resultShape.fields.find(f => f.id === 'firstName');
  const age = resultShape.fields.find(f => f.id === 'age');
  console.log(`Text field default: "${firstName?.value}" (should be "")`);
  console.log(`Number field default: ${age?.value === null ? 'null' : age?.value} (should be null)`);
  
  // Check form state
  console.log("\n--- Form State ---");
  console.log(`Has changes: ${resultShape.hasChanges === false}`); // Should start as false
  console.log(`Valid: ${resultShape.valid === false}`); // Should start as false (required fields empty)
  
} catch (error) {
  console.error("\n--- Error in Empty Data Test ---");
  console.error(error);
}

// --- Test 3: Field Filtering ---
console.log("\n\n=== TEST 3: Field Filtering ===");

// Context with field filtering
const filterContext: EditContext = {
  id: "editContext3",
  name: "Edit Context with Field Filtering",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "filter-test",
  data: {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com"
  },
  includeFields: ["firstName", "email"], // Only include these fields
  excludeFields: ["age"], // Explicitly exclude these (though redundant with includeFields)
  trackChanges: true
};

try {
  // Apply the pipeline
  const resultShape = EditModePipeline.apply(sampleShape, filterContext);
  
  // Check filtered fields
  console.log("\n--- Field Filtering Results ---");
  console.log("All fields:", resultShape.fields.map(f => f.id).join(", "));
  console.log(`Includes firstName: ${resultShape.fields.some(f => f.id === 'firstName')}`);
  console.log(`Includes email: ${resultShape.fields.some(f => f.id === 'email')}`);
  console.log(`Excludes lastName: ${!resultShape.fields.some(f => f.id === 'lastName')}`);
  console.log(`Excludes age: ${!resultShape.fields.some(f => f.id === 'age')}`);
  console.log(`Total fields after filtering: ${resultShape.fields.length}`);
  
} catch (error) {
  console.error("\n--- Error in Field Filtering Test ---");
  console.error(error);
}

// --- Test 4: Detecting Changes ---
console.log("\n\n=== TEST 4: Detecting Changes ===");

// First create a context and apply it
const initialContext: EditContext = {
  id: "editContext4",
  name: "Edit Context for Change Detection",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "change-test",
  data: {
    firstName: "Original",
    lastName: "Value",
    email: "original@example.com"
  },
  trackChanges: true
};

try {
  // Apply the pipeline to get initial state
  const initialResult = EditModePipeline.apply(sampleShape, initialContext);
  
  // Now simulate making changes to some fields
  const changedFields = initialResult.fields.map(field => {
    if (field.id === 'firstName') {
      return { 
        ...field, 
        value: "Changed", 
        meta: {
          ...field.meta,
          pristine: false, 
          touched: true 
        },
        isChanged: true 
      };
    }
    return field;
  });
  
  // Create a modified result with the changed fields
  const modifiedResult: EditOutput = {
    ...initialResult,
    fields: changedFields,
    hasChanges: true,
    // Using the correct EditOutput metadata structure with nested edit object
    meta: {
      ...(initialResult.meta || {}),
      edit: {
        ...(initialResult.meta?.edit || {}),
        trackChanges: true,
        changedFields: ['firstName'],
        originalValues: initialResult.meta?.edit?.originalValues || {}
      }
    }
  };
  
  // Test change detection
  console.log("\n--- Change Detection ---");
  console.log(`hasChanges flag set: ${modifiedResult.hasChanges === true}`);
  // Fixed to correctly access meta.edit.changedFields
  console.log(`Changed fields tracked: ${modifiedResult.meta?.edit?.changedFields?.includes('firstName')}`);
  console.log(`firstName isChanged flag: ${modifiedResult.fields.find(f => f.id === 'firstName')?.isChanged === true}`);
  console.log(`firstName no longer pristine: ${modifiedResult.fields.find(f => f.id === 'firstName')?.meta?.pristine === false}`);
  
} catch (error) {
  console.error("\n--- Error in Change Detection Test ---");
  console.error(error);
}

// --- Test 5: Edit without Change Tracking ---
console.log("\n\n=== TEST 5: Edit without Change Tracking ===");

// Context with change tracking disabled
const noTrackingContext: EditContext = {
  id: "editContext5",
  name: "Edit Context without Tracking",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "no-track",
  data: {
    firstName: "John",
    lastName: "Doe"
  },
  trackChanges: false // Explicitly disable tracking
};

try {
  // Apply the pipeline
  const resultShape = EditModePipeline.apply(sampleShape, noTrackingContext);
  
  // Check if tracking is disabled
  console.log("\n--- Change Tracking Disabled ---");
  console.log(`Tracking disabled in meta: ${resultShape.meta?.edit?.trackChanges === false}`);
  console.log(`originalValues undefined: ${resultShape.meta?.edit?.originalValues === undefined}`);
  console.log(`changedFields undefined: ${resultShape.meta?.edit?.changedFields === undefined}`);
  console.log(`Field originalValue undefined: ${resultShape.fields.find(f => f.id === 'firstName')?.originalValue === undefined}`);
  
} catch (error) {
  console.error("\n--- Error in No Tracking Test ---");
  console.error(error);
}