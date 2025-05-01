import React from "react";
import { ContainerCardMorphInput, ContainerCardPipeline } from "./card-morph";
import type { ContainerCardShape } from "@/form/schema/card";
import type { FormMode, FormContent, FormHandler } from "@/form/schema/shape";
import { Card } from "./card";

/**
 * ContainerCard specialized class for wrapping content
 */
export class ContainerCard<T extends ContainerCardShape> extends Card<T> {
  constructor(protected readonly data: T) {
    super(data);
  }

  // Override render to use container card pipeline
  async render(
    mode: FormMode,
    content: FormContent,
    handler: FormHandler,
    children?: React.ReactNode
  ): Promise<React.ReactNode | string> {
    if (content !== "jsx") {
      return this.data.layout.title || "Container Card";
    }

    // Get the card shape based on current mode
    const shape = await this[`${mode}Form`]();
    
    // Use the container card pipeline
    return ContainerCardPipeline.transform(
      { 
        shape,
        handler: {
          onAction: handler.onAction,
        },
        children
      }, 
      { shape }
    );
  }
}

// Functional component for convenient JSX usage
export default function ContainerCardForm(props: ContainerCardShape & {
  mode?: FormMode,
  onAction?: (actionId: string, data: ContainerCardShape) => void,
  children?: React.ReactNode
}) {
  const { mode = "view", onAction, children, ...cardProps } = props;
  const containerCardInstance = new ContainerCard(props);
  const [content, setContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    const renderCard = async () => {
      const handler: FormHandler = onAction
        ? {
            onAction: (id, data) => onAction(id, data),
          }
        : {} as FormHandler;

      const renderedContent = await containerCardInstance.render(
        mode,
        "jsx",
        handler,
        children
      );
      setContent(renderedContent);
    };
    renderCard();
  }, [containerCardInstance, mode, onAction, children, props]);

  return <>{content}</>;
}