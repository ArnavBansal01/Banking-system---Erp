import React from "react";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const handleToastClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const toastEl = (e.target as HTMLElement).closest("[data-sonner-toast]");
    if (toastEl) {
      const toastId = toastEl.getAttribute("data-id");
      if (toastId) {
        toast.dismiss(toastId);
      } else {
        toast.dismiss();
      }
    }
  };

  return (
    <div onClick={handleToastClick}>
      <Sonner
        className="toaster group"
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg cursor-pointer hover:border-primary/40 active:scale-[0.98] transition-all select-none",
            description: "group-[.toast]:text-muted-foreground",
            actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            closeButton:
              "group-[.toast]:bg-muted group-[.toast]:text-foreground hover:group-[.toast]:bg-accent hover:group-[.toast]:text-accent-foreground",
          },
        }}
        {...props}
      />
    </div>
  );
};

export { Toaster };

