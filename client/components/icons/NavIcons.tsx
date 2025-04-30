import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils/utils";

export function IconLeft({ className, ...props }:  React.SVGProps<SVGSVGElement>) {
  return <ChevronLeft className={cn("h-4 w-4", className)} {...props} />;
}

export function IconRight({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return <ChevronRight className={cn("h-4 w-4", className)} {...props} />;
}
