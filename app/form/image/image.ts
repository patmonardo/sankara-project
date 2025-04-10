import type { OperationResult } from "@/data/schema/base";
import { ImageShape } from "@/form/schema/image";
import { Form } from "@/form/form/form";

export abstract class Image<T extends ImageShape> extends Form<T> {
  constructor(protected readonly data?: Record<string, any>) {
    super(data);
  }
  protected abstract createForm(): Promise<T>;
  protected abstract editForm(): Promise<T>;
}
