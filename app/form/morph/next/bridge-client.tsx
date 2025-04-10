import React, { createContext, useContext, useCallback } from 'react';
import { trpc } from '@/app/lib/trpc';

// Type definitions
type BridgeContextValue = {
  dispatchEvent: (eventId: string, payload?: Record<string, any>) => Promise<any>;
  executeAction: (actionId: string, payload?: Record<string, any>) => Promise<any>;
  submitForm: (values: Record<string, any>) => Promise<any>;
  validateField: (fieldId: string, value: any) => Promise<any>;
  formId?: string;
};

// Create context
const BridgeContext = createContext<BridgeContextValue | null>(null);

/**
 * Bridge Provider component
 */
export const FormBridgeProvider = ({ 
  children,
  formId,
  initialData
}: { 
  children: React.ReactNode;
  formId: string;
  initialData?: Record<string, any>;
}) => {
  // Initialize tRPC client hooks
  const utils = trpc.useContext();
  const submitMutation = trpc.submitForm.useMutation();
  const actionMutation = trpc.executeAction.useMutation();
  const eventMutation = trpc.dispatchEvent.useMutation();
  const validateQuery = trpc.validateField.useQuery;
  
  // Create dispatcher functions
  const dispatchEvent = useCallback(async (eventId: string, payload?: Record<string, any>) => {
    return eventMutation.mutateAsync({
      eventId,
      source: formId,
      payload
    });
  }, [eventMutation, formId]);
  
  const executeAction = useCallback(async (actionId: string, payload?: Record<string, any>) => {
    return actionMutation.mutateAsync({
      actionId,
      formId,
      payload
    });
  }, [actionMutation, formId]);
  
  const submitForm = useCallback(async (values: Record<string, any>) => {
    return submitMutation.mutateAsync({
      formId,
      values
    });
  }, [submitMutation, formId]);
  
  const validateField = useCallback(async (fieldId: string, value: any) => {
    const result = await validateQuery({
      formId,
      fieldId,
      value
    });
    return result.data;
  }, [validateQuery, formId]);
  
  // Create context value
  const contextValue: BridgeContextValue = {
    dispatchEvent,
    executeAction,
    submitForm,
    validateField,
    formId
  };
  
  return (
    <BridgeContext.Provider value={contextValue}>
      {children}
    </BridgeContext.Provider>
  );
};

/**
 * Hook to use the bridge in components
 */
export const useBridge = () => {
  const context = useContext(BridgeContext);
  if (!context) {
    throw new Error('useBridge must be used within a FormBridgeProvider');
  }
  return context;
};

/**
 * Component to render an action button connected to the bridge
 */
export const ActionButton = ({ 
  action,
  className,
  disabled
}: {
  action: any;
  className?: string;
  disabled?: boolean;
}) => {
  const bridge = useBridge();
  
  const handleClick = async () => {
    // Dispatch the action's associated event if defined
    if (action.meta?.bridge?.events && action.meta.bridge.events.length > 0) {
      await bridge.dispatchEvent(action.meta.bridge.events[0]);
    }
    
    // Execute the action directly
    await bridge.executeAction(action.id);
  };
  
  return (
    <button
      type={action.type === 'submit' ? 'submit' : 'button'}
      onClick={action.type !== 'submit' ? handleClick : undefined}
      className={className}
      disabled={disabled}
    >
      {action.label || action.id}
    </button>
  );
};

/**
 * Form component that connects to the bridge
 */
export const BridgeForm = ({
  formId,
  children,
  className,
  onSubmit
}: {
  formId: string;
  children: React.ReactNode;
  className?: string;
  onSubmit?: (values: Record<string, any>) => Promise<void>;
}) => {
  const bridge = useBridge();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const values = Object.fromEntries(formData.entries());
    
    // Allow custom handler or use bridge
    if (onSubmit) {
      await onSubmit(values);
    } else {
      await bridge.submitForm(values);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={className} id={formId}>
      {children}
    </form>
  );
};