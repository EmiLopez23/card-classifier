import { Loader2, Upload, Lightbulb } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "./ui/dropzone";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface UploadCardProps {
  files: File[] | undefined;
  isAnalyzing: boolean;
  hint?: string;
  onHintChange?: (hint: string) => void;
  handleDrop: (acceptedFiles: File[]) => void;
  handleError: (error: Error) => void;
  handleSubmit: () => void;
}

export default function UploadCard({
  files,
  isAnalyzing,
  hint,
  onHintChange,
  handleDrop,
  handleError,
  handleSubmit,
}: UploadCardProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex-1 space-y-4 flex flex-col">
        {/* Optional Hint Input */}
        <div className="space-y-2">
          <Label
            htmlFor="hint"
            className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
          >
            <Lightbulb className="h-4 w-4" />
            Optional Hint (helps the AI agent)
          </Label>
          <Input
            id="hint"
            placeholder="e.g., 'Focus on the player stats' or 'Check for authenticity'"
            value={hint}
            onChange={(e) => onHintChange?.(e.target.value)}
            disabled={isAnalyzing}
            className="text-sm"
          />
        </div>
        {/* Dropzone Component */}
        <Dropzone
          accept={{
            "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
            "application/pdf": [".pdf"],
          }}
          maxFiles={10}
          maxSize={1024 * 1024 * 10} // 10MB
          onDrop={handleDrop}
          onError={handleError}
          src={files}
          className="flex-1"
          disabled={isAnalyzing}
        >
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
      </CardContent>
      <CardFooter>
        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!files || files.length === 0 || isAnalyzing}
          onClick={handleSubmit}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {`Analyze ${files?.length ?? 0} ${
                files && files.length === 1 ? "Card" : "Cards"
              }`}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
