export function BlockStuds({ className = '' }: { className?: string }) {
  return <div className={`block-studs ${className}`} aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} />)}</div>
}
