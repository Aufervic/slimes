class JumperScene extends Phaser.Scene {
  constructor() {
    super("JumperScene");
  }

  preload() {
    this.load.image("sky", "./assets/sky.png");
    this.load.image("ground", "./assets/ground.png");
    this.load.image("platform", "./assets/platform-large.png");
    this.load.image("star", "./assets/star.png");
    this.load.image("bomb", "./assets/bomb.png");

    this.load.spritesheet("slime", "./assets/slime-generic-Sheet.png", { frameWidth: 64, frameHeight: 64});
    this.load.spritesheet("slime0", "./assets/slime-0-Sheet.png", { frameWidth: 64, frameHeight: 64});
    this.load.spritesheet("slime1", "./assets/slime-1-Sheet.png", { frameWidth: 64, frameHeight: 64});
    this.load.spritesheet("slime2", "./assets/slime-2-Sheet.png", { frameWidth: 64, frameHeight: 64});
    this.load.spritesheet("slime3", "./assets/slime-3-Sheet.png", { frameWidth: 64, frameHeight: 64});
    this.load.spritesheet("slime4", "./assets/slime-4-Sheet.png", { frameWidth: 64, frameHeight: 64});
    this.load.spritesheet("slime5", "./assets/slime-5-Sheet.png", { frameWidth: 64, frameHeight: 64});
    this.load.spritesheet("slime6", "./assets/slime-6-Sheet.png", { frameWidth: 64, frameHeight: 64});
    this.load.spritesheet("slime7", "./assets/slime-7-Sheet.png", { frameWidth: 64, frameHeight: 64});
    this.load.spritesheet("slime8", "./assets/slime-8-Sheet.png", { frameWidth: 64, frameHeight: 64});
    this.load.spritesheet("slime9", "./assets/slime-9-Sheet.png", { frameWidth: 64, frameHeight: 64});
    this.load.spritesheet("slime10", "./assets/slime-10-Sheet.png", { frameWidth: 64, frameHeight: 64});
    this.load.spritesheet("slime11", "./assets/slime-11-Sheet.png", { frameWidth: 64, frameHeight: 64});
  }

  create() {
    this.add.image(400, 300, "sky");

    this.platforms = this.physics.add.staticGroup();
    //platforms
    this.platforms.create(300, 440, "ground");

    this.platforms.create(600, 350, "platform");
    this.platforms.create(50, 250, "platform");
    this.platforms.create(740, 220, "platform");

    // others
    this.otherPlayers = this.add.group();

    // player
    this.player = this.physics.add.sprite(24, 360, "slime");
    this.player.setScale(0.6);
    this.player.isAlive = true
    this.player.isReady = false // true cuando se conecta

    this.iAmServer = false
    
    //stars
    const stars = this.physics.add.group({
      key: "star",
      repeat: 8,
      setXY: { x: 12, y: 0, stepX: 70 },
    });
    stars.children.iterate(function (child) {
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
    this.physics.add.collider(stars, this.platforms);
    this.physics.add.overlap(this.player, stars, collect, null, this);
    //bombs

    this.bombs = this.physics.add.group();
    this.physics.add.collider(this.bombs, this.platforms);

    this.physics.add.overlap(this.player, this.bombs, bombTouched, null, this);

    function onEvent() {
      
      this.player.enableBody(true,0, 0, true);
      //.enableBody(true, child.x, 0, true, true);
      this.player.anims.play("idle", true);
      this.player.isAlive = true
    }

    function bombTouched(player, bomb) {
      this.player.isAlive = false
      // this.physics.pause();
      // this.player.setTint(0xff000);
      this.player.anims.play("hited");
      this.player.disableBody(true, false);

      this.timedEvent = this.time.delayedCall(3000, onEvent, [], this);
    }



    this.otherBombs = this.physics.add.group({
      immovable: false,
      allowGravity: false,
      gravity:0
    });
    //this.otherBombs.setGravity(0);
    this.physics.add.overlap(this.player, this.otherBombs, bombTouched, null, this);
    this.physics.add.collider(this.otherBombs, this.platforms);
    //score text
    const scoreText = this.add.text(15, 15, "score: 0", {
      fontSize: "32px",
      fill: "#000",
    });
    let score = 0;
    //stars collision
    function collect(player, star) {
      star.disableBody(true, true);
      score += 1;
      scoreText.setText("Score: " + score);

      if (stars.countActive(true) === 0) {
        stars.children.iterate(function (child) {
          child.enableBody(true, child.x, 0, true, true);
        });

        if(this.bomb) return
        var x =
          player.x < 400
            ? Phaser.Math.Between(400, 600)
            : Phaser.Math.Between(0, 400);

        this.bomb = this.bombs.create(x, 16, "bomb");
        this.bomb.setBounce(1);
        this.bomb.setCollideWorldBounds(true);
        this.bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        this.bomb.playerId = this.player.playerId
       
        this.socket.emit('createdBomb', { x: this.bomb.x, y: this.bomb.y, playerId: this.player.playerId});
      }
    }

    this.defineSocket();
  }

  update() {
    if(!this.player.isReady) return

    if(this.player.isAlive){
      const cursors = this.input.keyboard.createCursorKeys();
      if (cursors.left.isDown) {
        this.player.setVelocityX(-200);
        this.player.anims.play("left", true);
        this.player.flipX = true;
      } else if (cursors.right.isDown) {
        this.player.setVelocityX(200);
        this.player.anims.play("right", true);
        this.player.flipX = false;
      } else {
        this.player.setVelocityX(0);
        this.player.anims.play("idle", true);
      }

      if (cursors.up.isDown && this.player.body.touching.down) {
        this.player.setVelocityY(-500);
      }
    }

    // emit player movement
    var x = this.player.x;
    var y = this.player.y;
    if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)) {
      this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, flipX: this.player.flipX });
    }
    // save old position data
    this.player.oldPosition = {
      x: this.player.x,
      y: this.player.y,
    };

    // emit bomb movement
    if(!this.bomb) return
    var x = this.bomb.x;
    var y = this.bomb.y;
    if (this.bomb.oldPosition && (x !== this.bomb.oldPosition.x || y !== this.bomb.oldPosition.y )) {
      this.socket.emit('bombMovement', { x: this.bomb.x, y: this.bomb.y, flipX: this.bomb.flipX, playerId: this.bomb.playerId });
    }
    // save old position data
    this.bomb.oldPosition = {
      x: this.bomb.x,
      y: this.bomb.y,
    };
  }

  
  defineSocket() {
    const self = this
    this.socket = io();
    this.socket.on("currentData", ({players, bombs}) => {
      Object.keys(players).forEach((id) =>{
        if (players[id].playerId === self.socket.id) {
          self.addPlayer(players[id]);
        } else {
          self.addOtherPlayer(self, players[id]);
        }
      });
    });
    this.socket.on("newPlayer", function (playerInfo) {
      self.addOtherPlayer(self, playerInfo);
    });
    this.socket.on("playerMoved", function (playerInfo) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerInfo.playerId === otherPlayer.playerId) {
          otherPlayer.setPosition(playerInfo.x, playerInfo.y);
          otherPlayer.flipX = playerInfo.flipX
        }
      });
    });
    
    this.socket.on("newBomb", function (bombInfo) {
      self.addOtherBomb(self, bombInfo);
    });
    
    this.socket.on("bombMoved", function (bombInfo) {
      self.otherBombs.getChildren().forEach(function (otherBomb) {
        if (bombInfo.playerId === otherBomb.playerId) {
          otherBomb.setPosition(bombInfo.x, bombInfo.y);
        }
      });
    });

    this.socket.on("disconnect", function (playerId) {
      self.otherPlayers.getChildren().forEach( (otherPlayer)=> {
        if (playerId === otherPlayer.playerId) {
          otherPlayer.destroy();
        }
      });

      self.otherBombs.getChildren().forEach( (otherbomb)=> {
        if (playerId === otherbomb.playerId) {
          otherbomb.destroy();
        }
      });
    });

    // this.socket.on('scoreUpdate', function (scores) {
    //   this.blueScoreText.setText('Blue: ' + scores.blue);
    //   this.redScoreText.setText('Red: ' + scores.red);
    // });
  
    // this.socket.on('starLocation', function (starLocation) {
    //   if (this.star) this.star.destroy();
    //   this.star = this.physics.add.image(starLocation.x, starLocation.y, 'star');
    //   this.physics.add.overlap(this.player, this.star, function () {
    //     this.socket.emit('starCollected');
    //   }, null, this);
    // });
  }

  addPlayer(playerInfo) {
    const spriteName  = this.defineSpriteName(playerInfo.index)
    const initialPosition = this.defineInitialPosition(playerInfo.index)
    this.player.initialPosition = initialPosition
    this.player.playerId = playerInfo.playerId;
    this.player.setPosition(initialPosition.x, initialPosition.y)
    //this.iAmServer = playerInfo.type === 'server'
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);
    //animation
    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNumbers(spriteName, { start: 0, end: 1 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers(spriteName, { start: 0, end: 1 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers(spriteName, { start: 0, end: 1 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "hited",
      frames: [{ key: spriteName, frame: 2 }],
      // frameRate: 40,
    });

    this.player.anims.play("idle", true);
    this.player.isReady = true
  }
  
  addOtherPlayer(self, playerInfo) {
    const spriteName = this.defineSpriteName(playerInfo.index)
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, spriteName)
    otherPlayer.setScale(0.6)
    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.flipX = playerInfo.flipX;
    otherPlayer.alpha = .5
    self.otherPlayers.add(otherPlayer);
  }

  addOtherBomb(self, bombInfo) {
    const otherBomb = self.add.sprite(bombInfo.x, bombInfo.y, 'bomb')
    otherBomb.playerId = bombInfo.playerId;
    otherBomb.alpha = .6
    self.otherBombs.add(otherBomb);
    
  }

  defineSpriteName(index){
    return index < 11 ? 'slime'+index: 'slime'
  }

  defineInitialPosition(index){
    const totalLugares = Math.floor(400 / 64)
    const posX = (index) % totalLugares
    return {x: 24+44*(posX), y: 360}
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 600,
  height: 450,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 600 },
      debug: false,
    },
  },
  scene: JumperScene,
};

const game = new Phaser.Game(config);
