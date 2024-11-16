export function shuffleParticipants(participants: string[]) {
  const shuffled = [...participants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return participants.map((person, index) => ({
    giver: person,
    receiver: shuffled[index]
  }));
}
