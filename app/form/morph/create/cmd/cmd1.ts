import { CreateFormPipeline } from '../pipeline';
import { CreateFormField, CreateFormContext } from '../types';

// Sample form schema
const sampleSchema = {
  id: 'sampleForm',
  name: 'Sample Form',
  fields: [
    { id: 'username', label: 'Username', type: 'text', meta: {} },
    { id: 'email', label: 'Email', type: 'email', meta: {} },
    { id: 'password', label: 'Password', type: 'password', meta: {} }
  ],
  meta: {}
};

// Sample context for creation
const sampleContext: CreateFormContext = {
  id: 'cmd-test-context',
  timestamp: Date.now(),
  operation: 'create',
  data: {
    initialValues: {
      username: 'cmdUser',
      email: 'cmd@example.com'
    },
    // For example, include only username & email, leave password out
    includeFields: ['username', 'email'],
    submitLabel: 'Submit',
    cancelLabel: 'Abort',
    showCancel: true,
    buttonPosition: 'bottom',
    config: {
      validateOnChange: true,
      validateOnBlur: true,
      validateOnSubmit: true,
      submitOnEnter: false,
      showLabels: true,
      showRequiredIndicator: true,
      showValidationErrors: true,
      trackChanges: true,
      confirmDiscardChanges: false,
      labelPosition: 'top'
    },
    // Optionally attach a template here if needed
    // templateData: { ... },
    templateOptions: {
      preserveOriginalDefaults: false,
      readOnlyFields: [],
      titlePrefix: 'New',
      mergeStrategy: 'override'
    },
    customization: {}
  },
  meta: {},
  ui: {}
};

// Run the pipeline on the sample schema
const result = CreateFormPipeline.run(sampleSchema, sampleContext);

// Output the result to the console
console.log('--- Create Form Pipeline Result ---');
console.log(JSON.stringify(result, null, 2));

// Exit the process (useful for CMD scripts)
process.exit(0);