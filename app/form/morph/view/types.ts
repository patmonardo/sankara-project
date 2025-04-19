import { FormShape, FormField } from "../../schema/form";
import { ViewContext, isViewContext } from "../mode";
import { createPipeline, createMorph } from "../morph";
import {
  determineDisplayType,
  shouldIncludeField,
  extractFieldValue,
  getFieldLabel,
} from "./extract";
import { getDefaultFormat, formatValueForDisplay } from "./format";

// --- Define Core View Interfaces ---
// (ViewField and ViewOutput interfaces remain as before)
export interface ViewField {
  id: string;
  type: string;
  label: string;
  value?: any;
  displayValue?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  visible?: boolean;
  format?: string;
  meta?: {
    mode?: "view";
    styles?: Record<string, any>;
    originalType?: string;
    validationState?: "idle" | "error" | "success";
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ViewOutput {
  id: string;
  fields: ViewField[];
  mode: "view";
  format?: string;
  meta?: {
    title?: string;
    description?: string;
    styles?: Record<string, any>;
    [key: string]: any;
  };
}
