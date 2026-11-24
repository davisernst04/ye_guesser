"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-sm duration-300",
        className
      )}
      {...props}
    />
  )
}

/**
 * Lets the phone bottom sheet be dragged down to close, like a native sheet.
 * A drag starts only on a downward swipe while nothing under the finger is
 * scrolled, so lists inside the sheet still scroll normally.
 */
function useSwipeToClose(
  sheet: HTMLDivElement | null,
  closeRef: React.RefObject<HTMLButtonElement | null>
) {
  React.useEffect(() => {
    if (!sheet) return

    let startX = 0
    let startY = 0
    let lastTime = 0
    let velocity = 0
    let canDrag = false
    let decided = false
    let dragging = false
    let offset = 0

    const onStart = (event: TouchEvent) => {
      decided = dragging = false
      offset = 0
      // Wider screens show a centered card, not a sheet.
      canDrag = event.touches.length === 1 && !window.matchMedia("(min-width: 40rem)").matches
      for (let el = event.target as HTMLElement | null; canDrag && el && el !== sheet.parentElement; el = el.parentElement) {
        if (el.scrollTop > 0) canDrag = false
      }
      const touch = event.touches[0]!
      startX = touch.clientX
      startY = touch.clientY
      lastTime = event.timeStamp
      velocity = 0
    }

    const onMove = (event: TouchEvent) => {
      if (!canDrag) return
      const touch = event.touches[0]!
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      if (!decided) {
        if (Math.hypot(dx, dy) < 6) return
        decided = true
        dragging = dy > 0 && dy > Math.abs(dx)
        if (dragging) sheet.style.transition = "none"
      }
      if (!dragging) return
      event.preventDefault()
      const next = Math.max(0, dy)
      velocity = (next - offset) / Math.max(1, event.timeStamp - lastTime)
      lastTime = event.timeStamp
      offset = next
      sheet.style.transform = `translateY(${offset}px)`
    }

    const onEnd = (event: TouchEvent) => {
      if (!dragging) return
      dragging = false
      // A downward flick closes the sheet even after a short drag,
      // unless the finger stopped before it let go.
      const flick = velocity > 0.4 && event.timeStamp - lastTime < 100
      if (offset > sheet.offsetHeight / 4 || (offset > 40 && flick)) {
        // The exit animation starts from where the finger left the sheet.
        closeRef.current?.click()
        return
      }
      sheet.style.transition = "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)"
      sheet.style.transform = ""
    }

    sheet.addEventListener("touchstart", onStart, { passive: true })
    sheet.addEventListener("touchmove", onMove, { passive: false })
    sheet.addEventListener("touchend", onEnd)
    sheet.addEventListener("touchcancel", onEnd)
    return () => {
      sheet.removeEventListener("touchstart", onStart)
      sheet.removeEventListener("touchmove", onMove)
      sheet.removeEventListener("touchend", onEnd)
      sheet.removeEventListener("touchcancel", onEnd)
    }
  }, [sheet, closeRef])
}

function DialogContent({
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  // State, not a ref: the sheet mounts only when the dialog opens.
  const [sheet, setSheet] = React.useState<HTMLDivElement | null>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  useSwipeToClose(sheet, closeRef)
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      setSheet(node)
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        ref={setRefs}
        className={cn(
          // A bottom sheet on phones, a centered card on wider screens.
          "fixed inset-x-0 bottom-0 z-50 grid max-h-[92dvh] w-full gap-5 overflow-y-auto rounded-t-[28px] border-t border-glass-edge bg-neutral-900/85 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-2xl ease-spring outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:duration-500 data-[state=closed]:duration-300",
          "sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:border sm:p-6",
          "sm:data-[state=open]:slide-in-from-bottom-8 sm:data-[state=closed]:slide-out-to-bottom-8 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      >
        <div aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-white/25 sm:hidden" />
        {children}
        <DialogPrimitive.Close ref={closeRef} className="absolute top-4 right-4 grid size-8 place-items-center rounded-full bg-glass-strong text-label-2 transition-[transform,background-color] duration-200 ease-spring hover:bg-white/20 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ye/60 focus-visible:outline-none active:scale-90 [&_svg]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1 pr-10 text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-2xl leading-tight font-bold tracking-tight", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-label-2 text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
