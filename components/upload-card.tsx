import { Loader2, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "./ui/dropzone";

interface UploadCardProps {
  files: File[] | undefined;
  isAnalyzing: boolean;
  handleDrop: (acceptedFiles: File[]) => void;
  handleError: (error: Error) => void;
  handleSubmit: () => void;
}

export default function UploadCard({
  files,
  isAnalyzing,
  handleDrop,
  handleError,
  handleSubmit,
}: UploadCardProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex-1">
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
          className="min-h-[200px] h-full"
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
              {`Analyze ${files?.length ?? 0} ${files && files.length === 1 ? "Card" : "Cards"}`}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
