import { FormShape } from "../../schema/form";

/**
 * Safely run a demo function with error handling - simplified version
 */
export function safeRunDemo(
  demoName: string,
  demoFn: (form: FormShape, arg1?: any, arg2?: any) => FormShape,
  form: FormShape,
  arg1?: any,
  arg2?: any
): FormShape | null {
  console.log(`\n---------- ${demoName.toUpperCase()} ----------`);
  
  try {
    return demoFn(form, arg1, arg2);
  } catch (error) {
    console.error(`Error in ${demoName}:`, error);
    return null;
  }
}

/**
 * Print demo results in a formatted way
 */
export function printDemoResults(
  demoName: string, 
  result: FormShape | null,
  includeFields: boolean = false
): void {
  if (!result) {
    console.log(`${demoName} failed.`);
    return;
  }
  
  console.log(`${demoName} Results:`);
  console.log(`- ID: ${result.id}`);
  console.log(`- Title: ${result.title}`);
  console.log(`- Fields: ${result.fields.length}`);
  
  if (result.meta) {
    console.log(`- Metadata: ${JSON.stringify(result.meta, null, 2)}`);
  }
  
  if (includeFields) {
    console.log(`- Field Details:`);
    result.fields.forEach((field, i) => {
      console.log(`  [${i}] ${field.id}: ${field.label || field.id} (${field.type})`);
    });
  }
}