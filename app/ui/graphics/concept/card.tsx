import { FC } from "react";
import { kb } from "@/ui/theme/kb";
import { mdTokens } from "@/ui/theme/token/tokens";
import { CardShape } from "../schema/card";

interface ConceptCardProps {
  schema: CardShape;
  data: Record<string, any>;
  className?: string;
}

export const ConceptCard: FC<ConceptCardProps> = ({
  schema,
  data,
  className = "",
}) => {
  const { title, description, layout, actions = [] } = schema;

  // Handle actions
  const handleAction = (action: string, target?: string) => {
    console.log(`Action: ${action}, Target: ${target}`);
    // Implement your action handling here
  };

  return (
    <div className={`${kb.card.base} ${kb.card.concept()} ${className}`}>
      {/* Card header */}
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h3 className={mdTokens.type.title}>{title}</h3>
        <span className={kb.badge.concept}>Concept</span>
      </div>

      {/* Card content */}
      <div className="px-4 py-4">
        {/* Sanskrit term display with stylized container */}
        {data.sanskrit_term && (
          <div className={kb.sanskrit.container}>
            <p className={kb.sanskrit.primary}>{data.sanskrit_term}</p>
            {data.transliteration && (
              <p className={kb.sanskrit.transliteration}>
                {data.transliteration}
              </p>
            )}
            {data.root_term && (
              <p className="text-xs text-gray-600 mt-1">
                Root: <span className="font-sanskrit">{data.root_term}</span>
              </p>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className={`${mdTokens.type.body} text-gray-700 mb-4`}>
            {description}
          </p>
        )}

        {/* Definition section with special formatting */}
        {data.definition && (
          <div className={kb.section.standard}>
            <h4 className={kb.section.title}>Definition</h4>
            <p className="mb-3">{data.definition}</p>

            {/* Optional sub-definitions */}
            {data.variants && (
              <div className="pl-4 border-l-2 border-purple-200 mt-2">
                {data.variants.map((variant: any, index: number) => (
                  <div key={index} className="mb-2">
                    <span className="font-medium text-sm">
                      {variant.name}:{" "}
                    </span>
                    <span>{variant.definition}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Related concepts with visual connections */}
        {data.related_concepts && data.related_concepts.length > 0 && (
          <div className={kb.section.standard}>
            <h4 className={kb.section.title}>Related Concepts</h4>
            <div className={kb.connection.container}>
              {data.related_concepts.map((concept: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium">{concept.name}</span>
                  <span
                    className={`${kb.connection.label} ${
                      kb.connection[
                        concept.relation as keyof typeof kb.connection
                      ] || kb.connection.defines
                    }`}
                  >
                    {concept.relation}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Textual sources */}
        {data.sources && data.sources.length > 0 && (
          <div className={kb.section.standard}>
            <h4 className={kb.section.title}>Textual Sources</h4>
            <div className="space-y-2">
              {data.sources.map((source: any, index: number) => (
                <div key={index} className="text-sm">
                  {source.is_primary && (
                    <span className="mr-2 inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">
                      Primary
                    </span>
                  )}
                  <span className="font-medium">{source.text}</span>
                  {source.reference && (
                    <span className="ml-1 text-gray-600">
                      ({source.reference})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Example sutra */}
        {data.example_sutra && (
          <div className={kb.section.standard}>
            <h4 className={kb.section.title}>Example Sutra</h4>
            <div className={kb.sanskrit.sutra}>
              <p className="font-sanskrit mb-1">{data.example_sutra.text}</p>
              <p className="text-sm italic">{data.example_sutra.translation}</p>
              {data.example_sutra.source && (
                <p className={kb.sanskrit.citation}>
                  {data.example_sutra.source}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card actions */}
      {actions.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex space-x-2">
          {actions.map((action) => {
            // Determine button style based on variant
            // Button styles from kb
            let buttonClass = kb.button.base;

            if (action.variant === "primary") {
              buttonClass += " " + kb.button.primary;
            } else if (action.variant === "secondary") {
              buttonClass += " " + kb.button.secondary;
            } else {
              buttonClass += " " + kb.button.text;
            }
            return (
              <button
                key={action.label}
                className={buttonClass}
                onClick={() => handleAction(action.action, action.target)}
              >
                {action.icon && <i className={`${action.icon} mr-2`}></i>}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
