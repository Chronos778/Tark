import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface ReadAloudButtonProps {
  text: string;
  messageIndex: number;
  isSpeaking: boolean;
  speakingMessageIndex: number | null;
  onReadAloud: (text: string, index: number) => void;
}

export const ReadAloudButton = ({
  text,
  messageIndex,
  isSpeaking,
  speakingMessageIndex,
  onReadAloud,
}: ReadAloudButtonProps) => {
  const isThisMessageSpeaking = isSpeaking && speakingMessageIndex === messageIndex;

  return (
    <div className="mt-3 flex items-center gap-2 not-prose">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onReadAloud(text, messageIndex)}
        className="h-8 px-3 text-xs text-gray-400 hover:text-white hover:bg-[#27272a] transition-colors"
      >
        {isThisMessageSpeaking ? (
          <>
            <VolumeX className="w-3.5 h-3.5 mr-1.5" />
            Stop Reading
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 mr-1.5" />
            Read Aloud
          </>
        )}
      </Button>
    </div>
  );
};
