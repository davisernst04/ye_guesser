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
 * Lets the bottom sheet be dragged down to close, like a native sheet.
 * Touch and mouse both work. A drag starts only on a downward swipe while
 * nothing under the pointer is scrolled, so lists inside the sheet still scroll.
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

    const start = (x: number, y: number, time: number, target: EventTarget | null) => {
      decided = dragging = false
      offset = 0
      canDrag = true
      for (let el = target as HTMLElement | null; canDrag && el && el !== sheet.parentElement; el = el.parentElement) {
        if (el.scrollTop > 0) canDrag = false
      }
      startX = x
      startY = y
      lastTime = time
      velocity = 0
    }

    /** Returns true while the sheet follows the pointer. */
    const move = (x: number, y: number, time: number) => {
      if (!canDrag) return false
      const dx = x - startX
      const dy = y - startY
      if (!decided) {
        if (Math.hypot(dx, dy) < 6) return false
        decided = true
        dragging = dy > 0 && dy > Math.abs(dx)
        if (dragging) {
          sheet.style.transition = "none"
          sheet.style.userSelect = "none"
          window.getSelection()?.removeAllRanges()
        }
      }
      if (!dragging) return false
      const next = Math.max(0, dy)
      velocity = (next - offset) / Math.max(1, time - lastTime)
      lastTime = time
      offset = next
      sheet.style.transform = `translateY(${offset}px)`
      return true
    }

    /** Returns true if a drag just ended. */
    const end = (time: number) => {
      canDrag = false
      if (!dragging) return false
      dragging = false
      sheet.style.userSelect = ""
      // A downward flick closes the sheet even after a short drag,
      // unless the pointer stopped before it let go.
      const flick = velocity > 0.4 && time - lastTime < 100
      if (offset > sheet.offsetHeight / 4 || (offset > 40 && flick)) {
        // The exit animation starts from where the pointer left the sheet.
        closeRef.current?.click()
      } else {
        sheet.style.transition = "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)"
        sheet.style.transform = ""
      }
      return true
    }

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]!
      start(touch.clientX, touch.clientY, event.timeStamp, event.target)
      if (event.touches.length !== 1) canDrag = false
    }
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]!
      if (move(touch.clientX, touch.clientY, event.timeStamp)) event.preventDefault()
    }
    const onTouchEnd = (event: TouchEvent) => end(event.timeStamp)

    // Touch uses the touch events above, because only they can stop the page from scrolling.
    const onMouseMove = (event: PointerEvent) => move(event.clientX, event.clientY, event.timeStamp)
    // A drag that starts and ends on a button must not also press it.
    const swallowClick = (event: MouseEvent) => event.stopPropagation()
    const onMouseUp = (event: PointerEvent) => {
      window.removeEventListener("pointermove", onMouseMove)
      window.removeEventListener("pointerup", onMouseUp)
      window.removeEventListener("pointercancel", onMouseUp)
      if (end(event.timeStamp)) {
        window.addEventListener("click", swallowClick, { capture: true, once: true })
        setTimeout(() => window.removeEventListener("click", swallowClick, { capture: true }))
      }
    }
    const onMouseDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return
      start(event.clientX, event.clientY, event.timeStamp, event.target)
      window.addEventListener("pointermove", onMouseMove)
      window.addEventListener("pointerup", onMouseUp)
      window.addEventListener("pointercancel", onMouseUp)
    }

    sheet.addEventListener("touchstart", onTouchStart, { passive: true })
    sheet.addEventListener("touchmove", onTouchMove, { passive: false })
    sheet.addEventListener("touchend", onTouchEnd)
    sheet.addEventListener("touchcancel", onTouchEnd)
    sheet.addEventListener("pointerdown", onMouseDown)
    return () => {
      sheet.removeEventListener("touchstart", onTouchStart)
      sheet.removeEventListener("touchmove", onTouchMove)
      sheet.removeEventListener("touchend", onTouchEnd)
      sheet.removeEventListener("touchcancel", onTouchEnd)
      sheet.removeEventListener("pointerdown", onMouseDown)
      window.removeEventListener("pointermove", onMouseMove)
      window.removeEventListener("pointerup", onMouseUp)
      window.removeEventListener("pointercancel", onMouseUp)
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
          // A bottom sheet on every screen. Wider screens center it with auto margins,
          // because a translate would fight the slide animation.
          "fixed inset-x-0 bottom-0 z-50 mx-auto grid max-h-[92dvh] w-full gap-5 overflow-y-auto rounded-t-[28px] border-t border-glass-edge bg-neutral-900/85 px-5 pt-9 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-2xl ease-spring outline-none sm:max-w-md sm:border-x sm:px-6",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:duration-500 data-[state=closed]:duration-300",
          className
        )}
        {...props}
      >
        {/* Floats, so content such as artwork can run to the top edge under it. */}
        <div aria-hidden className="absolute top-2 left-1/2 z-10 h-1.5 w-10 -translate-x-1/2 rounded-full bg-white/35" />
        {children}
        <DialogPrimitive.Close ref={closeRef} className="absolute top-4 right-4 z-10 grid size-8 place-items-center rounded-full bg-black/35 text-label-2 backdrop-blur-md transition-[transform,background-color] duration-200 ease-spring hover:bg-white/20 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ye/60 focus-visible:outline-none active:scale-90 [&_svg]:size-4">
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
