import { Button } from '@/form/button/button';
import { ButtonShape } from '@/form/schema/button';

export interface ActionButtonProps extends Partial<ButtonShape> {
  action: string;
}

/**
 * ActionButton - A button that performs a specific action
 */
export class ActionButton extends Button<ButtonShape> {
  constructor(private props: ActionButtonProps) {
    super();
  }

  protected getButtonShape(): ButtonShape {
    return {
      id: this.props.id || `action-${this.props.action}`,
      label: this.props.label || this.props.action,
      variant: this.props.variant || 'primary',
      size: this.props.size || 'md',
      icon: this.props.icon,
      onClick: this.props.onClick,
      disabled: this.props.disabled || false,
    };
  }
}

// Functional component
export function ActionButtonForm(props: ActionButtonProps) {
  const button = new ActionButton(props);
  const [content, setContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    async function renderButton() {
      const rendered = await button.render('create', 'jsx', {
        submit: (form, data) => {
          console.log(`Action button ${props.action} clicked`);
          if (props.onClick) {
            props.onClick(new Event('click') as any);
          }
        }
      });
      setContent(rendered);
    }
    
    renderButton();
  }, [button, props]);

  return <>{content}</>;
}