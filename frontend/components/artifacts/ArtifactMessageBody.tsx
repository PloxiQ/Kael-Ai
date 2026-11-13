"use client";

import {
  FileArtifactCard,
  parseMessageContent,
} from "../FileArtifacts";
import MarkdownMessage from "../MarkdownMessage";
import ArtifactCard from "./ArtifactCard";
import {
  parseArtifactSegments,
  type KaelArtifact,
} from "./artifactParser";

export default function ArtifactMessageBody({
  content,
  onOpenArtifact,
  streaming = false,
}: {
  content: string;
  onOpenArtifact: (artifact: KaelArtifact) => void;
  streaming?: boolean;
}) {
  const segments = parseArtifactSegments(content, { streaming });

  return (
    <div className="space-y-5">
      {segments.map((segment, segmentIndex) => {
        if (segment.type === "artifact") {
          return (
            <ArtifactCard
              key={`artifact-${segment.artifact.id}-${segmentIndex}`}
              artifact={segment.artifact}
              onOpen={onOpenArtifact}
            />
          );
        }

        const fileSegments = parseMessageContent(segment.content);

        return fileSegments.map((fileSegment, fileIndex) => {
          if (fileSegment.type === "file") {
            return (
              <FileArtifactCard
                key={`file-${segmentIndex}-${fileIndex}-${fileSegment.artifact.id}`}
                artifact={fileSegment.artifact}
              />
            );
          }

          return fileSegment.content.trim() ? (
            <MarkdownMessage
              key={`text-${segmentIndex}-${fileIndex}`}
              content={fileSegment.content}
            />
          ) : null;
        });
      })}
    </div>
  );
}
