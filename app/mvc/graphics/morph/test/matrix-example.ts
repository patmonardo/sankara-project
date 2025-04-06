import { FormShape } from "../../schema/form";
import { 
  runMatrixDemo, 
  runSmithDemo, 
  runDejaVuDemo, 
  runArchitectDemo 
} from "./matrix-demo";
import { safeRunDemo, printDemoResults } from "./matrix-test-utils";

// Create a test form
const testForm: FormShape = {
  id: "contact-form",
  title: "Contact Form",
  fields: [
    {
      id: "name",
      type: "text",
      label: "Name",
      required: true,
    },
    {
      id: "email",
      type: "email",
      label: "Email Address",
      required: true,
      description: "We'll never share your email with anyone else.",
    },
    {
      id: "phone",
      type: "tel",
      label: "Phone Number",
      required: false,
      pattern: "^\\d{3}-\\d{3}-\\d{4}$",
    },
    {
      id: "subject",
      type: "select",
      label: "Subject",
      required: false,
      description: "Please select the reason for your contact.",
      options: [
        { value: "support", label: "Support" },
        { value: "sales", label: "Sales" },
        { value: "feedback", label: "Feedback" },
        { value: "other", label: "Other" },
      ],
    },
    {
      id: "message",
      type: "textarea",
      label: "Message",
      required: true,
      minLength: 20,
    },
  ],
  meta: {
    //version: "1.0",
    //created: new Date().toISOString(),
  }
};

// Add validation defaults to make the demos work better
const enhancedTestForm = {
  ...testForm,
  fields: testForm.fields.map(field => ({
    ...field,
    validation: {
      valid: true,
      errors: [],
      warnings: []
    },
    defaultValue: field.id === 'name' ? 'Neo' : ''
  }))
};

// Terminal colors for fancy output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  yellow: "\x1b[33m"
};

/**
 * Print a styled Matrix-themed header
 */
function printMatrixHeader(text: string): void {
  const border = "=".repeat(50);
  console.log(`\n${colors.green}${border}${colors.reset}`);
  console.log(`${colors.bright}${colors.green}${text}${colors.reset}`);
  console.log(`${colors.green}${border}${colors.reset}`);
}

/**
 * Print digital rain effect (just for fun)
 */
function printDigitalRain(): void {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*()";
  let rainEffect = "";
  
  for (let i = 0; i < 3; i++) {
    let line = "";
    for (let j = 0; j < 50; j++) {
      line += chars[Math.floor(Math.random() * chars.length)];
    }
    rainEffect += `${colors.green}${line}${colors.reset}\n`;
  }
  
  console.log(rainEffect);
}

/**
 * Print a Matrix quote
 */
function printMatrixQuote(): void {
  const quotes = [
    "I know kung fu.",
    "There is no spoon.",
    "Ignorance is bliss.",
    "Welcome to the desert of the real.",
    "Never send a human to do a machine's job.",
    "I'm trying to free your mind, Neo. But I can only show you the door. You're the one that has to walk through it.",
    "What is real? How do you define 'real'?",
    "Unfortunately, no one can be told what the Matrix is. You have to see it for yourself."
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  console.log(`\n${colors.cyan}"${randomQuote}"${colors.reset}\n`);
}

printDigitalRain();
printMatrixHeader("THE MATRIX FORM SYSTEM DEMONSTRATION");
printMatrixQuote();

console.log(`${colors.yellow}Initializing form transformation system...${colors.reset}\n`);

// Run all demos safely with enhanced output

// 1. Main Matrix Demo
console.log(`${colors.bright}${colors.blue}Taking the red pill...${colors.reset}`);
const matrixResult = safeRunDemo(
  "MAIN MATRIX TRANSFORMATION",
  runMatrixDemo,
  enhancedTestForm
);
printDemoResults("Matrix Demo", matrixResult);

// Print digital rain to separate sections
printDigitalRain();

// 2. Smith Replication Demo
console.log(`\n${colors.bright}${colors.red}Agent Smith is replicating...${colors.reset}`);
const smithResult = safeRunDemo(
  "SMITH REPLICATION DEMO", 
  runSmithDemo,
  enhancedTestForm, 
  2
);
printDemoResults("Smith Demo", smithResult, true);

// 3. DejaVu Glitch Detector
console.log(`\n${colors.bright}${colors.magenta}Detecting glitches in the system...${colors.reset}`);
const dejaVuResult = safeRunDemo(
  "DEJA VU GLITCH DETECTOR",
  runDejaVuDemo,
  enhancedTestForm
);
printDemoResults("DejaVu Demo", dejaVuResult);

// 4. Architect Demo
console.log(`\n${colors.bright}${colors.yellow}The Architect is redesigning the system...${colors.reset}`);
const architectResult = safeRunDemo(
  "ARCHITECT DEMO",
  runArchitectDemo,
  enhancedTestForm
);
printDemoResults("Architect Demo", architectResult);

// Final message
printDigitalRain();
console.log(`\n${colors.bright}${colors.green}Matrix demonstrations complete.${colors.reset}`);
console.log(`${colors.green}Remember, there is no spoon.${colors.reset}\n`);

// Check which demos succeeded and which failed
const results = {
  matrix: !!matrixResult,
  smith: !!smithResult,
  dejaVu: !!dejaVuResult,
  architect: !!architectResult
};

// Print a summary
console.log(`${colors.bright}Test Summary:${colors.reset}`);
Object.entries(results).forEach(([name, success]) => {
  const icon = success ? "✓" : "✗";
  const color = success ? colors.green : colors.red;
  console.log(`${color}${icon} ${name}${colors.reset}`);
});

// Check for form differences
if (matrixResult) {
  console.log(`\n${colors.bright}Form Transformation Stats:${colors.reset}`);
  console.log(`- Original fields: ${testForm.fields.length}`);
  console.log(`- Transformed fields: ${matrixResult.fields.length}`);
  console.log(`- Field difference: ${matrixResult.fields.length - testForm.fields.length}`);
  
  // Check for Meta fields added
  const originalMetaKeys = Object.keys(testForm.meta || {}).length;
  const transformedMetaKeys = Object.keys(matrixResult.meta || {}).length;
  
  console.log(`- Original metadata keys: ${originalMetaKeys}`);
  console.log(`- Transformed metadata keys: ${transformedMetaKeys}`);
  console.log(`- Metadata difference: ${transformedMetaKeys - originalMetaKeys}`);
}

// Exit
console.log(`\n${colors.green}Exiting the Matrix...${colors.reset}`);