import React from "react";
import { CardMorphInput, CardPipeline } from "./card-morph";
import type { CardShape } from "@/form/schema/card";
import type { FormMode, FormContent, FormHandler } from "@/form/schema/shape";
import { Form } from "@/form/form/form";

/**
 * Card component for displaying a simple card
 */
export class Card<T extends CardShape> extends Form<T> {
  constructor(protected readonly data: T) {
    super(data);
  }

  protected async getCardShape(mode: FormMode): Promise<T> {
    const {
      title,
      value,
      label,
      description,
      type = "default",
      icon,
      actions = [],
    } = this.data.layout;

    // Mode-specific customizations
    if (mode === "view") {
      return {
        ...this.data,
        layout: {
          ...this.data.layout,
        },
      } as T;
    }
    else if (mode === "edit") {
      return {
        ...this.data,
        layout: {
          ...this.data.layout,
          title: `Edit ${title}`,
          actions: [
            {
              id: "save",
              label: "Save Changes",
              type: "primary",
              variant: "primary",
            },
            {
              id: "cancel",
              label: "Cancel",
              type: "secondary",
              variant: "secondary",
            },
          ],
        },
      } as T;
    }
    else { // create mode
      return {
        ...this.data,
        layout: {
          ...this.data.layout,
          title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
          value: "",
          label: "",
          description: "",
          actions: [
            {
              id: "create",
              label: "Create",
              type: "primary",
              variant: "primary",
            },
            {
              id: "cancel",
              label: "Cancel",
              type: "secondary",
              variant: "secondary",
            },
          ],
        },
      } as T;
    }
  }

  // Implement the abstract methods from Form
  protected async viewForm(): Promise<T> {
    return this.getCardShape("view");
  }

  protected async createForm(): Promise<T> {
    return this.getCardShape("create");
  }

  protected async editForm(): Promise<T> {
    return this.getCardShape("edit");
  }

  // Render method that uses our morphology pipeline
  async render(
    mode: FormMode,
    content: FormContent,
    handler: FormHandler
  ): Promise<React.ReactNode | string> {
    if (content !== "jsx") {
      return this.data.layout.title || "Card";
    }

    // Get the card shape based on current mode
    const shape = await this[`${mode}Form`]();
    
    // Use our morphology pipeline
    return CardPipeline.transform(
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

// Functional component for direct JSX usage
export default function CardForm(props: CardShape & {
  mode?: FormMode,
  onAction?: (actionId: string, data: CardShape) => void
}) {
  const { mode = "view", onAction, ...cardProps } = props;
  const cardInstance = new Card(cardProps as CardShape);
  const [content, setContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    const renderCard = async () => {
      const handler: FormHandler = onAction
        ? {
            onAction: (id, data) => onAction(id, data),
          }
        : {} as FormHandler;

      const renderedContent = await cardInstance.render(
        mode,
        "jsx",
        handler
      );
      setContent(renderedContent);
    };
    renderCard();
  }, [cardInstance, mode, onAction, props]);

  return <>{content}</>;
}

// Knowledge domain card classes
export class ConceptCard<T extends CardShape> extends Card<T> {}
export class TextCard<T extends CardShape> extends Card<T> {}
export class RelationCard<T extends CardShape> extends Card<T> {}
export class ExplorationCard<T extends CardShape> extends Card<T> {}