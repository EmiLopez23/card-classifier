import { FileText, Loader2, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "./ui/dropzone";

interface UploadCardProps {
  files: File[] | undefined;
  filePreview: string | undefined;
  isAnalyzing: boolean;
  handleDrop: (acceptedFiles: File[]) => void;
  handleError: (error: Error) => void;
  handleSubmit: () => void;
}

export default function UploadCard({
  files,
  filePreview,
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
          maxFiles={1}
          maxSize={1024 * 1024 * 10} // 10MB
          onDrop={handleDrop}
          onError={handleError}
          src={files}
          className="min-h-[200px] h-full"
          disabled={isAnalyzing}
        >
          <DropzoneEmptyState />
          <DropzoneContent>
            {files && files.length > 0 && (
              <>
                {filePreview ? (
                  <div className="relative rounded-lg overflow-hidden h-[400px]">
                    <img
                      alt="Preview"
                      className="w-full h-full object-contain"
                      src={filePreview}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                      <FileText className="h-12 w-12 text-red-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{files[0].name}</p>
                      <p className="text-muted-foreground text-xs">
                        Click or drag to replace
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </DropzoneContent>
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
              Analyzing Card...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Analyze Card
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
