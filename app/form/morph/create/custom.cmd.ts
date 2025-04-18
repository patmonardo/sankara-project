import { createMorph, createPipeline } from "../morph";
import { FormField, FormShape } from "../../schema/form";
import { CreateContext } from "../mode";

interface CustomTestContext extends CreateContext {
  customComponents?: Record<string, string>;
  customFieldTransformers?: Record<string, (field: CustomFormField) => CustomFormField>;
}

interface CustomFormField extends FormField {
  component?: string;
  props?: Record<string, any>;
  value?: any;
}

interface CustomFormShape extends FormShape {
  customElements?: Record<string, string>;
  componentMap?: Record<string, string>;
  fields: CustomFormField[];
}

// --- Test Data ---
const testFormShape: FormShape = {
  id: "customTestForm",
  fields: [
    {
      id: "standardField",
      type: "text",
      label: "Standard Field",
      required: true
    },
    {
      id: "customField",
      type: "custom",
      label: "Custom Field",
      meta: {
        customType: "signature",
        customProps: {
          width: 300,
          height: 150,
          strokeColor: "#000000"
        }
      }
    },
    {
      id: "richtextField",
      type: "richtext",
      label: "Rich Text Editor",
      meta: {
        toolbar: ["bold", "italic", "link"],
        initialHtml: "<p>Initial <strong>content</strong></p>"
      }
    }
  ]
};

// Update the context definition
const testContext: CustomTestContext = {
  id: "customTestContext",
  name: "Custom Components Test",
  timestamp: Date.now(),
  customComponents: {
    signature: "SignaturePad",
    richtext: "RichTextEditor",
    fileUpload: "FileDropZone"
  },
  customFieldTransformers: {
    signature: (field: CustomFormField) => ({
      ...field,
      component: "SignaturePad",
      props: {
        ...(field.meta?.customProps || {}),
        onChange: `{{handlers.onChange}}`,
        initialValue: field.value || null
      }
    }),
    richtext: (field: CustomFormField) => ({
      ...field,
      component: "RichTextEditor",
      props: {
        toolbar: field.meta?.toolbar || ["bold", "italic"],
        initialHtml: field.meta?.initialHtml || "",
        onChange: `{{handlers.onChange}}`
      }
    })
  }
};

// --- Test Custom Field Adapter ---
console.log("=== TESTING CUSTOM FIELD ADAPTER ===");

const testAdapter = createMorph<FormShape, CustomFormShape>(
  "TestCustomFieldAdapter",
  (shape) => {
    // Mark custom fields
    const fields = shape.fields.map(field => {
      if (field.type === "custom" || field.type === "richtext") {
        return {
          ...field,
          meta: {
            ...field.meta,
            isCustomField: true
          }
        };
      }
      return field;
    }) as CustomFormField[];
    
    return { ...shape, fields } as CustomFormShape;
  }
);

// Test the adapter
const adapterResult = testAdapter.apply(testFormShape, testContext);

console.log("Original fields count:", testFormShape.fields.length);
console.log("Processed fields count:", adapterResult.fields.length);

// Check custom field detection
const customFieldsBefore = testFormShape.fields.filter(f => f.type === "custom").length;
const customFieldsAfter = adapterResult.fields.filter(f => f.meta?.isCustomField).length;

console.log("Custom fields before:", customFieldsBefore);
console.log("Custom fields after:", customFieldsAfter);
console.log("Custom field detection working:", customFieldsAfter === customFieldsBefore + 1); // +1 for richtext

// Check if adapter added necessary metadata
const customField = adapterResult.fields.find(f => f.id === "customField");
console.log("Custom field metadata added:", 
  customField?.meta?.isCustomField === true && 
  customField?.meta?.customType === "signature"
);

console.log("\nAdapter Result Sample:");
console.log(JSON.stringify(customField, null, 2));

// --- Test Custom Field Transformer ---
console.log("\n=== TESTING CUSTOM FIELD TRANSFORMER ===");
const testTransformer = createMorph<CustomFormShape, CustomFormShape>(
  "TestCustomFieldTransformer",
  (shape, context) => {
    // Type guard: check if context has customFieldTransformers
    const hasCustomFieldTransformers = (ctx: any): ctx is { customFieldTransformers: Record<string, (field: CustomFormField) => CustomFormField> } =>
      !!ctx && typeof ctx === "object" && "customFieldTransformers" in ctx;

    const fields = shape.fields.map(field => {
      if (
        field.meta?.isCustomField &&
        field.meta?.customType &&
        hasCustomFieldTransformers(context)
      ) {
        const transformer = context.customFieldTransformers[field.meta.customType];
        if (typeof transformer === "function") {
          return transformer(field);
        }
      }
      return field;
    });

    return { ...shape, fields } as CustomFormShape;
  }
);
// Apply the transformer to the adapter result
const transformerResult = testTransformer.apply(adapterResult, testContext);

// Check if transformer correctly applied the transformers
const transformedField = transformerResult.fields.find(f => f.id === "customField");
console.log("Transformer applied component:", 
  transformedField?.component === "SignaturePad"
);

console.log("Transformer applied custom props:", 
  transformedField?.props?.width === 300 &&
  transformedField?.props?.height === 150
);

// Check richtext field transformation
const richtextField = transformerResult.fields.find(f => f.id === "richtextField");
console.log("Richtext field identified:", richtextField?.meta?.isCustomField === true);

console.log("\nTransformer Result Sample:");
console.log(JSON.stringify(transformedField, null, 2));

// --- Test Custom Layout Generator ---
console.log("\n=== TESTING CUSTOM LAYOUT GENERATOR ===");

const testLayoutGenerator = createMorph<CustomFormShape, CustomFormShape>(
  "TestCustomLayoutGenerator",
  (shape) => {
    // Generate a basic layout with all fields
    return {
      ...shape,
      layout: {
        sections: [
          {
            id: "main",
            title: "Main Section",
            fields: shape.fields.map(f => f.id)
          }
        ]
      }
    };
  }
);

// Create a form with no layout
const formWithoutLayout: FormShape = { ...testFormShape, layout: undefined };

// Apply the layout generator
const layoutResult = testLayoutGenerator.apply(formWithoutLayout, testContext);

console.log("Layout generated:", layoutResult.layout !== undefined);
console.log("All fields included in layout:",
  (layoutResult.layout?.sections?.[0]?.fields?.length ?? 0) === testFormShape.fields.length
);
console.log("\nGenerated Layout:");
console.log(JSON.stringify(layoutResult.layout, null, 2));

// --- Test Custom Elements Addition ---
console.log("\n=== TESTING CUSTOM ELEMENTS ADDITION ===");

const testCustomElements = createMorph<CustomFormShape, CustomFormShape>(
  "TestCustomElements",
  (shape, context) => {
    // Type guard: check if context has customComponents
    const custom = (context && typeof context === "object" && "customComponents" in context)
      ? (context as { customComponents: Record<string, string> })
      : undefined;

    return {
      ...shape,
      customElements: { 
        main: "CustomElementsContainer",
        signature: "SignaturePad",
        richtext: "RichTextEditor"
      },
      componentMap: custom?.customComponents || {}
    };
  }
);
// Apply the custom elements morph
const elementsResult = testCustomElements.apply(testFormShape, testContext);

console.log("Custom elements added:", 
  elementsResult.customElements !== undefined &&
  Object.keys(elementsResult.customElements).length > 0
);

console.log("Component map created:", 
  elementsResult.componentMap !== undefined &&
  Object.keys(elementsResult.componentMap).length > 0
);

console.log("\nCustom Elements Result:");
console.log(JSON.stringify({
  customElements: elementsResult.customElements,
  componentMap: elementsResult.componentMap
}, null, 2));

// --- Test Complete Pipeline ---
console.log("\n=== TESTING COMPLETE CUSTOM PIPELINE ===");

// Create a test pipeline combining all the custom morphs
const testPipeline = createPipeline<CustomFormShape>("TestCustomPipeline")
  .pipe(testAdapter as any)  // Use type assertion for the first morph
  .pipe(testTransformer)
  .pipe(testLayoutGenerator)
  .pipe(testCustomElements);

// Apply the complete pipeline
const pipelineResult = testPipeline.apply(testFormShape, testContext);
console.log("Complete pipeline success:",
  Array.isArray(pipelineResult.fields) && pipelineResult.fields.some(f => f.component !== undefined) &&
  !!pipelineResult.layout &&
  !!pipelineResult.customElements &&
  !!pipelineResult.componentMap
);

// Final summary
console.log("\nFinal Pipeline Results Summary:");
console.log(`Total fields: ${pipelineResult.fields?.length ?? 0}`);
console.log(`Fields with components: ${pipelineResult.fields?.filter(f => f.component !== undefined).length ?? 0}`);
console.log(`Layout sections: ${pipelineResult.layout?.sections?.length ?? 0}`);
console.log(`Custom elements: ${Object.keys(pipelineResult.customElements || {}).length}`);