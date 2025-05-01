import React from 'react';
import { Form } from '@/form/form/form';
import type { FormMode, FormContent, FormHandler } from '@/form/schema/shape';
import { LinkShape } from '@/form/schema/link';
import { LinkMorphPipeline } from '@/ui/link/link.morph';

// Link class consistent with your Form architecture
export class Link<T extends LinkShape> extends Form<T> {
  constructor(protected readonly data: T) {
    super(data);
  }

  // Implement required Form abstract methods
  protected async createForm(): Promise<T> {
    return this.data;
  }

  protected async editForm(): Promise<T> {
    return this.data;
  }

  // Custom render method for links using morphology
  async render(
    mode: FormMode,
    content: FormContent,
    handler: FormHandler
  ): Promise<React.ReactNode | string> {
    // If not rendering JSX, return simple representation
    if (content !== "jsx") {
      return this.data.layout.label;
    }

    // Use our morphology pipeline
    return LinkMorphPipeline.transform({
      link: this.data,
      handler
    }, {
      link: this.data,
      handler
    });
  }
}

// React component wrapper for convenient JSX usage
export default function LinkForm(props: LinkShape) {
  const linkInstance = new Link(props);
  const [content, setContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    const renderLink = async () => {
      const renderedContent = await linkInstance.render("create", "jsx", {
        submit: (actionId, data) => {
          console.log('Link action:', actionId, data);
        }
      });
      setContent(renderedContent);
    };
    renderLink();
  }, [linkInstance, props]);

  return <>{content}</>;
}

// Simplified rendering function for use inside other components
export function renderLink(link: LinkShape, onAction?: (actionId: string) => void): React.ReactNode {
  return LinkMorphPipeline.transform({
    link,
    handler: {
      submit: (actionId, _) => {
        if (onAction) {
          onAction(typeof actionId === 'string' ? actionId : actionId.layout.id);
        }
      }
    }
  }, { link });
}