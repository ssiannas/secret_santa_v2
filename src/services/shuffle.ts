import { Room } from "../types/room";

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

function shuffleParticipantsInRoom(room: Room): Record<string, string> {
  const givers = [...room.participants];
  const receivers = [...room.participants];
  const assignments: Record<string, string> = {};

  do {
    shuffleArray(receivers);
  } while (givers.some((p, i) => p.email === receivers[i].email));

  givers.forEach((p, i) => {
    assignments[p.email] = receivers[i].email;
  });

  room.status = "shuffled";
  return assignments;
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}