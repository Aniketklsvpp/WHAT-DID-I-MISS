import { type ScoredMessage } from '../lib/score';

interface MessageContentProps {
  msg: Pick<ScoredMessage, 'text' | 'maskedText'>;
  revealPii: boolean;
  showAiView: boolean;
}

export function MessageContent({ msg, revealPii, showAiView }: MessageContentProps) {
  const renderChips = (text: string) => {
    const parts = text.split(/(\[(?:PHONE|EMAIL|UPI|OTP|CARD|ACCOUNT|ID)(?: ••••\d{2,4})?\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span key={i} aria-label={`Masked ${part.slice(1, -1)} token`} className="inline-block px-1.5 py-0.5 mx-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-sm border-2 border-primary shadow-[1px_1px_0px_#000000]">
            {part.slice(1, -1)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (showAiView) {
    return (
      <div className="flex flex-col gap-2 w-full mt-1 font-normal">
        {revealPii && (
          <div className="p-2 border-l-4 border-primary bg-surface-container-low rounded-r-md">
            <div className="text-[10px] uppercase font-bold text-primary mb-1 tracking-wider">Original</div>
            <div className="whitespace-pre-wrap">{msg.text}</div>
          </div>
        )}
        <div className="p-2 border-l-4 border-secondary bg-surface-container-low rounded-r-md">
          <div className="text-[10px] uppercase font-bold text-secondary mb-1 tracking-wider">What the AI sees</div>
          <div className="whitespace-pre-wrap">{renderChips(msg.maskedText)}</div>
        </div>
      </div>
    );
  }

  return (
    <span className="whitespace-pre-wrap">
      {revealPii ? msg.text : renderChips(msg.maskedText)}
    </span>
  );
}
