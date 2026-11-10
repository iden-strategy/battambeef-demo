import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

// Brand buttons. Colours come from surface tokens, so the same variant works on the dark base
// and on the light and kraft accent surfaces. Tailwind v4 `hover:` only applies on devices that
// can hover. Only transform animates (press feedback); colours switch instantly.
// Focus: the global :focus-visible outline uses --ring (kraft on dark, crimson on light,
// charcoal on kraft), drawn 3px outside the button so it sits on the surface, not the fill.
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-sans font-semibold whitespace-nowrap transition-transform duration-150 ease-out select-none active:scale-[0.97] disabled:pointer-events-none aria-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Crimson fill. Disabled drops the fill (a faded crimson would vanish on charcoal).
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover data-[state=hover]:bg-primary-hover data-[state=pressed]:scale-[0.97] data-[state=pressed]:bg-primary-hover disabled:bg-card disabled:text-muted-foreground aria-disabled:bg-card aria-disabled:text-muted-foreground",
        outline:
          "border-[1.5px] border-current bg-transparent text-foreground hover:bg-foreground hover:text-background data-[state=hover]:bg-foreground data-[state=hover]:text-background data-[state=pressed]:scale-[0.97] data-[state=pressed]:bg-foreground data-[state=pressed]:text-background disabled:opacity-45 aria-disabled:opacity-45",
        ghost:
          "bg-transparent text-foreground hover:bg-foreground/12 data-[state=hover]:bg-foreground/12 data-[state=pressed]:scale-[0.97] data-[state=pressed]:bg-foreground/18 disabled:opacity-45 aria-disabled:opacity-45",
        // Kraft on dark, crimson on light, charcoal on kraft (crimson there is large-text only).
        link: "rounded-none px-0 text-link underline decoration-1 underline-offset-4 hover:decoration-2 data-[state=hover]:decoration-2 disabled:opacity-45 aria-disabled:opacity-45",
      },
      size: {
        default: "h-11 px-6 text-[0.9375rem]",
        sm: "h-11 px-4 text-sm",
        lg: "h-13 px-8 text-base",
        icon: "size-11",
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
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
