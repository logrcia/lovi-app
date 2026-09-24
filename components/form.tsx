import * as React from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const fieldInputClass =
  "border-2 border-ink bg-parchment text-foreground shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-fucsia";

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor} className="text-ink">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input ref={ref} className={cn(fieldInputClass, className)} {...props} />
));
TextInput.displayName = "TextInput";

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <Textarea
    ref={ref}
    className={cn(fieldInputClass, "min-h-24", className)}
    {...props}
  />
));
TextArea.displayName = "TextArea";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border-2 border-ink bg-parchment px-3 py-1 text-base shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fucsia disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}