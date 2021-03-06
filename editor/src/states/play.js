/* global Kiwi, _ */
'use strict';

var HelixPiEditor = HelixPiEditor || {};

HelixPiEditor.Play = new Kiwi.State('Play');

var Actor = function (sprite, genes, api, fitness, name) {
  var fitnessText = new Kiwi.GameObjects.TextField(
    HelixPiEditor.Play,
    Math.round(fitness),
    sprite.x,
    sprite.y + 15,
    '#FFF',
    15
  );

  sprite.velocity = {x: 0, y: 0};

  var physics = sprite.components.add(
    new Kiwi.Components.ArcadePhysics(HelixPiEditor.Play, sprite.box)
  );

  fitnessText.textAlign = Kiwi.GameObjects.TextField.TEXT_ALIGN_CENTER;

  HelixPiEditor.Play.addChild(fitnessText);

  return {
    play: function (currentFrame) {
      _.each(genes, function (gene) {
        gene(sprite, api, currentFrame);
      });

      api.update(sprite);

      fitnessText.x = sprite.x + sprite.width / 2;
      fitnessText.y = sprite.y + 130;
    },

    moveTo: function (x, y) {
      sprite.x = x; // TODO - fix hard coded start position
      sprite.y = y;
    },

    destroy: function () {
      sprite.destroy();
      fitnessText.destroy();
    },

    name: name,
    physics: physics,
    sprite: sprite
  };
};

HelixPiEditor.Play.checkCollision = function (entity) {
  return this.actors.filter(function (actor) {
    return actor.sprite !== entity &&
      actor.physics.overlaps(entity);
  }).length > 0;
}

HelixPiEditor.Play.create = function () {
  this.currentFrame = 0;
  this.game.huds.defaultHUD.removeAllWidgets();
  var backToEditorButton = HelixPiEditor.buttons.create(
    this,
    'Back to Editor',
    this.game.stage.width - 180,
    5
  );

  backToEditorButton.input.onDown.add(this.backToEditor, this);

  var restartButton = HelixPiEditor.buttons.create(
    this,
    'Restart',
    this.game.stage.width - 360,
    5
  );

  restartButton.input.onDown.add(this.restart, this);


  this.actors = this.createActors();

  this.keys = {
    w: this.game.input.keyboard.addKey(Kiwi.Input.Keycodes.W),
    a: this.game.input.keyboard.addKey(Kiwi.Input.Keycodes.A),
    s: this.game.input.keyboard.addKey(Kiwi.Input.Keycodes.S),
    d: this.game.input.keyboard.addKey(Kiwi.Input.Keycodes.D),

    up: this.game.input.keyboard.addKey(Kiwi.Input.Keycodes.UP),
    left: this.game.input.keyboard.addKey(Kiwi.Input.Keycodes.LEFT),
    down: this.game.input.keyboard.addKey(Kiwi.Input.Keycodes.DOWN),
    right: this.game.input.keyboard.addKey(Kiwi.Input.Keycodes.RIGHT)
  }
};

HelixPiEditor.Play.createActors = function () {
  var that = this;
  var spriteToUse = {
    'Eevee': this.textures.paddle,
    'Greg': this.textures.ball,
    'Stan': this.textures.paddle
  }

  return _.map(HelixPiEditor.results(), function (individuals, participant) {
    var startingPosition = that.startingPosition(participant);

    var sprite = new Kiwi.GameObjects.Sprite(
      that,
      spriteToUse[participant],
      startingPosition.x,
      startingPosition.y,
      true
    );

    that.addChild(sprite);

    var compiledApi = helixPi.createApi({
      checkButtonDown: that.checkButtonDown.bind(that),
      checkButtonReleased: that.checkButtonReleased.bind(that),
      checkCollision: that.checkCollision.bind(that)
    });

    return new Actor(sprite, individuals[0], compiledApi, individuals[0].fitness.score, participant);
  });
}

HelixPiEditor.Play.update = function () {
  var that = this;

  _.each(this.actors, function (actor) {
    actor.play(that.currentFrame);
  });

  // this.displayProgressIndicator(this.currentFrame / (this.highestFrame * 60));
  this.currentFrame += 1;
};

HelixPiEditor.Play.backToEditor = function () {
  this.game.states.switchState('Editor');
}

HelixPiEditor.Play.restart = function () {
  this.currentFrame = 0;

  var that = this;
  _.each(this.actors, function (actor) {
    actor.destroy();
  });

  this.actors = this.createActors();
}

HelixPiEditor.Play.startingPosition = function (participant) {
  return HelixPiEditor.scenarios()[0].positions[participant][0];
}

HelixPiEditor.Play.checkButtonDown = function (entity, button) {
  return this.keys[button].isDown;
}

HelixPiEditor.Play.checkButtonReleased = function (entity, button) {
  return this.keys[button].justReleased();
}
