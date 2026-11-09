export function Spinner() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-10 text-[15px] text-[#52646F]"
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-[#DDE5EC] border-t-[#1B5FA6]"
      />
      <span>Carregando...</span>
    </div>
  );
}
