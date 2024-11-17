export function shuffleParticipants<T>(arr: T[]): { giver: T; receiver: T }[] {
  if (arr.length < 2) {
    throw new Error('Array must contain at least 2 elements');
  }

  // Shuffle the array to randomize pairings
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  const result: { giver: T; receiver: T }[] = [];

  for (let i = 0; i < shuffled.length; i++) {
    const giver = shuffled[i];
    const receiver = shuffled[(i + 1) % shuffled.length]; // Circular pairing
    result.push({ giver, receiver });
  }

  return result;
}