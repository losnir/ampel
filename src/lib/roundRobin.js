export default function RoundRobin (N) {
  let current = 0;
  return () => current++ % N;
}