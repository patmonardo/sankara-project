import { FormShape } from '@/ui/graphics/schema/form';
import { runAllMatrixDemos } from './matrix-launcher';

// Create a sample form
const sampleForm: FormShape = {
    id: 'contact-form',
    fields: [
      { id: 'name', type: 'text', label: 'Name', required: true },
      { id: 'email', type: 'email', label: 'Email', required: true },
      { id: 'message', type: 'textarea', label: 'Message', required: true },
    ]
  };
  
// Run all Matrix demos on this form
runAllMatrixDemos(sampleForm);