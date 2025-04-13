import React, { useState } from 'react';
import { 
  createTranscendentalContext,
  Moment, Category, Aspect, Mode, Operation, Genera,
  MomentSchema, CategorySchema, AspectSchema, ModeSchema
} from '../form/context/execution';

// Create a global transcendental context
const globalContext = createTranscendentalContext({
  id: 'global',
  name: 'Global Transcendental Context',
  autoActivate: true
});

const TranscendentalForm: React.FC = () => {
  const [moment, setMoment] = useState<Moment>('ansich');
  const [category, setCategory] = useState<Category>('sein');
  const [aspect, setAspect] = useState<Aspect>('unmittelbar');
  const [mode, setMode] = useState<Mode>('rezeptiv');
  const [operation, setOperation] = useState<Operation>('setzen');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  
  const handleExecute = () => {
    const operationResult = globalContext.execute(operation, () => {
      // In a real implementation, each operation would have specific logic
      switch (operation) {
        case 'setzen':
          return { posited: input };
        case 'bestimmen':
          return { determined: input, qualities: input.split(' ') };
        case 'identifizieren':
          return { identified: input, identity: input.toUpperCase() };
        case 'kalkulieren':
          try {
            return { calculated: eval(input) };
          } catch {
            return { error: 'Invalid expression' };
          }
        case 'messen':
          return { measured: input, length: input.length };
        case 'schließen':
          const parts = input.split(',');
          return {
            major: parts[0] || '',
            minor: parts[1] || '',
            conclusion: parts[2] || 'Therefore...'
          };
        case 'absolvieren':
          return {
            absolute: true,
            original: input,
            transcended: `The Absolute Idea contains: ${input}`
          };
        default:
          return { input };
      }
    });
    
    setResult(operationResult);
    
    // Advance the dialectic
    globalContext.advance();
    setMoment(globalContext.metadata.moment);
    setCategory(globalContext.metadata.category);
    setAspect(globalContext.metadata.aspect);
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6">Transcendental Operations</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Logical State</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium">Moment</label>
            <select 
              value={moment}
              onChange={e => setMoment(e.target.value as Moment)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {MomentSchema.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium">Category</label>
            <select 
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {CategorySchema.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium">Aspect</label>
            <select 
              value={aspect}
              onChange={e => setAspect(e.target.value as Aspect)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {AspectSchema.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium">Mode</label>
            <select 
              value={mode}
              onChange={e => setMode(e.target.value as Mode)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {ModeSchema.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Operation</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium">Operation</label>
            <select 
              value={operation}
              onChange={e => setOperation(e.target.value as Operation)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {Object.keys(operationTaxonomy).map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium">Input</label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              rows={5}
            />
          </div>
          
          <button
            onClick={handleExecute}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Execute Transcendental Operation
          </button>
        </div>
      </div>
      
      {result && (
        <div className="mt-6 p-4 border rounded-md bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Operation Details</h3>
              <div className="text-sm">
                <p><span className="font-medium">Operation:</span> {result.operation}</p>
                <p><span className="font-medium">Genera:</span> {result.genera}</p>
                <p><span className="font-medium">Mode:</span> {result.mode}</p>
                <p><span className="font-medium">Success:</span> {result.success ? 'Yes' : 'No'}</p>
                <p><span className="font-medium">Context:</span> {result.contextId}</p>
                <p><span className="font-medium">Timestamp:</span> {new Date(result.timestamp).toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium">Value</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(result.value, null, 2)}
              </pre>
              
              {result.error && (
                <div className="mt-2 text-red-500">
                  <h3 className="font-medium">Error</h3>
                  <p>{result.error.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscendentalForm;