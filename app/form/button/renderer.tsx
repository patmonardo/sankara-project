//@/form/buttons/renderer.tsx
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ButtonShape } from "@/form/schema/button";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

/**
 * ButtonRenderer - Client Component
 * Handles client-side rendering, events, and browser APIs
 */
export function ButtonRenderer({ shape }: { shape: ButtonShape }) {
  const router = useRouter();
  const {
    variant,
    size,
    icon,
    label,
    href,
    onClick,
    disabled,
    confirmMessage,
    refreshAfterAction,
    srOnly,
    customClass,
    iconSource,
  } = shape;

  // Handle icon selection
  const iconElement = getIconElement(icon, iconSource);

  // Handle click with confirmation if needed
  const handleClick = async (e: React.MouseEvent) => {
    if (!onClick) return;

    if (confirmMessage && !window.confirm(confirmMessage)) {
      e.preventDefault();
      return;
    }

    await onClick(e);

    if (refreshAfterAction) {
      router.refresh();
    }
  };

  // Determine CSS classes
  const classes =
    customClass ||
    [
      "rounded-md border p-2 hover:bg-gray-100",
      variant === "primary" && "bg-blue-600 text-white hover:bg-blue-500",
      variant === "danger" && "text-red-600 hover:bg-red-50",
      disabled && "opacity-50 cursor-not-allowed",
    ]
      .filter(Boolean)
      .join(" ");

  // Return Link for href buttons, regular button otherwise
  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {srOnly && <span className="sr-only">{label}</span>}
        {!srOnly && label}
        {iconElement}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={handleClick}
      disabled={disabled}
    >
      {srOnly && <span className="sr-only">{label}</span>}
      {!srOnly && label}
      {iconElement}
    </button>
  );
}

/**
 * Helper to get the appropriate icon component
 */
function getIconElement(icon?: string, source = "heroicons"): ReactNode {
  if (!icon) return null;

  if (source === "heroicons") {
    const props = { className: "w-5" };
    switch (icon) {
      case "pencil":
        return <PencilIcon {...props} />;
      case "trash":
        return <TrashIcon {...props} />;
      case "plus":
        return <PlusIcon {...props} />;
      case "eye":
        return <EyeIcon {...props} />;
      case "cog":
        return <CogIcon {...props} />; // Add this line
      default:
        return null;
    }
  }

  // Custom icon handling
  return <span className={`icon icon-${icon} mr-2`} aria-hidden="true" />;
}
