import { FormSection } from "@/form/schema/form";
import { createMorph } from "../core";
import { FormShape } from "./types";
import { FormContext, isFormContext } from "./types";

/**
 * Shape after sections have been applied.
 */
export interface SectionShape extends FormShape {
  sections?: SectionField[];
  sectionsEnabled?: boolean;
  sectionCount?: number;
}

/**
 * Field with its assigned section.
 */
export interface SectionField extends FormSection {
  id: string;
  title: string;
  description?: string;
  fields: string[]; // No longer optional
}

/**
 * How to auto‑assign fields to sections.
 */
export interface SectionsOptions {
  fieldSections?: Record<string, string>;
  sectionOrder?: string[];
  removeEmpty?: boolean;
}

/**
 * Context extension for sectioning.
 */
export interface SectionContext extends FormContext {
  sectionsOptions?: SectionsOptions;
}
/**
 * Type guard to check if context is a valid SectionContext.
 */
export function isSectionContext(context: any): context is SectionContext {
  return true;
}

export const ApplySectionsMorph = createMorph<
  SectionShape,
  SectionShape
>(
  "ApplySectionsMorph",
  (shape, context) => {
    if (!isSectionContext(context)) return shape;

    const opts = context.sectionsOptions || {};

    // start from layout.sections or fall back to a single “default” section
    const base: SectionField[] =
      shape.layout?.sections?.map((sec) => ({
        id: sec.id,
        title: sec.title || "",
        description: sec.description,
        fields: [],
      })) || [];

    if (base.length === 0) {
      base.push({ id: "default", title: "Default", fields: [] });
    }

    // map them by id
    const map: Record<string, SectionField> = {};
    base.forEach((s) => (map[s.id] = { ...s }));

    // assign each field to its section
    shape.fields.forEach((f) => {
      if (!f.id) return;
      const sid =
        opts.fieldSections?.[f.id] ||
        (f as any).sectionId || // in case you seeded it
        "default";
      if (!map[sid]) {
        map[sid] = { id: sid, title: capitalize(sid), fields: [] };
      }
      const spec = map[sid];
      spec.fields?.push(f.id);
    });

    // optionally remove empty
    let secs = Object.values(map);
    if (opts.removeEmpty) {
      secs = secs.filter((s) => s.fields.length > 0);
    }

    // optionally reorder
    if (opts.sectionOrder) {
      secs.sort((a, b) => {
        const ai = opts.sectionOrder!.indexOf(a.id);
        const bi = opts.sectionOrder!.indexOf(b.id);
        if (ai < 0 && bi < 0) return 0;
        if (ai < 0) return 1;
        if (bi < 0) return -1;
        return ai - bi;
      });
    }

    return {
      ...shape,
      sectionsEnabled: Boolean(opts.fieldSections || shape.layout?.sections),
      sections: secs,
      sectionCount: secs.length,
    };
  },
  {
    pure: false,
    fusible: true,
    cost: 2,
  }
);

/** simple helper */
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}