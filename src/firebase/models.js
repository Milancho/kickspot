/* Lightweight domain models. Each knows how to read from / write to a plain
 * Firestore document. Keeping these here means pages never touch raw snapshot
 * shapes directly. */

export class Player {
  constructor({
    id = null,
    name = "",
    nickname = "",
    wins = 0,
    losses = 0,
    isDeleted = false,
    createdAt = null,
  } = {}) {
    this.id = id;
    this.name = name;
    this.nickname = nickname;
    this.wins = wins;
    this.losses = losses;
    this.isDeleted = isDeleted;
    this.createdAt = createdAt;
  }

  static fromFirestore(id, data) {
    return new Player({ id, ...data });
  }

  toFirestore() {
    return {
      name: this.name,
      nickname: this.nickname,
      wins: this.wins,
      losses: this.losses,
      isDeleted: this.isDeleted,
      createdAt: this.createdAt,
    };
  }
}
