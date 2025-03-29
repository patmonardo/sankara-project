import type { OperationResult } from "@/lib/data/schema/base";
import { ImageShape } from "@/ui/graphics/schema/image";
import { Form } from "@/ui/graphics/form/form";

export abstract class Image<T extends ImageShape> extends Form<T> {
  constructor(protected readonly data?: Record<string, any>) {
    super(data);
  }
  protected abstract createForm(): Promise<T>;
  protected abstract editForm(): Promise<T>;
}
