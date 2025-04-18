import { StyleViewMorph } from "./display";
import { ViewOutput } from "./pipeline";
import { ViewContext } from "../mode";

// Very simple view for styling test
const sampleView: ViewOutput = {
  id: "style-test-view",
  mode: "view",
  fields: [
    {
      id: "field1",
      label: "Field One",
      type: "string",
      value: "Sample text",
      meta: {},
    },
    {
      id: "field2",
      label: "Field Two",
      type: "number",
      value: 42,
      meta: {},
    }
  ],
  meta: {},
};

const context: ViewContext = {
  id: "style-test-context",
  mode: "view",
  name: "Style Test",
  timestamp: Date.now(),
  variant: "card",
  density: "comfortable",
};

async function main() {
  console.log("=== Testing StyleViewMorph ===\n");
  
  const styledView = await StyleViewMorph.apply(sampleView, context);
  
  console.log("Meta styles:", styledView.meta?.styles);
  console.log("\nField styles:");
  
  styledView.fields.forEach(field => {
    console.log(`\n${field.id}:`, field.meta?.styles);
  });
}

if (require.main === module) {
  main().catch(console.error);
}