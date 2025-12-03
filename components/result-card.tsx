import { PSACardWithCertification } from "@/lib/schemas";
import { Card, CardContent } from "./ui/card";
import {
  FileText,
  Loader2,
  XCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Image,
  CheckCircle,
  Search,
  FileType,
  Database,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ResultCardProps {
  result:
    | (PSACardWithCertification & {
        description?: string;
        webSearchResults?: any[];
        savedToDatabase?: boolean;
        cardId?: string;
      })
    | null;
  error: string | null;
  loading: boolean;
}

export default function ResultCard({
  result,
  error,
  loading,
}: ResultCardProps) {
  if (loading) {
    return (
      <Card className="shadow-none">
        <CardContent className="flex-1 items-center justify-center flex flex-col gap-4">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-600 dark:text-neutral-400" />
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Analyzing card...
            </p>
            <AnalysisProgress loading={loading} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !result && !loading) {
    return (
      <Card className="shadow-none">
        <CardContent className="flex-1 items-center justify-center flex flex-col gap-2">
          <XCircle className="size-6 text-red-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-500">
              There was an error analyzing your card
            </h3>
            <p className="text-md text-red-500 max-w-lg">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="shadow-none flex-1">
        <CardContent className="flex-1 items-center justify-center flex flex-col gap-2">
          <FileText className="size-6 text-neutral-600 dark:text-neutral-400" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">
              Your output will be shown here
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Upload your card to see your output
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none">
      <CardContent className="flex-1 flex flex-col gap-4 justify-between">
        {/* Database Status */}
        {result.savedToDatabase && result.cardId && (
          <DatabaseStatus cardId={result.cardId} />
        )}
        {/* Certification Status */}
        {result.certification && (
          <CertificationStatus certification={result.certification} />
        )}
        {/* AI-Generated Description */}
        {result.description && (
          <AIDescription
            description={result.description}
            webSearchResults={result.webSearchResults}
          />
        )}
        {/* PSA Information */}
        <PSAInformation psa={result.psa} />
        {/* Player Information */}
        <PlayerInformation player={result.player} />
        {/* Card Details */}
        <CardDetails card={result.card} />
        {/* Additional Information */}
        <AdditionalInformation metadata={result.metadata} />
      </CardContent>
    </Card>
  );
}

const DatabaseStatus = ({ cardId }: { cardId: string }) => {
  return (
    <div className="border rounded-lg p-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-green-900 dark:text-green-100">
            Saved to Database
          </h3>
          <p className="text-xs text-green-700 dark:text-green-300">
            Card ID:{" "}
            <code className="bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">
              {cardId}
            </code>
          </p>
        </div>
      </div>
    </div>
  );
};

const AIDescription = ({
  description,
  webSearchResults,
}: {
  description: string;
  webSearchResults?: any[];
}) => {
  const [showSources, setShowSources] = useState(false);

  return (
    <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-base text-blue-900 dark:text-blue-100">
          AI-Generated Description
        </h3>
      </div>
      <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed whitespace-pre-wrap">
        {description}
      </p>
      {webSearchResults && webSearchResults.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowSources(!showSources)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            {showSources ? "Hide" : "Show"} Web Sources (
            {webSearchResults.length})
          </button>
          {showSources && (
            <div className="mt-2 space-y-2">
              {webSearchResults.map((result, idx) => (
                <a
                  key={idx}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs p-2 bg-white dark:bg-neutral-800 rounded border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    {result.title} <ExternalLink className="h-3 w-3" />
                  </div>
                  {result.content && (
                    <div className="text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
                      {result.content}
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CertificationStatus = ({
  certification,
}: {
  certification: PSACardWithCertification["certification"];
}) => {
  if (!certification) return null;

  const isValid = certification.isValid;
  const certNumber = certification.certificationNumber;
  const details = certification.details;
  const psaUrl =
    details?.url ||
    (certNumber ? `https://www.psacard.com/cert/${certNumber}` : null);

  return (
    <div className="border rounded-lg p-3 bg-neutral-50 dark:bg-neutral-900">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          {isValid ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          )}
          Certification Status
        </h3>
        {psaUrl && (
          <a
            href={psaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Verify <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded ${
              isValid
                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
            }`}
          >
            {isValid ? "Verified" : "Pending Verification"}
          </span>
        </div>
        {details?.note && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {details.note}
          </p>
        )}
        {details?.verified === false && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Could not verify online - please verify manually
          </p>
        )}
      </div>
    </div>
  );
};

const PSAInformation = ({ psa }: { psa: PSACardWithCertification["psa"] }) => {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-1 text-neutral-900 dark:text-neutral-100">
        PSA Certification
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Cert Number
          </p>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">
            {psa.certificationNumber}
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Grade
          </p>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">
            {psa.grade} - {psa.gradeLabel}
          </p>
        </div>
        {psa.autographGrade && (
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Autograph Grade
            </p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {psa.autographGrade}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const PlayerInformation = ({
  player,
}: {
  player: PSACardWithCertification["player"];
}) => {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-1 text-neutral-900 dark:text-neutral-100">
        Player
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Name</p>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">
            {player.name}
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Team</p>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">
            {player.team}
          </p>
        </div>
        {player.position && (
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Position
            </p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {player.position}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const CardDetails = ({ card }: { card: PSACardWithCertification["card"] }) => {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-1 text-neutral-900 dark:text-neutral-100">
        Card Details
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Year</p>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">
            {card.year}
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Brand
          </p>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">
            {card.brand}
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Set</p>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">
            {card.setName}
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Card Number
          </p>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">
            #{card.cardNumber}
          </p>
        </div>
        {card.variant && (
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Variant
            </p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {card.variant}
            </p>
          </div>
        )}
        {card.serialNumber && (
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Serial Number
            </p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {card.serialNumber}
            </p>
          </div>
        )}
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Features
          </p>
          <div className="flex gap-2 mt-1">
            {card.rookie && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                Rookie
              </span>
            )}
            {card.autographed && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                Auto
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdditionalInformation = ({
  metadata,
}: {
  metadata: PSACardWithCertification["metadata"];
}) => {
  return (
    (metadata.rarity || metadata.estimatedValue || metadata.description) && (
      <div>
        <h3 className="font-semibold text-lg mb-1 text-neutral-900 dark:text-neutral-100">
          Additional Info
        </h3>
        <div className="space-y-2">
          {metadata.rarity && (
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Rarity
              </p>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {metadata.rarity}
              </p>
            </div>
          )}
          {metadata.estimatedValue && (
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Estimated Value
              </p>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {metadata.estimatedValue}
              </p>
            </div>
          )}
          {metadata.description && (
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Description
              </p>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {metadata.description}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  );
};

const AnalysisProgress = ({ loading }: { loading: boolean }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: "Extract", icon: Image },
    { label: "Validate", icon: CheckCircle },
    { label: "Certify", icon: Search },
    { label: "Describe", icon: Sparkles },
    { label: "Embed", icon: FileType },
    { label: "Save", icon: Database },
  ];

  useEffect(() => {
    if (!loading) {
      setCurrentStep(steps.length); // All steps completed
      return;
    }

    // Cycle through steps to show progress
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          return 0; // Reset to first step for continuous animation
        }
        return prev + 1;
      });
    }, 1500); // Change step every 1.5 seconds

    return () => clearInterval(interval);
  }, [loading, steps.length]);

  const getStepState = (index: number): "pending" | "active" | "completed" => {
    if (!loading) return "completed";
    if (index < currentStep) return "completed";
    if (index === currentStep) return "active";
    return "pending";
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-3">
      {steps.map((step, index) => {
        const state = getStepState(index);
        const IconComponent = step.icon;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  state === "active"
                    ? "bg-blue-500 dark:bg-blue-600 text-white shadow-lg scale-110"
                    : state === "completed"
                    ? "bg-green-500 dark:bg-green-600 text-white"
                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500"
                }`}
              >
                {state === "active" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : state === "completed" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <IconComponent className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-300 ${
                  state === "active"
                    ? "text-blue-600 dark:text-blue-400"
                    : state === "completed"
                    ? "text-green-600 dark:text-green-400"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`w-8 h-0.5 mx-2 transition-colors duration-300 ${
                  state === "completed"
                    ? "bg-green-500 dark:bg-green-600"
                    : index < currentStep
                    ? "bg-green-500 dark:bg-green-600"
                    : "bg-neutral-300 dark:bg-neutral-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
