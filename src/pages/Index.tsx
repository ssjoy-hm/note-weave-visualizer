import React, { useState, useEffect, useRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { cva, type VariantProps } from "class-variance-authority";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";
import {
  Trash2,
  FileText,
  Pencil,
  Link2,
  Plus,
  Search,
  ChevronRight,
  Calendar,
  Link,
} from "lucide-react";
import { toast } from "sonner";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  EdgeTypes,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Types
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

interface NoteLink {
  sourceId: string;
  targetId: string;
}

interface BacklinkReference {
  noteId: string;
  noteTitle: string;
  excerpt: string;
}

interface NoteNode {
  id: string;
  data: {
    label: string;
    noteId: string;
  };
  position: {
    x: number;
    y: number;
  };
}

interface NoteEdge {
  id: string;
  source: string;
  target: string;
}

interface GraphData {
  nodes: NoteNode[];
  edges: NoteEdge[];
}

// Utility Function - cn (class names)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Toast components
// Toast hook implementation
type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>;

type ToastActionElement = React.ReactElement<typeof ToastPrimitive.Action>;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & {
    variant?: "default" | "destructive";
  }
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  />
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

type ToastProviderProps = React.ComponentPropsWithoutRef<
  typeof ToastPrimitive.Provider
>;

const ToastProvider = ({ ...props }: ToastProviderProps) => {
  return <ToastPrimitive.Provider {...props} />;
};

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

// Toast hook
interface ToastState {
  toasts: Array<{
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: ToastActionElement;
    variant: "default" | "destructive";
  }>;
}

const createToastStore = (initialState: ToastState) => {
  return create<ToastState>()(() => initialState);
};

const useToast = createToastStore({
  toasts: [],
});

// Toaster component
function CustomToaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

// Sonner Toaster component
type SonnerToasterProps = React.ComponentProps<typeof SonnerToaster>;

const SonnerWrapper = ({ ...props }: SonnerToasterProps) => {
  // In a real implementation, we'd use useTheme(), but for simplicity
  // we'll just use a default theme
  const theme = "light";

  return (
    <SonnerToaster
      theme={theme as SonnerToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

// Tooltip Provider component
const TooltipProvider = TooltipPrimitive.Provider;

// Tooltip components
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// UI Component Implementations

// Button Component
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Input Component
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// Textarea Component
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// ScrollArea Component
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

// Separator Component
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

// Tabs Components
const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// AlertDialog Components
const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

// Dropdown Menu Components
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

// Utility functions for notes
/**
 * Find all mentions in a note's content
 * Mentions are enclosed in double brackets like [[Note Title]]
 */
function findMentions(content: string): string[] {
  const mentionRegex = /\[\[(.*?)\]\]/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  // Return unique mentions only
  return Array.from(new Set(mentions));
}

/**
 * Parse and render markdown content with interactive note links
 */
function parseMarkdownWithLinks(
  content: string,
  onLinkClick: (title: string) => void
): string {
  // Replace [[Note Title]] with <span class="note-link" data-title="Note Title">Note Title</span>
  return content.replace(
    /\[\[(.*?)\]\]/g,
    (_, title) =>
      `<span class="note-link" data-title="${title}">${title}</span>`
  );
}

// Helper function to extract a short excerpt around a mention
function extractExcerpt(content: string, mentionTitle: string): string {
  const mentionPattern = new RegExp(`\\[\\[${mentionTitle}\\]\\]`);
  const match = mentionPattern.exec(content);

  if (!match) return "";

  const startIndex = Math.max(0, match.index - 30);
  const endIndex = Math.min(content.length, match.index + match[0].length + 30);
  let excerpt = content.substring(startIndex, endIndex);

  // Add ellipsis if the excerpt doesn't start at the beginning or end at the end
  if (startIndex > 0) excerpt = "..." + excerpt;
  if (endIndex < content.length) excerpt = excerpt + "...";

  return excerpt;
}

// Function to get random position for graph nodes
const getRandomPosition = () => ({
  x: Math.random() * 500,
  y: Math.random() * 400,
});

// Note Store Implementation
interface NoteStore {
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  isCreatingNewNote: boolean;
  graphData: GraphData;

  // Actions
  createNote: (title: string) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setIsCreatingNewNote: (isCreating: boolean) => void;
  generateGraphData: () => GraphData;
  getBacklinks: (noteId: string) => BacklinkReference[];
}

const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [
    {
      id: "1",
      title: "Welcome to NoteWeave",
      content: `# Welcome to NoteWeave!

This is your first note. You can **edit** it or create new notes.

## Features
- Create and edit notes with Markdown
- Link notes together using [[brackets]]
- View connections in the graph visualizer
- Search for notes quickly

## How to Link Notes
To create a link to another note, use double brackets like this: [[Sample Note]].

Try creating more notes and linking them together!`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ["welcome"],
    },
    {
      id: "2",
      title: "Sample Note",
      content: `# Sample Note

This is an example note that's linked from the [[Welcome to NoteWeave]] note.

You can create links between notes to build a network of connected ideas.

## Backlinks
Backlinks will automatically appear at the bottom of notes when other notes link to this one.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ["example"],
    },
  ],
  activeNoteId: "1",
  searchQuery: "",
  isCreatingNewNote: false,
  graphData: { nodes: [], edges: [] },

  createNote: (title) => {
    const id = uuidv4();
    const newNote: Note = {
      id,
      title,
      content: `# ${title}\n\nStart writing your note here...`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    };

    set((state) => ({
      notes: [...state.notes, newNote],
      activeNoteId: id,
      isCreatingNewNote: false,
    }));

    // Update graph after creating a note
    get().generateGraphData();
  },

  updateNote: (id, data) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...data, updatedAt: new Date().toISOString() }
          : note
      ),
    }));

    // Update graph after updating a note as links might have changed
    get().generateGraphData();
  },

  deleteNote: (id) => {
    set((state) => {
      // If the active note is being deleted, set activeNoteId to the first available note or null
      const activeNoteId =
        state.activeNoteId === id
          ? state.notes.length > 1
            ? state.notes.find((note) => note.id !== id)?.id || null
            : null
          : state.activeNoteId;

      return {
        notes: state.notes.filter((note) => note.id !== id),
        activeNoteId,
      };
    });

    // Update graph after deleting a note
    get().generateGraphData();
  },

  setActiveNote: (id) => {
    set({ activeNoteId: id });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setIsCreatingNewNote: (isCreating) => {
    set({ isCreatingNewNote: isCreating });
  },

  generateGraphData: () => {
    const { notes } = get();

    // Create nodes for each note
    const nodes: NoteNode[] = notes.map((note) => ({
      id: note.id,
      data: {
        label: note.title,
        noteId: note.id,
      },
      position: getRandomPosition(),
    }));

    // Create edges based on mentions in notes
    const edges: NoteEdge[] = [];

    notes.forEach((sourceNote) => {
      const mentions = findMentions(sourceNote.content);

      mentions.forEach((mention) => {
        // Find the target note by title
        const targetNote = notes.find(
          (note) => note.title.toLowerCase() === mention.toLowerCase()
        );

        if (targetNote) {
          const edgeId = `${sourceNote.id}-${targetNote.id}`;

          // Check if this edge already exists to avoid duplicates
          if (!edges.some((edge) => edge.id === edgeId)) {
            edges.push({
              id: edgeId,
              source: sourceNote.id,
              target: targetNote.id,
            });
          }
        }
      });
    });

    const graphData = { nodes, edges };
    set({ graphData });
    return graphData;
  },

  getBacklinks: (noteId) => {
    const { notes } = get();
    const currentNote = notes.find((note) => note.id === noteId);

    if (!currentNote) {
      return [];
    }

    const backlinks: BacklinkReference[] = [];

    notes.forEach((note) => {
      if (note.id === noteId) return; // Skip the current note

      // Check if the note mentions the current note
      const mentions = findMentions(note.content);
      if (mentions.includes(currentNote.title)) {
        // Extract a short excerpt around the mention
        const excerpt = extractExcerpt(note.content, currentNote.title);

        backlinks.push({
          noteId: note.id,
          noteTitle: note.title,
          excerpt,
        });
      }
    });

    return backlinks;
  },
}));

// Sidebar Component Implementation
const Sidebar: React.FC = () => {
  const {
    notes,
    activeNoteId,
    searchQuery,
    isCreatingNewNote,
    setActiveNote,
    setSearchQuery,
    setIsCreatingNewNote,
    createNote,
    getBacklinks,
  } = useNoteStore();
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNote = () => {
    if (newNoteTitle.trim()) {
      createNote(newNoteTitle.trim());
      setNewNoteTitle("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateNote();
    } else if (e.key === "Escape") {
      setIsCreatingNewNote(false);
    }
  };

  const toggleExpand = (noteId: string) => {
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "Unknown date";
    }
  };

  return (
    <div className="h-full flex flex-col bg-sidebar p-4 border-r">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-noteweave-600 dark:text-noteweave-400">
          NoteWeave
        </h1>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setIsCreatingNewNote(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      {isCreatingNewNote && (
        <div className="mb-4 p-2 bg-card rounded-md border">
          <Input
            placeholder="Note title..."
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreatingNewNote(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCreateNote}
              disabled={!newNoteTitle.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 -mx-2">
        <div className="px-2 space-y-1">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => {
              const mentions = findMentions(note.content);
              const backlinks = getBacklinks(note.id);
              const isExpanded = expandedNoteId === note.id;
              const isActive = activeNoteId === note.id;

              return (
                <div key={note.id} className="mb-1">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start flex items-center ${
                        isActive ? "bg-accent" : ""
                      }`}
                      onClick={() => setActiveNote(note.id)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span className="truncate">{note.title}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(note.id);
                      }}
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          isExpanded ? "transform rotate-90" : ""
                        }`}
                      />
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="ml-7 mt-1 mb-2 text-xs space-y-2 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {formatDate(note.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Updated: {formatDate(note.updatedAt)}</span>
                      </div>

                      {mentions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Link className="h-3 w-3" />
                            <span className="font-medium">Links:</span>
                          </div>
                          <div className="ml-4">
                            {mentions.map((mention) => (
                              <div
                                key={mention}
                                className="truncate cursor-pointer hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const targetNote = notes.find(
                                    (n) =>
                                      n.title.toLowerCase() ===
                                      mention.toLowerCase()
                                  );
                                  if (targetNote) setActiveNote(targetNote.id);
                                }}
                              >
                                {mention}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {backlinks.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Link className="h-3 w-3 transform rotate-180" />
                            <span className="font-medium">Backlinks:</span>
                          </div>
                          <div className="ml-4">
                            {backlinks.map((backlink) => (
                              <div
                                key={backlink.noteId}
                                className="truncate cursor-pointer hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveNote(backlink.noteId);
                                }}
                              >
                                {backlink.noteTitle}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              {searchQuery ? "No matching notes found" : "No notes yet"}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// NoteContent Component
interface NoteContentProps {
  content: string;
  onLinkClick: (title: string) => void;
}

const NoteContent: React.FC<NoteContentProps> = ({ content, onLinkClick }) => {
  // For server-side rendering support, we check if window is defined
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Add event listener for note links when the DOM is ready
    const handleNoteLinks = () => {
      document.querySelectorAll(".note-link").forEach((element) => {
        if (element instanceof HTMLElement && element.dataset.title) {
          element.addEventListener("click", () => {
            onLinkClick(element.dataset.title || "");
          });
        }
      });
    };

    // Execute after the component renders
    handleNoteLinks();

    // Clean up on unmount
    return () => {
      document.querySelectorAll(".note-link").forEach((element) => {
        if (element instanceof HTMLElement) {
          element.replaceWith(element.cloneNode(true));
        }
      });
    };
  }, [content, onLinkClick]);

  // Convert markdown to HTML - Fix the Promise<string> issue
  let rawHTML = "";
  try {
    // Use markdownString option to ensure synchronous parsing
    const options = { breaks: true, async: false };
    rawHTML = marked.parse(content, options) as string;
  } catch (error) {
    rawHTML = content;
    console.error("Error parsing markdown:", error);
  }

  // Process HTML with DOMPurify
  const sanitizedHTML = DOMPurify.sanitize(rawHTML);

  // Replace mentions with interactive links
  const processedHtml = parseMarkdownWithLinks(sanitizedHTML, onLinkClick);

  return (
    <div
      className="markdown prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
};

// Backlinks Component
interface BacklinksListProps {
  noteId: string;
  onLinkClick: (title: string) => void;
}

const BacklinksList: React.FC<BacklinksListProps> = ({
  noteId,
  onLinkClick,
}) => {
  const { getBacklinks } = useNoteStore();
  const backlinks = getBacklinks(noteId);

  if (!backlinks.length) return null;

  return (
    <div className="mt-10">
      <Separator className="my-4" />
      <div className="flex items-center gap-2 text-sm text-noteweave-600 dark:text-noteweave-400 mb-2">
        <Link2 className="h-4 w-4" />
        <h3 className="font-semibold">
          {backlinks.length} {backlinks.length === 1 ? "Mention" : "Mentions"}
        </h3>
      </div>
      <div className="space-y-3">
        {backlinks.map((backlink) => (
          <div
            key={backlink.noteId}
            className="p-3 rounded-md bg-muted/50 cursor-pointer hover:bg-muted"
            onClick={() => onLinkClick(backlink.noteTitle)}
          >
            <div className="font-medium mb-1">{backlink.noteTitle}</div>
            <div
              className="text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: backlink.excerpt.replace(
                  /\[\[(.*?)\]\]/g,
                  (_, title) => `<span class="note-link">${title}</span>`
                ),
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Note Graph Component
interface NoteGraphProps {
  onNodeClick: (nodeId: string) => void;
}

const nodeTypes: NodeTypes = {};
const edgeTypes: EdgeTypes = {};

const NoteGraph: React.FC<NoteGraphProps> = ({ onNodeClick }) => {
  const { notes, activeNoteId, setActiveNote, graphData } = useNoteStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const reactFlowInstance = useReactFlow();

  // Initialize or update the graph when graphData changes
  useEffect(() => {
    if (graphData) {
      // Create nodes with formatted data
      const formattedNodes = graphData.nodes.map((node) => {
        // Check if this is the active note
        const isActive = node.data.noteId === activeNoteId;

        return {
          ...node,
          style: {
            background: isActive ? "#4338ca" : "#f9fafb",
            color: isActive ? "white" : "black",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "10px",
            fontSize: "12px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            width: 150,
          },
        };
      });

      // Create edges with formatted data
      const formattedEdges = graphData.edges.map((edge) => ({
        ...edge,
        animated: true,
        style: { stroke: "#4f46e5", strokeWidth: 2 },
      }));

      setNodes(formattedNodes);
      setEdges(formattedEdges);
    }
  }, [graphData, activeNoteId, setNodes, setEdges]);

  const onConnect = React.useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    // Fix the type issue by explicitly checking for the noteId property
    if (node.data && typeof node.data.noteId === "string") {
      const noteId = node.data.noteId;
      onNodeClick(noteId);
    }
  };

  useEffect(() => {
    // If we have nodes, re-center the view
    if (nodes.length > 0) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  }, [nodes, reactFlowInstance]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

// Graph Visualizer Component
const GraphVisualizer: React.FC = () => {
  const { setActiveNote } = useNoteStore();

  const handleNodeClick = (noteId: string) => {
    setActiveNote(noteId);
  };

  return (
    <div className="h-full">
      <ReactFlowProvider>
        <NoteGraph onNodeClick={handleNodeClick} />
      </ReactFlowProvider>
    </div>
  );
};

// Note Editor Component
const NoteEditor: React.FC = () => {
  const { notes, activeNoteId, updateNote, deleteNote, setActiveNote } =
    useNoteStore();
  const [editedContent, setEditedContent] = useState<string>("");
  const [editedTitle, setEditedTitle] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeNote = notes.find((note) => note.id === activeNoteId);

  useEffect(() => {
    if (activeNote) {
      setEditedContent(activeNote.content);
      setEditedTitle(activeNote.title);
    }
  }, [activeNote]);

  const handleSaveChanges = () => {
    if (!activeNoteId) return;

    updateNote(activeNoteId, {
      title: editedTitle,
      content: editedContent,
    });

    toast.success("Note saved successfully");
  };

  const handleDeleteNote = () => {
    if (!activeNoteId) return;
    deleteNote(activeNoteId);
    toast.success("Note deleted successfully");
  };

  const handleNoteNavigation = (title: string) => {
    const targetNote = notes.find(
      (note) => note.title.toLowerCase() === title.toLowerCase()
    );

    if (targetNote) {
      setActiveNote(targetNote.id);
    } else {
      // Create a new note if one doesn't exist with this title
      const shouldCreateNote = window.confirm(
        `Note "${title}" doesn't exist. Create it?`
      );

      if (shouldCreateNote) {
        const store = useNoteStore.getState();
        store.createNote(title);
      }
    }
  };

  // Auto-save when user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        activeNoteId &&
        (editedContent !== activeNote?.content ||
          editedTitle !== activeNote?.title)
      ) {
        handleSaveChanges();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [editedContent, editedTitle]);

  if (!activeNote) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">No Note Selected</h2>
          <p className="text-muted-foreground">
            Select a note from the sidebar or create a new one.
          </p>
        </div>
      </div>
    );
  }

  const mentions = findMentions(activeNote.content);
  const hasMentions = mentions.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4 bg-gradient-to-r from-secondary/80 to-background">
        <div className="flex items-center justify-between">
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="text-xl font-semibold border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            onBlur={handleSaveChanges}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{activeNote.title}"? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteNote}
                  className="bg-destructive text-destructive-foreground"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="text-xs text-muted-foreground mt-1 flex gap-3">
          <span>
            Created: {new Date(activeNote.createdAt).toLocaleString()}
          </span>
          <span>
            Updated: {new Date(activeNote.updatedAt).toLocaleString()}
          </span>
        </div>
        {hasMentions && (
          <div className="mt-2 text-xs">
            <span className="font-medium">Links: </span>
            {mentions.map((mention, i) => (
              <span
                key={mention}
                className="inline-block bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs mr-2 cursor-pointer hover:bg-secondary/80"
                onClick={() => handleNoteNavigation(mention)}
              >
                {mention}
              </span>
            ))}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-background to-secondary/10">
        <div className="pb-12 relative">
          <div className="bg-secondary/30 rounded-md p-3 mb-4 text-sm">
            <p className="font-medium">Creating Links:</p>
            <p>
              Type <code className="bg-muted px-1 rounded">[[Note Title]]</code>{" "}
              to link to another note.
            </p>
          </div>

          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[60vh] font-mono text-sm resize-none border-muted rounded-lg shadow-inner bg-white/80 dark:bg-gray-800/80"
              placeholder="Start writing your note..."
            />
          </div>

          <BacklinksList
            noteId={activeNote.id}
            onLinkClick={handleNoteNavigation}
          />
        </div>
      </ScrollArea>
    </div>
  );
};

// Main Index Component
const Index: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("editor");
  const { generateGraphData } = useNoteStore();

  // Generate graph data when component mounts
  useEffect(() => {
    generateGraphData();
  }, [generateGraphData]);

  return (
    <TooltipProvider>
      <CustomToaster />
      <SonnerWrapper />
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 h-full border-r">
            <Sidebar />
          </div>

          <div className="flex-1 h-full flex flex-col">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col h-full"
            >
              <div className="border-b px-4 py-2">
                <TabsList>
                  <TabsTrigger
                    value="editor"
                    className="flex items-center gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger
                    value="graph"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Graph
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="editor"
                className="flex-1 overflow-hidden m-0"
              >
                <NoteEditor />
              </TabsContent>

              <TabsContent value="graph" className="flex-1 overflow-hidden m-0">
                <GraphVisualizer />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Index;
