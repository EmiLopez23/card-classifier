import { PSACard } from "@/lib/schemas";
import { Card, CardContent } from "./ui/card";
import { FileText, Loader2, XCircle } from "lucide-react";

interface ResultCardProps {
  result: PSACard | null;
  error: string | null;
  loading: boolean;
}

export default function ResultCard({
  result,
  error,
  loading,
}: ResultCardProps) {
  console.log(result, error, loading);
  if (loading) {
    return (
      <Card className="shadow-none">
        <CardContent className="flex-1 items-center justify-center flex flex-col gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-600 dark:text-neutral-400" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Analyzing card...
          </p>
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
      <Card className="shadow-none">
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
      <CardContent className="flex-1 flex flex-col gap-2 justify-between">
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

const PSAInformation = ({ psa }: { psa: PSACard["psa"] }) => {
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

const PlayerInformation = ({ player }: { player: PSACard["player"] }) => {
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

const CardDetails = ({ card }: { card: PSACard["card"] }) => {
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
  metadata: PSACard["metadata"];
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
