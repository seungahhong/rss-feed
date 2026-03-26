'use client';

interface AiAnswerProps {
  answer: string;
}

export function AiAnswer({ answer }: AiAnswerProps) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-sm prose-p:text-sm prose-p:leading-relaxed">
      <div
        className="text-sm leading-relaxed text-foreground"
        dangerouslySetInnerHTML={{ __html: simpleMarkdown(answer) }}
      />
    </div>
  );
}

function simpleMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="rounded bg-surface-hover px-1 py-0.5 text-xs">$1</code>')
    .replace(/^### (.*$)/gm, '<h4 class="mt-3 mb-1 font-semibold">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="mt-3 mb-1 font-semibold">$1</h3>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
