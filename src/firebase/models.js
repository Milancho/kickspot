/* Lightweight domain models. Each knows how to read from a plain Firestore
 * document. Identity rules: a team is its set of player IDs (not names);
 * players/matches/availability carry IDs so stats credit the right people. */

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

export class Team {
  constructor({
    id = null,
    name = "",
    nickname = "",
    date = "",
    playerIds = [],
    playerNames = [],
    wins = 0,
    losses = 0,
  } = {}) {
    this.id = id;
    this.name = name;
    this.nickname = nickname;
    this.date = date;
    this.playerIds = playerIds;
    this.playerNames = playerNames;
    this.wins = wins;
    this.losses = losses;
  }

  static fromFirestore(id, data) {
    return new Team({ id, ...data });
  }
}

export class MatchResult {
  constructor({
    id = null,
    date = "",
    team1Id = null,
    team2Id = null,
    team1Name = "",
    team2Name = "",
    team1PlayerIds = [],
    team2PlayerIds = [],
    team1Players = [],
    team2Players = [],
    score1 = 0,
    score2 = 0,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id;
    this.date = date;
    this.team1Id = team1Id;
    this.team2Id = team2Id;
    this.team1Name = team1Name;
    this.team2Name = team2Name;
    this.team1PlayerIds = team1PlayerIds;
    this.team2PlayerIds = team2PlayerIds;
    this.team1Players = team1Players;
    this.team2Players = team2Players;
    this.score1 = score1;
    this.score2 = score2;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(id, data) {
    return new MatchResult({ id, ...data });
  }

  get winnerName() {
    if (this.score1 === this.score2) return null;
    return this.score1 > this.score2 ? this.team1Name : this.team2Name;
  }
}

export class Availability {
  constructor({
    id = null,
    date = "",
    playerId = null,
    playerName = "",
    isAvailable = false,
    updatedAt = null,
  } = {}) {
    this.id = id;
    this.date = date;
    this.playerId = playerId;
    this.playerName = playerName;
    this.isAvailable = isAvailable;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(id, data) {
    return new Availability({ id, ...data });
  }
}
