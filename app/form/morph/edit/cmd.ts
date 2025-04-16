import { EditFieldsPipeline } from "./fields";
import { EditModePipeline } from "./pipeline";
import { EditSystemPipeline } from "./system";
import { EditOutput } from "./pipeline";
import { EditContext } from "../mode";
import { FormShape }  from "../../schema/form";

// --- 1. Minimal Sample Input Shape (EditOutput) ---
const sampleShape: FormShape = {
  id: "simpleForm1",
  fields: [
    {
      id: "firstName",
      type: "text",
      label: "First Name",
      inputType: "text",
      visible: true,
      disabled: false,
      readOnly: false,
      meta: {
        mode: "edit",
        pristine: true,
        touched: false,
      },
    },
    {
      id: "age",
      type: "number",
      label: "Age",
      inputType: "number",
      visible: true,
      disabled: false,
      readOnly: false,

      meta: {
        mode: "edit",
        pristine: true,
        touched: false,
      },
    },
  ],
  layout: {
    sections: [
      {
        id: "main",
        title: "Main Info",
        fields: ["firstName", "age"],
      },
    ],
  },
};

// --- 2. Minimal Edit Context ---
const sampleContext: EditContext = {
  id: "editContext1",
  name: "Edit Context for Simple Form",
  timestamp: 0,
  targetId: "item-001",
  data: {
    firstName: "Alice",
    age: 30,
  },
};

// --- 3. Execute the Standard Edit Pipeline ---
console.log("--- Input Shape ---");
console.log(JSON.stringify(sampleShape, null, 2));

try {
  const resultShape = EditSystemPipeline.apply(sampleShape, sampleContext);
  console.log("\n--- Output Shape ---");
  console.log(JSON.stringify(resultShape, null, 2));
} catch (error) {
  console.error("\n--- Error during Morph Execution ---");
  console.error(error);
}