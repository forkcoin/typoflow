export function calculateProgress(scrollTop: number, scrollHeight: number, clientHeight: number): number {
  const available = scrollHeight - clientHeight;
  if (available <= 0) {
    return 100;
  }
  return Math.max(0, Math.min(100, Math.round((scrollTop / available) * 100)));
}

export function shouldPersistProgress(previous: number, next: number): boolean {
  return Math.abs(previous - next) >= 5 || next === 100;
}
