import { normalizeText } from '../search';

interface SearchHighlightProps {
  text: string;
  query?: string;
  className?: string;
}

export function SearchHighlight({ text, query = '', className = '' }: SearchHighlightProps) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <span className={className}>{text}</span>;
  }

  const normText = normalizeText(text);
  const normQuery = normalizeText(trimmed);
  const index = normText.indexOf(normQuery);

  if (index === -1) {
    return <span className={className}>{text}</span>;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + trimmed.length);
  const after = text.slice(index + trimmed.length);

  return (
    <span className={className}>
      {before}
      <span className="hit">{match}</span>
      {after}
    </span>
  );
}
