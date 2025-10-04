"use client"
import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
  className?: string
  placeholder?: string
  bgColor?: string
  textColor?: string
  borderColor?: string
  hoverBgColor?: string
  selectedBgColor?: string
  selectedTextColor?: string
  todayBgColor?: string
  rangeMiddleBgColor?: string
  mutedTextColor?: string
}

export function DateRangePicker({
  date,
  onDateChange,
  className,
  placeholder = "Seleccionar rango de fechas",
  bgColor = "bg-slate-900",
  textColor = "text-white",
  borderColor = "border-slate-700",
  hoverBgColor = "hover:bg-slate-800",
  selectedBgColor = "bg-white",
  selectedTextColor = "text-slate-900",
  todayBgColor = "bg-slate-700",
  rangeMiddleBgColor = "bg-slate-700",
  mutedTextColor = "text-slate-500"
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              bgColor,
              textColor,
              borderColor,
              hoverBgColor,
              "hover:text-white",
              !date && mutedTextColor
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy", { locale: es })} -{" "}
                  {format(date.to, "dd/MM/yyyy", { locale: es })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale: es })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-auto p-0", bgColor, borderColor)} align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={1}
            locale={es}
            pagedNavigation={true}
            className={cn(bgColor, textColor)}
            classNames={{
              months: cn(bgColor, textColor),
              month: cn(bgColor, textColor),
              caption: cn(bgColor, textColor),
              caption_label: textColor,
              nav: bgColor,
              nav_button: cn(textColor, hoverBgColor),
              nav_button_previous: cn(textColor, hoverBgColor),
              nav_button_next: cn(textColor, hoverBgColor),
              table: bgColor,
              head_row: bgColor,
              head_cell: mutedTextColor,
              row: bgColor,
              cell: cn(bgColor, textColor),
              day: cn(textColor, hoverBgColor, "hover:text-white"),
              day_selected: cn(selectedBgColor, selectedTextColor, "hover:bg-gray-200 hover:text-slate-900 font-medium"),
              day_today: cn(todayBgColor, textColor),
              day_outside: mutedTextColor,
              day_disabled: mutedTextColor,
              day_range_start: cn(selectedBgColor, selectedTextColor, "hover:bg-gray-200"),
              day_range_end: cn(selectedBgColor, selectedTextColor, "hover:bg-gray-200"),
              day_range_middle: cn(rangeMiddleBgColor, textColor, "hover:bg-slate-600"),
              day_hidden: "invisible",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}