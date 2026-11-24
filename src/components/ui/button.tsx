import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Pill buttons that press in under the finger, like iOS controls.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium select-none transition-[transform,background-color,color,opacity,box-shadow] duration-200 ease-spring active:scale-[0.96] active:duration-75 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ye/60 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-white text-black shadow-[0_8px_24px_-8px_rgb(0_0_0/0.6)] hover:bg-white/90",
        destructive: "bg-miss/15 text-miss hover:bg-miss/25",
        outline: "border border-glass-edge bg-glass text-foreground backdrop-blur-xl hover:bg-glass-strong",
        secondary: "bg-glass-strong text-foreground backdrop-blur-xl hover:bg-white/20",
        ghost: "text-foreground hover:bg-glass",
        link: "text-ye underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-11 px-5 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-3.5 text-xs has-[>svg]:px-3",
        lg: "h-12 px-7 text-base has-[>svg]:px-5",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
