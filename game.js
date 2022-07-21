const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

canvas.width = window.innerWidth
let widthOffset = canvas.width % 20
if (widthOffset != 0) canvas.width -= widthOffset
canvas.height = window.innerHeight
let heightOffset = canvas.height % 20
if (heightOffset != 0) canvas.height -= heightOffset

let playerMoveDone = false
let gameUpdate
let matchHistory = []

class Game {
    constructor() {
        if (confirm('Play ?')) {    
            if (localStorage.getItem('HighScore') === null) localStorage.setItem('HighScore', 0)                                  
            if (localStorage.getItem('MatchHistory') === null) localStorage.setItem('MatchHistory', JSON.stringify(matchHistory))                                  
            gameUpdate = setInterval(() => {
                this.update()
                this.draw()
            }, 100);
        }  
        this.player = []
        this.bots = []
        this.foods = []
        this.foodSpawnRate = 0.1
        this.score = 0
        this.pointsForKillBot = 3
    }

    update() {
        // player move
        playerMoveDone = false

        // player
        this.player.forEach(part => {
            part.prePos.x = part.pos.x
            part.prePos.y = part.pos.y
        })
        player.pos.x += player.vel.x * 20
        player.pos.y += player.vel.y * 20
        this.player.forEach(part => {
            let i = this.player.indexOf(part)
            if (i != 0) {
                part.pos.x = this.player[i - 1].prePos.x
                part.pos.y = this.player[i - 1].prePos.y
            }
        })

        // bots
        this.bots.forEach(bot => {
            let botHead = bot[0] 
            let nearestTarget = botHead.calculateTarget() || this.foods[0] || this.foods[1] || this.foods[2]
            let distanceX = nearestTarget.pos.x - botHead.pos.x
            let distanceY = nearestTarget.pos.y - botHead.pos.y
            
            bot.forEach(part => {
                let i = bot.indexOf(part)
                part.prePos.x = part.pos.x
                part.prePos.y = part.pos.y
                if (i != 0) {
                    part.pos.x = bot[i - 1].prePos.x
                    part.pos.y = bot[i - 1].prePos.y
                }
            })

            if (botHead.pos.x != nearestTarget.pos.x && botHead.pos.y != nearestTarget.pos.y) {
                if (distanceX > distanceY) {
                    if (botHead.pos.x < nearestTarget.pos.x) { 
                        botHead.vel.x = 1 ; botHead.vel.y = 0
                    }
                    if (botHead.pos.x > nearestTarget.pos.x) { 
                        botHead.vel.x = -1 ;  botHead.vel.y = 0
                    } 
                } else if (distanceY > distanceX) {
                    if (botHead.pos.y < nearestTarget.pos.y) { 
                        botHead.vel.y = 1 ; botHead.vel.x = 0
                     }
                    if (botHead.pos.y > nearestTarget.pos.y) { 
                        botHead.vel.y = -1 ; botHead.vel.x = 0
                     } 
                }
            } else if (botHead.pos.x != nearestTarget.pos.x && botHead.pos.y === nearestTarget.pos.y) {
                if (botHead.pos.x < nearestTarget.pos.x) { 
                    if (botHead.vel.x === -1) {
                        botHead.vel.x = 0
                        botHead.vel.y = botHead.betterPath()
                        return
                    }
                    botHead.vel.x = 1 ; botHead.vel.y = 0
                 } 
                if (botHead.pos.x > nearestTarget.pos.x) { 
                    if (botHead.vel.x === 1) {
                        botHead.vel.x = 0
                        botHead.vel.y = botHead.betterPath()
                        return
                    }
                    botHead.vel.x = -1 ; botHead.vel.y = 0
                 } 
            } else if (botHead.pos.x === nearestTarget.pos.x && botHead.pos.y != nearestTarget.pos.y) {
                if (botHead.pos.y < nearestTarget.pos.y) { 
                    if (botHead.vel.y === -1) {
                        botHead.vel.x = botHead.betterPath()
                        botHead.vel.y = 0
                        return
                    }
                    botHead.vel.y = 1 ; botHead.vel.x = 0
                 } 
                if (botHead.pos.y > nearestTarget.pos.y) { 
                    if (botHead.vel.y === 1) {
                        botHead.vel.x = botHead.betterPath()
                        botHead.vel.y = 0
                        return
                    }
                    botHead.vel.y = -1 ; botHead.vel.x = 0
                 } 
            }

            botHead.pos.x += botHead.vel.x * 20
            botHead.pos.y += botHead.vel.y * 20
        })
        // bot eat food
        this.bots.forEach(bot => {
            this.foods.forEach(food => {
                if (bot[0].pos.x == food.pos.x && bot[0].pos.y == food.pos.y) {
                    // delete food 
                    let i = this.foods.indexOf(food)
                    this.foods.splice(i, 1)
                    // expand bot
                    let j = this.bots.indexOf(bot)
                    bot[0].extand(j)
                }
            })
        })

        // bot check death with player
        this.bots.forEach(bot => {
            let botHead = bot[0]
            let i = this.bots.indexOf(bot)
            this.player.forEach(part => {
                if (this.player.indexOf(part) === 0 && botHead.pos.x === part.pos.x && botHead.pos.y === part.pos.y) {
                    // kill player and bot
                    this.playerDeath()
                    this.bots.splice(i, 1)
                } else if (botHead.pos.x === part.pos.x && botHead.pos.y === part.pos.y) {
                    // delete bot
                    this.bots.splice(i, 1)
                    // add points
                    this.score += this.pointsForKillBot
                }
            })
        })

        // check player death with bots
        this.bots.forEach(bot => {
            bot.forEach(part => {
                let playerHead = this.player[0]
                if (playerHead.pos.x === part.pos.x && playerHead.pos.y === part.pos.y) {
                    // player die
                    game.playerDeath()
                }
            })
        })

        // food
        if (Math.random() < this.foodSpawnRate) {
            this.foods.push(new Food())
        }

        // eat food
        this.foods.forEach(food => {
            if (food.pos.x == player.pos.x && food.pos.y == player.pos.y) {
                // delete food
                let i = this.foods.indexOf(food)
                this.foods.splice(i, 1)
                // score
                this.score += 1
                // expand snake
                player.extand()
                // new bot
                this.bots.push([new Bot()])
            }
        })

        // check death
            // check self death
        this.player.forEach(part => {
            if (this.player.indexOf(part) != 0) {
                if (this.player[0].pos.x == part.pos.x && this.player[0].pos.y == part.pos.y) {
                    // player death 
                    this.playerDeath()
                }
            }
        })
        
        // check out of screen
        if (player.pos.x >= canvas.width) player.pos.x = 0 // droite
        else if (player.pos.x <= -1) player.pos.x = canvas.width // gauche
        else if (player.pos.y >= canvas.height) player.pos.y = 0 // bas
        else if (player.pos.y <= -1) player.pos.y = canvas.height // haut

        // food spawn rate
        let parts = (game.player.length - 1) / 2
        if (parts >= 5 && parts < 10) game.foodSpawnRate = 0.2
        if (parts >= 10 && parts < 15) game.foodSpawnRate = 0.3
        if (parts >= 15 && parts < 20) game.foodSpawnRate = 0.4
        if (parts >= 20 && parts < 25) game.foodSpawnRate = 0.5
        if (parts >= 25 && parts < 30) game.foodSpawnRate = 0.6
        if (parts >= 30) game.foodSpawnRate = 0.7
    }

    draw() {
        // background
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // food 
        this.foods.forEach(food => {
            ctx.fillStyle = "#0f0"
            ctx.fillRect(food.pos.x, food.pos.y, 20, 20)
        })

        // player 
        this.player.forEach(part => {
            ctx.fillStyle = "#00f"
            ctx.fillRect(part.pos.x, part.pos.y, 20, 20)
        })
        
        // bots
        this.bots.forEach(bot => {
            bot.forEach(part => {
                ctx.fillStyle = "#f00"
                ctx.fillRect(part.pos.x, part.pos.y, 20, 20)
            })
        })

        // High Score and score
        ctx.fillStyle = '#ddd'
        ctx.font = '30px Arial';
        ctx.fillText('High Score: ' + localStorage.getItem('HighScore'), 10, 40);
        ctx.fillText('Score: ' + game.score, canvas.width - 150, 40);
    }
    
    playerDeath() {
        player.pos = {x: Math.floor(canvas.width / 2 / 10) * 10, y: Math.floor(canvas.height / 2 / 10) * 10}
        this.player.splice(1, this.player.length - 1)
        clearInterval(gameUpdate)
        alert('Game Over\nYou scored ' + game.score + ' points')
        // HighScore
        if (game.score > localStorage.getItem('HighScore')) localStorage.setItem('HighScore', game.score)
        // Match History
        matchHistory = localStorage.getItem('MatchHistory');
        matchHistory = JSON.parse(matchHistory)
        matchHistory.unshift(game.score)
        localStorage.setItem('MatchHistory', JSON.stringify(matchHistory))
        // reload and new game
        location.reload()
    }
}

class Player {
    constructor(_x, _y) {
        this.prePos = { x: 0, y: 0 }
        this.pos = { x: _x, y: _y }
        this.vel = { x: 1, y: 0 }
        game.player.push(this)
    }

    extand() {
        game.player.push(new Player(this.prePos.x, this.prePos.y))
    }
}

class Food {
    constructor() {
        this.pos = {
            x: Math.floor(Math.random() * canvas.width / 20) * 20,
            y: Math.floor(Math.random() * canvas.height / 20) * 20
        }
    }
}

class Bot {
    constructor() {
        this.prePos = { x: 0, y: 0 }
        this.pos = { x: Math.floor(Math.random() * canvas.width / 20) * 20, y: Math.floor(Math.random() * canvas.height / 20) * 20 }
        this.vel = { x: 0, y: 0}
    }

    extand(i) {
        game.bots[i].push(new Bot(this.prePos.x, this.prePos.y))
    }

    calculateTarget() {
        if (game.foods.length == 0) game.foods.push(new Food())
        let betterTarget 
        let target = 10000
        let sum
        game.foods.forEach(food => {
            let x = food.pos.x
            let y = food.pos.y
            let distanceX = this.pos.x - x
            let distanceY = this.pos.y - y
            if (distanceX < 0) distanceX *= -1
            if (distanceY < 0) distanceY *= -1
            sum = distanceX + distanceY
            if (sum <= target) {
                target = sum
                betterTarget = food
            }
        })
        return betterTarget
    }

    betterPath() {
        let possibleResult = [-1, 1]
        return possibleResult[Math.floor(Math.random() * possibleResult.length)]
    }
}

const game = new Game()
const player = new Player(500, 500)

window.addEventListener('keydown', (e) => {
    if (!playerMoveDone) {
        if ((e.key === 'ArrowUp' || e.key === 'z') && player.vel.y != 1) {
            player.vel.x = 0
            player.vel.y = -1
            playerMoveDone = true
        } else if ((e.key === 'ArrowDown' || e.key === 's') && player.vel.y != -1) {
            player.vel.x = 0
            player.vel.y = 1
            playerMoveDone = true
        } else if ((e.key === 'ArrowLeft' || e.key === 'q') && player.vel.x != 1) {
            player.vel.x = -1
            player.vel.y = 0
            playerMoveDone = true
        } else if ((e.key === 'ArrowRight' || e.key === 'd') && player.vel.x != -1) {
            player.vel.x = 1
            player.vel.y = 0
            playerMoveDone = true
        }
    }  
})

