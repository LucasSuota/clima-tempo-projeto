export function MissingValue({ text = 'Não informado' }: { text?: string }) {
  return <span className="text-sm leading-5 text-[#52646F] italic">{text}</span>;
}
