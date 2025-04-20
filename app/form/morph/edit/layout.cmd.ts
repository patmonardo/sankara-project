import { FormShape } from "../../schema/form";
import { EditContext } from "../core/mode";
import { EditModePipeline, EditOutput } from "./pipeline";
import { EditLayoutPipeline, EditSectionLayoutMorph, EditDynamicLayoutMorph } from "./layout";

console.log("=== EDIT LAYOUT MORPHS TESTS ===");

// --- Sample Form Schema with Sections ---
const formWithSections: FormShape = {
  id: "layout-test-form",
  title: "Layout Test Form",
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
      label: "Email Address",
      meta: {
        format: "email",
        sectionHint: "Contact Information"
      }
    },
    {
      id: "phone",
      type: "text",
      label: "Phone Number",
      meta: {
        format: "tel",
        sectionHint: "Contact Information"
      }
    },
    {
      id: "notes",
      type: "text",
      label: "Notes",
      meta: {
        multiline: true,
        sectionHint: "Additional Information"
      }
    }
  ],
  layout: {
    sections: [
      {
        id: "personal",
        title: "Personal Information",
        fields: ["firstName", "lastName"],
        collapsible: true
      },
      {
        id: "contact",
        title: "Contact Information",
        fields: ["email", "phone"],
        collapsible: true
      },
      {
        id: "additional",
        title: "Additional Information",
        fields: ["notes"],
        collapsible: true,
        collapsed: true
      }
    ]
  }
};

// --- Sample Form Schema without Layout ---
const formWithoutLayout: FormShape = {
  id: "no-layout-test-form",
  title: "No Layout Test Form",
  fields: [
    {
      id: "firstName",
      type: "text",
      label: "First Name"
    },
    {
      id: "lastName",
      type: "text",
      label: "Last Name"
    },
    {
      id: "email",
      type: "text",
      label: "Email Address",
      meta: {
        format: "email",
        sectionHint: "Contact Information"
      }
    },
    {
      id: "phone",
      type: "text",
      label: "Phone Number",
      meta: {
        format: "tel",
        sectionHint: "Contact Information"
      }
    },
    {
      id: "notes",
      type: "text",
      label: "Notes",
      meta: {
        multiline: true,
        sectionHint: "Additional Information"
      }
    }
  ]
  // No layout defined - should be auto-generated
};

// --- Test 1: Section Layout with Changed Fields ---
console.log("\n--- TEST 1: EditSectionLayoutMorph with Changed Fields ---");

// Context with changed fields
const changedFieldsContext: EditContext = {
  id: "changed-fields-test",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "user-123",
  data: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com"
  },
  expandChangedSections: true // Explicitly enable expanded changed sections
};

try {
  // Get edit output with change tracking
  const editOutput = EditModePipeline.apply(formWithSections, changedFieldsContext);
  
  // Add changed fields to meta
  const withChanges = {
    ...editOutput,
    meta: {
      ...(editOutput.meta || {}),
      mode: "edit",
      timestamp: new Date().toISOString(),
      edit: {
        ...(editOutput.meta?.edit || {}),
        trackChanges: true,
        changedFields: ["email", "notes"] // Changed fields in different sections
      }
    }
  } as EditOutput;
  
  // Apply section layout morph
  const result = EditSectionLayoutMorph.apply(withChanges, changedFieldsContext);
  
  console.log("\n--- Section Layout with Changes ---");
  console.log(`Number of sections: ${result.layout?.sections?.length}`);
  
  // Output section status
  result.layout?.sections?.forEach(section => {
    console.log(`\nSection: ${section.title}`);
    console.log(`Has changed fields: ${section.meta?.edit?.hasChangedFields}`);
    console.log(`Is collapsed: ${section.collapsed === true}`);
    console.log(`Fields: ${section.fields.join(", ")}`);
  });
  
} catch (error) {
  console.error("\n--- Error in Section Layout Test ---");
  console.error(error);
}

// --- Test 2: Dynamic Layout Generation ---
console.log("\n\n--- TEST 2: EditDynamicLayoutMorph ---");

// Context for dynamic layout
const dynamicLayoutContext: EditContext = {
  id: "dynamic-layout-test",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "user-456",
  data: {}
};

try {
  // Get edit output
  const editOutput = EditModePipeline.apply(formWithoutLayout, dynamicLayoutContext);
  
  // Apply dynamic layout morph
  const result = EditDynamicLayoutMorph.apply(editOutput, dynamicLayoutContext);
  
  console.log("\n--- Generated Dynamic Layout ---");
  console.log(`Layout generated: ${result.layout !== undefined}`);
  console.log(`Number of sections: ${result.layout?.sections?.length}`);
  
  // Output generated sections
  if (result.layout?.sections) {
    console.log("\nGenerated Sections:");
    result.layout.sections.forEach(section => {
      console.log(`\nSection: ${section.title}`);
      console.log(`Priority: ${section.priority}`);
      console.log(`Fields: ${section.fields.join(", ")}`);
    });
  }
  
  // Verify section hints were used for grouping
  const contactSection = result.layout?.sections?.find(s => s.title === "Contact Information");
  console.log(`\nContact section exists: ${contactSection !== undefined}`);
  if (contactSection) {
    console.log(`Contains both email and phone: ${
      contactSection.fields.includes("email") && contactSection.fields.includes("phone")
    }`);
  }
  
} catch (error) {
  console.error("\n--- Error in Dynamic Layout Test ---");
  console.error(error);
}

// --- Test 3: Complete Layout Pipeline ---
console.log("\n\n--- TEST 3: Complete EditLayoutPipeline ---");

// Context with mixed features
const pipelineContext: EditContext = {
  id: "complete-layout-test",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "user-789",
  data: {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    phone: "555-1234",
    notes: "These are notes"
  }
};

try {
  // Test with existing layout
  console.log("\n--- Pipeline with Existing Layout ---");
  
  // Get edit output with change tracking
  const editWithLayout = EditModePipeline.apply(formWithSections, pipelineContext);
  
  // Add changed fields
  const withLayoutChanges = {
    ...editWithLayout,
    meta: {
      ...(editWithLayout.meta || {}),
      mode: "edit",
      timestamp: new Date().toISOString(),
      edit: {
        ...(editWithLayout.meta?.edit || {}),
        trackChanges: true,
        changedFields: ["phone"] // Only phone is changed
      }
    }
  } as EditOutput;
  
  // Apply complete layout pipeline
  const resultWithLayout = EditLayoutPipeline.apply(withLayoutChanges, pipelineContext);
  
  console.log(`Layout preserved: ${resultWithLayout.layout !== undefined}`);
  console.log(`Number of sections: ${resultWithLayout.layout?.sections?.length}`);
  
  // Check if phone section is expanded
  const phoneSection = resultWithLayout.layout?.sections?.find(s => s.fields.includes("phone"));
  console.log(`Phone section expanded: ${phoneSection?.collapsed !== true}`);
  
  // Test with no existing layout
  console.log("\n--- Pipeline with No Existing Layout ---");
  
  // Get edit output
  const editNoLayout = EditModePipeline.apply(formWithoutLayout, pipelineContext);
  
  // Apply complete layout pipeline
  const resultNoLayout = EditLayoutPipeline.apply(editNoLayout, pipelineContext);
  
  console.log(`Layout generated: ${resultNoLayout.layout !== undefined}`);
  console.log(`Number of sections: ${resultNoLayout.layout?.sections?.length}`);
  
  // Check if sections were generated with section hints
  const generatedSections = resultNoLayout.layout?.sections?.map(s => s.title).join(", ");
  console.log(`Generated sections: ${generatedSections}`);
  
} catch (error) {
  console.error("\n--- Error in Complete Pipeline Test ---");
  console.error(error);
}

// --- Test 4: Section Expansion Control ---
console.log("\n\n--- TEST 4: Section Expansion Control ---");

// Context with expansion disabled
const noExpandContext: EditContext = {
  id: "no-expand-test",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "user-101",
  data: {},
  expandChangedSections: false // Explicitly disable expanding changed sections
};

try {
  // Get edit output with change tracking
  const editOutput = EditModePipeline.apply(formWithSections, noExpandContext);
  
  // Add changed fields to meta
  const withChanges = {
    ...editOutput,
    meta: {
      ...(editOutput.meta || {}),
      mode: "edit",
      timestamp: new Date().toISOString(),
      edit: {
        ...(editOutput.meta?.edit || {}),
        trackChanges: true,
        changedFields: ["notes"] // Changed field in collapsed section
      }
    }
  } as EditOutput;
  
  // Apply section layout morph
  const result = EditSectionLayoutMorph.apply(withChanges, noExpandContext);
  
  // Get the notes section (which should stay collapsed)
  const notesSection = result.layout?.sections?.find(s => s.fields.includes("notes"));
  
  console.log("\n--- Expansion Control Results ---");
  console.log(`Notes section exists: ${notesSection !== undefined}`);
  if (notesSection) {
    console.log(`Has changed field: ${notesSection.meta?.edit?.hasChangedFields === true}`);
    console.log(`Remains collapsed: ${notesSection.collapsed === true}`);
  }
  
  // Compare with default behavior
  const defaultContext: EditContext = {
    ...noExpandContext,
    expandChangedSections: undefined // Use default behavior
  };
  
  const defaultResult = EditSectionLayoutMorph.apply(withChanges, defaultContext);
  const defaultNotesSection = defaultResult.layout?.sections?.find(s => s.fields.includes("notes"));
  
  console.log(`\nWith default expansion behavior:`);
  console.log(`Notes section expanded by default: ${defaultNotesSection?.collapsed !== true}`);
  
} catch (error) {
  console.error("\n--- Error in Section Expansion Test ---");
  console.error(error);
}