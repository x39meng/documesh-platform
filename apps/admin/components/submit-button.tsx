"use client";

import { useFormStatus } from "react-dom";
import { Button, ButtonProps } from "@repo/ui/components/button";

interface SubmitButtonProps extends ButtonProps {
  children: React.ReactNode;
  loadingText?: string;
}

export function SubmitButton({ children, loadingText, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending || disabled} {...props}>
      {children}
    </Button>
  );
}
