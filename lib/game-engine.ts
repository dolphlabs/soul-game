export interface GameState {
  score: number
  level: number
  streak: number
  timeLeft: number
  isPlaying: boolean
  isPaused: boolean
  gameMode: "classic" | "speed" | "endless" | "challenge"
  difficulty: "easy" | "normal" | "hard" | "expert"
  colorsMatched: number
  perfectMatches: number
  maxStreak: number
  timePlayed: number
  powerUpsUsed: string[]
  bonusMultiplier: number
  lives: number
  isGameOver: boolean
}

export interface ColorChallenge {
  id: string
  targetColor: string
  targetColorName: string
  options: ColorOption[]
  timeLimit: number
  difficulty: number
}

export interface ColorOption {
  id: string
  color: string
  colorName: string
  isCorrect: boolean
}

export class GameEngine {
  private gameState: GameState
  private gameTimer: NodeJS.Timeout | null = null
  private challengeTimer: NodeJS.Timeout | null = null
  private onStateChange: (state: GameState) => void
  private onChallengeChange: (challenge: ColorChallenge) => void
  private onGameEnd: (finalScore: number) => void

  private gameColors = [
    { name: "red", color: "#dc2626", variants: ["#ef4444", "#f87171", "#fca5a5"] },
    { name: "orange", color: "#f59e0b", variants: ["#f97316", "#fb923c", "#fdba74"] },
    { name: "blue", color: "#3b82f6", variants: ["#2563eb", "#60a5fa", "#93c5fd"] },
    { name: "green", color: "#10b981", variants: ["#059669", "#34d399", "#6ee7b7"] },
    { name: "purple", color: "#8b5cf6", variants: ["#7c3aed", "#a78bfa", "#c4b5fd"] },
    { name: "pink", color: "#ec4899", variants: ["#db2777", "#f472b6", "#f9a8d4"] },
    { name: "yellow", color: "#eab308", variants: ["#ca8a04", "#facc15", "#fde047"] },
    { name: "teal", color: "#14b8a6", variants: ["#0d9488", "#2dd4bf", "#5eead4"] },
  ]

  constructor(
    onStateChange: (state: GameState) => void,
    onChallengeChange: (challenge: ColorChallenge) => void,
    onGameEnd: (finalScore: number) => void,
  ) {
    this.onStateChange = onStateChange
    this.onChallengeChange = onChallengeChange
    this.onGameEnd = onGameEnd
    this.gameState = this.getInitialState()
  }

  private getInitialState(): GameState {
    return {
      score: 0,
      level: 1,
      streak: 0,
      timeLeft: 60,
      isPlaying: false,
      isPaused: false,
      gameMode: "classic",
      difficulty: "normal",
      colorsMatched: 0,
      perfectMatches: 0,
      maxStreak: 0,
      timePlayed: 0,
      powerUpsUsed: [],
      bonusMultiplier: 1.0,
      lives: 3,
      isGameOver: false,
    }
  }

  startGame(mode: GameState["gameMode"] = "classic", difficulty: GameState["difficulty"] = "normal") {
    this.gameState = {
      ...this.getInitialState(),
      gameMode: mode,
      difficulty: difficulty,
      isPlaying: true,
      timeLeft: this.getInitialTime(mode, difficulty),
    }

    this.startGameTimer()
    this.generateNewChallenge()
    this.onStateChange(this.gameState)
  }

  private getInitialTime(mode: GameState["gameMode"], difficulty: GameState["difficulty"]): number {
    const baseTimes = { classic: 60, speed: 30, endless: 120, challenge: 45 }
    const difficultyMultipliers = { easy: 1.5, normal: 1.0, hard: 0.8, expert: 0.6 }
    return Math.floor(baseTimes[mode] * difficultyMultipliers[difficulty])
  }

  private startGameTimer() {
    this.gameTimer = setInterval(() => {
      if (this.gameState.isPlaying && !this.gameState.isPaused) {
        this.gameState.timeLeft -= 1
        this.gameState.timePlayed += 1

        if (this.gameState.timeLeft <= 0) {
          this.endGame()
        } else {
          this.onStateChange(this.gameState)
        }
      }
    }, 1000)
  }

  private generateNewChallenge() {
    const difficultySettings = {
      easy: { options: 3, timeLimit: 5000, similarColors: false },
      normal: { options: 4, timeLimit: 4000, similarColors: true },
      hard: { options: 5, timeLimit: 3000, similarColors: true },
      expert: { options: 6, timeLimit: 2500, similarColors: true },
    }

    const settings = difficultySettings[this.gameState.difficulty]
    const targetColorData = this.gameColors[Math.floor(Math.random() * this.gameColors.length)]
    const targetColor =
      settings.similarColors && Math.random() > 0.5
        ? targetColorData.variants[Math.floor(Math.random() * targetColorData.variants.length)]
        : targetColorData.color

    const options: ColorOption[] = []

    // Add correct answer
    options.push({
      id: "correct",
      color: targetColor,
      colorName: targetColorData.name,
      isCorrect: true,
    })

    // Add incorrect options
    const availableColors = this.gameColors.filter((c) => c.name !== targetColorData.name)
    for (let i = 0; i < settings.options - 1; i++) {
      const wrongColor = availableColors[Math.floor(Math.random() * availableColors.length)]
      const colorValue =
        settings.similarColors && Math.random() > 0.5
          ? wrongColor.variants[Math.floor(Math.random() * wrongColor.variants.length)]
          : wrongColor.color

      options.push({
        id: `wrong-${i}`,
        color: colorValue,
        colorName: wrongColor.name,
        isCorrect: false,
      })
    }

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }

    const challenge: ColorChallenge = {
      id: `challenge-${Date.now()}`,
      targetColor,
      targetColorName: targetColorData.name,
      options,
      timeLimit: settings.timeLimit,
      difficulty: this.gameState.level,
    }

    this.onChallengeChange(challenge)
  }

  handleColorSelection(optionId: string, challenge: ColorChallenge) {
    if (!this.gameState.isPlaying || this.gameState.isPaused) return

    const selectedOption = challenge.options.find((opt) => opt.id === optionId)
    if (!selectedOption) return

    if (selectedOption.isCorrect) {
      this.handleCorrectAnswer()
    } else {
      this.handleWrongAnswer()
    }

    this.generateNewChallenge()
  }

  private handleCorrectAnswer() {
    this.gameState.streak += 1
    this.gameState.colorsMatched += 1
    this.gameState.maxStreak = Math.max(this.gameState.maxStreak, this.gameState.streak)

    // Calculate score with streak bonus
    const baseScore = 10 * this.gameState.level
    const streakBonus = Math.floor(this.gameState.streak / 5) * 5
    const difficultyMultiplier = { easy: 0.8, normal: 1.0, hard: 1.3, expert: 1.6 }[this.gameState.difficulty]

    const points = Math.floor((baseScore + streakBonus) * difficultyMultiplier * this.gameState.bonusMultiplier)
    this.gameState.score += points

    // Level progression
    if (this.gameState.colorsMatched % 10 === 0) {
      this.gameState.level += 1
    }

    // Perfect match bonus (streak of 10+)
    if (this.gameState.streak >= 10 && this.gameState.streak % 10 === 0) {
      this.gameState.perfectMatches += 1
      this.gameState.score += 50 * this.gameState.level
    }

    this.onStateChange(this.gameState)
  }

  private handleWrongAnswer() {
    this.gameState.streak = 0
    this.gameState.lives -= 1

    if (this.gameState.lives <= 0) {
      this.endGame()
    } else {
      // Small time penalty for wrong answers
      this.gameState.timeLeft = Math.max(0, this.gameState.timeLeft - 2)
      this.onStateChange(this.gameState)
    }
  }

  pauseGame() {
    this.gameState.isPaused = true
    this.onStateChange(this.gameState)
  }

  resumeGame() {
    this.gameState.isPaused = false
    this.onStateChange(this.gameState)
  }

  endGame() {
    this.gameState.isPlaying = false
    this.gameState.isPaused = false
    this.gameState.isGameOver = true

    if (this.gameTimer) {
      clearInterval(this.gameTimer)
      this.gameTimer = null
    }

    if (this.challengeTimer) {
      clearTimeout(this.challengeTimer)
      this.challengeTimer = null
    }

    this.onGameEnd(this.gameState.score)
    this.onStateChange(this.gameState)
  }

  activatePowerUp(powerUpType: string) {
    if (!this.gameState.isPlaying) return

    this.gameState.powerUpsUsed.push(powerUpType)

    switch (powerUpType) {
      case "time_freeze":
        // Pause the game timer for 5 seconds
        this.gameState.isPaused = true
        setTimeout(() => {
          this.gameState.isPaused = false
          this.onStateChange(this.gameState)
        }, 5000)
        break
      case "score_multiplier":
        this.gameState.bonusMultiplier = 2.0
        setTimeout(() => {
          this.gameState.bonusMultiplier = 1.0
          this.onStateChange(this.gameState)
        }, 10000)
        break
      case "extra_life":
        this.gameState.lives += 1
        break
      case "hint":
        // This would be handled by the UI to highlight the correct answer
        break
    }

    this.onStateChange(this.gameState)
  }

  getGameState(): GameState {
    return { ...this.gameState }
  }

  destroy() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer)
    }
    if (this.challengeTimer) {
      clearTimeout(this.challengeTimer)
    }
  }
}
