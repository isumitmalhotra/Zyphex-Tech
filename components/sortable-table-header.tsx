import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { SortDirection } from "@/hooks/use-sortable-data"

interface SortableTableHeaderProps {
  label: string
  sortKey: string
  currentSortKey?: string | null
  sortDirection?: SortDirection
  onSort: (key: string) => void
  className?: string
  align?: "left" | "center" | "right"
}

export function SortableTableHeader({
  label,
  sortKey,
  currentSortKey,
  sortDirection,
  onSort,
  className,
  align = "left"
}: SortableTableHeaderProps) {
  const isActive = currentSortKey === sortKey
  
  const getSortIcon = () => {
    if (!isActive || !sortDirection) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    return <ArrowDown className="ml-2 h-4 w-4" />
  }

  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right"
  }[align]

  return (
    <TableHead className={cn(alignClass, className)}>
      <Button
        variant="ghost"
        onClick={() => onSort(sortKey)}
        className={cn(
          "-ml-3 h-8 data-[state=open]:bg-accent",
          isActive && "text-primary"
        )}
      >
        {label}
        {getSortIcon()}
      </Button>
    </TableHead>
  )
}
