import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { trpc } from '@/app/lib/trpc';

// Enhanced types for MatrixMode
type MatrixContextValue = {
  // Standard bridge functionality
  dispatchEvent: (eventId: string, payload?: Record<string, any>) => Promise<any>;
  executeAction: (actionId: string, payload?: Record<string, any>) => Promise<any>;
  submitForm: (values: Record<string, any>) => Promise<any>;
  validateField: (fieldId: string, value: any) => Promise<any>;
  
  // MatrixMode specific functionality
  matrix: {
    roomId: string | null;
    userId: string | null;
    isConnected: boolean;
    isDistributed: boolean;
    connect: (roomId: string) => Promise<void>;
    disconnect: () => Promise<void>;
    dispatchDistributed: (eventId: string, payload?: Record<string, any>) => Promise<any>;
    initiateConsensus: (actionId: string, payload?: Record<string, any>, threshold?: number) => Promise<any>;
    observeRemoteEvents: (eventType: string, callback: (event: any) => void) => () => void;
  };
  
  formId?: string;
};

// Create context
const MatrixBridgeContext = createContext<MatrixContextValue | null>(null);

/**
 * MatrixBridge Provider component
 */
export const MatrixBridgeProvider = ({ 
  children,
  formId,
  matrixConfig
}: { 
  children: React.ReactNode;
  formId: string;
  matrixConfig?: {
    roomId?: string;
    serverUrl?: string;
    userId?: string;
    autoConnect?: boolean;
    distributed?: boolean;
  };
}) => {
  // State for Matrix connection
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(matrixConfig?.roomId || null);
  
  // Initialize tRPC client hooks
  const utils = trpc.useContext();
  const submitMutation = trpc.submitForm.useMutation();
  const actionMutation = trpc.executeAction.useMutation();
  const eventMutation = trpc.dispatchEvent.useMutation();
  const validateQuery = trpc.validateField.useQuery;
  
  // Matrix-specific mutations
  const matrixEventMutation = trpc.dispatchMatrixEvent.useMutation();
  const consensusMutation = trpc.executeConsensusAction.useMutation();
  
  // Standard bridge functions
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
      values,
      // Allow local execution by default for forms
      executionMode: 'local' 
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
  
  // MatrixMode specific functions
  const connect = useCallback(async (roomId: string) => {
    // In a real implementation, this would connect to Matrix
    setCurrentRoomId(roomId);
    setIsConnected(true);
  }, []);
  
  const disconnect = useCallback(async () => {
    // In a real implementation, this would disconnect from Matrix
    setCurrentRoomId(null);
    setIsConnected(false);
  }, []);
  
  const dispatchDistributed = useCallback(async (eventId: string, payload?: Record<string, any>) => {
    if (!isConnected || !currentRoomId) {
      throw new Error("Not connected to Matrix room");
    }
    
    return matrixEventMutation.mutateAsync({
      eventId,
      roomId: currentRoomId,
      payload,
      distributed: true
    });
  }, [matrixEventMutation, isConnected, currentRoomId]);
  
  const initiateConsensus = useCallback(async (
    actionId: string, 
    payload?: Record<string, any>,
    threshold: number = 0.51
  ) => {
    if (!isConnected || !currentRoomId) {
      throw new Error("Not connected to Matrix room");
    }
    
    return consensusMutation.mutateAsync({
      actionId,
      formId,
      payload,
      requiredConsensus: threshold
    });
  }, [consensusMutation, isConnected, currentRoomId, formId]);
  
  const observeRemoteEvents = useCallback((eventType: string, callback: (event: any) => void) => {
    if (!isConnected || !currentRoomId) {
      console.warn("Cannot observe events: not connected to Matrix room");
      return () => {};
    }
    
    // In a real implementation, this would set up Matrix event listeners
    const listenerToken = { cancelled: false };
    
    // Return unsubscribe function
    return () => {
      listenerToken.cancelled = true;
    };
  }, [isConnected, currentRoomId]);
  
  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (matrixConfig?.autoConnect && matrixConfig?.roomId && !isConnected) {
      connect(matrixConfig.roomId);
    }
    
    // Cleanup on unmount
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [matrixConfig?.autoConnect, matrixConfig?.roomId]);
  
  // Create context value
  const contextValue: MatrixContextValue = {
    // Standard bridge functions
    dispatchEvent,
    executeAction,
    submitForm,
    validateField,
    formId,
    
    // MatrixMode specific functions
    matrix: {
      roomId: currentRoomId,
      userId: matrixConfig?.userId || null,
      isConnected,
      isDistributed: matrixConfig?.distributed !== false,
      connect,
      disconnect,
      dispatchDistributed,
      initiateConsensus,
      observeRemoteEvents
    }
  };
  
  return (
    <MatrixBridgeContext.Provider value={contextValue}>
      {children}
    </MatrixBridgeContext.Provider>
  );
};

/**
 * Hook to use the MatrixBridge in components
 */
export const useMatrixBridge = () => {
  const context = useContext(MatrixBridgeContext);
  if (!context) {
    throw new Error('useMatrixBridge must be used within a MatrixBridgeProvider');
  }
  return context;
};

/**
 * Enhanced Matrix Action Button component
 */
export const MatrixActionButton = ({ 
  action,
  className,
  disabled,
  distributed = false,
  requireConsensus = false,
  consensusThreshold = 0.51
}: {
  action: any;
  className?: string;
  disabled?: boolean;
  distributed?: boolean;
  requireConsensus?: boolean;
  consensusThreshold?: number;
}) => {
  const bridge = useMatrixBridge();
  
  const handleClick = async () => {
    try {
      // Handle distributed execution if requested
      if (distributed && bridge.matrix.isConnected) {
        // Handle consensus if required
        if (requireConsensus) {
          await bridge.matrix.initiateConsensus(
            action.id, 
            {}, // Payload
            consensusThreshold
          );
          return;
        }
        
        // Regular distributed execution
        if (action.meta?.matrix?.events && action.meta.matrix.events.length > 0) {
          await bridge.matrix.dispatchDistributed(action.meta.matrix.events[0]);
        }
        
        return;
      }
      
      // Standard local execution
      if (action.meta?.bridge?.events && action.meta.bridge.events.length > 0) {
        await bridge.dispatchEvent(action.meta.bridge.events[0]);
      }
      
      await bridge.executeAction(action.id);
    } catch (error) {
      console.error("Error executing action:", error);
    }
  };
  
  // Determine if this action is distributed
  const isDistributedAction = distributed || 
    action.meta?.matrix?.distributed || 
    false;
  
  // Add Matrix-specific classes
  const matrixClasses = [
    isDistributedAction ? 'matrix-distributed' : '',
    requireConsensus ? 'matrix-consensus' : '',
    bridge.matrix.isConnected ? 'matrix-connected' : 'matrix-disconnected'
  ].filter(Boolean).join(' ');
  
  return (
    <button
      type={action.type === 'submit' ? 'submit' : 'button'}
      onClick={action.type !== 'submit' ? handleClick : undefined}
      className={`${className || ''} ${matrixClasses}`.trim()}
      disabled={disabled || (isDistributedAction && !bridge.matrix.isConnected)}
      data-matrix={isDistributedAction ? 'true' : 'false'}
      data-consensus={requireConsensus ? 'true' : 'false'}
    >
      {action.label || action.id}
    </button>
  );
};

/**
 * Matrix-aware form component
 */
export const MatrixForm = ({
  formId,
  children,
  className,
  onSubmit,
  distributed = false
}: {
  formId: string;
  children: React.ReactNode;
  className?: string;
  onSubmit?: (values: Record<string, any>) => Promise<void>;
  distributed?: boolean;
}) => {
  const bridge = useMatrixBridge();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const values = Object.fromEntries(formData.entries());
    
    try {
      // Allow custom handler or use bridge
      if (onSubmit) {
        await onSubmit(values);
      } else if (distributed && bridge.matrix.isConnected) {
        // Use distributed submission
        await bridge.matrix.dispatchDistributed('formSubmitEvent', { values });
      } else {
        // Use local submission
        await bridge.submitForm(values);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };
  
  return (
    <form 
      onSubmit={handleSubmit} 
      className={`${className || ''} ${distributed ? 'matrix-distributed' : ''}`.trim()} 
      id={formId}
      data-matrix={distributed ? 'true' : 'false'}
      data-connected={bridge.matrix.isConnected ? 'true' : 'false'}
    >
      {children}
    </form>
  );
};