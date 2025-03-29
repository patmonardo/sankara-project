import { FC } from 'react';
import { kb } from '@/ui/theme/kb';
import { mdTokens } from '@/ui/theme/token/tokens';
import { CardShape } from '../schema/card';

interface TextCardProps {
  schema: CardShape;
  data: Record<string, any>;
  className?: string;
  onAction?: (action: string, target?: string) => void;
}

export const TextCard: FC<TextCardProps> = ({
  schema,
  data,
  className = '',
  onAction = () => {}
}) => {
  const { title, description, layout, actions = [] } = schema;

  return (
    <div className={`${kb.card.base} ${kb.card.text()} ${className}`}>
      {/* Card Header */}
      <header className={kb.card.header}>
        <h3 className={mdTokens.type.title}>{title}</h3>
        <span className={`${kb.badge.base} ${kb.badge.text}`}>Text</span>
      </header>

      {/* Card Content */}
      <div className={kb.card.content}>
        {/* Sanskrit Title Display */}
        {data.sanskrit_title && (
          <div className={kb.sanskrit.container}>
            <p className={kb.sanskrit.term}>
              {data.sanskrit_title}
            </p>
            {data.transliteration && (
              <p className={kb.sanskrit.transliteration}>
                {data.transliteration}
              </p>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className={`${mdTokens.type.body} text-gray-700 mb-4`}>{description}</p>
        )}

        {/* Text Metadata */}
        <section className={kb.section.container}>
          <h4 className={kb.section.title}>Information</h4>
          <div className="space-y-2">
            {data.period && (
              <div className={kb.field.container}>
                <span className={kb.field.label}>Period:</span>
                <span className={kb.field.value}>{data.period}</span>
              </div>
            )}
            {data.tradition && (
              <div className={kb.field.container}>
                <span className={kb.field.label}>Tradition:</span>
                <span className={kb.field.value}>{data.tradition}</span>
              </div>
            )}
            {data.author && (
              <div className={kb.field.container}>
                <span className={kb.field.label}>Author:</span>
                <span className={kb.field.value}>{data.author}</span>
              </div>
            )}
            {data.language && (
              <div className={kb.field.container}>
                <span className={kb.field.label}>Language:</span>
                <span className={kb.field.value}>{data.language}</span>
              </div>
            )}
          </div>
        </section>

        {/* Key Concepts */}
        {data.key_concepts && data.key_concepts.length > 0 && (
          <section className={kb.section.container}>
            <h4 className={kb.section.title}>Key Concepts</h4>
            <div className="flex flex-wrap gap-2">
              {data.key_concepts.map((concept: string, index: number) => (
                <span
                  key={index}
                  className={`${kb.badge.base} ${kb.badge.concept} cursor-pointer`}
                  onClick={() => onAction('navigate', `concept/${concept.toLowerCase().replace(/\s+/g, '-')}`)}
                >
                  {concept}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Example Verse */}
        {data.example_verse && (
          <section className={kb.section.container}>
            <h4 className={kb.section.title}>Example Verse</h4>
            <div className={kb.sanskrit.sutra}>
              <p className="font-sanskrit mb-1">{data.example_verse.text}</p>
              <p className="text-sm italic">{data.example_verse.translation}</p>
              {data.example_verse.reference && (
                <p className={kb.sanskrit.citation}>{data.example_verse.reference}</p>
              )}
            </div>
          </section>
        )}

        {/* Commentaries */}
        {data.commentaries && data.commentaries.length > 0 && (
          <section className={kb.section.container}>
            <h4 className={kb.section.title}>Commentaries</h4>
            <div className="space-y-3">
              {data.commentaries.map((commentary: any, index: number) => (
                <div
                  key={index}
                  className={kb.container.relatedItem}
                  onClick={() => onAction('navigate', `text/${commentary.id}`)}
                >
                  <p className="font-medium">{commentary.title}</p>
                  <p className="text-sm text-gray-600">{commentary.author}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Card Actions */}
      {actions.length > 0 && (
        <footer className={kb.card.footer}>
          {actions.map((action) => {
            // Determine button style based on variant
            let buttonClass = kb.button.base;

            if (action.variant === 'primary') {
              buttonClass += ' ' + kb.button.primary;
            } else if (action.variant === 'secondary') {
              buttonClass += ' ' + kb.button.secondary;
            } else {
              buttonClass += ' ' + kb.button.text;
            }

            return (
              <button
                key={action.label}
                className={buttonClass}
                onClick={() => onAction(action.action, action.target)}
              >
                {action.icon && <i className={`${action.icon} mr-2`}></i>}
                {action.label}
              </button>
            );
          })}
        </footer>
      )}
    </div>
  );
};
