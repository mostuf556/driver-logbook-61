import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getSuggestions } from "@/lib/contacts";
import type { AppSettings, AutocompleteField, Contact } from "@/lib/types";

interface Props {
  field: AutocompleteField;
  value: string;
  onChange: (v: string) => void;
  onPickContact?: (c: Contact) => void;
  contacts: Contact[];
  settings: AppSettings;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  id?: string;
  required?: boolean;
}

export function FieldAutocomplete({
  field,
  value,
  onChange,
  onPickContact,
  contacts,
  settings,
  placeholder,
  type = "text",
  inputMode,
  id,
  required,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const suggestions = open ? getSuggestions(field, value, contacts, settings) : [];

  useEffect(() => {
    if (suggestions.length === 0 && open) {
      // keep open false-ish if nothing matches
    }
  }, [suggestions.length, open]);

  const labelFor = (c: Contact) => {
    switch (field) {
      case "firstName":
        return c.firstName;
      case "lastName":
        return c.lastName;
      case "idNumber":
        return c.idNumber;
      case "phone":
        return c.phone;
      case "company":
        return c.company;
      case "carNumber":
        return c.carNumbers?.[0] ?? "";
      default:
        return "";
    }
  };

  return (
    <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          id={id}
          ref={ref}
          type={type}
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-1 w-(--radix-popover-trigger-width)"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ul className="max-h-64 overflow-auto">
          {suggestions.map((c, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(labelFor(c));
                  if (settings.autoFillOnSelect && onPickContact) onPickContact(c);
                  setOpen(false);
                }}
                className="w-full rounded px-2 py-1.5 text-right text-sm hover:bg-accent"
              >
                <div className="font-medium">{labelFor(c)}</div>
                <div className="text-xs text-muted-foreground">
                  {[c.firstName, c.lastName, c.idNumber, c.company].filter(Boolean).join(" · ")}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}