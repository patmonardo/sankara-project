// Example usage in a demo component
import React from 'react';
import { MorpheusDemo } from '@/form/modality/matrix';
import { FormShape } from '@/form/schema/form';

const MatrixDemoComponent: React.FC = () => {
  const [demoState, setDemoState] = React.useState<{
    form: FormShape;
    message: string;
  }>({
    form: {
      id: 'matrixDemo',
      fields: [
        { id: 'name', type: 'text', label: 'Name' },
        { id: 'email', type: 'email', label: 'Email' },
        { id: 'message', type: 'textarea', label: 'Message' }
      ]
    },
    message: 'Welcome to the Matrix Demo'
  });

  const handleRedPill = () => {
    setDemoState({
      form: MorpheusDemo.redPill(demoState.form),
      message: 'You took the red pill. The truth is revealed.'
    });
  };

  const handleBluePill = () => {
    setDemoState({
      form: MorpheusDemo.bluePill(demoState.form),
      message: 'You took the blue pill. Everything is fine.'
    });
  };

  const handleGlitch = () => {
    setDemoState({
      form: MorpheusDemo.glitch(demoState.form),
      message: 'A glitch in the Matrix...'
    });
  };

  const handleSeeCode = () => {
    setDemoState({
      form: MorpheusDemo.seeTheCode(demoState.form),
      message: 'You can now see the code of the Matrix'
    });
  };

  const handleBecomeTheOne = () => {
    setDemoState({
      form: MorpheusDemo.becomeTheOne(demoState.form),
      message: 'You are The One.'
    });
  };

  const handleReset = () => {
    setDemoState({
      form: {
        id: 'matrixDemo',
        fields: [
          { id: 'name', type: 'text', label: 'Name' },
          { id: 'email', type: 'email', label: 'Email' },
          { id: 'message', type: 'textarea', label: 'Message' }
        ]
      },
      message: 'Matrix reset. Take a pill?'
    });
  };

  const handleMorpheusSpeak = () => {
    setDemoState({
      ...demoState,
      message: MorpheusDemo.speak()
    });
  };

  return (
    <div className="matrix-demo">
      <h2>Matrix Morphism Demo</h2>
      
      <div className="matrix-message">
        {demoState.message}
      </div>
      
      <div className="matrix-form">
        {/* Render form using your form renderer */}
        <pre>{JSON.stringify(demoState.form, null, 2)}</pre>
      </div>
      
      <div className="matrix-controls">
        <button onClick={handleRedPill}>Take Red Pill</button>
        <button onClick={handleBluePill}>Take Blue Pill</button>
        <button onClick={handleGlitch}>Glitch</button>
        <button onClick={handleSeeCode}>See The Code</button>
        <button onClick={handleBecomeTheOne}>Become The One</button>
        <button onClick={handleMorpheusSpeak}>Morpheus Speaks</button>
        <button onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
};

export default MatrixDemoComponent;