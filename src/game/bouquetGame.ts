import Phaser from 'phaser'

const W = 720
const H = 420
const GROUND_Y = 360
const TOTAL_ROUNDS = 5
const BRIDE_FRAME_W = 179
const BRIDE_FRAME_H = 170
const CATCHER_FRAME_W = 155
const CATCHER_FRAME_H = 258

type Catcher = Phaser.Physics.Arcade.Sprite & {
  targetX: number
}

export class BouquetScene extends Phaser.Scene {
  private catcher!: Catcher
  private bride!: Phaser.GameObjects.Sprite
  private bouquet!: Phaser.Physics.Arcade.Image
  private scoreText!: Phaser.GameObjects.Text
  private statusText!: Phaser.GameObjects.Text
  private roundText!: Phaser.GameObjects.Text
  private score = 0
  private round = 0
  private canMove = false
  private roundActive = false
  private bestScore = 0
  private bouquetLaunched = false

  constructor() {
    super('BouquetScene')
  }

  init(data: { bestScore?: number }) {
    this.bestScore = data.bestScore ?? 0
    this.score = 0
    this.round = 0
  }

  preload() {
    this.load.spritesheet('bride-throw', '/game/bride-throw.png', {
      frameWidth: BRIDE_FRAME_W,
      frameHeight: BRIDE_FRAME_H,
    })
    this.load.spritesheet('catcher-anim', '/game/catcher-anim.png', {
      frameWidth: CATCHER_FRAME_W,
      frameHeight: CATCHER_FRAME_H,
    })
    this.load.image('bouquet-fly', '/game/bouquet-fly.png')
  }

  create() {
    this.drawBackground()
    this.createAnims()

    this.bride = this.add.sprite(100, GROUND_Y, 'bride-throw', 0)
    this.bride.setOrigin(0.5, 1)
    this.bride.setScale(0.92)
    this.bride.setDepth(4)

    // Art faces right; flip so she looks toward the bride (left)
    this.catcher = this.physics.add.sprite(W * 0.62, GROUND_Y, 'catcher-anim', 0) as Catcher
    this.catcher.setOrigin(0.5, 1)
    this.catcher.setScale(0.7)
    this.catcher.setFlipX(true)
    this.catcher.setCollideWorldBounds(true)
    this.catcher.setImmovable(true)
    const catcherBody = this.catcher.body as Phaser.Physics.Arcade.Body
    catcherBody.allowGravity = false
    catcherBody.setSize(70, 140)
    catcherBody.setOffset(42, 100)
    this.catcher.targetX = this.catcher.x
    this.catcher.setDepth(5)

    this.bouquet = this.physics.add.image(-120, -120, 'bouquet-fly')
    this.bouquet.setVisible(false)
    this.bouquet.setDisplaySize(56, 28)
    const bouquetBody = this.bouquet.body as Phaser.Physics.Arcade.Body
    bouquetBody.allowGravity = false
    bouquetBody.setSize(40, 22)
    bouquetBody.setOffset(8, 3)
    this.bouquet.setDepth(7)

    this.physics.add.overlap(this.catcher, this.bouquet, () => this.onCatch())

    this.roundText = this.add
      .text(18, 14, '', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '14px',
        color: '#e8e6e1',
      })
      .setDepth(10)

    this.scoreText = this.add
      .text(W - 18, 14, '', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '14px',
        color: '#e8e6e1',
        align: 'right',
      })
      .setOrigin(1, 0)
      .setDepth(10)

    this.statusText = this.add
      .text(W / 2, 52, '', {
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '22px',
        color: '#f4f2ec',
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(10)

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.canMove || this.round > TOTAL_ROUNDS) return
      const x = Phaser.Math.Clamp(pointer.worldX, 50, W - 50)
      this.catcher.targetX = x
      // Face the direction of movement; default toward bride is left (flipX true)
      this.catcher.setFlipX(x <= this.catcher.x)
    })

    this.bride.on(
      Phaser.Animations.Events.ANIMATION_UPDATE,
      (
        anim: Phaser.Animations.Animation,
        frame: Phaser.Animations.AnimationFrame,
      ) => {
        if (anim.key !== 'throw-anim') return
        if (frame.index >= 2 && !this.bouquetLaunched) {
          this.launchBouquet()
        }
      },
    )

    this.updateHud()
    this.time.delayedCall(700, () => this.startRound())
  }

  update() {
    if (!this.catcher) return
    const dx = this.catcher.targetX - this.catcher.x
    if (Math.abs(dx) > 2) {
      this.catcher.x += Phaser.Math.Clamp(dx * 0.14, -7.5, 7.5)
    } else {
      this.catcher.x = this.catcher.targetX
    }

    if (this.roundActive && this.bouquet.visible) {
      this.bouquet.body?.updateFromGameObject()

      // Reach pose while bouquet is near
      if (
        !this.catcher.anims.isPlaying &&
        Math.abs(this.bouquet.x - this.catcher.x) < 120 &&
        this.bouquet.y < GROUND_Y
      ) {
        this.catcher.setFrame(1)
      }

      const reachY = this.catcher.y - 70
      const nearX = Math.abs(this.bouquet.x - this.catcher.x) < 52
      const nearY = this.bouquet.y > reachY - 40 && this.bouquet.y < this.catcher.y - 5
      if (nearX && nearY) {
        this.onCatch()
        return
      }

      if (this.bouquet.y > GROUND_Y + 36) {
        this.onMiss()
      }
    }
  }

  private createAnims() {
    if (!this.anims.exists('throw-anim')) {
      this.anims.create({
        key: 'throw-anim',
        frames: this.anims.generateFrameNumbers('bride-throw', { start: 0, end: 4 }),
        frameRate: 7,
        repeat: 0,
      })
    }

    if (!this.anims.exists('catch-celebrate')) {
      this.anims.create({
        key: 'catch-celebrate',
        frames: this.anims.generateFrameNumbers('catcher-anim', { start: 2, end: 4 }),
        frameRate: 5,
        repeat: 0,
      })
    }
  }

  private startRound() {
    if (this.round >= TOTAL_ROUNDS) {
      this.endGame()
      return
    }

    this.round += 1
    this.roundActive = true
    this.canMove = true
    this.bouquetLaunched = false
    this.updateHud()
    this.statusText.setText('Toque no chão para correr!')

    this.bouquet.setVisible(false)
    this.bouquet.body!.enable = false
    this.bouquet.setVelocity(0, 0)
    this.killBouquetTweens()

    this.catcher.anims.stop()
    this.catcher.setFrame(0)
    this.catcher.setFlipX(true)

    this.bride.setFrame(0)
    this.bride.play('throw-anim')
  }

  private launchBouquet() {
    if (this.bouquetLaunched || !this.roundActive) return
    this.bouquetLaunched = true

    const startX = this.bride.x + 55
    const startY = this.bride.y - 110
    const targetX = Phaser.Math.Between(W * 0.42, W * 0.92)
    const peak = Phaser.Math.Between(70, 130)
    const duration = Phaser.Math.Between(1150, 1550)

    this.bouquet.setPosition(startX, startY)
    this.bouquet.setVisible(true)
    this.bouquet.setAngle(-12)
    this.bouquet.body!.enable = true
    ;(this.bouquet.body as Phaser.Physics.Arcade.Body).allowGravity = false

    this.tweens.add({
      targets: this.bouquet,
      x: targetX,
      duration,
      ease: 'Sine.easeOut',
    })

    this.tweens.add({
      targets: this.bouquet,
      y: peak,
      duration: duration * 0.42,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.bouquet,
          y: GROUND_Y + 44,
          duration: duration * 0.58,
          ease: 'Quad.easeIn',
        })
      },
    })

    this.tweens.add({
      targets: this.bouquet,
      angle: 25,
      duration,
      ease: 'Sine.easeInOut',
    })

    this.statusText.setText('Pegue o buquê!')
  }

  private onCatch() {
    if (!this.roundActive || !this.bouquet.visible) return
    this.roundActive = false
    this.canMove = false
    this.score += 1
    this.killBouquetTweens()
    this.bouquet.setVisible(false)
    this.bouquet.body!.enable = false
    this.catcher.play('catch-celebrate')
    this.updateHud()
    this.statusText.setText('Pegou! 💐')
    this.time.delayedCall(1200, () => this.startRound())
  }

  private onMiss() {
    if (!this.roundActive) return
    this.roundActive = false
    this.canMove = false
    this.killBouquetTweens()
    this.bouquet.setVisible(false)
    this.bouquet.body!.enable = false
    this.catcher.anims.stop()
    this.catcher.setFrame(0)
    this.updateHud()
    this.statusText.setText('Quase... próxima!')
    this.time.delayedCall(950, () => this.startRound())
  }

  private endGame() {
    this.canMove = false
    this.roundActive = false
    this.bride.setFrame(4)
    this.catcher.setFrame(this.score > 0 ? 4 : 0)
    const isRecord = this.score > this.bestScore
    const best = Math.max(this.score, this.bestScore)
    this.statusText.setText(
      isRecord
        ? `Fim! ${this.score}/${TOTAL_ROUNDS} — novo recorde!`
        : `Fim! ${this.score}/${TOTAL_ROUNDS} · melhor: ${best}`,
    )
    this.game.events.emit('bouquet-finished', { score: this.score, best })

    const restart = this.add
      .text(W / 2, H - 48, 'Jogar de novo', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '16px',
        color: '#1c1b19',
        backgroundColor: '#e8e6e1',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(12)

    restart.on('pointerdown', () => {
      this.scene.restart({ bestScore: best })
    })
  }

  private killBouquetTweens() {
    this.tweens.killTweensOf(this.bouquet)
  }

  private updateHud() {
    this.roundText.setText(`Rodada ${Math.min(this.round, TOTAL_ROUNDS)}/${TOTAL_ROUNDS}`)
    this.scoreText.setText(`Pegos ${this.score} · Recorde ${this.bestScore}`)
  }

  private drawBackground() {
    const g = this.add.graphics().setDepth(0)

    // Wall wash — warm stone hall
    g.fillGradientStyle(0x3d3832, 0x3d3832, 0x2a2622, 0x2a2622, 1)
    g.fillRect(0, 0, W, GROUND_Y)

    // Soft ceiling glow
    g.fillStyle(0x5a534a, 0.25)
    g.fillEllipse(W / 2, 20, 520, 120)

    // Back wall panel
    g.fillStyle(0x322e2a, 1)
    g.fillRoundedRect(90, 48, W - 180, GROUND_Y - 78, 8)
    g.lineStyle(2, 0x4a433c, 0.7)
    g.strokeRoundedRect(90, 48, W - 180, GROUND_Y - 78, 8)

    // Central arch / altar niche
    g.fillStyle(0x26221e, 1)
    g.fillRoundedRect(W / 2 - 70, 70, 140, GROUND_Y - 95, { tl: 70, tr: 70, bl: 0, br: 0 })
    g.fillStyle(0x4a433c, 0.35)
    g.fillEllipse(W / 2, 130, 90, 50)
    // Tiny floral mark in the niche
    g.fillStyle(0xc9c4ba, 0.55)
    g.fillCircle(W / 2, 155, 5)
    g.fillCircle(W / 2 - 8, 162, 3.5)
    g.fillCircle(W / 2 + 8, 162, 3.5)
    g.fillStyle(0x6e6a62, 0.8)
    g.fillRect(W / 2 - 1.5, 165, 3, 18)

    // Side windows with evening light
    this.drawWindow(g, 130, 95, 78, 110)
    this.drawWindow(g, W - 208, 95, 78, 110)

    // Curtains
    this.drawCurtain(g, 0, true)
    this.drawCurtain(g, W - 52, false)

    // String lights across the hall
    g.lineStyle(1.5, 0x6e6a62, 0.45)
    g.beginPath()
    g.moveTo(70, 58)
    g.lineTo(W / 2, 42)
    g.lineTo(W - 70, 58)
    g.strokePath()

    const bulbPositions: { x: number; y: number }[] = []
    for (let i = 0; i <= 12; i++) {
      const t = i / 12
      const x = 70 + (W - 140) * t
      const y = 58 - Math.sin(t * Math.PI) * 16
      bulbPositions.push({ x, y })
      g.fillStyle(0xf0ebe3, 0.9)
      g.fillCircle(x, y, 2.4)
      g.fillStyle(0xfff8ee, 0.25)
      g.fillCircle(x, y, 5)
    }

    // Side floral stands
    this.drawFloralStand(g, 55, GROUND_Y - 8)
    this.drawFloralStand(g, W - 55, GROUND_Y - 8)

    // Floor — warm parquet with perspective
    g.fillGradientStyle(0xc4b8a4, 0xc4b8a4, 0xa89880, 0xa89880, 1)
    g.fillRect(0, GROUND_Y, W, H - GROUND_Y)

    g.lineStyle(1, 0x8a7c68, 0.35)
    for (let i = 1; i < 8; i++) {
      const y = GROUND_Y + i * 8
      g.lineBetween(0, y, W, y)
    }
    for (let i = 0; i < 14; i++) {
      const x = (W / 14) * i
      g.lineBetween(x, GROUND_Y, W / 2 + (x - W / 2) * 0.15, H)
    }

    // Floor edge highlight
    g.fillStyle(0xe8e0d4, 0.55)
    g.fillRect(0, GROUND_Y, W, 3)
    g.fillStyle(0x6e6354, 0.4)
    g.fillRect(0, GROUND_Y + 3, W, 2)

    // Soft stage spotlight on play area
    g.fillStyle(0xf2ebe0, 0.06)
    g.fillEllipse(W * 0.55, GROUND_Y - 10, 380, 70)

    // Twinkling bulbs (lightweight overlays)
    for (const pos of bulbPositions) {
      if (Math.random() > 0.55) continue
      const glow = this.add.circle(pos.x, pos.y, 3, 0xfff6e8, 0.55).setDepth(1)
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.25, to: 0.85 },
        scale: { from: 0.7, to: 1.35 },
        duration: 700 + Math.random() * 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 800,
      })
    }
  }

  private drawWindow(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    g.fillStyle(0x1a1815, 1)
    g.fillRoundedRect(x, y, w, h, 6)
    g.fillGradientStyle(0x8a8070, 0x8a8070, 0x5c564c, 0x5c564c, 0.55)
    g.fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 4)
    g.lineStyle(2, 0xb8b0a4, 0.35)
    g.lineBetween(x + w / 2, y + 4, x + w / 2, y + h - 4)
    g.lineBetween(x + 4, y + h / 2, x + w - 4, y + h / 2)
    g.lineStyle(2, 0x6e6a62, 0.6)
    g.strokeRoundedRect(x, y, w, h, 6)
  }

  private drawCurtain(g: Phaser.GameObjects.Graphics, x: number, left: boolean) {
    g.fillStyle(0x4a433c, 0.92)
    g.fillRect(x, 0, 52, GROUND_Y)
    g.fillStyle(0x3a342e, 0.5)
    for (let i = 0; i < 5; i++) {
      const ox = left ? x + 6 + i * 9 : x + 8 + i * 9
      g.fillTriangle(ox, 36, ox + 7, GROUND_Y, ox - 4, GROUND_Y)
    }
    g.fillStyle(0xc9c4ba, 0.35)
    g.fillRect(x, 28, 52, 6)
  }

  private drawFloralStand(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x5a534a, 1)
    g.fillRect(x - 3, y - 42, 6, 42)
    g.fillStyle(0x3a342e, 1)
    g.fillEllipse(x, y - 2, 22, 8)
    g.fillStyle(0xe8e6e1, 0.85)
    g.fillCircle(x, y - 52, 7)
    g.fillStyle(0xb8b4ab, 0.9)
    g.fillCircle(x - 9, y - 48, 6)
    g.fillCircle(x + 9, y - 48, 6)
    g.fillStyle(0x6e6a62, 0.7)
    g.fillCircle(x - 4, y - 58, 4)
    g.fillCircle(x + 5, y - 57, 4)
  }
}

export function createBouquetGame(
  parent: HTMLElement,
  options: {
    bestScore: number
    onFinished: (result: { score: number; best: number }) => void
  },
) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: W,
    height: H,
    backgroundColor: '#1c1b19',
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: W,
      height: H,
    },
    scene: [BouquetScene],
    audio: { noAudio: true },
  })

  game.scene.start('BouquetScene', { bestScore: options.bestScore })
  game.events.on('bouquet-finished', options.onFinished)

  return game
}
