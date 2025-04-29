import React from "react";
import { LightBulbIcon } from "@heroicons/react/24/outline";
import { Card } from "@/form/card/card.morph";
import type { CardShape } from "@/form/schema/card";
import { kb } from "@/ui/theme/kb";
import { md } from "@/ui/theme/token";

// Extended shape for concept cards
export interface ConceptCardShape extends CardShape {
  concept: {
    sanskrit?: string;
    transliteration?: string;
    tradition?: string;
    tags?: string[];
    relatedConcepts?: Array<{
      id: string;
      name: string;
      relation: "defines" | "contains" | "opposes" | "enhances";
    }>;
  };
}

// Specialized card for philosophical concepts
export class SanskritConceptCard extends Card<ConceptCardShape> {
  constructor(protected readonly data: ConceptCardShape) {
    super(data);
    // Ensure concept card type
    data.layout.type = "concept";
    data.layout.icon = "concept";
  }

  protected getCardStyle(): string {
    return kb.card.concept("level2");
  }

  // Custom render method for concept cards
  async render(
    mode: FormMode,
    content: FormContent,
    handler: FormHandler
  ): Promise<React.ReactNode | string> {
    const {
      title,
      description,
      onClick,
      className = "",
    } = this.data.layout;

    const {
      sanskrit,
      transliteration,
      tradition,
      tags = [],
      relatedConcepts = [],
    } = this.data.concept || {};

    const cardStyle = this.getCardStyle();

    return (
      <div
        className={`
          ${cardStyle}
          ${md.pattern.interaction.hover}
          overflow-hidden
          ${className}
        `}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className="p-4">
          {/* Header with icon and title */}
          <div className="flex items-center justify-between mb-3">
            <h3 className={md.type.title}>{title}</h3>
            <span className={`text-[${md.color.knowledge.concept}]`}>
              <LightBulbIcon className="h-5 w-5" />
            </span>
          </div>

          {/* Tags if available */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.map((tag, i) => (
                <span key={i} className={kb.badge.concept}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Sanskrit text if available */}
          {sanskrit && (
            <div className={kb.sanskrit.container}>
              <p className={kb.sanskrit.primary}>{sanskrit}</p>
              {transliteration && (
                <p className={kb.sanskrit.transliteration}>{transliteration}</p>
              )}
              {tradition && (
                <p className={kb.sanskrit.citation}>{tradition}</p>
              )}
            </div>
          )}

          {/* Description */}
          <p className={md.pattern.content.primaryContent}>{description}</p>

          {/* Related concepts */}
          {relatedConcepts.length > 0 && (
            <div className={`${md.pattern.knowledge.connection} mt-4`}>
              <h4 className={`${md.type.label} mb-2`}>Related Concepts</h4>
              <ul className={md.pattern.layout.stack}>
                {relatedConcepts.map((related, i) => (
                  <li
                    key={i}
                    className={`
                      flex items-center
                      ${kb.connection[related.relation] || ''}
                      pl-2 py-1
                    `}
                  >
                    <span className={kb.badge.concept}>{related.relation}</span>
                    <span className="ml-2">{related.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }
}

// React component wrapper for convenient JSX usage
export default function ConceptCardForm(props: ConceptCardShape) {
  const cardInstance = new SanskritConceptCard(props);
  return <>{cardInstance.render("edit", "jsx", {} as FormHandler)}</>;
}
