'use client';

import React, { useState, useEffect } from 'react';
import { essence } from '../../core/essence/shine';

/**
 * DialecticalComponent
 *
 * A React component that manifests the dialectical appearance system.
 * This represents the final stage of the progression from Being through
 * Essence to Appearance.
 */
interface DialecticalComponentProps {
  entityRef: { entity: string; id: string };
  appearanceType?: string;
  initialState?: string;
  dialectical?: boolean;
  context?: Record<string, any>;
}

export const DialecticalComponent: React.FC<DialecticalComponentProps> = ({
  entityRef,
  appearanceType = 'node',
  initialState,
  dialectical = false,
  context
}) => {
  // Component state
  const [appearance, setAppearance] = useState<Record<string, any>>({});
  const [currentState, setCurrentState] = useState<string>(initialState || '');
  const [sequenceRef, setSequenceRef] = useState<{ entity: string; id: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial appearance
  useEffect(() => {
    const loadAppearance = async () => {
      try {
        setLoading(true);

        if (dialectical && initialState) {
          // Create a dialectical sequence
          const result = await essence.createDialecticalAppearanceSequence(
            entityRef,
            `Appearance of ${entityRef.entity}:${entityRef.id}`,
            [initialState, 'hover', 'active', 'selected'],
            [
              {
                from: initialState,
                to: 'hover',
                condition: {
                  type: 'property',
                  expression: 'context.hovered === true'
                },
                visualTransformation: {
                  scale: 1.05,
                  elevation: 2
                }
              },
              {
                from: 'hover',
                to: initialState,
                condition: {
                  type: 'property',
                  expression: 'context.hovered === false'
                },
                visualTransformation: {
                  scale: 1.0,
                  elevation: 1
                }
              },
              {
                from: 'hover',
                to: 'active',
                condition: {
                  type: 'property',
                  expression: 'context.clicked === true'
                },
                visualTransformation: {
                  scale: 0.98,
                  backgroundColor: '#E3F2FD'
                }
              }
            ]
          );

          setAppearance(result.initialAppearance);
          setSequenceRef(result.sequenceRef);
          setCurrentState(initialState);
        } else {
          // Get static appearance
          const result = essence.createReflectiveAppearance(
            entityRef,
            appearanceType
          );

          setAppearance(result.appearance.visualProperties);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadAppearance();
  }, [entityRef, appearanceType, initialState, dialectical]);

  // Handle dialectical transitions
  const handleInteraction = async (interactionType: string, value: any) => {
    if (!dialectical || !sequenceRef) return;

    // Update the context with the interaction
    const updatedContext = {
      ...(context || {}),
      [interactionType]: value
    };

    // Advance the appearance
    try {
      const result = await essence.advanceAppearance(
        sequenceRef,
        updatedContext
      );

      // Update the component state
      setCurrentState(result.currentState);
      setAppearance(prev => ({
        ...prev,
        ...result.newAppearance
      }));
    } catch (err) {
      console.error('Failed to advance appearance:', err);
    }
  };

  // Render nothing during loading
  if (loading) {
    return <div>Loading...</div>;
  }

  // Render error state
  if (error) {
    return <div>Error: {error}</div>;
  }

  // Determine component style from appearance
  const style: React.CSSProperties = {
    color: appearance.color,
    backgroundColor: appearance.backgroundColor,
    fontSize: `${appearance.fontSize || 14}px`,
    fontWeight: appearance.emphasis > 0.7 ? 'bold' : 'normal',
    padding: `${appearance.padding || 8}px`,
    margin: `${appearance.margin || 4}px`,
    borderRadius: `${appearance.cornerRadius || 4}px`,
    boxShadow: appearance.elevation
      ? `0 ${appearance.elevation}px ${appearance.elevation * 2}px rgba(0,0,0,0.2)`
      : 'none',
    transform: appearance.scale
      ? `scale(${appearance.scale})`
      : 'scale(1)',
    transition: 'all 0.2s ease-in-out',
  };

  // Render the component based on appearance type
  switch (appearanceType) {
    case 'card':
      return (
        <div
          style={style}
          onMouseEnter={() => handleInteraction('hovered', true)}
          onMouseLeave={() => handleInteraction('hovered', false)}
          onClick={() => handleInteraction('clicked', true)}
          onMouseUp={() => handleInteraction('clicked', false)}
        >
          {appearance.content || 'Card Content'}
        </div>
      );

    case 'list-item':
      return (
        <div
          style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            height: `${appearance.height || 48}px`,
            borderBottom: appearance.divider ? '1px solid #e0e0e0' : 'none'
          }}
          onMouseEnter={() => handleInteraction('hovered', true)}
          onMouseLeave={() => handleInteraction('hovered', false)}
          onClick={() => handleInteraction('clicked', true)}
        >
          {appearance.content || 'List Item Content'}
        </div>
      );

    case 'node':
    default:
      return (
        <div
          style={{
            ...style,
            width: `${appearance.radius * 2 || 10}px`,
            height: `${appearance.radius * 2 || 10}px`,
            borderRadius: '50%',
            display: 'inline-block'
          }}
          onMouseEnter={() => handleInteraction('hovered', true)}
          onMouseLeave={() => handleInteraction('hovered', false)}
          onClick={() => handleInteraction('clicked', true)}
        />
      );
  }
};
