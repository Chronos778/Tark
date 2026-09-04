import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import curatedData from "@/data/key_bns_mappings.json";
import rawData from "@/data/ipc_bns.json";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export interface LawSection {
  topic: string;
  bns: string;
  ipc: string | null;
  description: string;
  text_bns: string;
  text_ipc: string | null;
  change_type?: string; 
  summary_of_change?: string;
}

// Merge Logic: Prioritize Curated > Filtered Raw (only with IPC text)
const getMergedData = (): LawSection[] => {
    // 1. Start with high-quality curated data and map to LawSection interface
    const curatedDataAny = curatedData as any[];
    const curated: LawSection[] = curatedDataAny.map(item => ({
        topic: item.bns_title,
        bns: item.bns_section,
        ipc: item.ipc_section,
        description: item.summary_of_change,
        text_bns: item.text_bns,
        text_ipc: item.text_ipc,
        change_type: item.change_type,
        summary_of_change: item.summary_of_change
    }));

    const curatedBnsIds = new Set(curated.map(i => i.bns));

    // 2. Filter raw data: Must have IPC text AND not be in curated list
    const filteredRaw = (rawData as LawSection[]).filter(item => 
        item.text_ipc !== null && // Only if "they have both sides of data"
        item.text_ipc !== "Pending IPC Dataset Ingestion" &&
        !curatedBnsIds.has(item.bns)
    );

    return [...curated, ...filteredRaw];
};

const lawData = getMergedData();

interface LawSearchProps {
  onSelect: (section: LawSection) => void;
  className?: string;
}

export function LawSearch({ onSelect, className }: LawSearchProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [selectedSection, setSelectedSection] = useState<LawSection | null>(null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
            <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
                "relative w-full h-14 justify-between bg-black/50 border-white/10 text-gray-400 hover:text-white hover:bg-black/70 hover:border-white/20 backdrop-blur-xl rounded-xl px-4 transition-all duration-300",
                className
            )}
            >
            <div className="flex items-center gap-3 w-full overflow-hidden">
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                    <Search className="h-4 w-4 text-purple-400" />
                </div>
                {selectedSection ? (
                    <div className="flex flex-col items-start truncate">
                        <span className="text-sm font-medium text-white">
                            Section {selectedSection.bns}
                        </span>
                        <span className="text-xs text-gray-500 truncate max-w-[280px]">
                            {selectedSection.topic}
                        </span>
                    </div>
                ) : (
                    <span className="text-base font-medium">Search for a BNS Section...</span>
                )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0 bg-[#0A0A0B]/95 border-white/10 text-gray-300 backdrop-blur-2xl shadow-2xl rounded-xl">
        <Command className="bg-transparent">
          <CommandInput 
            placeholder="Type 'Murder', 'Theft', or '103'..." 
            className="text-white placeholder:text-gray-600 h-12 border-none focus:ring-0" 
          />
          <CommandList className="max-h-[350px] overflow-y-auto custom-scrollbar p-1">
            <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                No section found.
            </CommandEmpty>
            <CommandGroup heading="BNS Sections" className="text-gray-500">
              {lawData.map((section) => (
                <CommandItem
                  key={section.bns}
                  value={`${section.bns} ${section.topic} ${section.description}`}
                  onSelect={() => {
                    setValue(section.bns);
                    setSelectedSection(section);
                    onSelect(section);
                    setOpen(false);
                  }}
                  className="aria-selected:bg-white/10 aria-selected:text-white rounded-lg px-3 py-2.5 my-0.5 cursor-pointer transition-colors"
                >
                  <Check
                    className={cn(
                      "mr-3 h-4 w-4 text-purple-500",
                      value === section.bns ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-200">
                                Sec {section.bns}
                            </span>
                            {section.ipc && (
                                <span className="text-[10px] uppercase tracking-wider bg-white/5 text-gray-500 px-1.5 py-0.5 rounded border border-white/5">
                                    IPC {section.ipc}
                                </span>
                            )}
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 truncate">
                        {section.topic}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
