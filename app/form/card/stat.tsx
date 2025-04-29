import React from "react";
import { StatCardMorphInput, StatCardPipeline } from "./card-morph";
import type { StatCardShape } from "@/form/schema/card";
import type { FormMode, FormContent, FormHandler } from "@/form/schema/form";
import { Card } from "./card";

/**
 * StatCard specialized class for statistical displays
 */
export class StatCard<T extends StatCardShape> extends Card<T> {
  constructor(protected readonly data: T) {
    super(data);
  }

  // Override render to use stat card pipeline
  async render(
    mode: FormMode,
    content: FormContent,
    handler: FormHandler
  ): Promise<React.ReactNode | string> {
    if (content !== "jsx") {
      return this.data.layout.title || "Stat Card";
    }

    // Get the card shape based on current mode
    const shape = await this[`${mode}Form`]();
    
    // Use the stat card pipeline
    return StatCardPipeline.transform(
      { 
        shape,
        handler: {
          onAction: handler.onAction,
        }
      }, 
      { shape }
    );
  }
}

// Functional component for convenient JSX usage
export default function StatCardForm(props: StatCardShape & {
  mode?: FormMode,
  onAction?: (actionId: string, data: StatCardShape) => void
}) {
  const { mode = "view", onAction, ...cardProps } = props;
  const statCardInstance = new StatCard(props);
  const [content, setContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    const renderCard = async () => {
      const handler: FormHandler = onAction
        ? {
            onAction: (id, data) => onAction(id, data),
          }
        : {} as FormHandler;

      const renderedContent = await statCardInstance.render(
        mode,
        "jsx",
        handler
      );
      setContent(renderedContent);
    };
    renderCard();
  }, [statCardInstance, mode, onAction, props]);

  return <>{content}</>;
}